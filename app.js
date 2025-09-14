const firebaseConfig = {
    apiKey: "AIzaSyAvexYVTMpdGGG1oBPJdqCrw9b0GIhCWsI",
    authDomain: "tolik-tours-crm.firebaseapp.com",
    projectId: "tolik-tours-crm",
    storageBucket: "tolik-tours-crm.firebasestorage.app",
    messagingSenderId: "217275046335",
    appId: "1:217275046335:web:43287c9fa8056c24d3a90a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const EXCURSIONS_SCHEDULE = {
    'monday': [
        { id: 'south-islands-mon', name: 'Южные острова', time: '08:00' }
    ],
    'tuesday': [
        { id: 'dalat-tue', name: 'Далат', time: '06:00' },
        { id: 'north-islands-tue', name: 'Северные острова', time: '08:30' }
    ],
    'wednesday': [
        { id: 'city-tour-wed', name: 'Городской тур Нячанг', time: '09:00' },
        { id: 'doc-let-wed', name: 'Док Лет', time: '08:00' }
    ],
    'thursday': [
        { id: 'dalat-thu', name: 'Далат', time: '06:00' },
        { id: 'south-islands-thu', name: 'Южные острова', time: '08:00' }
    ],
    'friday': [
        { id: 'north-islands-fri', name: 'Северные острова', time: '08:30' }
    ],
    'saturday': [
        { id: 'dalat-sat', name: 'Далат', time: '06:00' },
        { id: 'south-islands-sat', name: 'Южные острова', time: '08:00' }
    ],
    'sunday': [
        { id: 'yang-bay-sun', name: 'Янг Бай', time: '08:00' },
        { id: 'phan-rang-sun', name: 'Фан Ранг', time: '07:00' }
    ]
};

let allBookings = [];
let filteredBookings = [];

const bookingForm = document.getElementById('bookingForm');
const excursionSelect = document.getElementById('excursion');
const filterExcursionSelect = document.getElementById('filterExcursion');
const filterDateInput = document.getElementById('filterDate');
const clearFiltersBtn = document.getElementById('clearFilters');
const bookingsTableBody = document.getElementById('bookingsTableBody');
const noBookingsDiv = document.getElementById('noBookings');
const loadingOverlay = document.getElementById('loadingOverlay');

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        if (!checkAccess()) {
            showLoginScreen();
            return;
        }
        
        showLoading(true);
        
        // Заполняем расписание экскурсий
        populateExcursionSelects();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        // Загружаем данные из Firestore
        setupFirestoreListeners();
        
        showLoading(false);
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Ошибка подключения к базе данных. Проверьте настройки Firebase.');
        showLoading(false);
    }
}

function populateExcursionSelects() {
    // Очищаем селекты
    excursionSelect.innerHTML = '<option value="">Выберите экскурсию</option>';
    filterExcursionSelect.innerHTML = '<option value="">Все экскурсии</option>';
    
    // Заполняем селекты экскурсиями БЕЗ времени
    Object.entries(EXCURSIONS_SCHEDULE).forEach(([day, excursions]) => {
        excursions.forEach(excursion => {
            const dayName = getDayName(day);
            const optionText = `${excursion.name} (${dayName})`;
            
            // Для формы добавления
            const option1 = document.createElement('option');
            option1.value = excursion.id;
            option1.textContent = optionText;
            option1.dataset.day = day;
            option1.dataset.name = excursion.name;
            option1.dataset.time = excursion.time;
            excursionSelect.appendChild(option1);
            
            // Для фильтра
            const option2 = document.createElement('option');
            option2.value = excursion.id;
            option2.textContent = optionText;
            filterExcursionSelect.appendChild(option2);
        });
    });
}

function getDayName(day) {
    const days = {
        'monday': 'Понедельник',
        'tuesday': 'Вторник', 
        'wednesday': 'Среда',
        'thursday': 'Четверг',
        'friday': 'Пятница',
        'saturday': 'Суббота',
        'sunday': 'Воскресенье'
    };
    return days[day] || day;
}

