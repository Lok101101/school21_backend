# 🏫 School 21 Backend

Проект представляет собой API для системы учёта практикантов Школы 21, разработанный на фреймворке **Laravel**.
На данный момент API интегрировано в веб-сайт, но использовать его можно и на любых других платформах.

---

## 🛠 Технологический стек

* **Язык:** PHP 8.3
* **Фреймворк:** Laravel 13
* **Веб-сокеты:** Laravel Reverb
* **База данных:** PostgreSQL
* **Веб-сервер:** Caddy
* **Документация:** Swagger
---

## ✨ Ключевые возможности

1.  Авторизация и регистрация с подтверждением электронной почты.
2.  Роли студента и руководителя практики (тимлида) для ограничения прав.
3.  Создание заявок на практику, возможность их отмены студентом, а также отклонение или принятие тимлидом.
4.  Автоматическое формирование групп практикантов на основе одобренных заявок или добавление студента в уже существующую группу.
5.  Уведомления через WebSocket и Email при изменении статуса заявки.
6.  WebSocket-чат с поддержкой отправки файлов.
7.  Отправка уведомлений всем участникам определенной группы через WebSocket и Email.

---

## 📖 Документация
После развертывания проекта Swagger-документация API будет доступна по URL /api/docs.

---

## 🚀 Инструкция по развертыванию

### 1. Установите PHP 8.3, Composer и любую базу данных, поддерживаемую Laravel

### 2. Склонируйте проект
```bash 
git clone https://github.com/Lok101101/school21_backend.git
```

### 3. Скопируйте .env.example и переименуйте в .env
```bash 
cp .env.example .env
```

### 4. Создайте базу данных и заполните данные для её подключения
```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=school21
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 5. Заполните данные почтового сервера
```dotenv 
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 6. Заполните REVERB_APP_SECRET рандомной строкой и порт, на котором будет работать Reverb
```dotenv    
REVERB_APP_SECRET=zmuaywwvzdpwi4k6i9g1
REVERB_PORT=8081
```

### 7. В public/js/config.js заполните API_BASE текущим доменом/ip и REVERB_PORT тем портом, на котором будет работать Reverb
```js    
const API_BASE = 'http://127.0.0.1:8000/api';
const REVERB_PORT = 8081;
```

### 8. Установите зависимости при помощи Composer
```bash 
composer i
```

### 9. Сгенерируйте ключ приложения
```bash 
php artisan key:generate
```

### 10. Выполните миграции и сидеры
Если вам нужны уже зарегистрированные пользователи для теста,
нужно раскомментировать UsersSeeder::class в
database/seeders/DatabaseSeeder.php
```bash 
php artisan migrate --seed
```

### 11. Запустите Laravel и Websocket сервер с нужным портом
```bash
php artisan reverb:start --port 8081
php artisan serve
```
### 🎉 Теперь веб-сайт доступен на http://127.0.0.1:8000
