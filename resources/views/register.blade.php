<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Регистрация</title>
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
            <form class="form-content" id="register-form">
                <div class="form-text">
                    <p class="form-text-top">Добро пожаловать на практику</p>
                    <p class="form-text-bottom">Пожалуйста, введите свою почту и придумайте пароль. Вышлем код подтверждения на почту</p>
                </div>
                <input type="email" placeholder="Почта" id="reg-email" required>
                <input type="password" placeholder="Пароль" id="reg-password" required>
                <input type="password" placeholder="Подтверждение пароля" id="reg-password-confirm" required>
                <!-- Блок с требованиями к паролю -->
                <div class="password-requirements">
                    Пароль должен содержать:
                    <ul>
                        <li>минимум 8 символов</li>
                        <li>буквы (верхний и нижний регистр)</li>
                        <li>цифры</li>
                    </ul>
                </div>
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="agree" class="check">
                    <label for="agree">Я согласен(-на) на <a href="https://21-school.ru/personal_data_politics" class="policy-link">обработку персональных данных</a></label>
                </div>
                <div class="form-input-buttons">
                    <button type="button" class="send-code" id="register-submit">Выслать код</button>
                    <a href="{{ url('/') }}"><button type="button" class="sign-in">Войти</button></a>
                </div>
            </form>
        </div>
    </div>
    <div id="notification-container"></div>
    <script src="{{ asset('js/config.js') }}"></script>
    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>
