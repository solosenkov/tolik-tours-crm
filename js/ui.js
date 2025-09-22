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

function updateExcursionsOverview(allBookings) {
    const excursionsContainer = document.getElementById('excursionsContainer');
    if (!excursionsContainer) return;
    
    // Получаем все доступные экскурсии из модуля туров
    let allAvailableExcursions = [];
    if (window.TolikCRM.tours && window.TolikCRM.tours.getAllTours) {
        // Используем новую систему туров
        allAvailableExcursions = window.TolikCRM.tours.getAllTours()
            .filter(tour => tour.isActive)
            .map(tour => ({
                id: tour.id,
                name: tour.name,
                time: tour.departureTime + ' - ' + tour.returnTime
            }));
    } else {
        // Fallback к старой системе календаря
        allAvailableExcursions = window.TolikCRM.calendar.getAllAvailableExcursions();
    }
    
    // Группируем существующие заявки по экскурсиям
    const groupedByExcursions = window.TolikCRM.database.groupBookingsByExcursions(allBookings);
    
    // Создаем карточки для всех экскурсий
    excursionsContainer.innerHTML = allAvailableExcursions
        .map(excursion => {
            const excursionName = excursion.name;
            const dates = groupedByExcursions[excursionName] || {};
            const hasBookings = Object.keys(dates).length > 0;
            
            if (hasBookings) {
                // Есть заявки - показываем статистику и даты
                const totalParticipants = Object.values(dates)
                    .flat()
                    .reduce((sum, booking) => sum + booking.participants, 0);
                
                const datesCount = Object.keys(dates).length;
                
                // Создаем список дат
                const datesHTML = Object.entries(dates)
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                    .map(([date, bookings]) => {
                        const dateParticipants = bookings.reduce((sum, booking) => sum + booking.participants, 0);
                        const dateObj = new Date(date);
                        const formattedDate = window.TolikCRM.database.formatDate(dateObj);
                        const dayOfWeek = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' });
                        
                        return `
                            <div class="excursion-date" onclick="showExcursionDateDetails('${excursionName}', '${date}')">
                                <div class="date-info">
                                    <span class="date-day">${formattedDate}</span>
                                    <span class="date-weekday">(${dayOfWeek})</span>
                                </div>
                                <div class="date-participants">
                                    <i class="fas fa-users"></i>
                                    ${dateParticipants} чел.
                                </div>
                            </div>
                        `;
                    }).join('');
                
                return `
                    <div class="excursion-card has-bookings">
                        <div class="excursion-header">
                            <div class="excursion-title">
                                <i class="fas fa-map-marker-alt"></i>
                                <h3>${excursionName}</h3>
                            </div>
                            <div class="excursion-stats">
                                <span class="total-participants">${totalParticipants} чел.</span>
                                <span class="total-dates">на ${datesCount} дат${datesCount === 1 ? 'у' : ''}</span>
                            </div>
                        </div>
                        <div class="excursion-dates">
                            ${datesHTML}
                        </div>
                    </div>
                `;
            } else {
                // Нет заявок - показываем заглушку
                return `
                    <div class="excursion-card no-bookings">
                        <div class="excursion-header">
                            <div class="excursion-title">
                                <i class="fas fa-map-marker-alt"></i>
                                <h3>${excursionName}</h3>
                            </div>
                            <div class="excursion-stats">
                                <span class="total-participants">0 чел.</span>
                                <span class="total-dates">нет дат</span>
                            </div>
                        </div>
                        <div class="excursion-dates empty">
                            <div class="empty-state">
                                <i class="fas fa-calendar-plus"></i>
                                <p>Пока нет записей</p>
                                <small>Добавьте первую заявку через форму ниже</small>
                            </div>
                        </div>
                    </div>
                `;
            }
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

function showExcursionDateDetails(excursionName, date) {
    const modal = document.getElementById('excursionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalExcursionDates');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    // Форматируем дату для заголовка
    const dateObj = new Date(date);
    const formattedDate = window.TolikCRM.database.formatDate(dateObj);
    const dayOfWeek = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
    
    // Устанавливаем заголовок
    modalTitle.textContent = `${excursionName} — ${formattedDate} (${dayOfWeek})`;
    
    // Фильтруем заявки по экскурсии и дате
    const allBookings = window.TolikCRM.database.getAllBookings();
    const dateBookings = allBookings.filter(booking => 
        booking.excursionName === excursionName && booking.date === date
    );
    
    if (dateBookings.length === 0) {
        modalBody.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>Нет участников</h3>
                <p>На эту дату пока никто не записан</p>
            </div>
        `;
    } else {
        const totalParticipants = dateBookings.reduce((sum, booking) => sum + booking.participants, 0);
        const getPaymentStatusText = window.TolikCRM.database.getPaymentStatusText;
        
        const bookingsHTML = dateBookings.map(booking => `
            <div class="booking-item">
                <div class="booking-main">
                    <div class="booking-name">
                        <i class="fas fa-user"></i>
                        ${booking.fullName}
                    </div>
                    <div class="booking-participants">
                        <i class="fas fa-users"></i>
                        ${booking.participants} чел.
                    </div>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <i class="fas fa-phone"></i>
                        ${booking.contact}
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-building"></i>
                        ${booking.hotel}
                    </div>
                    <div class="booking-detail payment-${booking.payment}">
                        <i class="fas fa-credit-card"></i>
                        ${getPaymentStatusText(booking.payment)}
                    </div>
                    ${booking.notes ? `
                        <div class="booking-detail">
                            <i class="fas fa-sticky-note"></i>
                            ${booking.notes}
                        </div>
                    ` : ''}
                </div>
                <div class="booking-actions">
                    <button class="action-btn delete" onclick="deleteBooking('${booking.id}')" title="Удалить заявку">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        modalBody.innerHTML = `
            <div class="date-summary">
                <div class="summary-info">
                    <h4>Всего участников: ${totalParticipants}</h4>
                    <p>Заявок: ${dateBookings.length}</p>
                </div>
                <div class="summary-actions">
                    <button class="export-group-btn" onclick="exportGroupToExcel('${excursionName}', '${date}')" title="Скачать список группы в Excel">
                        <i class="fas fa-file-excel"></i>
                        Скачать группу
                    </button>
                </div>
            </div>
            <div class="bookings-list">
                ${bookingsHTML}
            </div>
        `;
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

// ========================
// Form Handling
// ========================

function handleExcursionChange(e) {
    // Теперь мы не ограничиваем календарь - любая экскурсия может быть в любой день
    // Менеджер сам выбирает подходящую дату
    
    const selectedValue = e.target.value;
    const dateInput = document.getElementById('date');
    
    if (selectedValue) {
        // Показываем подсказку о выбранной экскурсии
        const hint = document.getElementById('dateHint');
        if (hint) {
            hint.textContent = `Выберите любую дату для экскурсии "${selectedValue}"`;
            hint.style.display = 'block';
        }
        
        // Устанавливаем минимальную дату - сегодня или завтра
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        
        // Фокусируемся на поле даты для удобства
        dateInput.focus();
    } else {
        // Убираем подсказку и ограничения если экскурсия не выбрана
        const hint = document.getElementById('dateHint');
        if (hint) {
            hint.style.display = 'none';
        }
        dateInput.min = '';
        dateInput.value = '';
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
        const excursionName = formData.get('excursion');
        
        // Получаем информацию об экскурсии из модуля tours
        let excursionTime = '';
        if (window.TolikCRM.tours && window.TolikCRM.tours.getTourByName) {
            const tour = window.TolikCRM.tours.getTourByName(excursionName);
            if (tour) {
                excursionTime = `${tour.departureTime} - ${tour.returnTime}`;
            }
        }
        
        const bookingData = {
            participants: parseInt(formData.get('participants')),
            fullName: formData.get('fullName'),
            contact: formData.get('contact'),
            hotel: formData.get('hotel'),
            excursionId: excursionName, // используем название экскурсии как ID
            excursionName: excursionName, // название экскурсии
            excursionTime: excursionTime, // время из данных экскурсии
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
    if (exportExcelBtn && window.TolikCRM.exports) {
        exportExcelBtn.addEventListener('click', window.TolikCRM.exports.exportToExcel);
    }
}

// ========================
// Navigation Functions
// ========================

function setupNavigation() {
    // Получаем кнопки навигации
    const navBookings1 = document.getElementById('navBookings');
    const navBookings2 = document.getElementById('navBookings2');
    const navBookings3 = document.getElementById('navBookings3');
    
    const navTours1 = document.getElementById('navTours');
    const navTours2 = document.getElementById('navTours2');
    const navTours3 = document.getElementById('navTours3');
    
    const navFinances1 = document.getElementById('navFinances');
    const navFinances2 = document.getElementById('navFinances2');
    const navFinances3 = document.getElementById('navFinances3');
    
    const bookingsPage = document.getElementById('bookingsPage');
    const toursPage = document.getElementById('toursPage');
    const financesPage = document.getElementById('financesPage');
    
    // Функция переключения на страницу заявок
    function showBookingsPage() {
        bookingsPage.classList.add('active');
        toursPage.classList.remove('active');
        financesPage.classList.remove('active');
        
        // Обновляем состояние кнопок
        [navBookings1, navBookings2, navBookings3].forEach(btn => {
            if (btn) btn.classList.add('active');
        });
        [navTours1, navTours2, navTours3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        [navFinances1, navFinances2, navFinances3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
    }
    
    // Функция переключения на страницу экскурсий
    function showToursPage() {
        toursPage.classList.add('active');
        bookingsPage.classList.remove('active');
        financesPage.classList.remove('active');
        
        // Обновляем состояние кнопок
        [navTours1, navTours2, navTours3].forEach(btn => {
            if (btn) btn.classList.add('active');
        });
        [navBookings1, navBookings2, navBookings3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        [navFinances1, navFinances2, navFinances3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Инициализируем модуль экскурсий при первом открытии
        if (window.TolikCRM.tours && window.TolikCRM.tours.initToursPage) {
            window.TolikCRM.tours.initToursPage();
        }
    }
    
    // Функция переключения на финансовую страницу
    function showFinancesPage() {
        financesPage.classList.add('active');
        bookingsPage.classList.remove('active');
        toursPage.classList.remove('active');
        
        // Обновляем состояние кнопок
        [navFinances1, navFinances2, navFinances3].forEach(btn => {
            if (btn) btn.classList.add('active');
        });
        [navBookings1, navBookings2, navBookings3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        [navTours1, navTours2, navTours3].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Инициализируем финансовый модуль при первом открытии
        if (window.TolikCRM.finance && window.TolikCRM.finance.initFinancePage) {
            window.TolikCRM.finance.initFinancePage();
        }
    }
    
    // Навешиваем обработчики для заявок
    if (navBookings1) navBookings1.addEventListener('click', showBookingsPage);
    if (navBookings2) navBookings2.addEventListener('click', showBookingsPage);
    if (navBookings3) navBookings3.addEventListener('click', showBookingsPage);
    
    // Навешиваем обработчики для экскурсий
    if (navTours1) navTours1.addEventListener('click', showToursPage);
    if (navTours2) navTours2.addEventListener('click', showToursPage);
    if (navTours3) navTours3.addEventListener('click', showToursPage);
    
    // Навешиваем обработчики для финансов
    if (navFinances1) navFinances1.addEventListener('click', showFinancesPage);
    if (navFinances2) navFinances2.addEventListener('click', showFinancesPage);
    if (navFinances3) navFinances3.addEventListener('click', showFinancesPage);
}

// ========================
// Refresh Dashboard Function
// ========================

async function refreshDashboard() {
    try {
        // Получаем свежие данные бронирований
        const allBookings = await window.TolikCRM.database.getAllBookings();
        
        // Обновляем статистику и карточки экскурсий
        updateDashboardStats(allBookings);
        updateExcursionsOverview(allBookings);
        
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.ui = {
    updateDashboardStats,
    updateExcursionsOverview,
    renderBookingsTable,
    showExcursionDetails,
    showExcursionDateDetails,
    closeExcursionModal,
    handleExcursionChange,
    handleFormSubmit,
    setupEventListeners,
    setupNavigation,
    refreshDashboard
};

// Make functions globally available for HTML onclick
window.showExcursionDetails = showExcursionDetails;
window.showExcursionDateDetails = showExcursionDateDetails;
window.closeExcursionModal = closeExcursionModal;