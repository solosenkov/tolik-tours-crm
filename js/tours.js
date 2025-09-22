// ========================
// 🗺️ Tours Management Module
// ========================

// Хранилище данных о турах
let allTours = [];

// Начальные данные экскурсий на основе файла tours_list.txt
const INITIAL_TOURS_DATA = [
    {
        id: 'dalat',
        name: 'Далат ИНСТАГРАМ',
        price: 55,
        groupSize: '10-13 чел',
        departureTime: '5:00-5:30',
        returnTime: '19:00',
        duration: '14 часов',
        description: 'Горная экскурсия в Далат с посещением парка любви, стеклянного моста, музея восковых фигур, керамического храма и фермы кофе Лювак.',
        features: ['Завтрак в коробочке', 'Обед включен', 'Горный перевал', 'Парк любви', 'Стеклянный мост', 'Крейзи Хаус', 'Ферма Лювак'],
        included: 'Говядина, курица, супы, салаты, ром и кола',
        notes: 'Взять кофточку (холоднее чем в Нячанге), таблетки от укачивания, закрытые колени и плечи для храмов',
        isActive: true
    },
    {
        id: 'northern-islands',
        name: 'Остров обезьян и Северные острова',
        price: 35,
        groupSize: '10+ чел',
        departureTime: '7:00-7:30',
        returnTime: '16:00',
        duration: '9 часов',
        description: 'Посещение острова Орхидей с зоопарком и водопадами, затем остров обезьян с шоу дрессированных обезьян.',
        features: ['Остров Орхидей', 'Зоопарк', 'Водопады', 'Сад бабочек', 'Остров обезьян', 'Шоу обезьян'],
        included: 'Морепродукты, куриный шашлык, фрукты, вьетнамский самогон, ром',
        notes: 'Купальник, полотенце, головной убор, крем от загара',
        isActive: true
    },
    {
        id: 'southern-islands',
        name: 'Южные острова + рыбалка + снорклинг',
        price: 38,
        groupSize: '10+ чел',
        departureTime: '7:00-7:30',
        returnTime: '16:00',
        duration: '9 часов',
        description: 'Снорклинг на коралловом барьере, рыбалка в открытом море, отдых на острове Хон Там с белоснежным песком.',
        features: ['Снорклинг', 'Рыбалка', 'Коралловый риф', 'Остров Хон Там', 'Бассейны', 'Лежаки'],
        included: 'Морепродукты, куриный шашлык, фрукты, вьетнамский самогон, ром',
        notes: 'Купальник, полотенце, головной убор, крем от загара',
        isActive: true
    },
    {
        id: 'phan-rang',
        name: 'Город Фанранг',
        price: 40,
        groupSize: '6-13 чел',
        departureTime: '6:30-7:00',
        returnTime: '19:00',
        duration: '12.5 часов',
        description: 'Город-курорт на юге, храм-лабиринт дракона, коралловая башня, виноградная плантация, контактный зоопарк.',
        features: ['Храм дракона', 'Коралловая башня', 'Виноградники', 'Контактный зоопарк', 'Пляж Цаплей'],
        included: 'Особенный лобстер, морепродукты, курица, фрукты, вьетнамский самогон, ром',
        notes: 'ОБЯЗАТЕЛЬНО фото паспорта и визы для морской полиции! Купальник, полотенце',
        isActive: true
    },
    {
        id: 'yang-bay',
        name: 'Эко парк Янг Бэй',
        price: 35,
        groupSize: '10+ чел',
        departureTime: '7:00-7:30',
        returnTime: '16:00',
        duration: '9 часов',
        description: 'Эко парк среди джунглей с термальными источниками, водопадом, деревней племени Раглай и крокодиловой фермой.',
        features: ['Племя Раглай', 'Термальные источники', 'Водопад Янг Бей', 'Крокодиловая ферма', 'Поросячьи бега'],
        included: 'Морепродукты, курица, фрукты, вьетнамский самогон, ром',
        notes: 'Купальник, полотенце, головной убор, крем от загара',
        isActive: true
    },
    {
        id: 'nha-trang-city',
        name: 'Городской тур по Нячангу',
        price: 25,
        groupSize: '10+ чел',
        departureTime: '7:00-7:30',
        returnTime: '15:00',
        duration: '8 часов',
        description: 'Обзорная экскурсия по Нячангу: ремесленная деревня, башня По Нагар, пагода Лонг Шон, каменный собор.',
        features: ['Деревня Труонг Сон', 'Башня По Нагар', 'Белый Будда', 'Каменный собор'],
        included: 'Традиционное вьетнамское блюдо Фо Бо (говяжий суп)',
        notes: 'Легкая прогулочная экскурсия',
        isActive: true
    },
    {
        id: 'doc-let',
        name: 'Док Лет',
        price: 30,
        groupSize: 'Уточняется',
        departureTime: 'Уточняется',
        returnTime: 'Уточняется',
        duration: 'Уточняется',
        description: 'Пляжная экскурсия в Док Лет. Подробности уточняются.',
        features: ['Пляжный отдых'],
        included: 'Обед включен',
        notes: 'Купальник, полотенце',
        isActive: true
    }
];

