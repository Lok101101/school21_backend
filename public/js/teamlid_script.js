// ============================================================
// ГЛАВНЫЙ КЛАСС - TEAMLEAD DASHBOARD
// ============================================================

class TeamleadDashboard {
    constructor() {
        this.userId = null;
        this.userRole = 'student';
        this.init();
    }

    // ============================================================
    // 1. ПОЛУЧЕНИЕ ID ПОЛЬЗОВАТЕЛЯ
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

            if (responseData.user) {
                userId = responseData.user.id || '1';
                userRole = responseData.user.role || 'student';
            } else {
                userId = responseData.id || '1';
                userRole = responseData.role || 'student';
            }

            this.userId = userId;
            this.userRole = userRole;

            return this.userId;

        } catch (error) {
            console.warn('Не удалось получить данные пользователя:', error);
            this.userId = '1';
            this.userRole = 'student';
            return '1';
        }
    }
    // ============================================================
    // 2. УВЕДОМЛЕНИЯ
    // ============================================================

    showNotification(message, type = 'info') {
        // Создаем контейнер, если его нет
        let container = document.getElementById('notification-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 99999 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
                align-items: flex-end !important;
                pointer-events: none !important;
                max-width: 400px !important;
                width: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: transparent !important;
            `;
            document.body.appendChild(container);
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
            background: ${backgroundColor} !important;
            color: ${textColor} !important;
            padding: 14px 24px !important;
            border-radius: 10px !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
            transform: translateX(120%) !important;
            opacity: 0 !important;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
            max-width: 400px !important;
            pointer-events: auto !important;
            word-break: break-word !important;
            position: relative !important;
        `;
        notificationElement.textContent = message;
        container.appendChild(notificationElement);

        // Анимация появления
        requestAnimationFrame(() => {
            notificationElement.style.transform = 'translateX(0)';
            notificationElement.style.opacity = '1';
        });

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(120%)';
            notificationElement.style.opacity = '0';
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.remove();
                }
            }, 400);
        }, 3000);
    }

    // ============================================================
    // 3. УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
    // ============================================================

    closeAllModals() {
        const allModals = document.querySelectorAll('.modal-overlay');
        for (let index = 0; index < allModals.length; index++) {
            const modal = allModals[index];
            modal.classList.remove('active');
        }
        document.body.style.overflow = 'auto';

        // Закрываем все выпадающие списки
        const dropdowns = document.querySelectorAll('.template-dropdown');
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = 'none';
        }
    }

    closeModalOutside(event, modalId) {
        // Проверяем, что клик был по оверлею (фону)
        if (event.target.classList.contains('modal-overlay')) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';

                // Закрываем все выпадающие списки
                const dropdowns = document.querySelectorAll('.template-dropdown');
                for (let i = 0; i < dropdowns.length; i++) {
                    dropdowns[i].style.display = 'none';
                }
            }
        }
    }

    switchModal(closeId, openId) {
        const closeModal = document.getElementById(closeId);
        const openModal = document.getElementById(openId);

        if (closeModal) {
            closeModal.classList.remove('active');
        }

        if (openModal) {
            openModal.classList.add('active');
        }

        document.body.style.overflow = 'hidden';
    }

    // ============================================================
    // 4. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ============================================================

    switchTab(tabId) {
        const allNavItems = document.querySelectorAll('.nav-item');
        for (let index = 0; index < allNavItems.length; index++) {
            const navItem = allNavItems[index];
            navItem.classList.remove('active');
        }

        // Ищем элемент с onclick, содержащий tabId
        let foundNavItem = null;
        for (let index = 0; index < allNavItems.length; index++) {
            const navItem = allNavItems[index];
            const onclickAttribute = navItem.getAttribute('onclick');
            if (onclickAttribute && onclickAttribute.includes(tabId)) {
                foundNavItem = navItem;
                break;
            }
        }

        if (foundNavItem) {
            foundNavItem.classList.add('active');
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

        this.closeAllModals();

        if (tabId === 'chat') {
            const self = this;
            setTimeout(function() {
                if (!self.chatService.chats || self.chatService.chats.length === 0) {
                    self.chatService.init();
                }

                if (!self.chatService.chats || self.chatService.chats.length === 0) {
                    const chatList = document.getElementById('chatList');
                    if (chatList) {
                        chatList.innerHTML = '<div class="chat-list-item" style="color:#888;">Нет доступных групп</div>';
                    }
                } else {
                    if (!self.chatService.selectedId) {
                        const firstChat = self.chatService.chats[0];
                        self.chatService.selectChat(firstChat.id, firstChat.type);
                    }
                }
            }, 100);
        }
    }

    // ============================================================
    // 5. МЕТОДЫ ДЛЯ УВЕДОМЛЕНИЙ
    // ============================================================

    openNotifyModal() {
        let groups = [];
        if (this.groupService) {
            groups = this.groupService.groups || [];
        }

        if (groups.length === 0) {
            this.showNotification('Нет доступных групп', 'warning');
            return;
        }

        if (this.notificationService) {
            this.notificationService.openNotifyModal(groups[0].id);
        }
    }

    openNotifyForGroup(groupId) {
        if (!groupId) {
            this.showNotification('Группа не найдена', 'error');
            return;
        }

        if (this.notificationService) {
            this.notificationService.openNotifyModal(groupId);
        }
    }

    // ============================================================
    // 6. ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    async init() {
    // Получаем userId
    await this.getUserId();

    // Создаём сервисы
    this.apiService = new ApiService();

    const self = this;

    this.templateService = new TemplateService(function(message, type) {
        self.showNotification(message, type);
    });

    this.requestService = new RequestService(
        this.apiService,
        this.templateService,
        function(message, type) {
            self.showNotification(message, type);
        }
    );

    this.groupService = new GroupService(
        this.apiService,
        function(message, type) {
            self.showNotification(message, type);
        }
    );

    this.chatService = new ChatService(
        function(message, type) {
            self.showNotification(message, type);
        },
        function() {
            return self.groupService.groups;
        },
        function() {
            return self.userId;
        },
        function() {
            return self.userRole;
        }
    );

    this.notificationService = new NotificationService(
        this.apiService,
        this.templateService,
        function(message, type) {
            self.showNotification(message, type);
        },
        function() {
            return self.groupService.groups;
        },
        function() {
            return self.userId;
        },
        function() {
            return self.userRole;
        }
    );


    const saveTemplateBtn = document.getElementById('notifyTemplateSaveBtn');
    if (saveTemplateBtn) {
        // Удаляем старые обработчики
        const newSaveBtn = saveTemplateBtn.cloneNode(true);
        saveTemplateBtn.parentNode.replaceChild(newSaveBtn, saveTemplateBtn);

        newSaveBtn.addEventListener('click', function() {
            if (self.templateService && typeof self.templateService.saveTemplateFromModal === 'function') {
                self.templateService.saveTemplateFromModal();
            } else {
                self.showNotification('Ошибка: метод сохранения шаблона не найден', 'error');
            }
        });
    }

    // Настройка колбэков
    this.chatService.onNewMessage = function(data) {
        self.showNotification('Новое сообщение: ' + data.text, 'info');
    };

    // Экспортируем ссылки
    this.requestService.closeAllModals = function() {
        self.closeAllModals();
    };

    this.requestService.switchModal = function(closeId, openId) {
        self.switchModal(closeId, openId);
    };

    // Рендерим шаблоны отказа
    this.templateService.renderRejectionTemplateDropdown();

    // Настройка фильтров
    const filterButtons = document.querySelectorAll('.filter-tabs .filter-btn');
    for (let index = 0; index < filterButtons.length; index++) {
        const button = filterButtons[index];
        if (index === 0) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    // Загружаем заявки
    const loadSuccess = await this.requestService.loadRequests();

    if (!loadSuccess) {
        const tableBody = document.getElementById('applicationsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;padding:30px;">❌ Ошибка загрузки</td></tr>';
        }
        return;
    }

    this.requestService.currentFilter = 'pending';
    this.requestService.renderApplications();

    // Загружаем группы
    const groups = await this.groupService.loadGroups();
    this.groupService.renderGroups(groups);

    // Инициализируем уведомления
    this.notificationService.init();

    // Инициализируем чат
    await this.chatService.init();
}
}

