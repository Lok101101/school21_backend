// ============================================================
// СЕРВИС ЧАТА
// ============================================================

class ChatService {
    /**
     * Конструктор сервиса чата
     * @param {Function} notify - Функция для показа уведомлений
     * @param {Function} getGroups - Функция получения списка групп
     * @param {Function} getUserId - Функция получения ID текущего пользователя
     * @param {Function} getUserRole - Функция получения роли текущего пользователя
     */
    constructor(notify, getGroups, getUserId, getUserRole) {
        // Внешние зависимости
        this.notify = notify;
        this.getGroups = getGroups;
        this.getUserIdCallback = getUserId;
        this.getUserRoleCallback = getUserRole;

        // Данные текущего пользователя
        this.userId = null;
        this.userRole = 'student';

        // Состояние чата
        this.messages = [];
        this.currentType = 'groups'; // 'groups' | 'members'
        this.selectedId = null;
        this.currentRoom = null;
        this.myGroupId = null;
        this.teamleadId = null;

        // Списки
        this.chats = [];
        this.members = [];

        // WebSocket
        this.echo = null;
        this.channel = null;

        // Управление отправкой
        this.MESSAGE_DELAY = 10000; // Минимальный интервал между сообщениями (мс)
        this.lastMessageTime = 0;
        this.isSending = false;

        // Файлы
        this.selectedFile = null;

        // Колбэк для новых сообщений
        this.onNewMessage = null;
    }

    // ============================================================
    // ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
    // ============================================================

    /**
     * Получить ID текущего пользователя
     * @returns {string|null} ID пользователя или null
     */
    getUserId() {
        if (this.getUserIdCallback) {
            return this.getUserIdCallback();
        }
        return null;
    }

