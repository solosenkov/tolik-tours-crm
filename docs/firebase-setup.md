# 🔥 Настройка Firebase для CRM Tolik Tours

## 📝 Пошаговая инструкция

### Шаг 1: Создание проекта Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите **"Создать проект"** или **"Add project"**
3. Введите название: `tolik-tours-crm`
4. Согласитесь с условиями и создайте проект

### Шаг 2: Настройка Firestore Database

1. В левом меню выберите **"Firestore Database"**
2. Нажмите **"Создать базу данных"**
3. Выберите режим **"Start in test mode"** (для начала)
4. Выберите регион: `asia-southeast1` (ближе к Вьетнаму)

### Шаг 3: Настройка Web App

1. В настройках проекта (шестеренка) выберите **"Project settings"**
2. Прокрутите вниз до раздела **"Your apps"**
3. Нажмите на иконку веба `</>`
4. Введите название: `tolik-tours-admin`
5. **НЕ включайте** Firebase Hosting пока
6. **Скопируйте** конфигурацию Firebase

### Шаг 4: Обновление конфигурации в app.js

Замените конфигурацию в файле `app.js` (строки 5-12):

**БЫЛО:**
```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

**СТАЛО (ваши данные):**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...",
    authDomain: "tolik-tours-crm.firebaseapp.com", 
    projectId: "tolik-tours-crm",
    storageBucket: "tolik-tours-crm.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123:web:abc123"
};
```

### Шаг 5: Правила безопасности

#### Для тестирования (открытые правила):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Для продакшена (с аутентификацией):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Шаг 6: Проверка работы

1. Откройте `index.html` в браузере
2. Попробуйте добавить тестовую заявку
3. Проверьте в Firebase Console → Firestore что данные появились

## 🌐 Развертывание на GitHub Pages

### 1. Создание репозитория

1. Создайте репозиторий на GitHub: `tolik-tours-crm`
2. Загрузите файлы проекта
3. В настройках репозитория включите GitHub Pages

### 2. Настройка домена

GitHub Pages даст вам адрес вида:
`https://ваш-username.github.io/tolik-tours-crm`

### 3. Обновление настроек Firebase

В Firebase Console → Project Settings → Authorized domains:
- Добавьте ваш GitHub Pages домен
- Это нужно для безопасности

## 🔒 Безопасность для продакшена

### Включение аутентификации:

1. **Firebase Console** → Authentication
2. Выберите метод входа (Email/Password)
3. Добавьте пользователей
4. Обновите правила Firestore (см. выше)

### Дополнительная защита:

1. **Ограничение API ключа** по домену
2. **Мониторинг использования** в Firebase Console
3. **Регулярные бэкапы** через экспорт данных

## 📊 Структура данных

Коллекция `bookings` содержит документы со структурой:

```javascript
{
  participants: 4,
  fullName: "Иванов Иван Иванович",
  contact: "+84 123 456 789",
  hotel: "Название отеля",
  excursionId: "dalat-tue",
  excursionName: "Далат",
  excursionTime: "06:00",
  date: "2024-01-15",
  payment: "pending",
  notes: "Примечания",
  createdAt: timestamp
}
```

## 🆘 Устранение проблем

### "Firebase не инициализирован"
- Проверьте конфигурацию в `app.js`
- Убедитесь что проект Firebase создан

### "Ошибка загрузки данных"
- Проверьте правила Firestore
- Убедитесь что интернет работает

### "Недоступно с мобильного"
- Добавьте домен в Authorized domains
- Проверьте HTTPS соединение

## 📞 Поддержка

При проблемах:
1. Откройте консоль браузера (F12)
2. Проверьте вкладку "Console" на ошибки
3. Проверьте Network для проблем с интернетом
4. Убедитесь что Firebase правильно настроен

---

**Firebase настроен!** 🔥  
*Теперь ваши данные в безопасности в облаке*