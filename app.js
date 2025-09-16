
// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// ========================
// Main App Initialization
// ========================

async function initializeApp() {
    try {
        // Check authentication first
        if (!window.TolikCRM.auth.checkAccess()) {
            window.TolikCRM.auth.showLoginScreen();
            return;
        }
        
        // Show loading
        window.TolikCRM.database.showLoading(true);
        
        // Initialize components in correct order
        await initializeComponents();
        
        // Hide loading
        window.TolikCRM.database.showLoading(false);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        window.TolikCRM.database.showError('Ошибка подключения к базе данных. Проверьте настройки Firebase.');
        window.TolikCRM.database.showLoading(false);
    }
}

async function initializeComponents() {
    // 1. Populate excursion selects from calendar module
    window.TolikCRM.calendar.populateExcursionSelects();
    
    // 2. Setup event listeners from UI module
    window.TolikCRM.ui.setupEventListeners();
    
    // 3. Setup Firestore listeners from database module
    window.TolikCRM.database.setupFirestoreListeners();
}

// ========================
// Export main app for debugging
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.app = {
    initializeApp,
    initializeComponents
};
