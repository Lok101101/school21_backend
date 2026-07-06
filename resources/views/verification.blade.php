<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Верификация</title>
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
            <form class="form-content" id="verification-form">
                <div class="form-text">
                    <p class="form-text-top">Подтвердите почту</p>
                    <p class="form-text-bottom">Мы отправили код на почту. Если письма нет — проверьте папку «Спам» и подождите пару минут</p>
                </div>
                <input type="text" placeholder="Введите код" id="code-input" maxlength="6" required>
                <button type="button" class="send-code" id="verify-btn">Продолжить</button>
                <p class="form-resend">Не пришло письмо? <a href="#" id="resend-code">Отправить код повторно</a></p>
            </form>
        </div>
    </div>
    <div id="notification-container"></div>
    <script src="{{ asset('js/config.js') }}"></script>
    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>
