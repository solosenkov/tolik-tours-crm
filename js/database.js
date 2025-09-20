// ========================
// 🗃️ Database Operations
// ========================

let allBookings = [];
let filteredBookings = [];

// ========================
// Data Management
// ========================

function setupFirestoreListeners() {
    const db = window.TolikCRM.db;
    
    // Слушаем изменения в коллекции bookings
    db.collection('bookings')
        .orderBy('createdAt', 'desc')
        .onSnapshot((querySnapshot) => {
        allBookings = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allBookings.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            });
        });
        
        // Обновляем отображение
        applyFilters();
        if (window.TolikCRM.ui) {
            window.TolikCRM.ui.updateDashboardStats(allBookings);
            window.TolikCRM.ui.updateExcursionsOverview(allBookings);
        }
        
        // Обновляем финансовые данные если финансовая страница активна
        if (window.TolikCRM.finance && document.getElementById('financesPage') && 
            document.getElementById('financesPage').classList.contains('active')) {
            const financialData = window.TolikCRM.finance.calculateFinancialReport(allBookings);
            window.TolikCRM.finance.updateFinancialStats(financialData.summary);
            window.TolikCRM.finance.renderFinancialTable(Object.values(financialData.byExcursion));
        }
        
    }, (error) => {
        console.error('Ошибка получения данных:', error);
        showError('Ошибка загрузки данных из базы');
    });
}

async function addBooking(bookingData) {
    const db = window.TolikCRM.db;
    const firebase = window.TolikCRM.firebase;
    
    try {
        // Добавляем в Firestore
        const docRef = await db.collection('bookings').add({
            ...bookingData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return docRef;
    } catch (error) {
        console.error('Ошибка добавления заявки:', error);
        throw error;
    }
}

async function deleteBooking(bookingId) {
    const db = window.TolikCRM.db;
    
    // Находим данные заявки для более информативного подтверждения
    const booking = allBookings.find(b => b.id === bookingId);
    
    if (!booking) {
        showError('Заявка не найдена');
        return;
    }
    
    // Создаем информативное сообщение для подтверждения
    const confirmMessage = `⚠️ Вы действительно хотите УДАЛИТЬ эту заявку?

📋 Детали заявки:
👤 ФИО: ${booking.fullName}
📞 Контакт: ${booking.contact}
🏨 Отель: ${booking.hotel}
🗺️ Экскурсия: ${booking.excursionName}
📅 Дата: ${formatDate(new Date(booking.date))}
👥 Участников: ${booking.participants} чел.

❌ Это действие нельзя отменить!
Заявка будет удалена навсегда.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Дополнительное подтверждение для безопасности
    const doubleConfirm = confirm('🔒 Последнее предупреждение!\n\nВы ТОЧНО хотите удалить заявку?\nЭто действие необратимо!');
    
    if (!doubleConfirm) {
        return;
    }
    
    try {
        showLoading(true);
        await db.collection('bookings').doc(bookingId).delete();
        showSuccess(`Заявка "${booking.fullName}" успешно удалена!`);
        showLoading(false);
    } catch (error) {
        console.error('Ошибка удаления заявки:', error);
        showError('Ошибка при удалении заявки. Попробуйте еще раз.');
        showLoading(false);
    }
}

// ========================
// Filtering
// ========================

function applyFilters() {
    const filterExcursionSelect = document.getElementById('filterExcursion');
    const filterDateInput = document.getElementById('filterDate');
    
    const excursionFilter = filterExcursionSelect?.value || '';
    const dateFilter = filterDateInput?.value || '';
    
    filteredBookings = allBookings.filter(booking => {
        // Теперь фильтруем по названию экскурсии (excursionName)
        const matchesExcursion = !excursionFilter || booking.excursionName === excursionFilter;
        const matchesDate = !dateFilter || booking.date === dateFilter;
        
        return matchesExcursion && matchesDate;
    });
    
    if (window.TolikCRM.ui) {
        window.TolikCRM.ui.renderBookingsTable(filteredBookings);
    }
}

function clearFilters() {
    const filterExcursionSelect = document.getElementById('filterExcursion');
    const filterDateInput = document.getElementById('filterDate');
    
    if (filterExcursionSelect) filterExcursionSelect.value = '';
    if (filterDateInput) filterDateInput.value = '';
    
    applyFilters();
}

// ========================
// Data Grouping
// ========================

function groupBookingsByDate(bookings) {
    return bookings.reduce((groups, booking) => {
        const date = booking.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(booking);
        return groups;
    }, {});
}

function groupBookingsByExcursionAndDate(bookings) {
    return bookings.reduce((groups, booking) => {
        const key = `${booking.excursionName}|${booking.date}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(booking);
        return groups;
    }, {});
}

// Новая функция: группировка по экскурсиям (excursion -> dates -> participants)
function groupBookingsByExcursions(bookings) {
    return bookings.reduce((excursions, booking) => {
        const excursionName = booking.excursionName;
        const date = booking.date;
        
        // Создаем экскурсию если не существует
        if (!excursions[excursionName]) {
            excursions[excursionName] = {};
        }
        
        // Создаем дату если не существует
        if (!excursions[excursionName][date]) {
            excursions[excursionName][date] = [];
        }
        
        // Добавляем участника к дате
        excursions[excursionName][date].push(booking);
        
        return excursions;
    }, {});
}

// ========================
// Utility Functions
// ========================

function formatDate(date) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
    }).format(date);
}

function getPaymentStatusText(status) {
    const statuses = {
        'pending': 'Ожидает',
        'partial': 'Частично',
        'paid': 'Оплачено'
    };
    return statuses[status] || status;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    let errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'error-message';
        document.querySelector('.container').insertBefore(errorElement, document.querySelector('.container').firstChild);
    }
    
    errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    errorElement.style.display = 'block';
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Создаем или обновляем элемент успеха
    let successElement = document.getElementById('successMessage');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'successMessage';
        successElement.className = 'success-message';
        document.querySelector('.container').insertBefore(successElement, document.querySelector('.container').firstChild);
    }
    
    successElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successElement.style.display = 'block';
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

// ========================
// Data Getters
// ========================

function getAllBookings() {
    return allBookings;
}

function getFilteredBookings() {
    return filteredBookings;
}

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.database = {
    setupFirestoreListeners,
    addBooking,
    deleteBooking,
    applyFilters,
    clearFilters,
    groupBookingsByDate,
    groupBookingsByExcursionAndDate,
    groupBookingsByExcursions,
    formatDate,
    getPaymentStatusText,
    showLoading,
    showError,
    showSuccess,
    getAllBookings,
    getFilteredBookings
};

// Make deleteBooking globally available for HTML onclick
window.deleteBooking = deleteBooking;