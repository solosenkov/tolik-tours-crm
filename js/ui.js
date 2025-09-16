// ========================
// 🎨 User Interface Functions
// ========================

// ========================
// Dashboard & Statistics
// ========================

function updateDashboardStats(allBookings) {
    const totalParticipants = allBookings.reduce((sum, booking) => sum + booking.participants, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(booking => 
        booking.createdAt.toISOString().split('T')[0] === today
    ).length;
    
    const activeExcursions = new Set(allBookings.map(booking => booking.excursionId)).size;
    
    const totalParticipantsEl = document.getElementById('totalParticipants');
    const totalBookingsEl = document.getElementById('totalBookings');
    const activeExcursionsEl = document.getElementById('activeExcursions');
    
    if (totalParticipantsEl) totalParticipantsEl.textContent = totalParticipants;
    if (totalBookingsEl) totalBookingsEl.textContent = todayBookings;
    if (activeExcursionsEl) activeExcursionsEl.textContent = activeExcursions;
}

function updateExcursionCounters(allBookings) {
    const scheduleGrid = document.getElementById('weeklySchedule');
    if (!scheduleGrid) return;
    
    const EXCURSIONS_SCHEDULE = window.TolikCRM.calendar.EXCURSIONS_SCHEDULE;
    
    // Создаем структуру дней недели
    const daysOfWeek = [
        { key: 'monday', name: 'Понедельник' },
        { key: 'tuesday', name: 'Вторник' },
        { key: 'wednesday', name: 'Среда' },
        { key: 'thursday', name: 'Четверг' },
        { key: 'friday', name: 'Пятница' },
        { key: 'saturday', name: 'Суббота' },
        { key: 'sunday', name: 'Воскресенье' }
    ];
    
    scheduleGrid.innerHTML = daysOfWeek.map(day => {
        const dayExcursions = EXCURSIONS_SCHEDULE[day.key] || [];
        
        const excursionsHTML = dayExcursions.map(excursion => {
            // Подсчитываем участников для этой экскурсии
            const excursionBookings = allBookings.filter(booking => 
                booking.excursionId === excursion.id
            );
            
            const totalParticipants = excursionBookings.reduce((sum, booking) => 
                sum + booking.participants, 0
            );
            
            // Подсчитываем количество уникальных дат
            const uniqueDates = new Set(excursionBookings.map(b => b.date)).size;
            const datesInfo = uniqueDates > 0 ? `на ${uniqueDates} дат${uniqueDates === 1 ? 'у' : ''}` : '';
            
            return `
                <div class="excursion-badge" onclick="showExcursionDetails('${excursion.id}', '${excursion.name}')">
                    <div class="excursion-name">${excursion.name}</div>
                    <div class="excursion-count">${totalParticipants} чел.</div>
                    ${datesInfo ? `<div class="excursion-dates-info">${datesInfo}</div>` : ''}
                </div>
            `;
        }).join('');
        
        return `
            <div class="day-card">
                <div class="day-header">${day.name}</div>
                <div class="day-excursions">
                    ${excursionsHTML || '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Нет экскурсий</div>'}
                </div>
            </div>
        `;
    }).join('');
}

// ========================
// Bookings Table
// ========================

function renderBookingsTable(filteredBookings) {
    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const noBookingsDiv = document.getElementById('noBookings');
    
    if (!bookingsTableBody) return;
    
    if (filteredBookings.length === 0) {
        bookingsTableBody.innerHTML = '';
        if (noBookingsDiv) noBookingsDiv.style.display = 'block';
        return;
    }
    
    if (noBookingsDiv) noBookingsDiv.style.display = 'none';
    
    const formatDate = window.TolikCRM.database.formatDate;
    const getPaymentStatusText = window.TolikCRM.database.getPaymentStatusText;
    
    bookingsTableBody.innerHTML = filteredBookings.map(booking => `
        <tr>
            <td>${formatDate(booking.createdAt)}</td>
            <td><strong>${booking.fullName}</strong></td>
            <td>${booking.contact}</td>
            <td>${booking.hotel}</td>
            <td>
                <strong>${booking.excursionName}</strong><br>
                <small>${booking.excursionTime}</small>
            </td>
            <td>${formatDate(new Date(booking.date))}</td>
            <td>
                <span style="font-weight: 600; color: var(--primary-color);">
                    ${booking.participants} чел.
                </span>
            </td>
            <td>
                <span class="status-badge status-${booking.payment}">
                    ${getPaymentStatusText(booking.payment)}
                </span>
            </td>
            <td>${booking.notes || '—'}</td>
            <td>
                <button class="action-btn delete" onclick="deleteBooking('${booking.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================
// Modal Windows
// ========================

function showExcursionDetails(excursionId, excursionName) {
    const modal = document.getElementById('excursionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalExcursionDates');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    // Устанавливаем заголовок
    modalTitle.textContent = `Заявки: ${excursionName}`;
    
    // Фильтруем заявки по выбранной экскурсии
    const allBookings = window.TolikCRM.database.getAllBookings();
    const excursionBookings = allBookings.filter(booking => 
        booking.excursionId === excursionId
    );
    
    if (excursionBookings.length === 0) {
        modalBody.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-inbox"></i>
                <p>Пока нет заявок на эту экскурсию</p>
            </div>
        `;
    } else {
        // Группируем заявки по датам
        const groupBookingsByDate = window.TolikCRM.database.groupBookingsByDate;
        const formatDate = window.TolikCRM.database.formatDate;
        const getPaymentStatusText = window.TolikCRM.database.getPaymentStatusText;
        
        const bookingsByDate = groupBookingsByDate(excursionBookings);
        
        modalBody.innerHTML = Object.entries(bookingsByDate)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .map(([date, bookings]) => {
                const totalParticipants = bookings.reduce((sum, b) => sum + b.participants, 0);
                const formattedDate = formatDate(new Date(date));
                
                const bookingsHTML = bookings.map(booking => `
                    <div class="booking-item">
                        <div class="booking-info">
                            <div class="booking-name">${booking.fullName}</div>
                            <div class="booking-detail">📞 ${booking.contact}</div>
                        </div>
                        <div class="booking-participants">${booking.participants} чел.</div>
                        <div class="booking-info">
                            <div class="booking-name">🏨 ${booking.hotel}</div>
                            <div class="booking-detail">${booking.notes || '—'}</div>
                        </div>
                        <div class="booking-payment">
                            <span class="status-badge status-${booking.payment}">
                                ${getPaymentStatusText(booking.payment)}
                            </span>
                        </div>
                    </div>
                `).join('');
                
                return `
                    <div class="date-group">
                        <div class="date-group-header">
                            <div class="date-group-title">📅 ${formattedDate}</div>
                            <div class="date-group-count">${totalParticipants} чел.</div>
                        </div>
                        <div class="bookings-list">
                            ${bookingsHTML}
                        </div>
                    </div>
                `;
            }).join('');
    }
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Закрытие по клику вне модального окна
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeExcursionModal();
        }
    };
}

