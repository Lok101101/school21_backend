<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Практика - Панель управления</title>
    <link rel="stylesheet" href="{{ asset('css/teamlid.css') }}">
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
            <button class="btn-notify" onclick="openNotifyModal()">Отправить уведомление</button>
                <div>
                    <img src="{{ asset('img/Frame 13.png') }}"  alt="icon" class="icon" id="profile-icon">
                </div>
            </div>
    </header>

    <nav class="nav-tabs">
        <div class="nav-item active" onclick="switchTab('applications')">Заявки</div>
        <div class="nav-item" onclick="switchTab('groups')">Группы</div>
        <div class="nav-item" onclick="switchTab('chat')">Чат</div>
    </nav>

    <!-- ==================== КОНТЕНТ ==================== -->
    <main class="content-area">

        <!-- Секция: Заявки -->
        <div id="applications" class="tab-content active">
            <div class="card">
                <div class="filter-tabs">
                    <button class="filter-btn active" onclick="switchAppFilter('pending', this)">На рассмотрении</button>
                    <button class="filter-btn" onclick="switchAppFilter('accepted', this)">Принят</button>
                    <button class="filter-btn" onclick="switchAppFilter('rejected', this)">Отклонен</button>
                </div>

                <div class="table-wrapper">
                    <div class="table-container">
                        <table class="app-table">
                            <thead>
                                <tr>
                                    <th>ФИО</th>
                                    <th>Курс</th>
                                    <th>Направление</th>
                                    <th>Дата начала</th>
                                    <th>Дата окончания</th>
                                </tr>
                            </thead>
                            <tbody id="applicationsTableBody">
                                <!-- Данные подставляются через JS -->
                            </tbody>
                        </table>
                    </div>

                    <div class="pagination-controls" id="applicationsPagination">
                        <!-- Пагинация подставляется через JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Секция: Группы -->
        <div id="groups" class="tab-content">
            <div class="card">
                <div class="filter-tabs">
                    <button class="filter-btn active" onclick="switchGroupView('active', this)">Активные</button>
                    <button class="filter-btn" onclick="switchGroupView('completed', this)">Завершенные</button>
                </div>

                <div id="groupViewActive">
                    <div class="groups-grid">
                        <!-- Группы подставляются через JS -->
                    </div>
                </div>

                <div id="groupViewCompleted" style="display: none;">
                    <!-- Аккордеоны создаются через JS -->
                </div>
            </div>
        </div>

       <!-- Секция: Чат -->
        <div id="chat" class="tab-content">
            <div class="card" style="padding: 20px;">
                <div class="chat-container">
                    <div class="chat-sidebar">
                        <div class="sidebar-tabs">
                            <button class="sidebar-tab-btn active" data-view="groups">Группы</button>
                            <button class="sidebar-tab-btn" data-view="members">Участники</button>
                        </div>
                        <div class="chat-list" id="chatList">
                            <div class="chat-list-item" style="color:#888;">Загрузка...</div>
                        </div>
                    </div>

                    <div class="chat-window">
                        <div class="chat-messages" id="chatMessages">
                            <div style="text-align:center; color:#888; padding:40px;">Выберите чат</div>
                        </div>

                        <!-- ====== ОБНОВЛЕННАЯ ОБЛАСТЬ ВВОДА С ФАЙЛАМИ ====== -->
                        <div class="chat-input-area">
                            <div class="input-wrapper">
                                <!-- Кнопка прикрепления файла -->
                                <button class="attach-btn" id="attach-btn" title="Прикрепить файл">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                                    </svg>
                                </button>

                                <!-- Скрытый input для выбора файла -->
                                <input type="file" id="file-input" style="display: none;" multiple>

                                <!-- Поле ввода текста -->
                                <input type="text" id="chatInput" placeholder="Введите текст"
                                    onkeypress="if(event.key==='Enter'){event.preventDefault(); window.app?.chatService?.sendMessage();}">

                                <!-- Кнопка отправки -->
                                <span class="send-icon" id="chatSendBtn" onclick="window.app?.chatService?.sendMessage();">&#10148;</span>
                            </div>

                            <!-- Превью выбранного файла -->
                            <div class="file-preview-container" id="file-preview-container" style="display: none; padding: 8px 0;">
                                <div class="file-preview-item">
                                    <span class="file-preview-name" id="file-preview-name">file.txt</span>
                                    <button class="clear-file-btn" id="clear-file-btn">✕</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>
</div>

