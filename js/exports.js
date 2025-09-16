// ========================
// 📊 Export Functions (Excel)
// ========================

// ========================
// Excel Export
// ========================

function exportToExcel() {
    const filteredBookings = window.TolikCRM.database.getFilteredBookings();
    
    if (filteredBookings.length === 0) {
        window.TolikCRM.database.showError('Нет данных для экспорта. Добавьте заявки или измените фильтры.');
        return;
    }
    
    try {
        const formatDate = window.TolikCRM.database.formatDate;
        const getPaymentStatusText = window.TolikCRM.database.getPaymentStatusText;
        
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
        
        window.TolikCRM.database.showSuccess(`Excel файл "${fileName}" успешно создан!`);
        
    } catch (error) {
        console.error('Ошибка создания Excel:', error);
        window.TolikCRM.database.showError('Ошибка при создании Excel файла. Попробуйте еще раз.');
    }
}

// ========================
// Group Excel Export
// ========================

function exportGroupToExcel(excursionName, date) {
    // Получаем всех участников конкретной экскурсии на конкретную дату
    const allBookings = window.TolikCRM.database.getAllBookings();
    const groupBookings = allBookings.filter(booking => 
        booking.excursionName === excursionName && booking.date === date
    );
    
    if (groupBookings.length === 0) {
        window.TolikCRM.database.showError('Нет участников в этой группе для экспорта.');
        return;
    }
    
    try {
        const formatDate = window.TolikCRM.database.formatDate;
        const getPaymentStatusText = window.TolikCRM.database.getPaymentStatusText;
        
        // Подготавливаем данные для гида - простая и удобная структура
        const groupData = groupBookings.map((booking, index) => ({
            '№': index + 1,
            'ФИО': booking.fullName,
            'Телефон': booking.contact,
            'Отель': booking.hotel,
            'Участников': booking.participants + ' чел.',
            'Оплата': getPaymentStatusText(booking.payment),
            'Примечания': booking.notes || '—'
        }));
        
        // Создаем рабочую книгу
        const wb = XLSX.utils.book_new();
        
        // Создаем лист с данными группы
        const ws = XLSX.utils.json_to_sheet(groupData);
        
        // Настраиваем ширину столбцов для оптимального отображения
        ws['!cols'] = [
            { wch: 5 },   // №
            { wch: 25 },  // ФИО
            { wch: 18 },  // Телефон
            { wch: 30 },  // Отель
            { wch: 12 },  // Участников
            { wch: 15 },  // Оплата
            { wch: 35 }   // Примечания
        ];
        
        // Добавляем лист в книгу с понятным названием
        const dateObj = new Date(date);
        const formattedDate = formatDate(dateObj);
        const sheetName = `${excursionName} ${formattedDate}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Excel ограничение на 31 символ
        
        // Создаем заголовок и статистику в самом файле
        const totalParticipants = groupBookings.reduce((sum, booking) => sum + booking.participants, 0);
        const dayOfWeek = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
        
        // Добавляем итоги в конец таблицы
        const summaryData = [
            {},
            { '№': '', 'ФИО': 'ИТОГО:', 'Телефон': '', 'Отель': '', 'Участников': `${totalParticipants} чел.`, 'Оплата': `${groupBookings.length} заявок`, 'Примечания': '' },
            { '№': '', 'ФИО': 'Дата:', 'Телефон': '', 'Отель': '', 'Участников': formattedDate, 'Оплата': dayOfWeek, 'Примечания': '' },
            { '№': '', 'ФИО': 'Экскурсия:', 'Телефон': '', 'Отель': excursionName, 'Участников': '', 'Оплата': '', 'Примечания': '' }
        ];
        
        const summaryWs = XLSX.utils.json_to_sheet([...groupData, ...summaryData]);
        summaryWs['!cols'] = ws['!cols'];
        
        // Заменяем лист на тот, что с итогами
        wb.Sheets[sheetName.slice(0, 31)] = summaryWs;
        
        // Сохраняем файл с понятным именем для гида
        const fileName = `${excursionName}_${formattedDate.replace(/\./g, '-')}_${totalParticipants}чел.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        window.TolikCRM.database.showSuccess(`Excel файл для гида "${fileName}" готов!`);
        
    } catch (error) {
        console.error('Ошибка создания Excel для группы:', error);
        window.TolikCRM.database.showError('Ошибка при создании Excel файла для группы. Попробуйте еще раз.');
    }
}

// ========================
// Helper Functions
// ========================

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

function getPaymentStatusTextEn(status) {
    const statusMap = {
        'pending': 'Pending',
        'partial': 'Partial', 
        'paid': 'Paid'
    };
    return statusMap[status] || 'Pending';
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

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.exports = {
    exportToExcel,
    exportGroupToExcel
};

// Make functions globally available for HTML onclick
window.exportGroupToExcel = exportGroupToExcel;