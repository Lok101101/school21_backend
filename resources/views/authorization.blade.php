<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap">
</head>
<body>
    <div class="wrapper">
        <div class="register-info">
            <img src="{{ asset('img/logo-big.png') }}" alt="logo" class="register-logo">
            <div class="register-text">
                <p class="register-text-top">Вместе сильнее</p>
                <p class="register-text-bottom">Идите к успеху со своей командой, щедро обмениваясь опытом и знаниями на каждом этапе пути</p>
            </div>
        </div>
        <div class="form">
            <form class="form-content" id="login-form">
                <div class="form-text">
                    <p class="form-text-top">Добро пожаловать на практику</p>
                    <p class="form-text-bottom">Пожалуйста, введите свою почту и пароль</p>
                </div>
                <input type="email" placeholder="Почта" id="login-email" required>
                <input type="password" placeholder="Пароль" id="login-password" required>
                <div class="form-input-buttons">
                    <button type="button" class="send-code" id="login-submit">Войти</button>
                    <a href="{{ url('/register') }}"><button type="button" class="sign-in">Зарегистрироваться</button></a>
                </div>
            </form>
        </div>
    </div>
        <!-- Контейнер для уведомлений -->
    <div id="notification-container"></div>
    <script src="{{ asset('js/config.js') }}"></script>
    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>
