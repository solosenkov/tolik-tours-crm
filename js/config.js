// ========================
// 🔥 Firebase Configuration
// ========================

const firebaseConfig = {
    apiKey: "AIzaSyAvexYVTMpdGGG1oBPJdqCrw9b0GIhCWsI",
    authDomain: "tolik-tours-crm.firebaseapp.com",
    projectId: "tolik-tours-crm",
    storageBucket: "tolik-tours-crm.firebasestorage.app",
    messagingSenderId: "217275046335",
    appId: "1:217275046335:web:43287c9fa8056c24d3a90a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export database instance
const db = firebase.firestore();

// Export configuration for other modules
window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.db = db;
window.TolikCRM.firebase = firebase;