function setupEventListeners() {
    // Отправка формы
    bookingForm.addEventListener('submit', handleFormSubmit);
    
    // Обработчик изменения экскурсии для ограничения дат
    excursionSelect.addEventListener('change', handleExcursionChange);
    
    // Фильтры
    filterExcursionSelect.addEventListener('change', applyFilters);
    filterDateInput.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Экспорт данных
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
}

function handleExcursionChange(e) {
    const selectedValue = e.target.value;
    const dateInput = document.getElementById('date');
    
    if (selectedValue) {
        // Находим выбранную экскурсию в расписании
        let selectedExcursion = null;
        let availableDays = [];
        
        Object.entries(EXCURSIONS_SCHEDULE).forEach(([day, excursions]) => {
            excursions.forEach(excursion => {
                if (excursion.id === selectedValue) {
                    selectedExcursion = excursion;
                    availableDays.push(day);
                }
            });
        });
        
        if (selectedExcursion && availableDays.length > 0) {
            // Устанавливаем ограничения на календарь
            setupCalendarRestrictions(dateInput, availableDays);
            
            // Автоматически выбираем ближайшую подходящую дату
            const nextDate = getNextAvailableDate(availableDays);
            if (nextDate) {
                dateInput.value = nextDate;
            }
            
            // Показываем подсказку пользователю
            showDateHint(selectedExcursion.name, availableDays);
        }
    } else {
        // Если экскурсия не выбрана, убираем ограничения
        clearCalendarRestrictions(dateInput);
        hideDateHint();
    }
}

function getAvailableDaysForExcursion(excursionName) {
    const availableDays = [];
    
    Object.entries(EXCURSIONS_SCHEDULE).forEach(([day, excursions]) => {
        excursions.forEach(excursion => {
            if (excursion.name === excursionName) {
                availableDays.push(day);
            }
        });
    });
    
    return availableDays;
}

function setupCalendarRestrictions(dateInput, availableDays) {
    // Убираем старый обработчик если был
    const oldHandler = dateInput._restrictionHandler;
    if (oldHandler) {
        dateInput.removeEventListener('input', oldHandler);
    }
    
    // Устанавливаем минимальную дату (сегодня)
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Создаем новый обработчик ограничений
    const restrictionHandler = function(event) {
        const selectedDate = new Date(event.target.value);
        const dayName = getDayNameFromDate(selectedDate);
        
        if (!availableDays.includes(dayName)) {
            // Если выбранный день недели не подходит, находим ближайший подходящий
            const nextDate = getNextAvailableDateFromDate(selectedDate, availableDays);
            if (nextDate) {
                event.target.value = nextDate;
                showError(`Эта экскурсия проводится только в ${getReadableDayNames(availableDays)}. Выбрана ближайшая подходящая дата.`);
            }
        }
    };
    
    // Сохраняем ссылку на обработчик и добавляем его
    dateInput._restrictionHandler = restrictionHandler;
    dateInput.addEventListener('input', restrictionHandler);
}

function clearCalendarRestrictions(dateInput) {
    const oldHandler = dateInput._restrictionHandler;
    if (oldHandler) {
        dateInput.removeEventListener('input', oldHandler);
        dateInput._restrictionHandler = null;
    }
    dateInput.removeAttribute('min');
}

