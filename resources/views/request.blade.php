<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Практика - Подача заявки</title>
    <link rel="stylesheet" href="{{ asset('css/application.css') }}">
</head>
<body>

<div class="container">
    <header>
        <div class="header-left">
            <div>
                <img src="{{ asset('img/logo.png') }}" alt="Логотип" width="80" height="60">
            </div>
        </div>
        <div class="header-right">
                <div class="user-avatar" id="profile-icon">
                    <img src="{{ asset('img/Frame 13.png') }}"  alt="icon" class="user-icon" id="profile-icon">
                </div>
            </div>
        </header>

    <nav class="nav-tabs">
        <div class="nav-item active" data-tab="application">Заявка</div>
        <div class="nav-item" data-tab="confirmation">Подтверждение</div>
    </nav>

    <main class="content-area">
        <div id="content-container">
            <!-- Контент подставляется через JS -->
        </div>
    </main>
</div>

<!-- ==================== ПОПАП ПРОФИЛЯ ==================== -->
<div class="profile" id="profilePopup">
    <div class="profile-header">
        <img src="{{ asset('img/Frame 13.png') }}" alt="profile" class="profile-icon">
        <p class="profile-email" id="profileEmail">user@example.com</p>
    </div>
    <hr>
    <button class="logout-button">Выход</button>
</div>

<!-- ==================== КОНТЕЙНЕР УВЕДОМЛЕНИЙ ==================== -->
<div id="notification-container"></div>

<!-- ==================== ПОДКЛЮЧЕНИЕ СКРИПТОВ ==================== -->
<script src="{{ asset('js/config.js') }}"></script>
<script src="{{ asset('js/app_script.js') }}"></script>

</body>
</html>
