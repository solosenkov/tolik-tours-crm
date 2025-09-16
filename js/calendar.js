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

// ========================
// Date Calculation (simplified - no restrictions)
// ========================

// Removed old restriction functions - no longer needed
// All dates are now available for all excursions

// ========================
// Populate Selects
// ========================

function populateExcursionSelects() {
    const excursionSelect = document.getElementById('excursion');
    const filterExcursionSelect = document.getElementById('filterExcursion');
    
    if (!excursionSelect || !filterExcursionSelect) return;
    
    // Очищаем селекты
    excursionSelect.innerHTML = '<option value="">Выберите экскурсию</option>';
    filterExcursionSelect.innerHTML = '<option value="">Все экскурсии</option>';
    
    // Получаем уникальные экскурсии из календаря
    const uniqueExcursions = getAllAvailableExcursions();
    
    // Заполняем селекты уникальными экскурсиями БЕЗ привязки к дням
    uniqueExcursions.forEach(excursion => {
        // Для формы добавления
        const option1 = document.createElement('option');
        option1.value = excursion.name; // используем название как id
        option1.textContent = excursion.name;
        option1.dataset.name = excursion.name;
        option1.dataset.time = excursion.time;
        excursionSelect.appendChild(option1);
        
        // Для фильтра
        const option2 = document.createElement('option');
        option2.value = excursion.name;
        option2.textContent = excursion.name;
        filterExcursionSelect.appendChild(option2);
    });
}

// ========================
// Date Hints (simplified)
// ========================

function showDateHint(message) {
    let hintElement = document.getElementById('dateHint');
    if (!hintElement) {
        hintElement = document.createElement('div');
        hintElement.id = 'dateHint';
        hintElement.className = 'date-hint';
        
        const dateInput = document.getElementById('date');
        if (dateInput && dateInput.parentNode) {
            dateInput.parentNode.insertBefore(hintElement, dateInput.nextSibling);
        }
    }
    
    hintElement.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    hintElement.style.display = 'block';
}

function hideDateHint() {
    const hint = document.getElementById('dateHint');
    if (hint) {
        hint.style.display = 'none';
    }
}

// ========================
// Get All Available Excursions
// ========================

function getAllAvailableExcursions() {
    const excursionsMap = new Map();
    
    // Проходим по всем дням недели и собираем уникальные экскурсии
    Object.values(EXCURSIONS_SCHEDULE).forEach(dayExcursions => {
        dayExcursions.forEach(excursion => {
            if (!excursionsMap.has(excursion.name)) {
                excursionsMap.set(excursion.name, {
                    id: excursion.id,
                    name: excursion.name,
                    time: excursion.time
                });
            }
        });
    });
    
    // Возвращаем массив уникальных экскурсий, отсортированный по названию
    return Array.from(excursionsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    populateExcursionSelects,
    showDateHint,
    hideDateHint,
    getAllAvailableExcursions
};