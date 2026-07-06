<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Практика - Кабинет</title>
    <link rel="stylesheet" href="{{ asset('css/practicant.css') }}">
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
            <div style="position: relative; display: inline-block; cursor: pointer;" onclick="openNotificationsModal()">
                <img src="{{ asset('img/icon 03.png') }}" alt="notification" class="notification-icon" id="profile-notification" width="30" height="30">
                <!-- Бейдж с количеством новых уведомлений -->
                <span id="notification-badge" style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #FF6B6B;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 10px;
                    font-weight: 600;
                    min-width: 18px;
                    text-align: center;
                    display: none;
                ">0</span>
            </div>
        </div>
    </header>

    <nav class="nav-tabs">
        <div class="nav-item active" onclick="switchTab('profile')">Профиль</div>
        <div class="nav-item" onclick="switchTab('chat')">Чат</div>
    </nav>

    <!-- ==================== КОНТЕНТ ==================== -->
    <main class="content-area">

        <!-- СТРАНИЦА: ПРОФИЛЬ -->
        <div id="profile" class="tab-content active">
            <div class="card">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        <img src="{{ asset('img/Frame 27.png') }}" alt="icon" class="icon" id="profile-icon">
                    </div>
                    <div>
                        <div class="profile-name">Загрузка...</div>
                        <div class="profile-role">Студент</div>
                    </div>
                </div>

                <div class="profile-grid">
                    <div class="profile-item">
                        <span class="profile-item-label">Дата рождения</span>
                        <span class="profile-item-value">—</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-item-label">Город</span>
                        <span class="profile-item-value">—</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-item-label">Телефон</span>
                        <span class="profile-item-value">—</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-item-label">Направление</span>
                        <span class="profile-item-value">—</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-item-label">Курс</span>
                        <span class="profile-item-value">—</span>
                    </div>
                    <div class="profile-item" style="grid-column: 1 / -1; border-top: 1px solid #eee; padding-top: 15px;">
                        <span class="profile-item-label">Даты практики</span>
                        <span class="profile-item-value">—</span>
                        <!-- ============================================================ -->
                        <!-- КНОПКА ВЫХОДА -->
                        <!-- ============================================================ -->
                        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
                            <button onclick="handleLogout()" style="
                                padding: 10px 30px;
                                background: #87d4a5;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 15px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            " onmouseover="this.style.background='#e55555'; this.style.transform='scale(1.02)'" onmouseout="this.style.background='#87d4a5'; this.style.transform='scale(1)'">
                                <span style="font-size: 18px;"></span>
                                Выйти из аккаунта
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- СТРАНИЦА: ЧАТ -->
        <div id="chat" class="tab-content">
            <div class="card" style="padding: 20px; background-color: #F9FAFB; max-width: 1100px;">
                <div class="chat-container">
                    <div class="chat-sidebar">
                        <div class="chat-list" id="chatList">
                            <div class="chat-list-item" style="color:#888;">Загрузка...</div>
                        </div>
                    </div>

                    <div class="chat-window">
                        <div class="chat-messages" id="chatMessages">
                            <div style="text-align:center; color:#888; padding:40px;">Выберите чат</div>
                        </div>
                        <div class="chat-input-area">
                            <!-- Кнопка прикрепления файла -->
                            <button type="button" id="attach-btn" class="attach-btn" style="
                                background: none;
                                border: none;
                                cursor: pointer;
                                padding: 8px 10px;
                                font-size: 20px;
                                color: #888;
                                border-radius: 8px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
                                📎
                            </button>

                            <!-- Скрытый инпут для файлов -->
                            <input type="file" id="file-input" class="hidden" style="display: none;">

                            <input type="text" id="chatInput" placeholder="Введите текст" onkeypress="if(event.key==='Enter'){event.preventDefault(); window.sendMessage();}">
                            <span class="send-icon" id="chatSendBtn" onclick="window.sendMessage();">&#10148;</span>
                        </div>

                        <!-- Превью выбранного файла -->
                        <div id="file-preview-container" style="
                            display: none;
                            padding: 8px 12px;
                            background: white;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            margin-top: 8px;
                            align-items: center;
                            justify-content: space-between;
                        ">
                            <div style="display: flex; align-items: center; gap: 10px; color: #555; font-size: 14px;">
                                <span style="font-size: 18px;">📎</span>
                                <span id="file-preview-name" style="font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Файл.jpg</span>
                            </div>
                            <button type="button" id="clear-file-btn" style="
                                background: none;
                                border: none;
                                color: #999;
                                font-size: 20px;
                                cursor: pointer;
                                padding: 0 8px;
                            " onmouseover="this.style.color='#FF6B6B'" onmouseout="this.style.color='#999'">×</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>