// ========================
// Database Operations
// ========================

async function initializeToursData() {
    console.log('Initializing tours data...');
    
    const db = window.TolikCRM.db;
    
    try {
        // Проверяем, есть ли уже данные в коллекции tours
        const snapshot = await db.collection('tours').get();
        
        if (snapshot.empty) {
            console.log('No tours found, creating initial data...');
            
            // Добавляем начальные данные
            for (const tour of INITIAL_TOURS_DATA) {
                await db.collection('tours').doc(tour.id).set({
                    ...tour,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('Initial tours data created successfully');
        } else {
            console.log('Tours data already exists');
        }
        
        // Настраиваем слушатель для обновлений
        setupToursListener();
        
    } catch (error) {
        console.error('Error initializing tours data:', error);
        window.TolikCRM.database.showError('Ошибка инициализации данных об экскурсиях');
    }
}

function setupToursListener() {
    const db = window.TolikCRM.db;
    
    db.collection('tours')
        .orderBy('name')
        .onSnapshot((querySnapshot) => {
            allTours = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allTours.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                });
            });
            
            console.log('Tours data updated:', allTours.length, 'tours');
            
            // Обновляем отображение если страница экскурсий активна
            if (document.getElementById('toursPage').classList.contains('active')) {
                renderToursGrid();
            }
            
            // Обновляем селекты экскурсий в других модулях
            updateExcursionSelects();
            
            // Обновляем дашборд если находимся на главной странице
            if (window.TolikCRM.ui && window.TolikCRM.ui.refreshDashboard) {
                window.TolikCRM.ui.refreshDashboard();
            }
            
        }, (error) => {
            console.error('Error getting tours:', error);
            window.TolikCRM.database.showError('Ошибка загрузки данных об экскурсиях');
        });
}