function getDayNameFromDate(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

function getNextAvailableDate(availableDays) {
    const today = new Date();
    
    // Ищем ближайшую подходящую дату в течение следующих 30 дней
    for (let i = 0; i < 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        const dayName = getDayNameFromDate(testDate);
        if (availableDays.includes(dayName)) {
            return testDate.toISOString().split('T')[0];
        }
    }
    
    return null;
}

function getNextAvailableDateFromDate(fromDate, availableDays) {
    // Ищем ближайшую подходящую дату в течение следующих 30 дней от выбранной даты
    for (let i = 0; i < 30; i++) {
        const testDate = new Date(fromDate);
        testDate.setDate(fromDate.getDate() + i);
        
        const dayName = getDayNameFromDate(testDate);
        if (availableDays.includes(dayName)) {
            return testDate.toISOString().split('T')[0];
        }
    }
    
    return null;
}

function getReadableDayNames(dayKeys) {
    const dayNames = {
        'monday': 'понедельники',
        'tuesday': 'вторники', 
        'wednesday': 'среды',
        'thursday': 'четверги',
        'friday': 'пятницы',
        'saturday': 'субботы',
        'sunday': 'воскресенья'
    };
    
    return dayKeys.map(key => dayNames[key]).join(', ');
}

function showDateHint(excursionName, availableDays) {
    let hintElement = document.getElementById('dateHint');
    if (!hintElement) {
        hintElement = document.createElement('div');
        hintElement.id = 'dateHint';
        hintElement.className = 'date-hint';
        
        const dateInput = document.getElementById('date');
        dateInput.parentNode.insertBefore(hintElement, dateInput.nextSibling);
    }
    
    const dayNames = getReadableDayNames(availableDays);
    hintElement.innerHTML = `<i class="fas fa-info-circle"></i> Экскурсия "${excursionName}" проводится в: ${dayNames}`;
    hintElement.style.display = 'block';
}

function hideDateHint() {
    const hintElement = document.getElementById('dateHint');
    if (hintElement) {
        hintElement.style.display = 'none';
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

function showCalendarWarning(message) {
    // Показываем предупреждение в подсказке
    let hint = document.getElementById('date-hint');
    if (hint) {
        hint.innerHTML = `⚠️ ${message}`;
        hint.classList.add('warning');
        
        // Убираем предупреждение через 3 секунды
        setTimeout(() => {
            hint.classList.remove('warning');
        }, 3000);
    } else {
        showError(message);
    }
}

function clearCalendarRestrictions(dateInput) {
    const oldHandler = dateInput._restrictionHandler;
    if (oldHandler) {
        dateInput.removeEventListener('input', oldHandler);
        delete dateInput._restrictionHandler;
    }
    
    // Убираем минимальную дату
    dateInput.removeAttribute('min');
    
    // Удаляем стили ограничений
    const existingStyle = document.getElementById('calendar-restrictions');
    if (existingStyle) {
        existingStyle.remove();
    }
}

function getNextAvailableDate(availableDays, fromDate = new Date()) {
    const dayIndices = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    // Получаем индексы доступных дней
    const availableIndices = availableDays.map(day => dayIndices[day]);
    
    let checkDate = new Date(fromDate);
    
    // Ищем ближайший подходящий день (максимум 14 дней вперед)
    for (let i = 0; i < 14; i++) {
        const dayIndex = checkDate.getDay();
        
        if (availableIndices.includes(dayIndex)) {
            return checkDate.toISOString().split('T')[0];
        }
        
        checkDate.setDate(checkDate.getDate() + 1);
    }
    
    // Если не нашли, возвращаем сегодня + 1 день
    return new Date(Date.now() + 86400000).toISOString().split('T')[0];
}

function hideeDateHint() {
    const hint = document.getElementById('date-hint');
    if (hint) {
        hint.style.display = 'none';
    }
}

function getNextDateByDayOfWeek(dayOfWeek) {
    const days = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const targetDay = days[dayOfWeek];
    const today = new Date();
    const todayDay = today.getDay();
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Следующая неделя
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate.toISOString().split('T')[0];
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
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
            notes: formData.get('notes') || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Добавляем в Firestore
        await db.collection('bookings').add(bookingData);
        
        // Очищаем форму
        bookingForm.reset();
        
        showSuccess('Заявка успешно добавлена!');
        showLoading(false);
        
    } catch (error) {
        console.error('Ошибка добавления заявки:', error);
        showError('Ошибка при сохранении заявки. Попробуйте еще раз.');
        showLoading(false);
    }
}

function setupFirestoreListeners() {
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
        updateDashboardStats();
        updateExcursionCounters();
        
    }, (error) => {
        console.error('Ошибка получения данных:', error);
        showError('Ошибка загрузки данных из базы');
    });
}

function applyFilters() {
    const excursionFilter = filterExcursionSelect.value;
    const dateFilter = filterDateInput.value;
    
    filteredBookings = allBookings.filter(booking => {
        const matchesExcursion = !excursionFilter || booking.excursionId === excursionFilter;
        const matchesDate = !dateFilter || booking.date === dateFilter;
        
        return matchesExcursion && matchesDate;
    });
    
    renderBookingsTable();
}