    /**
     * Получить роль текущего пользователя
     * @returns {string} Роль пользователя ('student' | 'teamlead')
     */
    getUserRole() {
        if (this.getUserRoleCallback) {
            return this.getUserRoleCallback();
        }
        return 'student';
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    /**
     * Инициализация сервиса чата
     */
    async init() {
        // Получаем данные пользователя
        this.userId = this.getUserId();
        this.userRole = this.getUserRole();

        // Повторная попытка получения ID, если он не определён
        if (!this.userId || this.userId === 'null' || this.userId === null) {
            this.userId = this.getUserId();
        }

        // Загружаем список чатов
        await this.loadChats();

        // Если чаты загружены, выбираем первый
        if (this.chats && this.chats.length > 0) {
            const firstChat = this.chats[0];
            this.selectChat(firstChat.id, firstChat.type);
        }

        // Инициализируем DOM-элементы чата
        this.initChatElements();
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ DOM-ЭЛЕМЕНТОВ
    // ============================================================

    /**
     * Настройка обработчиков событий для элементов интерфейса чата
     */
    initChatElements() {
        const sendButton = document.getElementById('chatSendBtn');
        const inputField = document.getElementById('chatInput');
        const attachButton = document.getElementById('attach-btn');
        const fileInputElement = document.getElementById('file-input');
        const filePreviewContainer = document.getElementById('file-preview-container');
        const filePreviewName = document.getElementById('file-preview-name');
        const clearFileButton = document.getElementById('clear-file-btn');
        const sidebarTabButtons = document.querySelectorAll('.sidebar-tab-btn');

        // Отправка по клику на кнопку
        if (sendButton) {
            sendButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.sendMessage();
            });
        }

        // Отправка по клавише Enter
        if (inputField) {
            inputField.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Прикрепление файла через кнопку
        if (attachButton && fileInputElement) {
            attachButton.addEventListener('click', function() {
                fileInputElement.click();
            });
        }

        // Обработка выбора файла
        if (fileInputElement) {
            fileInputElement.addEventListener('change', function(event) {
                if (fileInputElement.files.length > 0) {
                    const file = fileInputElement.files[0];
                    this.selectedFile = file;

                    // Показываем превью
                    if (filePreviewName) {
                        filePreviewName.textContent = file.name;
                    }
                    if (filePreviewContainer) {
                        filePreviewContainer.style.display = 'block';
                    }

                    // Если файл - изображение, показываем миниатюру
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const previewItem = filePreviewContainer.querySelector('.file-preview-item');
                            if (previewItem) {
                                const oldImg = previewItem.querySelector('img');
                                if (oldImg) {
                                    oldImg.remove();
                                }
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.style.cssText = 'max-width: 40px; max-height: 40px; border-radius: 4px; margin-right: 10px; object-fit: cover;';
                                previewItem.insertBefore(img, filePreviewName);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }.bind(this));
        }

        // Очистка выбранного файла
        if (clearFileButton) {
            clearFileButton.addEventListener('click', function() {
                this.clearSelectedFile();
            }.bind(this));
        }

        // Переключение вкладок чата (Группы / Участники)
        if (sidebarTabButtons) {
            sidebarTabButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                    const view = button.dataset.view;
                    const allButtons = document.querySelectorAll('.sidebar-tab-btn');
                    allButtons.forEach(function(btn) {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                    this.renderChatList(view);
                }.bind(this));
            }.bind(this));
        }
    }

    /**
     * Очистка выбранного файла
     */
    clearSelectedFile() {
        this.selectedFile = null;
        const fileInputElement = document.getElementById('file-input');
        const filePreviewContainer = document.getElementById('file-preview-container');
        const filePreviewName = document.getElementById('file-preview-name');
        const inputField = document.getElementById('chatInput');

        if (fileInputElement) {
            fileInputElement.value = '';
        }
        if (filePreviewContainer) {
            filePreviewContainer.style.display = 'none';
            const previewItem = filePreviewContainer.querySelector('.file-preview-item');
            if (previewItem) {
                const img = previewItem.querySelector('img');
                if (img) {
                    img.remove();
                }
            }
        }
        if (filePreviewName) {
            filePreviewName.textContent = '';
        }
        if (inputField) {
            inputField.setAttribute('required', 'true');
        }
    }

    // ============================================================
    // АУТЕНТИФИКАЦИЯ
    // ============================================================

    /**
     * Получение токена авторизации из хранилища
     * @returns {string|null} Токен авторизации или null
     */
    getAuthToken() {
        const tokenFromLocalStorage = localStorage.getItem('auth_token');
        if (tokenFromLocalStorage) {
            return tokenFromLocalStorage;
        }

        const tokenFromSessionStorage = sessionStorage.getItem('auth_token');
        if (tokenFromSessionStorage) {
            return tokenFromSessionStorage;
        }

        const tokenFromLocalStorageAlt = localStorage.getItem('authToken');
        if (tokenFromLocalStorageAlt) {
            return tokenFromLocalStorageAlt;
        }

        const tokenFromSessionStorageAlt = sessionStorage.getItem('authToken');
        if (tokenFromSessionStorageAlt) {
            return tokenFromSessionStorageAlt;
        }

        const tokenFromLocalStorageShort = localStorage.getItem('token');
        if (tokenFromLocalStorageShort) {
            return tokenFromLocalStorageShort;
        }

        const tokenFromSessionStorageShort = sessionStorage.getItem('token');
        if (tokenFromSessionStorageShort) {
            return tokenFromSessionStorageShort;
        }

        return null;
    }

    // ============================================================
    // ЗАГРУЗКА СПИСКА ЧАТОВ
    // ============================================================

    /**
     * Загрузка списка доступных чатов (групп)
     * @returns {Promise<Array>} Массив объектов чатов
     */
    async loadChats() {
        try {
            const authenticationToken = this.getAuthToken();

            if (!authenticationToken) {
                this.notify('Требуется авторизация', 'error');
                this.chats = [];
                this.renderChatList(this.currentType);
                return [];
            }

            const userRole = this.getUserRole();
            let groups = [];

            if (userRole === 'student') {
                groups = await this.loadStudentGroups(authenticationToken);
            } else {
                groups = await this.loadAllGroups(authenticationToken);
            }

            if (groups.length > 0) {
                this.chats = groups.map(function(group) {
                    return {
                        id: group.id,
                        name: group.name || 'Группа ' + group.id,
                        type: 'group',
                        unread: 0,
                        is_active: group.is_active !== undefined ? group.is_active : true
                    };
                });
            } else {
                this.chats = [
                    {
                        id: 1,
                        name: 'Моя группа',
                        type: 'group',
                        unread: 0,
                        is_active: true
                    }
                ];
            }

            this.renderChatList(this.currentType);
            return this.chats;

        } catch (error) {
            console.error('Ошибка загрузки чатов:', error);
            this.chats = [
                {
                    id: 1,
                    name: 'Моя группа',
                    type: 'group',
                    unread: 0,
                    is_active: true
                }
            ];
            this.renderChatList(this.currentType);
            return this.chats;
        }
    }

    /**
     * Загрузка групп студента
     * @param {string} authenticationToken - Токен авторизации
     * @returns {Promise<Array>} Массив групп
     */
    async loadStudentGroups(authenticationToken) {
        const apiUrl = API_BASE + '/groups/my';
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + authenticationToken
            }
        };

        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            return [];
        }

        const responseData = await response.json();
        let myGroups = [];

        if (responseData.user_groups && Array.isArray(responseData.user_groups)) {
            myGroups = responseData.user_groups;
        } else if (responseData.groups && Array.isArray(responseData.groups)) {
            myGroups = responseData.groups;
        } else if (Array.isArray(responseData)) {
            myGroups = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
            myGroups = responseData.data;
        } else if (responseData.group) {
            myGroups = [responseData.group];
        }

        return myGroups;
    }

    /**
     * Загрузка всех групп (для тимлида)
     * @param {string} authenticationToken - Токен авторизации
     * @returns {Promise<Array>} Массив групп
     */
    async loadAllGroups(authenticationToken) {
        const apiUrl = API_BASE + '/groups';
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + authenticationToken
            }
        };

        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            return [];
        }

        const responseData = await response.json();
        let groups = [];

        if (responseData.groups) {
            groups = responseData.groups;
        } else if (Array.isArray(responseData)) {
            groups = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
            groups = responseData.data;
        }

        return groups;
    }

    // ============================================================
    // WEBSOCKET ПОДПИСКА
    // ============================================================

    /**
     * Подписка на канал группы для получения сообщений в реальном времени
     * @param {number|string} groupId - ID группы
     */
    subscribeToChannel(groupId) {
        if (this.channel) {
            if (this.echo) {
                this.echo.leave(this.channel);
            }
            this.channel = null;
        }

        if (!this.echo) {
            const authenticationToken = this.getAuthToken();
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: window.REVERB_KEY,
                auth: {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + authenticationToken
                    }
                },
                authEndpoint: API_BASE.replace('/api', '') + '/broadcasting/auth',
                wsHost: API_BASE.replace('https://', '').replace('/api', ''),
                wsPort: window.REVERB_PORT || 443,
                wssPort: window.REVERB_PORT || 443,
                forceTLS: true,
                enabledTransports: ['ws', 'wss']
            });
        }

        const channelName = 'Group.' + groupId;
        this.channel = channelName;

        this.echo.private(channelName).listen('MessageSentEvent', function(eventData) {
            const roomName = 'group_' + groupId;
            const messageData = eventData.message || eventData;
            const senderInfo = eventData.senderInfo || eventData.sender || messageData.senderInfo;

            const isOwn = senderInfo && Number(senderInfo.id) === Number(this.userId);

            // Проверяем, есть ли уже такое сообщение
            let messageExists = false;
            let messageIndex = -1;

            for (let index = 0; index < this.messages.length; index++) {
                const currentMessage = this.messages[index];

                // Проверка по ID
                if (currentMessage.id === messageData.id) {
                    messageExists = true;
                    messageIndex = index;
                    break;
                }

                // Проверка по содержимому для временных сообщений
                if (currentMessage.isTemp) {
                    if (currentMessage.text === messageData.text) {
                        const tempTime = new Date(currentMessage.time).getTime();
                        const msgTime = new Date(messageData.created_at || new Date()).getTime();
                        const timeDiff = Math.abs(tempTime - msgTime);

                        if (timeDiff < 5000) {
                            messageExists = true;
                            messageIndex = index;
                            break;
                        }
                    }

                    if (currentMessage.file_name && messageData.file_name &&
                        currentMessage.file_name === messageData.file_name) {
                        const tempTime = new Date(currentMessage.time).getTime();
                        const msgTime = new Date(messageData.created_at || new Date()).getTime();
                        const timeDiff = Math.abs(tempTime - msgTime);

                        if (timeDiff < 5000) {
                            messageExists = true;
                            messageIndex = index;
                            break;
                        }
                    }
                }
            }

            // Если сообщение уже есть - обновляем его
            if (messageExists && messageIndex !== -1) {
                if (this.messages[messageIndex].isTemp) {
                    this.messages[messageIndex] = {
                        ...this.messages[messageIndex],
                        isTemp: false,
                        id: messageData.id || this.messages[messageIndex].id,
                        time: messageData.created_at || this.messages[messageIndex].time,
                        created_at: messageData.created_at || this.messages[messageIndex].created_at
                    };
                }
                this.renderMessages();
                this.scrollToBottom();
                return;
            }

            // Если сообщение от себя - пропускаем
            if (isOwn) {
                let ownMessageExists = false;
                for (let index = 0; index < this.messages.length; index++) {
                    const msg = this.messages[index];
                    if (msg.isOwn && msg.isTemp && msg.text === messageData.text) {
                        ownMessageExists = true;
                        this.messages[index] = {
                            ...this.messages[index],
                            isTemp: false,
                            id: messageData.id || msg.id,
                            time: messageData.created_at || msg.time
                        };
                        break;
                    }
                }

                if (ownMessageExists) {
                    this.renderMessages();
                    this.scrollToBottom();
                    return;
                }

                return;
            }

            // Добавляем новое сообщение (только для получателя)
            const formattedMessage = this.formatMessage(messageData, senderInfo, isOwn);
            this.messages.push(formattedMessage);
            this.sortMessages();
            this.renderMessages();
            this.scrollToBottom();

            if (this.onNewMessage && !formattedMessage.isOwn) {
                const notificationData = {
                    room: roomName,
                    text: formattedMessage.text,
                    sender: formattedMessage.sender,
                    timestamp: formattedMessage.time,
                    senderName: formattedMessage.senderName
                };
                this.onNewMessage(notificationData);
            }
        }.bind(this));
    }

    // ============================================================
    // ФОРМАТИРОВАНИЕ СООБЩЕНИЙ
    // ============================================================

    /**
     * Форматирование сообщения для отображения
     */
    formatMessage(messageData, senderInfo, isOwn) {
        let isTeamlead = false;
        if (senderInfo?.role === 'teamlead' ||
            senderInfo?.role === 'operator' ||
            senderInfo?.name === 'Тимлид' ||
            senderInfo?.surname === 'Тимлид') {
            isTeamlead = true;
        }

        let senderName = 'Участник';

        if (isOwn) {
            senderName = 'Вы';
        } else if (senderInfo) {
            if (senderInfo.full_name && senderInfo.full_name !== 'Тимлид Тимлид Тимлид') {
                senderName = senderInfo.full_name;
            } else {
                const nameParts = [];
                if (senderInfo.surname && senderInfo.surname !== 'Тимлид') {
                    nameParts.push(senderInfo.surname);
                }
                if (senderInfo.name && senderInfo.name !== 'Тимлид') {
                    nameParts.push(senderInfo.name);
                }
                if (senderInfo.patronymic && senderInfo.patronymic !== 'Тимлид') {
                    nameParts.push(senderInfo.patronymic);
                }

                if (nameParts.length > 0) {
                    senderName = nameParts.join(' ');
                } else if (senderInfo.name) {
                    senderName = senderInfo.name;
                }
            }

            if (senderName === 'Тимлид Тимлид Тимлид' || senderName.includes('Тимлид')) {
                senderName = 'Тимлид';
            }
        }

        const hasFile = messageData.file_name || messageData.file_id;

        // Формируем URL для скачивания файла
        let fileDownloadUrl = null;
        if (messageData.id) {
            fileDownloadUrl = API_BASE + '/groups/messages/' + messageData.id + '/download';
        }

        const formattedMessage = {
            id: messageData.id || Date.now(),
            sender: senderInfo?.role || 'student',
            text: messageData.text || messageData.message || '',
            time: messageData.created_at || messageData.timestamp || new Date().toISOString(),
            isOwn: isOwn,
            isSystem: false,
            senderName: senderName,
            senderId: senderInfo?.id || null,
            isTeamlead: isTeamlead,
            isTemp: false,
            type: messageData.type || (hasFile ? 'file' : 'text'),
            file_name: messageData.file_name || null,
            file_type: messageData.file_type || null,
            file_size: messageData.file_size || null,
            file_download_url: fileDownloadUrl || messageData.file_download_url || null,
            file_id: messageData.file_id || null,
            localFileUrl: null // Для локального превью только у отправителя
        };

        return formattedMessage;
    }

    // ============================================================
    // ВЫБОР ЧАТА
    // ============================================================

    /**
     * Выбор чата для отображения
     * @param {number|string} chatId - ID чата
     * @param {string} chatType - Тип чата ('group' | 'member')
     */
    selectChat(chatId, chatType) {
        this.selectedId = chatId;
        this.currentType = chatType;

        const allChatItems = document.querySelectorAll('#chatList .chat-list-item');
        allChatItems.forEach(function(element) {
            element.classList.remove('active');
        });

        const activeItemSelector = '#chatList .chat-list-item[data-id="' + chatId + '"][data-type="' + chatType + '"]';
        const activeItem = document.querySelector(activeItemSelector);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        if (chatType === 'group') {
            this.currentRoom = 'group_' + chatId;
            this.messages = [];
            this.loadChatHistory(chatId);
            this.subscribeToChannel(chatId);
        } else {
            this.currentRoom = 'private_' + this.userId + '_' + chatId;
            this.messages = [];
            this.renderMessages();
        }
    }

    // ============================================================
    // ЗАГРУЗКА ИСТОРИИ СООБЩЕНИЙ
    // ============================================================

    /**
     * Загрузка истории сообщений группы
     * @param {number|string} groupId - ID группы
     * @returns {Promise<void>}
     */
    async loadChatHistory(groupId) {
        try {
            const authenticationToken = this.getAuthToken();
            const apiUrl = API_BASE + '/groups/' + groupId + '/messages';
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + authenticationToken
                }
            };

            const response = await fetch(apiUrl, requestOptions);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const responseData = await response.json();
            const messages = responseData.group_messages || responseData.messages || responseData.data || [];

            this.messages = messages.map(function(message) {
                const senderInfo = message.senderInfo || message.sender || message.user || message.author || {};
                const isOwn = senderInfo && Number(senderInfo.id) === Number(this.userId);
                return this.formatMessage(message, senderInfo, isOwn);
            }.bind(this));

            this.sortMessages();
            this.renderMessages();
            this.scrollToBottom();

        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            this.notify('Ошибка загрузки сообщений', 'error');
            this.messages = [];
            this.renderMessages();
        }
    }

    // ============================================================
    // ОТПРАВКА СООБЩЕНИЯ
    // ============================================================

    /**
     * Отправка сообщения (текст + файл)
     */
    sendMessage() {
        const inputField = document.getElementById('chatInput');
        if (!inputField) {
            this.notify('Поле ввода не найдено', 'error');
            return;
        }

        const messageText = inputField.value.trim();
        const attachedFile = this.selectedFile;

        if (!messageText && !attachedFile) {
            this.notify('Введите текст или прикрепите файл', 'warning');
            return;
        }

        if (!this.selectedId) {
            this.notify('Сначала выберите чат', 'warning');
            return;
        }

        if (this.currentType !== 'group') {
            this.notify('Личный чат пока не поддерживается', 'warning');
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - this.lastMessageTime;

        if (this.isSending) {
            this.notify('Подождите, сообщение уже отправляется...', 'warning');
            return;
        }

        if (timeSinceLastMessage < this.MESSAGE_DELAY) {
            const remainingSeconds = Math.ceil((this.MESSAGE_DELAY - timeSinceLastMessage) / 1000);
            this.notify('Подождите ' + remainingSeconds + ' секунд перед следующим сообщением', 'warning');
            return;
        }

        const textToSend = messageText;
        const fileToSend = attachedFile;

        inputField.value = '';
        this.clearSelectedFile();

        this.isSending = true;
        this.lastMessageTime = currentTime;

        const sendButton = document.getElementById('chatSendBtn');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = '⏳ 10с';
        }
        inputField.disabled = true;

        const tempId = Date.now();
        let localFileUrl = null;
        if (fileToSend) {
            localFileUrl = URL.createObjectURL(fileToSend);
        }

        // Удаляем старые временные сообщения
        this.messages = this.messages.filter(m => !m.isTemp);

        // Создаем ВРЕМЕННОЕ сообщение
        const temporaryMessage = {
            id: tempId,
            sender: 'student',
            text: textToSend || (fileToSend ? '📎 Файл' : ''),
            time: new Date().toISOString(),
            isOwn: true,
            isSystem: false,
            senderName: 'Вы',
            senderId: this.userId,
            isTeamlead: false,
            isTemp: true,
            type: fileToSend ? 'file' : 'text',
            file_name: fileToSend ? fileToSend.name : null,
            file_type: fileToSend ? fileToSend.type : null,
            file_size: fileToSend ? fileToSend.size : null,
            localFileUrl: localFileUrl,
            file_download_url: null,
            file_id: null
        };

        this.messages.push(temporaryMessage);
        this.sortMessages();
        this.renderMessages();
        this.scrollToBottom();

        this.sendMessageToServer(textToSend, fileToSend, this.selectedId, sendButton, inputField);
    }

    /**
     * Скачивание файла
     */
    async downloadFile(downloadUrl, fileName) {
        if (!downloadUrl) {
            this.notify('Ссылка для скачивания недоступна', 'error');
            return;
        }

        try {
            const authenticationToken = this.getAuthToken();
            if (!authenticationToken) {
                this.notify('Требуется авторизация', 'error');
                return;
            }

            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authenticationToken
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка скачивания');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.notify('Файл скачан!', 'success');

        } catch (error) {
            console.error('Ошибка скачивания:', error);
            this.notify('Ошибка скачивания файла', 'error');
        }
    }


    /**
     * Отправка сообщения на сервер
     */
    async sendMessageToServer(messageText, attachedFile, groupId, sendButton, inputField) {
        let localFileUrl = null;

        try {
            if (attachedFile) {
                localFileUrl = URL.createObjectURL(attachedFile);
            }

            const authenticationToken = this.getAuthToken();
            if (!authenticationToken) {
                throw new Error('Токен не найден');
            }

            // Удаляем старые временные сообщения
            this.messages = this.messages.filter(m => !m.isTemp);

            const formData = new FormData();
            if (messageText) {
                formData.append('text', messageText);
            }
            if (attachedFile) {
                formData.append('file', attachedFile);
            }

            const apiUrl = API_BASE + '/groups/' + groupId + '/messages';
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + authenticationToken
                },
                body: formData
            };

            const response = await fetch(apiUrl, requestOptions);
            let responseData = {};
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = {};
            }

            if (!response.ok) {
                throw new Error('Ошибка отправки');
            }

            const sentMessage = responseData.message || responseData;

            // Создаем финальное сообщение с локальным URL для отправителя
            const finalMessage = {
                id: sentMessage.id || Date.now(),
                sender: 'student',
                text: messageText || (attachedFile ? '📎 Файл' : ''),
                time: sentMessage.created_at || new Date().toISOString(),
                isOwn: true,
                isSystem: false,
                senderName: 'Вы',
                senderId: this.userId,
                isTeamlead: false,
                isTemp: false,
                type: attachedFile ? 'file' : 'text',
                file_name: attachedFile ? attachedFile.name : null,
                file_type: attachedFile ? attachedFile.type : null,
                file_size: attachedFile ? attachedFile.size : null,
                localFileUrl: localFileUrl, // Сохраняем локальный URL для отправителя
                file_download_url: sentMessage.id ? API_BASE + '/groups/messages/' + sentMessage.id + '/download' : null,
                file_id: sentMessage.file_id || null,
                created_at: sentMessage.created_at || new Date().toISOString()
            };

            this.messages.push(finalMessage);
            this.renderMessages();
            this.scrollToBottom();

            if (attachedFile) {
                this.notify('📎 Файл отправлен!', 'success');
            } else {
                this.notify('Сообщение отправлено!', 'success');
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            this.notify('Ошибка: ' + error.message, 'error');

            // Удаляем все временные сообщения при ошибке
            this.messages = this.messages.filter(function(message) {
                return !message.isTemp;
            });
            this.renderMessages();
        } finally {
            this.isSending = false;

            if (sendButton) {
                sendButton.disabled = false;
                sendButton.textContent = '▶';
            }
            if (inputField) {
                inputField.disabled = false;
            }
        }
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ СООБЩЕНИЙ
    // ============================================================

    /**
     * Рендеринг сообщений в контейнере чата
     */
    renderMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) {
            return;
        }

        if (this.messages.length === 0) {
            let emptyMessage = 'Выберите чат';
            if (this.currentRoom) {
                emptyMessage = 'Нет сообщений. Начните общение!';
            }
            container.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">' + emptyMessage + '</div>';
            return;
        }

        const sortedMessages = [...this.messages].sort(function(a, b) {
            const timeA = new Date(a.time || 0);
            const timeB = new Date(b.time || 0);
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;
            return 0;
        });

        let htmlContent = '';
        for (let index = 0; index < sortedMessages.length; index++) {
            const message = sortedMessages[index];

            if (message.isSystem) {
                htmlContent += '<div style="text-align:center; color:#888; padding:8px; font-size:13px;">' + message.text + '</div>';
                continue;
            }

            const isOwn = message.isOwn || message.sender === this.userId;
            let isTeamlead = message.isTeamlead || message.sender === 'teamlead';

            let senderName = message.senderName || 'Участник';
            if (isOwn) {
                senderName = 'Вы';
            }

            let bubbleClass = 'message-bubble';
            let authorClass = '';

            if (isOwn) {
                bubbleClass = bubbleClass + ' own';
                authorClass = 'teal';
            } else if (isTeamlead) {
                bubbleClass = bubbleClass + ' teamlead';
                authorClass = 'purple';
            } else {
                bubbleClass = bubbleClass + ' student';
                authorClass = 'green';
            }

            let fileHtml = '';
            if (message.file_name) {
                const fileExtension = message.file_name.split('.').pop().toLowerCase();
                const isImage = message.file_type && message.file_type.startsWith('image/') ||
                    fileExtension === 'jpg' ||
                    fileExtension === 'jpeg' ||
                    fileExtension === 'png' ||
                    fileExtension === 'webp' ||
                    fileExtension === 'gif';

                if (isImage) {
                    fileHtml = this.renderImageFile(message);
                } else {
                    fileHtml = this.renderDocumentFile(message);
                }
            }

            const escapedText = this.escapeHtml(message.text);
            const formattedTime = this.formatTime(message.time);

            htmlContent += '<div class="' + bubbleClass + '">';
            htmlContent += '<span class="message-author ' + authorClass + '">' + senderName + '</span>';
            if (message.text) {
                htmlContent += '<div class="message-text">' + escapedText + '</div>';
            }
            htmlContent += fileHtml;
            htmlContent += '<div class="message-time">' + formattedTime + '</div>';
            htmlContent += '</div>';
        }

        container.innerHTML = htmlContent;
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Рендеринг файла-изображения
     */
    renderImageFile(message) {
        const imageId = 'img-' + (message.id || Date.now());

        // Если есть локальный URL - показываем его (у отправителя)
        if (message.localFileUrl) {
            let html = '<div class="mt-2 overflow-hidden rounded-lg border border-black/5 bg-black/5">';
            html += '<img src="' + message.localFileUrl + '" alt="' + this.escapeHtml(message.file_name || 'Файл') + '" ';
            html += 'class="w-full object-contain max-h-[200px]" ';
            html += 'style="display:block; min-height:80px;" ';
            html += 'loading="lazy" />';
            html += '<div class="p-1 bg-black/10 flex justify-end items-center gap-2">';
            html += '<button type="button" onclick="window.app?.chatService?.downloadFile(\'' + message.file_download_url + '\', \'' + this.escapeHtml(message.file_name || 'Файл') + '\')" class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer text-xs px-3 py-1 rounded hover:bg-blue-50 transition-colors">';
            html += '📥 Скачать';
            html += '</button>';
            html += '</div></div>';
            return html;
        }

        // Для получателя - загружаем с сервера
        const downloadUrl = message.file_download_url;

        // Если есть URL для скачивания - показываем загрузку
        if (downloadUrl) {
            let html = '<div class="mt-2 overflow-hidden rounded-lg border border-black/5 bg-black/5">';
            html += '<div id="loader-' + imageId + '" class="flex items-center justify-center p-4 text-xs opacity-50 text-center" style="min-height:80px;">';
            html += 'Загрузка...';
            html += '</div>';
            html += '<img id="' + imageId + '" alt="' + this.escapeHtml(message.file_name || 'Файл') + '" ';
            html += 'class="w-full object-contain max-h-[200px]" ';
            html += 'style="display:none; min-height:80px;" ';
            html += 'loading="lazy" />';
            html += '<div class="p-1 bg-black/10 flex justify-end items-center gap-2">';
            html += '<button type="button" onclick="window.app?.chatService?.downloadFile(\'' + downloadUrl + '\', \'' + this.escapeHtml(message.file_name || 'Файл') + '\')" class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer text-xs px-3 py-1 rounded hover:bg-blue-50 transition-colors">';
            html += 'Скачать';
            html += '</button>';
            html += '</div></div>';

            // Загружаем изображение асинхронно
            setTimeout(() => {
                this.loadImageAsync(downloadUrl, imageId);
            }, 100);

            return html;
        }

        // Если ничего нет - показываем заглушку
        let html = '<div class="mt-2 overflow-hidden rounded-lg border border-black/5 bg-black/5">';
        html += '<div class="flex items-center justify-center p-4 text-xs opacity-50 text-center" style="min-height:80px;">';
        html += '📷 Файл';
        html += '</div>';
        html += '<div class="p-1 bg-black/10 flex justify-end items-center gap-2">';
        html += '<button type="button" class="text-gray-400 cursor-not-allowed text-xs px-3 py-1 rounded" disabled>';
        html += 'Скачать';
        html += '</button>';
        html += '</div></div>';

        return html;
    }

    /**
     * Рендеринг документа (не изображения)
     */
    renderDocumentFile(message) {
        const downloadUrl = message.file_download_url;
        const fileName = this.escapeHtml(message.file_name || 'Файл');
        const fileSize = message.file_size ? (message.file_size / (1024 * 1024)).toFixed(2) + ' МБ' : '';

        // Определяем иконку в зависимости от типа файла
        let fileIcon = '📄';
        let fileColor = 'from-blue-500 to-blue-600';

        if (message.file_name) {
            const ext = message.file_name.split('.').pop().toLowerCase();
            if (['pdf'].includes(ext)) {
                fileIcon = '📕';
                fileColor = 'from-red-500 to-red-600';
            } else if (['doc', 'docx'].includes(ext)) {
                fileIcon = '📘';
                fileColor = 'from-blue-500 to-blue-700';
            } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
                fileIcon = '📗';
                fileColor = 'from-green-500 to-green-600';
            } else if (['ppt', 'pptx'].includes(ext)) {
                fileIcon = '📙';
                fileColor = 'from-orange-500 to-orange-600';
            } else if (['zip', 'rar', '7z'].includes(ext)) {
                fileIcon = '📦';
                fileColor = 'from-yellow-500 to-yellow-700';
            } else if (['txt', 'log'].includes(ext)) {
                fileIcon = '📝';
                fileColor = 'from-gray-500 to-gray-600';
            }
        }

        let html = '<div class="mt-2 overflow-hidden rounded-lg border border-gray-200/60 bg-gray-50/50">';
        html += '<div class="flex items-center gap-2 p-2">';
        html += '<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ' + fileColor + ' text-white text-sm shadow-sm flex-shrink-0">';
        html += fileIcon;
        html += '</div>';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="text-xs font-medium text-gray-700 truncate">' + fileName + '</div>';
        if (fileSize) {
            html += '<div class="text-[10px] text-gray-400">' + fileSize + '</div>';
        }
        html += '</div>';

        if (downloadUrl) {
            html += '<button type="button" onclick="window.app?.chatService?.downloadFile(\'' + downloadUrl + '\', \'' + fileName + '\')" class="flex items-center gap-1 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-[10px] px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow flex-shrink-0">';
            html += 'Скачать';
            html += '</button>';
        } else {
            html += '<button type="button" class="flex items-center gap-1 text-gray-400 bg-gray-100 cursor-not-allowed text-[10px] px-2 py-1 rounded-md opacity-50 flex-shrink-0">';
            html += 'Скачать';
            html += '</button>';
        }

        html += '</div></div>';

        return html;
    }
    /**
     * Асинхронная загрузка изображения
     */
    async loadImageAsync(downloadUrl, imageId) {
        try {
            const authenticationToken = this.getAuthToken();

            if (!authenticationToken) {
                throw new Error('Токен не найден');
            }

            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authenticationToken
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки: ' + response.status);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            const imgElement = document.getElementById(imageId);
            const loaderElement = document.getElementById('loader-' + imageId);

            if (imgElement) {
                imgElement.onload = function() {
                    URL.revokeObjectURL(imageUrl);
                };
                imgElement.src = imageUrl;
                imgElement.style.display = 'block';
                this.scrollToBottom();
            }

            if (loaderElement) {
                loaderElement.style.display = 'none';
            }

        } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
            const loaderElement = document.getElementById('loader-' + imageId);
            if (loaderElement) {
                loaderElement.textContent = '❌ Не удалось загрузить';
                loaderElement.style.color = 'red';
            }
        }
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ СПИСКА ЧАТОВ
    // ============================================================

    /**
     * Рендеринг списка чатов в боковой панели
     * @param {string} view - Тип отображения ('groups' | 'members')
     */
    renderChatList(view) {
        const listElement = document.getElementById('chatList');
        if (!listElement) {
            return;
        }
        listElement.innerHTML = '';

        if (view === 'groups') {
            this.renderGroupsList(listElement);
        } else {
            this.renderMembersList(listElement);
        }
    }

    /**
     * Рендеринг списка групп
     * @param {HTMLElement} listElement - DOM-элемент списка
     */
    renderGroupsList(listElement) {
        const chats = this.chats;

        if (!chats || chats.length === 0) {
            listElement.innerHTML = '<div class="chat-list-item" style="color:#888;">Нет доступных групп</div>';
            return;
        }

        const sortedChats = [...chats].sort(function(a, b) {
            if (a.is_active === b.is_active) {
                return 0;
            }
            if (a.is_active) {
                return -1;
            }
            return 1;
        });

        for (let index = 0; index < sortedChats.length; index++) {
            const chat = sortedChats[index];

            const listItem = document.createElement('div');
            listItem.className = 'chat-list-item';
            listItem.dataset.id = chat.id;
            listItem.dataset.type = 'group';

            const statusIcon = chat.is_active ? '🟢' : '🔴';
            let itemHtml = '<span>' + statusIcon + ' ' + (chat.name || 'Группа ' + chat.id) + '</span>';
            if (chat.unread > 0) {
                itemHtml += '<span class="badge">' + chat.unread + '</span>';
            }
            listItem.innerHTML = itemHtml;

            const self = this;
            listItem.addEventListener('click', function() {
                self.selectChat(chat.id, 'group');
            });

            listElement.appendChild(listItem);
        }

        if (this.selectedId && this.currentType === 'groups') {
            const activeItemSelector = '#chatList .chat-list-item[data-id="' + this.selectedId + '"]';
            const activeItem = listElement.querySelector(activeItemSelector);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        } else if (sortedChats.length > 0) {
            const firstItem = listElement.querySelector('.chat-list-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    }

    /**
     * Рендеринг списка участников
     * @param {HTMLElement} listElement - DOM-элемент списка
     */
    renderMembersList(listElement) {
        let members = [];

        if (this.userRole === 'teamlead') {
            members = this.members;
        } else {
            if (this.teamleadId) {
                members = [
                    {
                        id: this.teamleadId,
                        name: 'Тимлид'
                    }
                ];
            }
        }

        if (members.length === 0) {
            listElement.innerHTML = '<div class="chat-list-item" style="color:#888;">Нет участников</div>';
            return;
        }

        for (let index = 0; index < members.length; index++) {
            const member = members[index];

            const listItem = document.createElement('div');
            listItem.className = 'chat-list-item';
            listItem.dataset.id = member.id;
            listItem.dataset.type = 'member';
            listItem.textContent = member.name || 'Участник ' + member.id;

            const self = this;
            listItem.addEventListener('click', function() {
                self.selectChat(member.id, 'member');
            });

            listElement.appendChild(listItem);
        }

        if (this.selectedId && this.currentType === 'members') {
            const activeItemSelector = '#chatList .chat-list-item[data-id="' + this.selectedId + '"]';
            const activeItem = listElement.querySelector(activeItemSelector);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        } else {
            const firstItem = listElement.querySelector('.chat-list-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================

    /**
     * Сортировка сообщений по времени
     */
    sortMessages() {
        this.messages.sort(function(a, b) {
            const timeA = new Date(a.time || 0);
            const timeB = new Date(b.time || 0);
            if (timeA < timeB) {
                return -1;
            }
            if (timeA > timeB) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * Форматирование времени
     * @param {string} timeString - Строка с временем
     * @returns {string} Отформатированное время (ЧЧ:ММ)
     */
    formatTime(timeString) {
        if (!timeString) {
            return '';
        }
        try {
            const dateObject = new Date(timeString);
            const hours = dateObject.getHours().toString().padStart(2, '0');
            const minutes = dateObject.getMinutes().toString().padStart(2, '0');
            return hours + ':' + minutes;
        } catch (error) {
            return timeString;
        }
    }

    /**
     * Прокрутка вниз контейнера сообщений
     */
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * Обновление бейджа непрочитанных сообщений
     * @param {string} roomName - Идентификатор комнаты
     */
    updateUnreadBadge(roomName) {
        const allChatItems = document.querySelectorAll('#chatList .chat-list-item');
        for (let index = 0; index < allChatItems.length; index++) {
            const item = allChatItems[index];
            const itemRoom = 'group_' + item.dataset.id;
            if (itemRoom === roomName && item.dataset.type === 'group') {
                let badge = item.querySelector('.badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.style.cssText = 'background: #FF6B6B; color: white; border-radius: 50%; padding: 2px 8px; font-size: 12px; margin-left: 8px;';
                    item.appendChild(badge);
                }
                const currentCount = parseInt(badge.textContent || '0', 10);
                const newCount = currentCount + 1;
                badge.textContent = newCount;
            }
        }
    }

    /**
     * Переход в чат группы
     * @param {number|string} groupId - ID группы
     */
    goToGroupChat(groupId) {
        const chatTab = document.querySelector('.nav-item[onclick*="chat"]');
        if (chatTab) {
            chatTab.click();
        }

        const self = this;
        setTimeout(function() {
            const allChatItems = document.querySelectorAll('#chatList .chat-list-item');
            for (let index = 0; index < allChatItems.length; index++) {
                const item = allChatItems[index];
                if (item.dataset.id == groupId && item.dataset.type === 'group') {
                    item.click();
                    break;
                }
            }
        }, 300);

        this.notify('Переход в чат группы', 'success');
    }

    /**
     * Экранирование HTML-символов
     * @param {string} text - Текст для экранирования
     * @returns {string} Безопасный текст
     */
    escapeHtml(text) {
        if (!text) {
            return '';
        }
        const temporaryDiv = document.createElement('div');
        temporaryDiv.textContent = text;
        return temporaryDiv.innerHTML;
    }

    /**
     * Отключение WebSocket-подключения
     */
    disconnect() {
        if (this.channel) {
            if (this.echo) {
                this.echo.leave(this.channel);
            }
            this.channel = null;
        }
        this.echo = null;
    }
}