// ============================================================
// ЗАПУСК
// ============================================================

let app = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        app = new TeamleadDashboard();
        window.app = app;
    });
} else {
    app = new TeamleadDashboard();
    window.app = app;
}

// ============================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ-ОБЁРТКИ
// ============================================================

if (typeof window.app === 'undefined') {
    window.app = {};
}

// --- REQUEST SERVICE ---
window.handleSendRejection = function() {
    if (window.app && window.app.requestService && window.app.requestService.handleSendRejection) {
        window.app.requestService.handleSendRejection();
    }
};

window.handleAcceptRequest = function() {
    if (window.app && window.app.requestService && window.app.requestService.handleAcceptRequest) {
        window.app.requestService.handleAcceptRequest();
    }
};

window.handleSaveRejectionTemplate = function() {
    if (window.app && window.app.requestService && window.app.requestService.handleSaveRejectionTemplate) {
        window.app.requestService.handleSaveRejectionTemplate();
    }
};

window.openRejectModal = function() {
    if (window.app && window.app.requestService && window.app.requestService.openRejectModal) {
        window.app.requestService.openRejectModal();
    }
};

window.closeAllModals = function() {
    // Исправлено: сначала пробуем через app, потом через requestService
    if (window.app && typeof window.app.closeAllModals === 'function') {
        window.app.closeAllModals();
    } else if (window.app && window.app.requestService && window.app.requestService.closeAllModals) {
        window.app.requestService.closeAllModals();
    } else {
        // Fallback
        const allModals = document.querySelectorAll('.modal-overlay');
        for (let i = 0; i < allModals.length; i++) {
            allModals[i].classList.remove('active');
        }
        document.body.style.overflow = 'auto';
    }
};