function clearFilters() {
    filterExcursionSelect.value = '';
    filterDateInput.value = '';
    applyFilters();
}

function renderBookingsTable() {
    if (filteredBookings.length === 0) {
        bookingsTableBody.innerHTML = '';
        noBookingsDiv.style.display = 'block';
        return;
    }
    
    noBookingsDiv.style.display = 'none';
    
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

function updateDashboardStats() {
    const totalParticipants = allBookings.reduce((sum, booking) => sum + booking.participants, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(booking => 
        booking.createdAt.toISOString().split('T')[0] === today
    ).length;
    
    const activeExcursions = new Set(allBookings.map(booking => booking.excursionId)).size;
    
    document.getElementById('totalParticipants').textContent = totalParticipants;
    document.getElementById('totalBookings').textContent = todayBookings;
    document.getElementById('activeExcursions').textContent = activeExcursions;
}

function updateExcursionCounters() {
    const scheduleGrid = document.getElementById('weeklySchedule');
    
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

async function deleteBooking(bookingId) {
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

// Глобальная функция для удаления (для onclick в HTML)
window.deleteBooking = deleteBooking;

// Utility функции
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
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// =============== МОДАЛЬНОЕ ОКНО ДЕТАЛИЗАЦИИ ЭКСКУРСИЙ ===============

function showExcursionDetails(excursionId, excursionName) {
    const modal = document.getElementById('excursionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalExcursionDates');
    
    // Устанавливаем заголовок
    modalTitle.textContent = `Заявки: ${excursionName}`;
    
    // Фильтруем заявки по выбранной экскурсии
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
    modal.style.display = 'none';
}

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

// Делаем функции глобальными для вызова из HTML
window.showExcursionDetails = showExcursionDetails;
window.closeExcursionModal = closeExcursionModal;

// =============== ЭКСПОРТ ДАННЫХ ===============

function exportToPDF() {
    if (filteredBookings.length === 0) {
        showError('Нет данных для экспорта. Добавьте заявки или измените фильтры.');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Заголовок (на английском для совместимости)
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Tolik Tours - Booking List', 20, 20);
        
        // Информация о экспорте
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        const exportDate = new Date().toLocaleDateString('en-US');
        const exportTime = new Date().toLocaleTimeString('en-US');
        doc.text(`Export created: ${exportDate} at ${exportTime}`, 20, 30);
        
        // Группируем заявки по экскурсиям и датам
        const groupedBookings = groupBookingsByExcursionAndDate(filteredBookings);
        
        let yPosition = 50;
        
        Object.entries(groupedBookings).forEach(([key, bookings]) => {
            const [excursionName, date] = key.split('|');
            const totalParticipants = bookings.reduce((sum, b) => sum + b.participants, 0);
            
            // Заголовок экскурсии
            doc.setFontSize(16);
            doc.setTextColor(37, 99, 235);
            doc.text(`${excursionName}`, 20, yPosition);
            
            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text(`Date: ${formatDateForPDF(new Date(date))} | Total: ${totalParticipants} people`, 20, yPosition + 8);
            
            yPosition += 20;
            
            // Таблица участников (латиницей для совместимости)
            const tableData = bookings.map((booking, index) => [
                index + 1,
                convertToLatin(booking.fullName),
                booking.contact,
                convertToLatin(booking.hotel),
                `${booking.participants} ppl`,
                getPaymentStatusTextEn(booking.payment),
                convertToLatin(booking.notes || '—')
            ]);
            
            doc.autoTable({
                startY: yPosition,
                head: [['#', 'Full Name', 'Contact', 'Hotel', 'People', 'Payment', 'Notes']],
                body: tableData,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    font: 'helvetica'
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: 20, right: 20 }
            });
            
            yPosition = doc.lastAutoTable.finalY + 20;
            
            // Проверяем, нужна ли новая страница
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });
        
        // Сохраняем файл
        const fileName = `tolik_tours_bookings_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showSuccess('PDF файл успешно сохранен!');
        
    } catch (error) {
        console.error('Ошибка экспорта в PDF:', error);
        showError('Ошибка при создании PDF файла. Попробуйте еще раз.');
    }
}

// Вспомогательные функции для PDF
function convertToLatin(text) {
    if (!text || typeof text !== 'string') return '';
    
    const cyrillic = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const latin = 'abvgdeeyzhzijklmnoprstufhzcchshshchhyeyuaaabvgdeeyzhzijklmnoprstufhzcchshshchhyeyua';
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = cyrillic.indexOf(char);
        result += index !== -1 ? latin[index] : char;
    }
    
    return result;
}

function formatDateForPDF(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getPaymentStatusTextEn(status) {
    const statusMap = {
        'pending': 'Pending',
        'partial': 'Partial', 
        'paid': 'Paid'
    };
    return statusMap[status] || 'Pending';
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

function exportToExcel() {
    if (filteredBookings.length === 0) {
        showError('Нет данных для экспорта. Добавьте заявки или измените фильтры.');
        return;
    }
    
    try {
        // Подготавливаем данные для Excel
        const excelData = filteredBookings.map((booking, index) => ({
            '№': index + 1,
            'Дата создания': formatDate(booking.createdAt),
            'ФИО': booking.fullName,
            'Контакт': booking.contact,
            'Отель': booking.hotel,
            'Экскурсия': booking.excursionName,
            'Дата экскурсии': formatDate(new Date(booking.date)),
            'Время': booking.excursionTime,
            'Участников': booking.participants,
            'Оплата': getPaymentStatusText(booking.payment),
            'Примечания': booking.notes || ''
        }));
        
        // Создаем рабочую книгу
        const wb = XLSX.utils.book_new();
        
        // Создаем лист с данными
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Настраиваем ширину столбцов
        const colWidths = [
            { wch: 5 },   // №
            { wch: 12 },  // Дата создания
            { wch: 25 },  // ФИО
            { wch: 20 },  // Контакт
            { wch: 25 },  // Отель
            { wch: 30 },  // Экскурсия
            { wch: 15 },  // Дата экскурсии
            { wch: 8 },   // Время
            { wch: 10 },  // Участников
            { wch: 12 },  // Оплата
            { wch: 30 }   // Примечания
        ];
        ws['!cols'] = colWidths;
        
        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(wb, ws, 'Заявки');
        
        // Создаем сводный лист с статистикой
        const statsData = createStatsData(filteredBookings);
        const statsWs = XLSX.utils.json_to_sheet(statsData);
        statsWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, statsWs, 'Статистика');
        
        // Сохраняем файл
        const fileName = `Tolik_Tours_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showSuccess(`Excel файл "${fileName}" успешно создан!`);
        
    } catch (error) {
        console.error('Ошибка создания Excel:', error);
        showError('Ошибка при создании Excel файла. Попробуйте еще раз.');
    }
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

function createStatsData(bookings) {
    const stats = [];
    
    // Общая статистика
    stats.push({
        'Показатель': 'Общее количество заявок',
        'Значение': bookings.length,
        'Примечание': ''
    });
    
    stats.push({
        'Показатель': 'Общее количество участников',
        'Значение': bookings.reduce((sum, b) => sum + b.participants, 0),
        'Примечание': 'человек'
    });
    
    // Статистика по экскурсиям
    const excursionStats = {};
    bookings.forEach(booking => {
        if (!excursionStats[booking.excursionName]) {
            excursionStats[booking.excursionName] = { bookings: 0, participants: 0 };
        }
        excursionStats[booking.excursionName].bookings++;
        excursionStats[booking.excursionName].participants += booking.participants;
    });
    
    stats.push({
        'Показатель': '',
        'Значение': '',
        'Примечание': ''
    });
    
    stats.push({
        'Показатель': 'ПО ЭКСКУРСИЯМ:',
        'Значение': '',
        'Примечание': ''
    });
    
    Object.entries(excursionStats).forEach(([excursion, data]) => {
        stats.push({
            'Показатель': excursion,
            'Значение': data.participants,
            'Примечание': `${data.bookings} заявок`
        });
    });
    
    // Статистика по оплатам
    const paymentStats = {
        'paid': 0,
        'partial': 0,
        'pending': 0
    };
    
    bookings.forEach(booking => {
        paymentStats[booking.payment]++;
    });
    
    stats.push({
        'Показатель': '',
        'Значение': '',
        'Примечание': ''
    });
    
    stats.push({
        'Показатель': 'ПО ОПЛАТАМ:',
        'Значение': '',
        'Примечание': ''
    });
    
    stats.push({
        'Показатель': 'Оплачено',
        'Значение': paymentStats.paid,
        'Примечание': 'заявок'
    });
    
    stats.push({
        'Показатель': 'Частично оплачено',
        'Значение': paymentStats.partial,
        'Примечание': 'заявок'
    });
    
    stats.push({
        'Показатель': 'Ожидает оплаты',
        'Значение': paymentStats.pending,
        'Примечание': 'заявок'
    });
    
    return stats;
}



function checkAccess() {
    return localStorage.getItem('tolikCrmAccess') === getRandomData();
}

function showLoginScreen() {
    document.body.innerHTML = `
        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="
                background: white; 
                padding: 40px; 
                border-radius: 16px; 
                box-shadow: 0 20px 60px rgba(0,0,0,0.1); 
                text-align: center;
                max-width: 400px;
                width: 100%;
            ">
                <div style="margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px;">🏝️ Tolik Tours</h1>
                    <h2 style="color: #64748b; margin: 0; font-size: 18px; font-weight: 500;">CRM система</h2>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #475569; font-size: 14px;">
                            🔒 Для доступа к системе управления заявками<br>введите пароль
                        </p>
                    </div>
                    
                    <input 
                        type="password" 
                        id="accessPassword" 
                        placeholder="Введите пароль доступа"
                        style="
                            width: 100%;
                            padding: 16px;
                            border: 2px solid #e2e8f0;
                            border-radius: 12px;
                            font-size: 16px;
                            box-sizing: border-box;
                            transition: border-color 0.3s ease;
                            outline: none;
                        "
                        onkeypress="if(event.key==='Enter') attemptAccess()"
                    >
                </div>
                
                <button 
                    onclick="attemptAccess()" 
                    style="
                        width: 100%;
                        background: #2563eb; 
                        color: white; 
                        padding: 16px 24px; 
                        border: none; 
                        border-radius: 12px; 
                        cursor: pointer; 
                        font-size: 16px;
                        font-weight: 600;
                        transition: background 0.3s ease;
                    "
                    onmouseover="this.style.background='#1d4ed8'"
                    onmouseout="this.style.background='#2563eb'"
                >
                    🚀 Войти в систему
                </button>
                
                <p style="
                    color: #94a3b8; 
                    font-size: 12px; 
                    margin-top: 20px;
                    line-height: 1.5;
                ">
                    Система защищена от несанкционированного доступа<br>
                    © 2024 Tolik Tours - Нячанг, Вьетнам
                </p>
            </div>
        </div>
    `;
}

function attemptAccess() {
    const passwordInput = document.getElementById('accessPassword');
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    const enteredPassword = passwordInput.value.trim();
    
    if (enteredPassword === getRandomData()) {
        localStorage.setItem('tolikCrmAccess', getRandomData());
        
        passwordInput.style.borderColor = '#10b981';
        passwordInput.style.background = '#f0fdf4';
        
        const button = passwordInput.parentElement.querySelector('button');
        if (button) {
            button.innerHTML = '✅ Доступ разрешен! Загружаем...';
            button.style.background = '#10b981';
        }
        
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } else {
        passwordInput.style.borderColor = '#ef4444';
        passwordInput.style.background = '#fef2f2';
        passwordInput.value = '';
        passwordInput.placeholder = '❌ Неверный пароль! Попробуйте еще раз';
        
        passwordInput.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            passwordInput.style.borderColor = '#e2e8f0';
            passwordInput.style.background = 'white';
            passwordInput.placeholder = 'Введите пароль доступа';
            passwordInput.style.animation = '';
        }, 2000);
    }
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
        20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
`;
document.head.appendChild(shakeStyle);

window.attemptAccess = attemptAccess;

const random_data = "tolik2025dalat";

function getRandomData() {
    return document.querySelector('.error-message') ? random_data : "tolik2025dalat";
}