<!-- ==================== МОДАЛЬНЫЕ ОКНА ==================== -->
<div class="modal-overlay" id="modal1" onclick="closeModalOutside(event, 'modal1')">
    <div class="modal-box">
        <div class="modal-title" id="modalUserName">Иванов Илья Федорович</div>
        <div class="modal-grid">
            <div class="modal-item phone"><span class="modal-item-label">номер телефона</span><span class="modal-item-value" id="modalPhone">+7 000 000 00 00</span></div>
            <div class="modal-item"><span class="modal-item-label">дата рождения</span><span class="modal-item-value" id="modalBirthday">14.08.2002</span></div>
            <div class="modal-item"><span class="modal-item-label">курс</span><span class="modal-item-value" id="modalCourse">3</span></div>
            <div class="modal-item"><span class="modal-item-label">направление</span><span class="modal-item-value" id="modalDirection">09.03.03</span></div>
            <div class="modal-item"><span class="modal-item-label">дата начала</span><span class="modal-item-value" id="modalStartDate">22.07</span></div>
            <div class="modal-item"><span class="modal-item-label">дата окончания</span><span class="modal-item-value" id="modalEndDate">14.08</span></div>
        </div>
        <div class="modal-actions">
            <button class="modal-btn modal-btn-accept" onclick="handleAcceptRequest()">Принять</button>
            <button class="modal-btn modal-btn-reject" onclick="switchModal('modal1', 'modal2')">Отклонить</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal2" onclick="closeModalOutside(event, 'modal2')">
    <div class="modal-box">
        <div class="modal-header-row"><button class="back-button" onclick="switchModal('modal2', 'modal1')">&#10094;</button><button class="dropdown-btn">Шаблоны &#9662;</button></div>
        <div class="modal-subtitle">Укажите причину отказа</div>
        <textarea class="modal-textarea" placeholder="Текст"></textarea>
        <div class="action-row"><button class="text-btn">Сохранить шаблон</button><button class="btn-send-green" onclick="handleSendRejection()">Отправить</button></div>
    </div>
</div>

<div class="modal-overlay" id="modal3" onclick="closeModalOutside(event, 'modal3')">
    <div class="modal-box">
        <div class="modal-header-row"><button class="back-button" onclick="switchModal('modal3', 'modal2')">&#10094;</button></div>
        <input type="text" class="modal-input" placeholder="Название шаблона">
        <textarea class="modal-textarea" placeholder="Причина отказа" style="min-height: 80px;"></textarea>
        <button class="btn-save-full" onclick="handleSaveRejectionTemplate()">Сохранить</button>
    </div>
</div>

<!-- Модальное окно группы -->
<div class="modal-overlay" id="modalGroup" onclick="closeModalOutside(event, 'modalGroup')">
    <div class="modal-box wide">
        <div class="group-modal-header">
            <div>
                <span class="group-modal-title" id="groupTitle">Группа</span>
                <span class="group-modal-count" id="groupCount">—</span>
            </div>
            <div class="group-modal-actions" id="groupModalActions"></div>
        </div>
        <div class="group-table-container">
            <table class="group-table">
                <tbody id="groupTableBody">
                    <tr>
                        <td style="text-align:center; color:#888; padding:20px;">Загрузка...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modalNotify" onclick="closeModalOutside(event, 'modalNotify')">
    <div class="modal-box">
        <div class="modal-header-row">
            <div class="modal-subtitle">Уведомление</div>
            <button class="dropdown-btn" id="notifyTemplateBtn">Шаблоны ▼</button>
        </div>
        <div class="form-group">
            <label class="form-label">Тема</label>
            <input type="text" class="modal-input" id="notifySubject" placeholder="Тема">
        </div>
        <div class="form-group">
            <label class="form-label">Группа</label>
            <select class="modal-select" id="notifyGroup">
                <option value="all">Все группы</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Описание</label>
            <textarea class="modal-textarea" id="notifyDescription" placeholder="Текст уведомления"></textarea>
        </div>
        <div class="action-row">
            <button class="text-btn" id="notifySaveTemplateBtn">Сохранить шаблон</button>
            <button class="btn-send-green" id="notifySendBtn">Отправить</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modalNotifyTemplate" onclick="closeModalOutside(event, 'modalNotifyTemplate')">
    <div class="modal-box">
        <div class="modal-header-row">
            <button class="back-button" onclick="switchModal('modalNotifyTemplate', 'modalNotify')">&#10094;</button>
        </div>
        <div class="form-group">
            <label class="form-label">Название шаблона</label>
            <input type="text" class="modal-input" id="notifyTemplateName" placeholder="Название">
        </div>
        <div class="form-group">
            <label class="form-label">Тема</label>
            <input type="text" class="modal-input" id="notifyTemplateSubject" placeholder="Тема">
        </div>
        <div class="form-group">
            <label class="form-label">Описание</label>
            <textarea class="modal-textarea" id="notifyTemplateDescription" placeholder="Текст"></textarea>
        </div>
        <button class="btn-save-full" id="notifyTemplateSaveBtn">Сохранить</button>
    </div>
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

<script src="https://cdnjs.cloudflare.com/ajax/libs/pusher/8.3.0/pusher.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
<script src="{{ asset('js/config.js') }}"></script>
<script src="{{ asset('js/services/ApiService.js') }}"></script>
<script src="{{ asset('js/services/TemplateService.js') }}"></script>
<script src="{{ asset('js/services/RequestService.js') }}"></script>
<script src="{{ asset('js/services/GroupService.js') }}"></script>
<script src="{{ asset('js/services/ChatService.js') }}"></script>
<script src="{{ asset('js/services/NotificationService.js') }}"></script>
<script src="{{ asset('js/teamlid_script.js') }}"></script>
</body>
</html>
