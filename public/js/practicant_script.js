// ============================================================
// УВЕДОМЛЕНИЯ
// ============================================================

// Ключ для хранения в localStorage
const NOTIFICATIONS_STORAGE_KEY = 'practicant_notifications';

// Загрузка уведомлений из localStorage
function loadNotificationsFromStorage() {
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Ошибка загрузки уведомлений из localStorage:', e);
    }
    return null;
}

// Сохранение уведомлений в localStorage
function saveNotificationsToStorage(notifications) {
    try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
        console.warn('Ошибка сохранения уведомлений в localStorage:', e);
    }
}

// ============================================================
// ГЛАВНЫЙ КЛАСС - PRACTICANT DASHBOARD
// ============================================================
class PracticantDashboard {
    constructor() {
        this.userId = null;
        this.userRole = 'student';
        this.userData = null;
        this.groupId = null;
        this.teamleadId = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.selectedNotificationId = null;
        this.echo = null;
        this.chatService = null;
        this.isWebSocketInitialized = false;

        const self = this;
        setTimeout(function() {
            self.init();
        }, 0);
    }

    // ============================================================
    // 1. ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
    // ============================================================

    async getUserId() {
        try {
            const token = localStorage.getItem('auth_token');
            const requestHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (token) {
                requestHeaders['Authorization'] = 'Bearer ' + token;
            }

            const response = await fetch(API_BASE + '/users/me', {
                headers: requestHeaders
            });

            if (!response.ok) {
                throw new Error('Ошибка получения данных пользователя');
            }

            const responseData = await response.json();

            let userId = null;
            let userRole = 'student';
            let userData = null;

            if (responseData.user) {
                userId = responseData.user.id || '1';
                userRole = responseData.user.role || 'student';
                userData = responseData.user;
            } else {
                userId = responseData.id || '1';
                userRole = responseData.role || 'student';
                userData = responseData;
            }

            this.userId = userId;
            this.userRole = userRole;
            this.userData = userData;

            await this.loadProfileData();

            // Если groupId найден - загружаем уведомления и подключаем WebSocket
            if (this.groupId) {
                await this.loadNotifications();
                this.initWebSocket();
            } else {
                // Если не найден - пробуем принудительно
                await this.forceLoadNotifications();
            }

            this.initChat();

            return this.userId;

        } catch (error) {
            console.warn('Не удалось получить данные пользователя:', error);
            this.userId = '1';
            this.userRole = 'student';
            return '1';
        }
    }

    // ============================================================
    // 2. ЗАГРУЗКА ПРОФИЛЯ И GROUP ID
    // ============================================================