</div>

<!-- ============================================================ -->
<!-- ПОПАП УВЕДОМЛЕНИЙ -->
<!-- ============================================================ -->
<div class="popup notification-popup" id="modalNotifications">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <span class="application-main-text" style="font-size: 18px; font-weight: 600; color: #1a1a2e;">Уведомления</span>
        <button onclick="closeNotificationsModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #888;
            padding: 0 8px;
            transition: color 0.2s;
        " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#888'">×</button>
    </div>
    <div class="notification-container" style="display: flex; gap: 20px; height: 450px;">
        <!-- Левая колонка - список уведомлений -->
        <div class="notification-left" style="
            flex: 1;
            overflow-y: auto;
            padding-right: 10px;
            border-right: 1px solid #eee;
        ">
            <div id="notificationsList">
                <div style="text-align:center; color:#888; padding:20px;">Загрузка уведомлений...</div>
            </div>
        </div>
        <!-- Правая колонка - детали выбранного уведомления -->
        <div class="notification-right" style="
            flex: 1.5;
            overflow-y: auto;
            padding-left: 10px;
        ">
            <div id="notificationDetail" style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #999;
                font-size: 14px;
            ">
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">👆</div>
                    <div>Выберите уведомление для просмотра</div>
                </div>
            </div>
        </div>
    </div>
    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; display: flex; justify-content: center;">
        <button onclick="markAllNotificationsRead()" style="
            padding: 8px 24px;
            border: none;
            border-radius: 6px;
            background: #7B3FE4;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        " onmouseover="this.style.background='#6a2fc9'" onmouseout="this.style.background='#7B3FE4'">
            Прочитать все
        </button>
    </div>
</div>

<!-- Оверлей для затемнения фона -->
<div id="popup-overlay" onclick="closeNotificationsModal()"></div>

<!-- ==================== СКРИПТЫ ==================== -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pusher/8.3.0/pusher.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
<script src="{{ asset('js/config.js') }}"></script>
<script src="{{ asset('js/services/ApiService.js') }}"></script>
<script src="{{ asset('js/services/ChatService.js') }}"></script>
<script src="{{ asset('js/practicant_script.js') }}"></script>

<script>
    // Дополнительные глобальные функции
    window.switchTab = function(tabId) {
        if (window.app && window.app.switchTab) {
            window.app.switchTab(tabId);
        } else {
            var allNavItems = document.querySelectorAll('.nav-item');
            for (var i = 0; i < allNavItems.length; i++) {
                allNavItems[i].classList.remove('active');
            }

            var allTabContents = document.querySelectorAll('.tab-content');
            for (var j = 0; j < allTabContents.length; j++) {
                allTabContents[j].classList.remove('active');
            }

            var targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        }
    };

    window.sendMessage = function() {
        if (window.app && window.app.chatService) {
            window.app.chatService.sendMessage();
        }
    };

    window.selectChat = function(element, title) {
        var allChatItems = document.querySelectorAll('.chat-list-item');
        for (var i = 0; i < allChatItems.length; i++) {
            allChatItems[i].classList.remove('active');
        }
        if (element) {
            element.classList.add('active');
        }
    };

    // ============================================================
    // ВЫХОД ИЗ СИСТЕМЫ
    // ============================================================

    window.handleLogout = function() {
        var isConfirmed = confirm('Вы уверены, что хотите выйти из аккаунта?');
        if (!isConfirmed) {
            return;
        }

        localStorage.clear();
        sessionStorage.clear();
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = '{{ url("/") }}';
    };

    // ============================================================
    // УВЕДОМЛЕНИЯ - ГЛОБАЛЬНЫЕ ФУНКЦИИ
    // ============================================================


    // Закрыть попап уведомлений
    window.closeNotificationsModal = function() {
        var modal = document.getElementById('modalNotifications');
        var overlay = document.getElementById('popup-overlay');

        if (modal) {
            modal.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
    };

    // Отметить все как прочитанные
    window.markAllNotificationsRead = function() {
        if (window.app && window.app.markAllAsRead) {
            window.app.markAllAsRead();
        }
    };

    // Закрытие по Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var modal = document.getElementById('modalNotifications');
            if (modal && modal.classList.contains('active')) {
                window.closeNotificationsModal();
            }
        }
    });
</script>

</body>
</html>