function closeExcursionModal() {
    const modal = document.getElementById('excursionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========================
// Form Handling
// ========================

function handleExcursionChange(e) {
    const selectedValue = e.target.value;
    const dateInput = document.getElementById('date');
    
    const calendar = window.TolikCRM.calendar;
    
    if (selectedValue) {
        // Находим выбранную экскурсию в расписании
        let selectedExcursion = null;
        let availableDays = [];
        
        Object.entries(calendar.EXCURSIONS_SCHEDULE).forEach(([day, excursions]) => {
            excursions.forEach(excursion => {
                if (excursion.id === selectedValue) {
                    selectedExcursion = excursion;
                    availableDays.push(day);
                }
            });
        });
        
        if (selectedExcursion && availableDays.length > 0) {
            // Устанавливаем ограничения на календарь
            calendar.setupCalendarRestrictions(dateInput, availableDays);
            
            // Автоматически выбираем ближайшую подходящую дату
            const nextDate = calendar.getNextAvailableDate(availableDays);
            if (nextDate) {
                dateInput.value = nextDate;
            }
            
            // Показываем подсказку пользователю
            calendar.showDateHint(selectedExcursion.name, availableDays);
        }
    } else {
        // Если экскурсия не выбрана, убираем ограничения
        calendar.clearCalendarRestrictions(dateInput);
        calendar.hideDateHint();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const bookingForm = document.getElementById('bookingForm');
    const excursionSelect = document.getElementById('excursion');
    
    if (!bookingForm || !excursionSelect) return;
    
    try {
        const showLoading = window.TolikCRM.database.showLoading;
        const addBooking = window.TolikCRM.database.addBooking;
        const showSuccess = window.TolikCRM.database.showSuccess;
        const showError = window.TolikCRM.database.showError;
        
        showLoading(true);
        
        const formData = new FormData(bookingForm);
        const selectedOption = excursionSelect.selectedOptions[0];
        
        const bookingData = {
            participants: parseInt(formData.get('participants')),
            fullName: formData.get('fullName'),
            contact: formData.get('contact'),
            hotel: formData.get('hotel'),
            excursionId: formData.get('excursion'),
            excursionName: selectedOption.dataset.name,
            excursionTime: selectedOption.dataset.time,
            date: formData.get('date'),
            payment: formData.get('payment'),
            notes: formData.get('notes') || ''
        };
        
        // Добавляем в Firestore
        await addBooking(bookingData);
        
        // Очищаем форму
        bookingForm.reset();
        
        showSuccess('Заявка успешно добавлена!');
        showLoading(false);
        
    } catch (error) {
        console.error('Ошибка добавления заявки:', error);
        window.TolikCRM.database.showError('Ошибка при сохранении заявки. Попробуйте еще раз.');
        window.TolikCRM.database.showLoading(false);
    }
}

// ========================
// Event Listeners Setup
// ========================

function setupEventListeners() {
    const bookingForm = document.getElementById('bookingForm');
    const excursionSelect = document.getElementById('excursion');
    const filterExcursionSelect = document.getElementById('filterExcursion');
    const filterDateInput = document.getElementById('filterDate');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const exportPDFBtn = document.getElementById('exportPDF');
    const exportExcelBtn = document.getElementById('exportExcel');
    
    // Отправка формы
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Обработчик изменения экскурсии для ограничения дат
    if (excursionSelect) {
        excursionSelect.addEventListener('change', handleExcursionChange);
    }
    
    // Фильтры
    if (filterExcursionSelect) {
        filterExcursionSelect.addEventListener('change', window.TolikCRM.database.applyFilters);
    }
    if (filterDateInput) {
        filterDateInput.addEventListener('change', window.TolikCRM.database.applyFilters);
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', window.TolikCRM.database.clearFilters);
    }
    
    // Экспорт данных
    if (exportPDFBtn && window.TolikCRM.exports) {
        exportPDFBtn.addEventListener('click', window.TolikCRM.exports.exportToPDF);
    }
    if (exportExcelBtn && window.TolikCRM.exports) {
        exportExcelBtn.addEventListener('click', window.TolikCRM.exports.exportToExcel);
    }
}

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.ui = {
    updateDashboardStats,
    updateExcursionCounters,
    renderBookingsTable,
    showExcursionDetails,
    closeExcursionModal,
    handleExcursionChange,
    handleFormSubmit,
    setupEventListeners
};

// Make functions globally available for HTML onclick
window.showExcursionDetails = showExcursionDetails;
window.closeExcursionModal = closeExcursionModal;