// ============================================================
// СЕРВИС УВЕДОМЛЕНИЙ
// ============================================================
class NotificationService {
    constructor(api, templateService, notify, getGroups, getUserId, getUserRole) {
        this.api = api;
        this.templateService = templateService;
        this.notify = notify;
        this.getGroups = getGroups;
        this.getUserId = getUserId;
        this.getUserRole = getUserRole;
        this.notifications = [];
        this.currentGroupId = null;
    }

    // ============================================================
    // ЗАГРУЗКА УВЕДОМЛЕНИЙ ГРУППЫ
    // ============================================================

    async loadGroupNotifications(groupId) {
        try {
            const result = await this.api.request('/groups/' + groupId + '/notifications', 'GET', null, true);

            if (!result.ok) {
                throw new Error(result.error || 'Ошибка загрузки уведомлений');
            }

            let notifications = [];
            if (result.data && result.data.group_notifications) {
                notifications = result.data.group_notifications;
            }

            this.notifications = notifications;
            this.currentGroupId = groupId;
            return notifications;

        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);
            this.notify('Ошибка загрузки уведомлений', 'error');
            return [];
        }
    }

    // ============================================================
    // ОТПРАВКА УВЕДОМЛЕНИЯ В ГРУППУ
    // ============================================================

    async sendGroupNotification(groupId, subject, text) {
        try {
            if (!subject || !text) {
                this.notify('Заполните тему и текст уведомления', 'warning');
                return false;
            }

            const requestBody = {
                subject: subject,
                text: text
            };

            const result = await this.api.request(
                '/groups/' + groupId + '/notifications',
                'POST',
                requestBody,
                true
            );

            if (!result.ok) {
                if (result.status === 403) {
                    this.notify('У вас нет прав для отправки уведомлений в эту группу', 'error');
                    return false;
                }

                if (result.status === 422) {
                    let errorMessages = [];
                    if (result.data && result.data.errors) {
                        const errors = result.data.errors;
                        const errorKeys = Object.keys(errors);
                        for (let index = 0; index < errorKeys.length; index++) {
                            const key = errorKeys[index];
                            const value = errors[key];
                            if (Array.isArray(value)) {
                                errorMessages = errorMessages.concat(value);
                            } else {
                                errorMessages.push(value);
                            }
                        }
                    }
                    const messageText = errorMessages.join(', ');
                    this.notify('Ошибка: ' + messageText, 'error');
                    return false;
                }

                throw new Error(result.error || 'Ошибка отправки уведомления');
            }

            this.notify('Уведомление отправлено!', 'success');

            // Перезагружаем уведомления
            await this.loadGroupNotifications(groupId);

            return true;

        } catch (error) {
            console.error('Ошибка отправки уведомления:', error);
            this.notify('Ошибка отправки уведомления', 'error');
            return false;
        }
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ УВЕДОМЛЕНИЙ
    // ============================================================

    renderNotifications(notifications) {
        const container = document.getElementById('notificationsList');
        if (!container) {
            return;
        }

        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">Уведомлений пока нет</div>';
            return;
        }

        let htmlContent = '';
        for (let index = 0; index < notifications.length; index++) {
            const notification = notifications[index];
            const formattedDate = this.formatDate(notification.created_at);

            htmlContent = htmlContent + `
                <div class="notification-item" style="
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin-bottom: 10px;
                ">
                    <div style="font-weight: 600; color: #333; font-size: 16px;">
                        ${notification.subject}
                    </div>
                    <div style="color: #555; margin-top: 5px; font-size: 14px;">
                        ${notification.text}
                    </div>
                    <div style="color: #888; font-size: 12px; margin-top: 8px;">
                        ${formattedDate}
                    </div>
                </div>
            `;
        }

        container.innerHTML = htmlContent;
    }

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ
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
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА УВЕДОМЛЕНИЙ
    // ============================================================

    async openNotifyModal(groupId) {
        // Если группа не указана, берём текущую
        let targetGroupId = groupId;
        if (!targetGroupId) {
            targetGroupId = this.currentGroupId;
        }

        if (!targetGroupId) {
            this.notify('Выберите группу для отправки уведомления', 'warning');
            return;
        }

        // Загружаем уведомления группы
        await this.loadGroupNotifications(targetGroupId);
        this.renderNotifications(this.notifications);

        // Открываем модальное окно
        const modalElement = document.getElementById('modalNotify');
        if (modalElement) {
            modalElement.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Заполняем селектор групп (для тимлида)
        const selectElement = document.getElementById('notifyGroup');
        if (selectElement) {
            const groups = this.getGroups();
            let optionsHtml = '';

            for (let index = 0; index < groups.length; index++) {
                const group = groups[index];
                const isSelected = group.id === targetGroupId ? 'selected' : '';
                const groupName = group.name || 'Группа ' + group.id;

                optionsHtml = optionsHtml + '<option value="' + group.id + '" ' + isSelected + '>' + groupName + '</option>';
            }

            selectElement.innerHTML = optionsHtml;
        }
    }

    // ============================================================
    // ОТПРАВКА УВЕДОМЛЕНИЯ ИЗ МОДАЛЬНОГО ОКНА
    // ============================================================

    async sendNotificationFromModal() {
        const subjectInput = document.getElementById('notifySubject');
        const textInput = document.getElementById('notifyDescription');
        const groupSelect = document.getElementById('notifyGroup');

        let subject = '';
        let text = '';
        let groupId = '';

        if (subjectInput) {
            subject = subjectInput.value;
            if (subject) {
                subject = subject.trim();
            }
        }

        if (textInput) {
            text = textInput.value;
            if (text) {
                text = text.trim();
            }
        }

        if (groupSelect) {
            groupId = groupSelect.value;
        }

        if (!groupId) {
            this.notify('Выберите группу', 'warning');
            return;
        }

        if (!subject) {
            this.notify('Введите тему уведомления', 'warning');
            if (subjectInput) {
                subjectInput.focus();
            }
            return;
        }

        if (!text) {
            this.notify('Введите текст уведомления', 'warning');
            if (textInput) {
                textInput.focus();
            }
            return;
        }

        const success = await this.sendGroupNotification(groupId, subject, text);

        if (success) {
            // Очищаем поля
            if (subjectInput) {
                subjectInput.value = '';
            }
            if (textInput) {
                textInput.value = '';
            }

            // Закрываем модальное окно
            const modalElement = document.getElementById('modalNotify');
            if (modalElement) {
                modalElement.classList.remove('active');
            }
            document.body.style.overflow = 'auto';
        }
    }

    // ============================================================
    // ПРОСМОТР АРХИВА УВЕДОМЛЕНИЙ
    // ============================================================

    async viewGroupArchive(groupId) {
        await this.openNotifyModal(groupId);
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

  init() {
    // Привязываем события для модального окна
    const sendButton = document.getElementById('notifySendBtn');
    if (sendButton) {
        const self = this;
        sendButton.addEventListener('click', function() {
            self.sendNotificationFromModal();
        });
    }

    // Сохранение шаблона
    const saveTemplateButton = document.getElementById('notifySaveTemplateBtn');
    if (saveTemplateButton) {
        const self = this;
        saveTemplateButton.addEventListener('click', function() {
            if (self.templateService && typeof self.templateService.openSaveTemplateModal === 'function') {
                self.templateService.openSaveTemplateModal();
            } else {
                console.error('TemplateService.openSaveTemplateModal is not available');
                self.notify('Ошибка: сервис шаблонов не инициализирован', 'error');
            }
        });
    }


    const templateButton = document.getElementById('notifyTemplateBtn');
    if (templateButton) {
        const self = this;
        // Удаляем старые обработчики
        const newTemplateButton = templateButton.cloneNode(true);
        templateButton.parentNode.replaceChild(newTemplateButton, templateButton);
        
        newTemplateButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (self.templateService && typeof self.templateService.openTemplateDropdown === 'function') {
                self.templateService.openTemplateDropdown();
            } else {
                console.error('TemplateService.openTemplateDropdown is not available');
                self.notify('Ошибка: сервис шаблонов не инициализирован', 'error');
            }
        });
    }

    // Обработчик для кнопки сохранения в модалке шаблона
    const saveTemplateBtn = document.getElementById('notifyTemplateSaveBtn');
    if (saveTemplateBtn) {
        const self = this;
        const newSaveBtn = saveTemplateBtn.cloneNode(true);
        saveTemplateBtn.parentNode.replaceChild(newSaveBtn, saveTemplateBtn);
        
        newSaveBtn.addEventListener('click', function() {
            if (self.templateService && typeof self.templateService.saveTemplateFromModal === 'function') {
                self.templateService.saveTemplateFromModal();
            } else {
                self.notify('Ошибка: метод сохранения шаблона не найден', 'error');
            }
        });
    }
}
}