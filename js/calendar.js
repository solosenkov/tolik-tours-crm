// ========================
// 📅 Calendar & Schedule Logic
// ========================

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

// ========================
// Day Name Utilities
// ========================

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

function getDayNameFromDate(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

// ========================
// Calendar Restrictions
// ========================

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

// ========================
// Date Calculation
// ========================

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

// ========================
// Populate Selects
// ========================

function populateExcursionSelects() {
    const excursionSelect = document.getElementById('excursion');
    const filterExcursionSelect = document.getElementById('filterExcursion');
    
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

// ========================
// Date Hints
// ========================

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

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.calendar = {
    EXCURSIONS_SCHEDULE,
    getDayName,
    getDayNameFromDate,
    getAvailableDaysForExcursion,
    setupCalendarRestrictions,
    clearCalendarRestrictions,
    getNextAvailableDate,
    getNextAvailableDateFromDate,
    getReadableDayNames,
    populateExcursionSelects,
    showDateHint,
    hideDateHint
};