
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
    // 1. Initialize tours data first (needed for excursion selects and pricing)
    if (window.TolikCRM.tours && window.TolikCRM.tours.initializeToursData) {
        await window.TolikCRM.tours.initializeToursData();
    }
    
    // 2. Populate excursion selects from tours module
    if (window.TolikCRM.tours && window.TolikCRM.tours.updateExcursionSelects) {
        window.TolikCRM.tours.updateExcursionSelects();
    }
    
    // 3. Setup navigation between pages
    window.TolikCRM.ui.setupNavigation();
    
    // 4. Setup event listeners from UI module
    window.TolikCRM.ui.setupEventListeners();
    
    // 5. Setup Firestore listeners from database module
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