    async loadProfileData() {
        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(API_BASE + '/requests/my', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Ошибка получения данных:', response.status);
                return;
            }

            const responseData = await response.json();

            // Рендерим профиль
            this.renderProfile(responseData);

            // Ищем group_id в разных местах
            let foundGroupId = null;

            if (responseData.practice_requests && responseData.practice_requests.length > 0) {
                const request = responseData.practice_requests[0];

                // Пробуем разные варианты получения group_id
                if (request.group_id) {
                    foundGroupId = request.group_id;
                } else if (request.groupId) {
                    foundGroupId = request.groupId;
                } else if (request.group && request.group.id) {
                    foundGroupId = request.group.id;
                } else if (request.group && request.group.group_id) {
                    foundGroupId = request.group.group_id;
                } else if (request.practice_group_id) {
                    foundGroupId = request.practice_group_id;
                }
            }

            // Если нашли group_id - сохраняем
            if (foundGroupId) {
                this.groupId = foundGroupId;
            }

        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        }
    }

    // ============================================================
    // 3. ПРИНУДИТЕЛЬНАЯ ЗАГРУЗКА УВЕДОМЛЕНИЙ
    // ============================================================

    async forceLoadNotifications() {
        // Если groupId уже есть - просто загружаем
        if (this.groupId) {
            await this.loadNotifications();
            this.initWebSocket();
            return true;
        }

        const token = localStorage.getItem('auth_token');

        try {
            // Пробуем через /groups/my
            const response = await fetch(API_BASE + '/groups/my', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const responseData = await response.json();

                let groups = [];
                if (responseData.user_groups) {
                    groups = responseData.user_groups;
                } else if (responseData.groups) {
                    groups = responseData.groups;
                } else if (responseData.data) {
                    groups = responseData.data;
                }

                if (Array.isArray(groups) && groups.length > 0) {
                    const firstGroup = groups[0];
                    this.groupId = firstGroup.id || firstGroup.group_id;

                    await this.loadNotifications();
                    this.initWebSocket();
                    return true;
                }
            }

            // Пробуем через /users/me
            const meResponse = await fetch(API_BASE + '/users/me', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (meResponse.ok) {
                const meData = await meResponse.json();
                const user = meData.user || meData;

                if (user.group_id || user.groupId) {
                    this.groupId = user.group_id || user.groupId;

                    await this.loadNotifications();
                    this.initWebSocket();
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('Ошибка принудительной загрузки:', error);
            return false;
        }
    }

    // ============================================================
    // 4. ЗАГРУЗКА УВЕДОМЛЕНИЙ
    // ============================================================

    async loadNotifications() {
        if (!this.groupId) {
            console.warn('Нет groupId для загрузки уведомлений');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(API_BASE + '/groups/' + this.groupId + '/notifications', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }

            const responseData = await response.json();

            let serverNotifications = [];
            if (responseData.group_notifications) {
                serverNotifications = responseData.group_notifications;
            } else if (responseData.notifications) {
                serverNotifications = responseData.notifications;
            } else if (responseData.data) {
                serverNotifications = responseData.data;
            }

            // Загружаем сохраненные статусы из localStorage
            const savedStatuses = loadNotificationsFromStorage();
            const savedMap = {};
            if (savedStatuses) {
                savedStatuses.forEach(function(item) {
                    savedMap[item.id] = item.is_read;
                });
            }

            // Объединяем: берем уведомления с сервера, но статус прочтения из localStorage
            this.notifications = serverNotifications.map(function(notification) {
                // Если есть сохраненный статус - используем его
                if (savedMap[notification.id] !== undefined) {
                    notification.is_read = savedMap[notification.id];
                }
                return notification;
            });

            // Сортируем по убыванию даты
            this.notifications.sort(function(a, b) {
                const dateA = new Date(b.created_at);
                const dateB = new Date(a.created_at);
                if (dateA < dateB) {
                    return -1;
                }
                if (dateA > dateB) {
                    return 1;
                }
                return 0;
            });

            // Сохраняем в localStorage
            saveNotificationsToStorage(this.notifications);

            // Подсчет непрочитанных
            this.unreadCount = 0;
            for (let index = 0; index < this.notifications.length; index++) {
                const notification = this.notifications[index];
                if (notification.is_read === false) {
                    this.unreadCount = this.unreadCount + 1;
                }
            }

            this.updateNotificationIcon();
            this.updateBadge();

        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);

            // Если ошибка - пробуем загрузить из localStorage
            const saved = loadNotificationsFromStorage();
            if (saved) {
                this.notifications = saved;
                this.unreadCount = 0;
                for (let index = 0; index < this.notifications.length; index++) {
                    const notification = this.notifications[index];
                    if (notification.is_read === false) {
                        this.unreadCount = this.unreadCount + 1;
                    }
                }
                this.updateNotificationIcon();
                this.updateBadge();
            } else {
                this.notifications = [];
                this.unreadCount = 0;
                this.updateNotificationIcon();
                this.updateBadge();
            }
        }
    }

    // ============================================================
    // 5. WEBSOCKET
    // ============================================================

    initWebSocket() {
        // Защита от повторной инициализации
        if (this.isWebSocketInitialized) {
            console.warn('WebSocket уже инициализирован');
            return;
        }

        try {
            if (typeof Echo === 'undefined') {
                console.warn('Laravel Echo не загружен');
                return;
            }

            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.warn('Нет токена для WebSocket');
                return;
            }

            if (!this.groupId) {
                console.warn('Нет groupId для WebSocket');
                return;
            }

            this.echo = new Echo({
                broadcaster: 'reverb',
                key: window.REVERB_KEY,
                auth: {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                },
                authEndpoint: API_BASE.replace('/api', '') + '/broadcasting/auth',
                wsHost: API_BASE.replace('https://', '').replace('/api', ''),
                wsPort: 443,
                wssPort: 443,
                forceTLS: true,
                enabledTransports: ['ws', 'wss']
            });

            // Уведомления группы
            const groupChannelName = 'Group.' + this.groupId;

            const self = this;
            this.echo.private(groupChannelName)
                .listen('PracticeGroupNotificationEvent', function(eventData) {
                    const newNotification = {
                        id: eventData.id || Date.now(),
                        subject: eventData.subject || eventData.title || 'Уведомление группы',
                        text: eventData.text || eventData.message || eventData.body || '',
                        created_at: eventData.created_at || eventData.timestamp || new Date().toISOString(),
                        is_read: false,
                        is_group_notification: true
                    };

                    self.notifications.unshift(newNotification);
                    self.unreadCount = self.unreadCount + 1;

                    // Сохраняем в localStorage
                    saveNotificationsToStorage(self.notifications);

                    self.updateNotificationIcon();
                    self.updateBadge();
                    self.showNotification('📬 ' + newNotification.subject, 'info');

                    const modal = document.getElementById('modalNotifications');
                    if (modal && modal.classList.contains('active')) {
                        self.renderNotifications();
                    }
                });

            // Личные уведомления
            const userChannelName = 'Notifications.' + this.userId;

            this.echo.private(userChannelName)
                .listen('PracticeRequestStatusChangeEvent', function(eventData) {
                    const newNotification = {
                        id: eventData.id || Date.now(),
                        subject: eventData.subject || 'Статус заявки изменен',
                        text: eventData.text || eventData.message || eventData.body || '',
                        created_at: eventData.created_at || eventData.timestamp || new Date().toISOString(),
                        is_read: false,
                        is_group_notification: false
                    };

                    self.notifications.unshift(newNotification);
                    self.unreadCount = self.unreadCount + 1;

                    // Сохраняем в localStorage
                    saveNotificationsToStorage(self.notifications);

                    self.updateNotificationIcon();
                    self.updateBadge();
                    self.showNotification('📬 ' + newNotification.subject, 'info');

                    const modal = document.getElementById('modalNotifications');
                    if (modal && modal.classList.contains('active')) {
                        self.renderNotifications();
                    }
                });

            this.isWebSocketInitialized = true;

        } catch (error) {
            console.error('Ошибка WebSocket:', error);
        }
    }

    // ============================================================
    // 6. ИНИЦИАЛИЗАЦИЯ ЧАТА
    // ============================================================

    initChat() {
        // Проверяем, что ChatService доступен
        if (typeof ChatService === 'undefined') {
            console.warn('ChatService не загружен');
            return;
        }

        const self = this;

        const getGroups = function() {
            if (self.groupId) {
                return [
                    {
                        id: self.groupId,
                        name: 'Моя группа',
                        is_active: true
                    }
                ];
            }
            return [];
        };

        const getUserId = function() {
            return self.userId;
        };

        const getUserRole = function() {
            return self.userRole;
        };

        this.chatService = new ChatService(
            function(message, type) {
                self.showNotification(message, type);
            },
            getGroups,
            getUserId,
            getUserRole
        );

        this.chatService.onNewMessage = function(data) {
            self.showNotification('Новое сообщение: ' + data.text, 'info');
        };

        const chatServiceInstance = this.chatService;
        this.chatService.init().then(function() {
            if (chatServiceInstance) {
                chatServiceInstance.renderChatList('groups');
            }
        });
    }

    // ============================================================
    // 7. ОБНОВЛЕНИЕ ИКОНКИ УВЕДОМЛЕНИЙ
    // ============================================================

    updateNotificationIcon() {
        const icon = document.getElementById('profile-notification');
        if (!icon) {
            return;
        }

        if (this.unreadCount > 0) {
            icon.src = 'img/icon 04.png';
        } else {
            icon.src = 'img/icon 03.png';
        }
    }

    // ============================================================
    // 8. ОБНОВЛЕНИЕ БЕЙДЖА УВЕДОМЛЕНИЙ
    // ============================================================

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) {
            return;
        }

        if (this.unreadCount > 0) {
            if (this.unreadCount > 99) {
                badge.textContent = '99+';
            } else {
                badge.textContent = this.unreadCount;
            }
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // ============================================================
    // 9. ОТОБРАЖЕНИЕ УВЕДОМЛЕНИЙ
    // ============================================================

    renderNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) {
            return;
        }

        if (!this.notifications || this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; color:#888; padding:40px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
                    <div style="font-size: 16px; font-weight: 500; color: #666;">У вас пока нет уведомлений</div>
                    <div style="font-size: 13px; color: #999; margin-top: 4px;">Новые уведомления будут появляться здесь</div>
                </div>
            `;

            // Очищаем правую колонку
            const detailContainer = document.getElementById('notificationDetail');
            if (detailContainer) {
                detailContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 14px;">
                        <div style="text-align: center;">
                            <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
                            <div>Нет уведомлений для просмотра</div>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // Сортируем: непрочитанные сверху
        const sortedNotifications = [...this.notifications].sort(function(a, b) {
            if (a.is_read === b.is_read) {
                return 0;
            }
            if (a.is_read) {
                return 1;
            }
            return -1;
        });

        let htmlContent = '';
        for (let index = 0; index < sortedNotifications.length; index++) {
            const notification = sortedNotifications[index];
            const isRead = notification.is_read;
            const backgroundColor = isRead ? '#fafafa' : '#f5f0ff';
            const borderLeftColor = isRead ? 'transparent' : '#7B3FE4';
            const fontWeight = isRead ? '500' : '600';
            const formattedDate = this.formatDate(notification.created_at);

            htmlContent = htmlContent + `
                <div class="notification-item"
                    style="
                        padding: 12px 14px;
                        border-radius: 8px;
                        margin-bottom: 6px;
                        transition: all 0.2s ease;
                        cursor: pointer;
                        background: ${backgroundColor};
                        border-left: 3px solid ${borderLeftColor};
                    "
                    onclick="window.app?.selectNotification(${notification.id})"
                    onmouseover="this.style.background='${isRead ? '#f0f0f0' : '#ede5ff'}'"
                    onmouseout="this.style.background='${backgroundColor}'"
                >
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="
                                font-weight: ${fontWeight};
                                color: #1a1a2e;
                                font-size: 13px;
                                margin-bottom: 2px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">
                                ${notification.subject || 'Уведомление'}
                            </div>
                            <div style="
                                color: #666;
                                font-size: 12px;
                                line-height: 1.4;
                                display: -webkit-box;
                                -webkit-line-clamp: 1;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                            ">
                                ${notification.text || ''}
                            </div>
                            <div style="
                                color: #999;
                                font-size: 10px;
                                margin-top: 4px;
                            ">
                                ${formattedDate}
                            </div>
                        </div>
                        ${!isRead ? `
                            <div style="
                                width: 8px;
                                height: 8px;
                                min-width: 8px;
                                background: #7B3FE4;
                                border-radius: 50%;
                                margin-top: 4px;
                            "></div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = htmlContent;
    }

    // ============================================================
    // 10. ВЫБОР УВЕДОМЛЕНИЯ
    // ============================================================

    selectNotification(notificationId) {
        let notification = null;
        for (let index = 0; index < this.notifications.length; index++) {
            const currentNotification = this.notifications[index];
            if (currentNotification.id === notificationId) {
                notification = currentNotification;
                break;
            }
        }

        if (!notification) {
            return;
        }

        this.selectedNotificationId = notificationId;

        if (!notification.is_read) {
            this.markAsRead(notificationId);
        }

        this.showNotificationDetail(notification);
    }

    // ============================================================
    // 11. ПОКАЗ ДЕТАЛЕЙ УВЕДОМЛЕНИЯ
    // ============================================================

    showNotificationDetail(notification) {
        const detailContainer = document.getElementById('notificationDetail');
        if (!detailContainer) {
            return;
        }

        const formattedDate = this.formatDate(notification.created_at);

        detailContainer.innerHTML = `
            <div style="
                padding: 16px;
                background: #f8f9fa;
                border-radius: 10px;
                margin-top: 12px;
            ">
                <div style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px;">
                    ${notification.subject || 'Уведомление'}
                </div>
                <div style="font-size: 14px; color: #444; line-height: 1.6; white-space: pre-wrap;">
                    ${notification.text || ''}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 8px;">
                    ${formattedDate}
                </div>
            </div>
        `;
    }

    // ============================================================
    // 12. ОТМЕТИТЬ КАК ПРОЧИТАННОЕ
    // ============================================================

    markAsRead(notificationId) {
        let notification = null;
        for (let index = 0; index < this.notifications.length; index++) {
            const currentNotification = this.notifications[index];
            if (currentNotification.id === notificationId) {
                notification = currentNotification;
                break;
            }
        }

        if (notification && !notification.is_read) {
            notification.is_read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);

            // Сохраняем в localStorage
            saveNotificationsToStorage(this.notifications);

            this.updateNotificationIcon();
            this.updateBadge();
            this.renderNotifications();

            const countElement = document.getElementById('notifications-count');
            if (countElement) {
                countElement.textContent = this.unreadCount;
            }
        }
    }

    // ============================================================
    // 13. ОТМЕТИТЬ ВСЕ КАК ПРОЧИТАННЫЕ
    // ============================================================

    markAllAsRead() {
        let markedCount = 0;

        for (let index = 0; index < this.notifications.length; index++) {
            const notification = this.notifications[index];
            if (!notification.is_read) {
                notification.is_read = true;
                markedCount = markedCount + 1;
            }
        }

        if (markedCount > 0) {
            this.unreadCount = 0;

            // Сохраняем в localStorage
            saveNotificationsToStorage(this.notifications);

            this.updateNotificationIcon();
            this.updateBadge();
            this.renderNotifications();

            const countElement = document.getElementById('notifications-count');
            if (countElement) {
                countElement.textContent = 0;
            }

            this.showNotification('✅ ' + markedCount + ' уведомлений прочитано', 'success');
        } else {
            this.showNotification('Нет непрочитанных уведомлений', 'info');
        }
    }

    // ============================================================
    // 14. ФОРМАТИРОВАНИЕ ДАТЫ
    // ============================================================

    formatDate(dateString) {
        if (!dateString) {
            return '';
        }

        try {
            const dateObject = new Date(dateString);
            const day = dateObject.getDate().toString().padStart(2, '0');
            const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObject.getFullYear();
            const hours = dateObject.getHours().toString().padStart(2, '0');
            const minutes = dateObject.getMinutes().toString().padStart(2, '0');

            return day + '.' + month + '.' + year + ' ' + hours + ':' + minutes;
        } catch (error) {
            return dateString;
        }
    }

    // ============================================================
    // 15. ОТОБРАЖЕНИЕ ПРОФИЛЯ
    // ============================================================

    renderProfile(data) {
        let requests = [];
        if (data.practice_requests) {
            requests = data.practice_requests;
        } else if (data.requests) {
            requests = data.requests;
        }

        let request = {};
        if (requests.length > 0) {
            request = requests[0];
        }

        const user = this.userData || {};

        // Имя
        const nameElement = document.querySelector('.profile-name');
        if (nameElement) {
            const nameParts = [];
            if (request.surname || user.surname) {
                nameParts.push(request.surname || user.surname);
            }
            if (request.name || user.name) {
                nameParts.push(request.name || user.name);
            }
            if (request.patronymic || user.patronymic) {
                nameParts.push(request.patronymic || user.patronymic);
            }

            if (nameParts.length > 0) {
                nameElement.textContent = nameParts.join(' ');
            } else {
                nameElement.textContent = 'Студент';
            }
        }

        // Роль
        const roleElement = document.querySelector('.profile-role');
        if (roleElement) {
            const course = request.course || user.course || '—';
            roleElement.textContent = 'Студент (Курс ' + course + ')';
        }

        // Поля профиля
        const fieldValues = {
            'Дата рождения': request.birth_date || user.birth_date || '—',
            'Пол': request.gender || user.gender || '—',
            'Город': request.city || user.city || '—',
            'Телефон': request.phone || user.phone || '—',
            'Направление': request.specialization || user.specialization || request.direction || user.direction || '—',
            'Курс': request.course || user.course || '—'
        };

        const profileItems = document.querySelectorAll('.profile-item');
        for (let index = 0; index < profileItems.length; index++) {
            const item = profileItems[index];
            const labelElement = item.querySelector('.profile-item-label');
            const valueElement = item.querySelector('.profile-item-value');

            if (labelElement && valueElement) {
                const labelText = labelElement.textContent.trim();
                if (fieldValues[labelText] !== undefined) {
                    valueElement.textContent = fieldValues[labelText];
                }
            }
        }

        // Период практики
        const dateItem = document.querySelector('.profile-item[style*="grid-column: 1 / -1"]');
        if (dateItem) {
            const valueElement = dateItem.querySelector('.profile-item-value');
            if (valueElement) {
                let startDate = '—';
                let endDate = '—';

                if (request.start_date) {
                    const startDateObject = new Date(request.start_date);
                    startDate = startDateObject.toLocaleDateString('ru-RU');
                }

                if (request.end_date) {
                    const endDateObject = new Date(request.end_date);
                    endDate = endDateObject.toLocaleDateString('ru-RU');
                }

                valueElement.textContent = 'с ' + startDate + ' по ' + endDate;
            }
        }
    }

    // ============================================================
    // 16. УВЕДОМЛЕНИЯ В ИНТЕРФЕЙСЕ
    // ============================================================

    showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');

        if (!container) {
            const tempContainer = document.createElement('div');
            tempContainer.id = 'notification-container';
            tempContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(tempContainer);
            container = tempContainer;
        }

        let backgroundColor = '#333';
        let textColor = 'white';

        if (type === 'success') {
            backgroundColor = '#55EFC4';
            textColor = '#111';
        } else if (type === 'error') {
            backgroundColor = '#FF6B6B';
            textColor = 'white';
        } else if (type === 'info') {
            backgroundColor = '#7B3FE4';
            textColor = 'white';
        } else if (type === 'warning') {
            backgroundColor = '#FDCB6E';
            textColor = '#111';
        }

        const notificationElement = document.createElement('div');
        notificationElement.style.cssText = `
            background: ${backgroundColor};
            color: ${textColor};
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;
        notificationElement.textContent = message;
        container.appendChild(notificationElement);

        requestAnimationFrame(function() {
            notificationElement.style.transform = 'translateX(0)';
        });

        setTimeout(function() {
            notificationElement.style.transform = 'translateX(100%)';
            setTimeout(function() {
                if (notificationElement.parentNode) {
                    notificationElement.remove();
                }
            }, 300);
        }, 3000);
    }

    // ============================================================
    // 17. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ============================================================

    switchTab(tabId) {
        const allNavItems = document.querySelectorAll('.nav-item');
        for (let index = 0; index < allNavItems.length; index++) {
            const navItem = allNavItems[index];
            navItem.classList.remove('active');
        }

        const allTabContents = document.querySelectorAll('.tab-content');
        for (let index = 0; index < allTabContents.length; index++) {
            const tabContent = allTabContents[index];
            tabContent.classList.remove('active');
        }

        const navItem = document.querySelector('.nav-item[onclick*="' + tabId + '"]');
        if (navItem) {
            navItem.classList.add('active');
        }

        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        if (tabId === 'chat' && this.chatService) {
            const self = this;
            setTimeout(function() {
                if (self.chatService.renderMessages) {
                    self.chatService.renderMessages();
                }
                if (self.chatService.scrollToBottom) {
                    self.chatService.scrollToBottom();
                }
            }, 100);
        }
    }

    // ============================================================
    // 18. ЗАПУСК
    // ============================================================

    async init() {
        await this.getUserId();

        const token = localStorage.getItem('auth_token');
        if (token) {
            localStorage.setItem('authToken', token);
        }

        // Обновляем иконку и бейдж после загрузки
        setTimeout(() => {
            this.updateNotificationIcon();
            this.updateBadge();
        }, 500);
    }
}

