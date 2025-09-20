// ========================
// 💰 Financial Management Module
// ========================

// Pricing configuration for each excursion (in USD)
const EXCURSION_PRICES = {
    'Южные острова': 38,
    'Северные острова': 35,
    'Далат': 55,
    'Янг Бай': 35,
    'Городской тур Нячанг': 25,
    'Док Лет': 30,
    'Фан Ранг': 40
};

// Currency settings
const CURRENCY_SETTINGS = {
    symbol: '$',
    name: 'USD',
    rate: 1
};

// ========================
// Financial Calculations
// ========================

function calculateFinancialReport(bookings = []) {
    console.log('Calculating financial report for', bookings.length, 'bookings');
    
    // Группируем по экскурсиям
    const financialData = {};
    
    // Инициализируем данные для всех доступных экскурсий
    Object.keys(EXCURSION_PRICES).forEach(excursionName => {
        financialData[excursionName] = {
            name: excursionName,
            price: EXCURSION_PRICES[excursionName],
            totalBookings: 0,
            totalParticipants: 0,
            paidParticipants: 0,
            partialParticipants: 0,
            pendingParticipants: 0,
            totalRevenue: 0,
            paidRevenue: 0,
            partialRevenue: 0,
            pendingRevenue: 0
        };
    });
    
    // Обрабатываем все заявки
    bookings.forEach(booking => {
        const excursionName = booking.excursionId;
        const participants = booking.participants || 0;
        const price = EXCURSION_PRICES[excursionName] || 0;
        const revenue = participants * price;
        
        if (financialData[excursionName]) {
            const data = financialData[excursionName];
            
            // Общие данные
            data.totalBookings++;
            data.totalParticipants += participants;
            data.totalRevenue += revenue;
            
            // По статусам оплаты
            switch (booking.payment) {
                case 'paid':
                    data.paidParticipants += participants;
                    data.paidRevenue += revenue;
                    break;
                case 'partial':
                    data.partialParticipants += participants;
                    data.partialRevenue += revenue;
                    break;
                case 'pending':
                default:
                    data.pendingParticipants += participants;
                    data.pendingRevenue += revenue;
                    break;
            }
        }
    });
    
    const summary = calculateTotalSummary(financialData);
    
    return {
        byExcursion: financialData,
        summary: summary
    };
}

function calculateTotalSummary(financialData) {
    const summary = {
        totalParticipants: 0,
        totalRevenue: 0,
        paidRevenue: 0,
        partialRevenue: 0,
        pendingRevenue: 0,
        totalBookings: 0
    };
    
    Object.values(financialData).forEach(excursion => {
        summary.totalParticipants += excursion.totalParticipants;
        summary.totalRevenue += excursion.totalRevenue;
        summary.paidRevenue += excursion.paidRevenue;
        summary.partialRevenue += excursion.partialRevenue;
        summary.pendingRevenue += excursion.pendingRevenue;
        summary.totalBookings += excursion.totalBookings;
    });
    
    return summary;
}

// ========================
// UI Functions for Finance Page
// ========================

function initFinancePage() {
    console.log('Initializing finance page');
    
    // Заполняем фильтры
    populateFinanceFilters();
    
    // Настраиваем обработчики событий
    setupFinanceEventListeners();
    
    // Загружаем данные
    if (window.TolikCRM && window.TolikCRM.database) {
        const allBookings = window.TolikCRM.database.getAllBookings();
        console.log('Got bookings for finance page:', allBookings.length);
        
        if (allBookings.length > 0) {
            const financialData = calculateFinancialReport(allBookings);
            console.log('Financial data calculated:', financialData);
            updateFinancialStats(financialData.summary);
            renderFinancialTable(Object.values(financialData.byExcursion));
        } else {
            console.log('No bookings data available yet');
            // Показываем пустые данные
            updateFinancialStats({
                totalRevenue: 0,
                paidRevenue: 0,
                pendingRevenue: 0
            });
            renderFinancialTable([]);
        }
    }
}

