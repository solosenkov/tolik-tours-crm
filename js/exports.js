// ========================
// 📊 Export Functions (PDF & Excel)
// ========================

// ========================
// PDF Export
// ========================

function exportToPDF() {
    const filteredBookings = window.TolikCRM.database.getFilteredBookings();
    
    if (filteredBookings.length === 0) {
        window.TolikCRM.database.showError('Нет данных для экспорта. Добавьте заявки или измените фильтры.');
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
        
        window.TolikCRM.database.showSuccess('PDF файл успешно сохранен!');
        
    } catch (error) {
        console.error('Ошибка экспорта в PDF:', error);
        window.TolikCRM.database.showError('Ошибка при создании PDF файла. Попробуйте еще раз.');
    }
}

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
    exportToPDF,
    exportToExcel
};