async function updateTourPrice(tourId, newPrice) {
    const db = window.TolikCRM.db;
    
    try {
        await db.collection('tours').doc(tourId).update({
            price: newPrice,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем дашборд если находимся на главной странице
        if (window.TolikCRM.ui && window.TolikCRM.ui.refreshDashboard) {
            window.TolikCRM.ui.refreshDashboard();
        }
        
        window.TolikCRM.database.showSuccess('Цена экскурсии обновлена');
        
    } catch (error) {
        console.error('Error updating tour price:', error);
        window.TolikCRM.database.showError('Ошибка обновления цены');
    }
}

async function toggleTourStatus(tourId) {
    const tour = allTours.find(t => t.id === tourId);
    if (!tour) return;
    
    const db = window.TolikCRM.db;
    
    try {
        await db.collection('tours').doc(tourId).update({
            isActive: !tour.isActive,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем дашборд если находимся на главной странице
        if (window.TolikCRM.ui && window.TolikCRM.ui.refreshDashboard) {
            window.TolikCRM.ui.refreshDashboard();
        }
        
        const status = !tour.isActive ? 'активирована' : 'деактивирована';
        window.TolikCRM.database.showSuccess(`Экскурсия ${status}`);
        
    } catch (error) {
        console.error('Error toggling tour status:', error);
        window.TolikCRM.database.showError('Ошибка изменения статуса экскурсии');
    }
}

// ========================
// UI Functions
// ========================

function initToursPage() {
    console.log('Initializing tours page');
    
    // Инициализируем данные если еще не инициализированы
    if (allTours.length === 0) {
        initializeToursData();
    } else {
        renderToursGrid();
    }
    
    // Настраиваем обработчики событий
    setupToursEventListeners();
}

function renderToursGrid() {
    const toursGrid = document.getElementById('toursGrid');
    const noToursDiv = document.getElementById('noToursData');
    
    if (!toursGrid) return;
    
    if (allTours.length === 0) {
        toursGrid.innerHTML = '';
        if (noToursDiv) noToursDiv.style.display = 'block';
        return;
    }
    
    if (noToursDiv) noToursDiv.style.display = 'none';
    
    toursGrid.innerHTML = allTours.map(tour => `
        <div class="tour-card ${tour.isActive ? '' : 'inactive'}" data-tour-id="${tour.id}">
            <div class="tour-status ${tour.isActive ? 'active' : 'inactive'}">
                ${tour.isActive ? 'АКТИВНА' : 'НЕАКТИВНА'}
            </div>
            
            <div class="tour-card-header">
                <h3 class="tour-title">${tour.name}</h3>
                <div class="tour-price" data-price="${tour.price}">$${tour.price}</div>
            </div>
            
            <div class="tour-schedule">
                <div class="tour-schedule-item">
                    <i class="fas fa-clock"></i>
                    <span>Выезд: ${tour.departureTime} → Возврат: ${tour.returnTime}</span>
                </div>
                <div class="tour-schedule-item">
                    <i class="fas fa-users"></i>
                    <span>Группа: ${tour.groupSize}</span>
                </div>
                <div class="tour-schedule-item">
                    <i class="fas fa-hourglass-half"></i>
                    <span>Длительность: ${tour.duration}</span>
                </div>
            </div>
            
            <div class="tour-description">${tour.description}</div>
            
            <div class="tour-features">
                ${tour.features.slice(0, 4).map(feature => `
                    <span class="tour-feature">${feature}</span>
                `).join('')}
                ${tour.features.length > 4 ? `<span class="tour-feature">+${tour.features.length - 4} еще</span>` : ''}
            </div>
            
            <div class="tour-card-actions">
                <button class="tour-action-btn edit-tour-btn" onclick="editTourPrice('${tour.id}')">
                    <i class="fas fa-dollar-sign"></i>
                    Цена
                </button>
                <button class="tour-action-btn edit-tour-btn" onclick="editTour('${tour.id}')">
                    <i class="fas fa-edit"></i>
                    Редактировать
                </button>
                <button class="tour-action-btn toggle-tour-btn" onclick="toggleTour('${tour.id}')">
                    <i class="fas fa-power-off"></i>
                    ${tour.isActive ? 'Отключить' : 'Включить'}
                </button>
            </div>
        </div>
    `).join('');
}

function setupToursEventListeners() {
    // Кнопка добавления новой экскурсии
    const addTourBtn = document.getElementById('addNewTour');
    if (addTourBtn) {
        addTourBtn.addEventListener('click', () => {
            // TODO: Открыть модальное окно добавления экскурсии
            console.log('Add new tour clicked');
            alert('Функция добавления новой экскурсии будет реализована в следующей версии');
        });
    }
    
    // Кнопка экспорта
    const exportBtn = document.getElementById('exportToursList');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToursToExcel();
        });
    }
    
    // Кнопка массового изменения цен
    const bulkUpdateBtn = document.getElementById('bulkPriceUpdate');
    if (bulkUpdateBtn) {
        bulkUpdateBtn.addEventListener('click', () => {
            // TODO: Реализовать массовое изменение цен
            console.log('Bulk price update clicked');
            alert('Функция массового изменения цен будет реализована в следующей версии');
        });
    }
}

// ========================
// Helper Functions
// ========================

function updateExcursionSelects() {
    // Обновляем селекты экскурсий в форме добавления заявки
    const excursionSelect = document.getElementById('excursion');
    if (excursionSelect) {
        const currentValue = excursionSelect.value;
        excursionSelect.innerHTML = '<option value="">Выберите экскурсию</option>';
        
        allTours
            .filter(tour => tour.isActive)
            .forEach(tour => {
                const option = document.createElement('option');
                option.value = tour.name;
                option.textContent = `${tour.name} ($${tour.price})`;
                // Добавляем данные о времени для совместимости
                option.dataset.time = `${tour.departureTime} - ${tour.returnTime}`;
                excursionSelect.appendChild(option);
            });
            
        // Восстанавливаем выбранное значение если оно было
        if (currentValue) excursionSelect.value = currentValue;
    }
    
    // Обновляем селекты в фильтрах
    const filterSelect = document.getElementById('filterExcursion');
    if (filterSelect) {
        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Все экскурсии</option>';
        
        allTours
            .filter(tour => tour.isActive)
            .forEach(tour => {
                const option = document.createElement('option');
                option.value = tour.name;
                option.textContent = tour.name;
                filterSelect.appendChild(option);
            });
            
        if (currentValue) filterSelect.value = currentValue;
    }
    
    // Обновляем селект в финансовых фильтрах
    const financeFilterSelect = document.getElementById('financeFilterExcursion');
    if (financeFilterSelect) {
        const currentValue = financeFilterSelect.value;
        financeFilterSelect.innerHTML = '<option value="">Все экскурсии</option>';
        
        allTours
            .filter(tour => tour.isActive)
            .forEach(tour => {
                const option = document.createElement('option');
                option.value = tour.name;
                option.textContent = tour.name;
                financeFilterSelect.appendChild(option);
            });
            
        if (currentValue) financeFilterSelect.value = currentValue;
    }
}

function getTourByName(name) {
    return allTours.find(tour => tour.name === name);
}

function getTourPrice(name) {
    const tour = getTourByName(name);
    return tour ? tour.price : 0;
}

function exportToursToExcel() {
    // Создаем workbook
    const wb = XLSX.utils.book_new();
    
    // Подготавливаем данные для экспорта
    const toursData = [
        ['Список экскурсий Tolik Tours'],
        ['Экспортировано:', new Date().toLocaleDateString('ru-RU')],
        [''],
        ['Название', 'Цена ($)', 'Группа', 'Выезд', 'Возврат', 'Длительность', 'Статус', 'Описание']
    ];
    
    allTours.forEach(tour => {
        toursData.push([
            tour.name,
            tour.price,
            tour.groupSize,
            tour.departureTime,
            tour.returnTime,
            tour.duration,
            tour.isActive ? 'Активна' : 'Неактивна',
            tour.description
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(toursData);
    XLSX.utils.book_append_sheet(wb, ws, 'Экскурсии');
    
    // Генерируем имя файла
    const today = new Date().toISOString().split('T')[0];
    const filename = `tours_list_${today}.xlsx`;
    
    // Скачиваем файл
    XLSX.writeFile(wb, filename);
}

// ========================
// Global Functions (for HTML onclick)
// ========================

function editTourPrice(tourId) {
    const tour = allTours.find(t => t.id === tourId);
    if (!tour) return;
    
    const newPrice = prompt(`Введите новую цену для "${tour.name}":`, tour.price);
    if (newPrice && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
        updateTourPrice(tourId, parseFloat(newPrice));
    }
}

function editTour(tourId) {
    // TODO: Открыть модальное окно редактирования экскурсии
    console.log('Edit tour:', tourId);
    alert('Функция редактирования экскурсии будет реализована в следующей версии');
}

function toggleTour(tourId) {
    toggleTourStatus(tourId);
}

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.tours = {
    initToursPage,
    initializeToursData,
    renderToursGrid,
    updateTourPrice,
    toggleTourStatus,
    getTourByName,
    getTourPrice,
    exportToursToExcel,
    updateExcursionSelects,
    getAllTours: () => allTours
};

// Make functions globally available for HTML onclick
window.editTourPrice = editTourPrice;
window.editTour = editTour;
window.toggleTour = toggleTour;