window.closeModalOutside = function(event, modalId) {
    // Проверяем, что клик был по оверлею
    if (!event.target.classList.contains('modal-overlay')) {
        return;
    }

    // Исправлено: сначала пробуем через app
    if (window.app && typeof window.app.closeModalOutside === 'function') {
        window.app.closeModalOutside(event, modalId);
    } else {
        // Fallback
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
};

window.openSaveTemplateModal = function() {
    if (window.app && window.app.requestService && window.app.requestService.openSaveTemplateModal) {
        window.app.requestService.openSaveTemplateModal();
    }
};

window.switchModal = function(fromId, toId) {
    // Исправлено: сначала пробуем через app
    if (window.app && typeof window.app.switchModal === 'function') {
        window.app.switchModal(fromId, toId);
    } else if (window.app && window.app.requestService && window.app.requestService.switchModal) {
        window.app.requestService.switchModal(fromId, toId);
    } else {
        // Fallback
        const closeModal = document.getElementById(fromId);
        const openModal = document.getElementById(toId);
        if (closeModal) closeModal.classList.remove('active');
        if (openModal) openModal.classList.add('active');
    }
};

window.switchAppFilter = function(status, buttonElement) {
    if (window.app && window.app.requestService && window.app.requestService.switchAppFilter) {
        window.app.requestService.switchAppFilter(status, buttonElement);
    }
};

// --- GROUP SERVICE ---
window.switchGroupView = function(viewType, buttonElement) {
    if (window.app && window.app.groupService && window.app.groupService.switchGroupView) {
        window.app.groupService.switchGroupView(viewType, buttonElement);
    }
};

window.toggleAccordion = function(headerElement) {
    if (window.app && window.app.groupService && window.app.groupService.toggleAccordion) {
        window.app.groupService.toggleAccordion(headerElement);
    }
};

// --- CHAT SERVICE ---
window.switchChatView = function(view, buttonElement) {
    if (window.app && window.app.chatService && window.app.chatService.switchChatView) {
        window.app.chatService.switchChatView(view, buttonElement);
    }
};

// --- NOTIFICATION SERVICE ---
window.openNotifyModal = function() {
    if (window.app && window.app.openNotifyModal) {
        window.app.openNotifyModal();
    }
};

window.openNotifyForGroup = function(groupId) {
    if (window.app && window.app.openNotifyForGroup) {
        window.app.openNotifyForGroup(groupId);
    }
};

// --- ОБЩИЕ ---
window.switchTab = function(tabId) {
    if (window.app && window.app.switchTab) {
        window.app.switchTab(tabId);
    }
};

// ============================================================
// ПОПАП ПРОФИЛЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const profileIcon = document.getElementById('profile-icon');
    const profilePopup = document.querySelector('.profile');
    const logoutButton = document.querySelector('.logout-button');
    const profileEmailElement = document.querySelector('.profile-email');

    if (!profileIcon || !profilePopup) {
        return;
    }

    const userEmail = sessionStorage.getItem('userEmail') ||
        sessionStorage.getItem('registrationEmail') ||
        localStorage.getItem('userEmail') ||
        'user@example.com';

    if (profileEmailElement) {
        profileEmailElement.textContent = userEmail;
    }

    // Открытие/закрытие попапа
    profileIcon.addEventListener('click', function(event) {
        event.stopPropagation();
        if (profilePopup.classList.contains('show')) {
            profilePopup.classList.remove('show');
        } else {
            profilePopup.classList.add('show');
        }
    });

    // Закрытие при клике вне попапа
    document.addEventListener('click', function(event) {
        const isInsidePopup = profilePopup.contains(event.target);
        const isProfileIcon = event.target === profileIcon;
        const isInsideProfileIcon = profileIcon.contains(event.target);

        if (!isInsidePopup && !isProfileIcon && !isInsideProfileIcon) {
            profilePopup.classList.remove('show');
        }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && profilePopup.classList.contains('show')) {
            profilePopup.classList.remove('show');
        }
    });

    // Выход
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            const isConfirmed = confirm('Вы уверены, что хотите выйти?');
            if (!isConfirmed) {
                return;
            }

            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

                if (token) {
                    await fetch(API_BASE + '/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/json'
                        }
                    });
                }

                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';

            } catch (error) {
                console.error('Ошибка выхода:', error);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
            }
        });
    }
});