function updateFinancialStats(summary) {
    console.log('Updating financial stats with:', summary);
    
    // Проверяем, что summary определен
    if (!summary) {
        console.error('Financial summary is undefined');
        return;
    }
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    const pendingRevenueEl = document.getElementById('pendingRevenue');
    const paidRevenueEl = document.getElementById('paidRevenue');
    const paymentRateEl = document.getElementById('paymentRate');
    
    if (totalRevenueEl) totalRevenueEl.textContent = `$${summary.totalRevenue || 0}`;
    if (pendingRevenueEl) pendingRevenueEl.textContent = `$${summary.pendingRevenue || 0}`;
    if (paidRevenueEl) paidRevenueEl.textContent = `$${summary.paidRevenue || 0}`;
    if (paymentRateEl) {
        const rate = summary.totalRevenue > 0 ? (summary.paidRevenue / summary.totalRevenue * 100).toFixed(1) : 0;
        paymentRateEl.textContent = `${rate}%`;
    }
}

function renderFinancialTable(excursionData) {
    const tableBody = document.getElementById('financialTableBody');
    const noDataDiv = document.getElementById('noFinancialData');
    
    if (!tableBody) return;
    
    if (excursionData.length === 0) {
        tableBody.innerHTML = '';
        if (noDataDiv) noDataDiv.style.display = 'block';
        return;
    }
    
    if (noDataDiv) noDataDiv.style.display = 'none';
    
    tableBody.innerHTML = excursionData
        .filter(stats => stats.totalBookings > 0)  // Показываем только экскурсии с заявками
        .map(stats => `
            <tr>
                <td><strong>${stats.name}</strong></td>
                <td>${stats.totalBookings}</td>
                <td>${stats.totalParticipants}</td>
                <td class="amount-pending">${stats.pendingParticipants}</td>
                <td class="amount-pending">${stats.partialParticipants}</td>
                <td class="amount-positive">${stats.paidParticipants}</td>
                <td class="amount-positive"><strong>$${stats.totalRevenue}</strong></td>
                <td class="amount-positive">$${stats.paidRevenue + stats.partialRevenue}</td>
                <td class="${stats.pendingRevenue > 0 ? 'amount-pending' : 'amount-zero'}">$${stats.pendingRevenue}</td>
            </tr>
        `).join('');
}

function populateFinanceFilters() {
    const excursionSelect = document.getElementById('financeFilterExcursion');
    if (!excursionSelect) return;
    
    // Очищаем текущие опции (кроме "Все экскурсии")
    excursionSelect.innerHTML = '<option value="">Все экскурсии</option>';
    
    // Добавляем все доступные экскурсии
    Object.keys(EXCURSION_PRICES).forEach(excursionName => {
        const option = document.createElement('option');
        option.value = excursionName;
        option.textContent = excursionName;
        excursionSelect.appendChild(option);
    });
}

function setupFinanceEventListeners() {
    // Фильтр по периоду
    const periodSelect = document.getElementById('financeFilterPeriod');
    const customDateRange = document.getElementById('customDateRange');
    
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            if (customDateRange) {
                customDateRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            }
        });
    }
    
    // Кнопка применения фильтров
    const applyFiltersBtn = document.getElementById('applyFinanceFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFinanceFilters();
        });
    }
    
    // Кнопка экспорта
    const exportBtn = document.getElementById('exportFinanceReport');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportFinancialReportUI();
        });
    }
}

