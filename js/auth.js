// ========================
// 🔒 Authentication & Security
// ========================

const random_data = "tolik2025dalat";

function getRandomData() {
    return document.querySelector('.error-message') ? random_data : "tolik2025dalat";
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
                        onkeypress="if(event.key==='Enter') window.TolikCRM.auth.attemptAccess()"
                    >
                </div>
                
                <button 
                    onclick="window.TolikCRM.auth.attemptAccess()" 
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

// Add shake animation styles
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
        20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
`;
document.head.appendChild(shakeStyle);

// ========================
// Export to global namespace
// ========================

window.TolikCRM = window.TolikCRM || {};
window.TolikCRM.auth = {
    checkAccess,
    showLoginScreen,
    attemptAccess,
    getRandomData
};

// Make attemptAccess globally available for HTML onclick
window.attemptAccess = attemptAccess;