// ============================================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================================

let app = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        app = new PracticantDashboard();
        window.app = app;
    });
} else {
    app = new PracticantDashboard();
    window.app = app;
}

// ============================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
// ============================================================

// --- Переключение вкладок ---
window.switchTab = function(tabId) {
    if (window.app && window.app.switchTab) {
        window.app.switchTab(tabId);
    } else {
        const allNavItems = document.querySelectorAll('.nav-item');
        for (let index = 0; index < allNavItems.length; index++) {
            const navItem = allNavItems[index];
            navItem.classList.remove('active');
        }

        const allTabContents = document.querySelectorAll('.tab-content');
        for (let index = 0; index < allTabContents.length; index++) {
            const tabContent = allTabContents[index];
            tabContent.classList.remove('active');
        }

        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
};

// --- Отправка сообщения в чат ---
window.sendMessage = function() {
    if (window.app && window.app.chatService) {
        window.app.chatService.sendMessage();
    } else {
        console.warn('ChatService не инициализирован');
    }
};

// --- Выбор чата ---
window.selectChat = function(element, title) {
    const allChatItems = document.querySelectorAll('.chat-list-item');
    for (let index = 0; index < allChatItems.length; index++) {
        const chatItem = allChatItems[index];
        chatItem.classList.remove('active');
    }

    if (element) {
        element.classList.add('active');
    }
};

// ============================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ
// ============================================================

// --- Открыть модальное окно уведомлений ---
window.openNotificationsModal = function() {
    const modal = document.getElementById('modalNotifications');
    const overlay = document.getElementById('popup-overlay');

    if (modal) {
        modal.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';

    if (window.app) {
        // Обновляем счетчик
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = window.app.unreadCount || 0;
            if (window.app.unreadCount > 0) {
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        if (window.app.renderNotifications) {
            window.app.renderNotifications();
        }
    }
};

// --- Закрыть модальное окно уведомлений ---
window.closeNotificationsModal = function() {
    const modal = document.getElementById('modalNotifications');
    const overlay = document.getElementById('popup-overlay');

    if (modal) {
        modal.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
};

// --- Отметить все как прочитанные ---
window.markAllNotificationsRead = function() {
    if (window.app && window.app.markAllAsRead) {
        window.app.markAllAsRead();
    }
};

// --- Закрытие по Escape ---
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('modalNotifications');
        if (modal && modal.classList.contains('active')) {
            window.closeNotificationsModal();
        }
    }
});

// ============================================================
// ДОПОЛНИТЕЛЬНЫЙ КОД ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. Клик на оверлей для закрытия
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            window.closeNotificationsModal();
        });
    }

    // 2. Обновление иконки и бейджа после загрузки
    setTimeout(function() {
        if (window.app) {
            window.app.updateNotificationIcon();
            window.app.updateBadge();
        }
    }, 1000);
});