function applyFinanceFilters() {
    const periodSelect = document.getElementById('financeFilterPeriod');
    const excursionSelect = document.getElementById('financeFilterExcursion');
    const startDateInput = document.getElementById('financeStartDate');
    const endDateInput = document.getElementById('financeEndDate');
    
    // Получаем все заявки
    let filteredBookings = window.TolikCRM.database.getAllBookings() || [];
    
    // Фильтр по периоду
    if (periodSelect && periodSelect.value !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (periodSelect.value) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'custom':
                if (startDateInput.value && endDateInput.value) {
                    startDate = new Date(startDateInput.value);
                    const endDate = new Date(endDateInput.value);
                    endDate.setHours(23, 59, 59, 999);
                    filteredBookings = filteredBookings.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate >= startDate && bookingDate <= endDate;
                    });
                }
                break;
        }
        
        if (startDate && periodSelect.value !== 'custom') {
            filteredBookings = filteredBookings.filter(booking => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= startDate;
            });
        }
    }
    
    // Фильтр по экскурсии
    if (excursionSelect && excursionSelect.value) {
        filteredBookings = filteredBookings.filter(booking => booking.excursionId === excursionSelect.value);
    }
    
    // Пересчитываем и обновляем UI
    const financialData = calculateFinancialReport(filteredBookings);
    updateFinancialStats(financialData.summary);
    renderFinancialTable(Object.values(financialData.byExcursion));
}

function exportFinancialReportUI() {
    // Получаем текущие фильтры и применяем их
    const periodSelect = document.getElementById('financeFilterPeriod');
    const excursionSelect = document.getElementById('financeFilterExcursion');
    const startDateInput = document.getElementById('financeStartDate');
    const endDateInput = document.getElementById('financeEndDate');
    
    const filters = {
        period: periodSelect ? periodSelect.value : 'all',
        excursion: excursionSelect ? excursionSelect.value : '',
        startDate: startDateInput ? startDateInput.value : '',
        endDate: endDateInput ? endDateInput.value : ''
    };
    
    if (!window.TolikCRM || !window.TolikCRM.database) {
        alert('Данные для экспорта не загружены');
        return;
    }
    
    const allBookings = window.TolikCRM.database.getAllBookings() || [];
    const financialData = calculateFinancialReport(allBookings);
    
    // Создаем workbook
    const wb = XLSX.utils.book_new();
    
    // Создаем лист с общей статистикой
    const summaryData = [
        ['Финансовый отчет Tolik Tours'],
        ['Дата создания:', new Date().toLocaleDateString('ru-RU')],
        [''],
        ['Общая статистика:'],
        ['Общий доход', `$${financialData.summary.totalRevenue}`],
        ['Получено', `$${financialData.summary.paidRevenue}`],
        ['К доплате', `$${financialData.summary.pendingRevenue}`],
        ['Всего участников', financialData.summary.totalParticipants],
        [''],
        ['Детальная статистика по экскурсиям:'],
        [''],
        ['Экскурсия', 'Заявки', 'Участники', 'Ожидают', 'Частично', 'Оплачено', 'Общий доход', 'Получено', 'К доплате']
    ];
    
    // Добавляем данные по экскурсиям
    Object.values(financialData.byExcursion)
        .filter(stats => stats.totalBookings > 0)
        .forEach(stats => {
            summaryData.push([
                stats.name,
                stats.totalBookings,
                stats.totalParticipants,
                stats.pendingParticipants,
                stats.partialParticipants,
                stats.paidParticipants,
                `$${stats.totalRevenue}`,
                `$${stats.paidRevenue + stats.partialRevenue}`,
                `$${stats.pendingRevenue}`
            ]);
        });
    
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Финансовый отчет');
    
    // Генерируем имя файла
    const today = new Date().toISOString().split('T')[0];
    const filename = `financial_report_${today}.xlsx`;
    
    // Скачиваем файл
    XLSX.writeFile(wb, filename);
}

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.finance = {
    calculateFinancialReport,
    calculateTotalSummary,
    initFinancePage,
    updateFinancialStats,
    renderFinancialTable,
    applyFinanceFilters,
    exportFinancialReportUI,
    EXCURSION_PRICES,
    CURRENCY_SETTINGS
};

// Make functions globally available for HTML onclick
window.exportFinancialReport = exportFinancialReportUI;