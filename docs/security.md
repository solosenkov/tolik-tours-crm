# 🔒 Настройка безопасности

> Руководство по обеспечению безопасности CRM Tolik Tours

## 🚨 Важность безопасности

CRM система содержит персональные данные клиентов и коммерческую информацию. Правильная настройка безопасности критически важна для защиты от:

- Неавторизованного доступа к данным
- Утечки персональной информации клиентов
- Несанкционированного изменения заявок
- DDoS атак и спама

## 🔐 Firebase Authentication

### Включение аутентификации

1. **Откройте Firebase Console**
   - Перейдите в раздел "Authentication"
   - Нажмите "Get started"

2. **Настройте провайдеров входа**
   ```
   Рекомендуемые методы:
   ✅ Email/Password (основной)
   ✅ Google (удобство)
   ⚠️ Anonymous (только для тестирования)
   ```

3. **Добавьте пользователей**
   - Создайте аккаунты для сотрудников
   - Используйте корпоративные email адреса
   - Установите надежные пароли

### Настройка в коде

Обновите `app.js` для работы с аутентификацией:

```javascript
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();

// Проверка авторизации при загрузке
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Пользователь авторизован - показать CRM
        initializeCRM();
    } else {
        // Пользователь не авторизован - показать форму входа
        showLoginForm();
    }
});
```

## 🛡️ Firestore Security Rules

### Базовые правила безопасности

Замените правила в Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Доступ только для авторизованных пользователей
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Более строгие правила для заявок
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
      
      // Запрет удаления заявок (только создание и обновление)
      allow create, update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

### Продвинутые правила

Для повышенной безопасности используйте role-based доступ:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Функция проверки ролей
    function isAuthorized(role) {
      return request.auth != null 
        && request.auth.token.email_verified == true
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Заявки - доступ для менеджеров и админов
    match /bookings/{bookingId} {
      allow read: if isAuthorized('manager') || isAuthorized('admin');
      allow create, update: if isAuthorized('manager') || isAuthorized('admin');
      allow delete: if isAuthorized('admin');
    }
    
    // Настройки - только для админов
    match /settings/{settingId} {
      allow read, write: if isAuthorized('admin');
    }
  }
}
```

## 🔑 API Keys Security

### Ограничение ключей

1. **В Firebase Console**
   - Перейдите в "Project Settings" → "General"
   - Найдите раздел "Web API Key"
   - Нажмите "Restrict key"

2. **Настройте ограничения**
   ```
   Application restrictions:
   ✅ HTTP referrers (web sites)
   
   Website restrictions:
   ✅ your-domain.github.io/*
   ✅ localhost:*/* (для разработки)
   
   API restrictions:
   ✅ Cloud Firestore API
   ✅ Identity Toolkit API
   ```

### Переменные окружения

Для локальной разработки используйте переменные окружения:

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "default-key-for-development",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  // ... остальные настройки
};
```

## 🌐 HTTPS и домены

### Принудительное HTTPS

Настройте перенаправление HTTP → HTTPS:

```html
<!-- В index.html добавьте в <head> -->
<script>
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
</script>
```

### Content Security Policy

Добавьте CSP заголовки для защиты от XSS:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;
">
```

## 📊 Мониторинг и аудит

### Логирование действий

Добавьте логирование важных операций:

```javascript
function logUserAction(action, details) {
    addDoc(collection(db, 'audit_logs'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        action: action,
        details: details,
        timestamp: serverTimestamp(),
        ipAddress: 'auto-detected' // можно добавить определение IP
    });
}

// Использование
await addBooking(bookingData);
logUserAction('booking_created', { bookingId: newBooking.id });
```

### Настройка алертов

В Firebase Console настройте уведомления:

1. **Performance Monitoring**
   - Отслеживание времени загрузки
   - Мониторинг ошибок

2. **Cloud Monitoring**
   - Алерты на подозрительную активность
   - Уведомления о превышении лимитов

## 🔒 Политики безопасности

### Для сотрудников

**Обязательные требования:**
- Использование только корпоративных устройств
- Регулярная смена паролей (каждые 3 месяца)
- Двухфакторная аутентификация для админов
- Запрет на сохранение паролей в браузере на общих устройствах

**Рекомендации:**
- Использование менеджеров паролей
- Выход из системы после работы
- Уведомление IT при подозрительной активности

### Резервное копирование

Настройте автоматические бэкапы:

```javascript
// Функция экспорта данных для бэкапа
async function createBackup() {
    const snapshot = await getDocs(collection(db, 'bookings'));
    const backup = {
        timestamp: new Date().toISOString(),
        data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
    
    // Сохранение в Cloud Storage или отправка на email
    return backup;
}

// Автоматический бэкап каждую неделю
setInterval(createBackup, 7 * 24 * 60 * 60 * 1000);
```

## ⚠️ Инциденты безопасности

### План реагирования

1. **При обнаружении нарушения:**
   - Немедленно отключить скомпрометированные аккаунты
   - Изменить все пароли и API ключи
   - Проанализировать логи на предмет утечек

2. **Восстановление:**
   - Восстановить данные из бэкапа
   - Обновить правила безопасности
   - Провести аудит системы

3. **Профилактика:**
   - Обучение сотрудников
   - Регулярные аудиты безопасности
   - Обновление системы безопасности

## 📋 Чек-лист безопасности

### Перед запуском в продакшен

- [ ] Firebase Authentication настроена
- [ ] Firestore Rules ограничивают доступ
- [ ] API ключи ограничены по домену
- [ ] HTTPS принудительно включен
- [ ] CSP заголовки настроены
- [ ] Логирование действий работает
- [ ] Бэкапы настроены
- [ ] Сотрудники обучены политикам безопасности

### Регулярное обслуживание

- [ ] Проверка логов безопасности (еженедельно)
- [ ] Аудит пользователей (ежемесячно)
- [ ] Тестирование восстановления из бэкапа (ежемесячно)
- [ ] Обновление правил безопасности (по необходимости)
- [ ] Ротация API ключей (каждые 6 месяцев)

---

🔐 **Помните**: Безопасность - это не разовая настройка, а постоянный процесс!