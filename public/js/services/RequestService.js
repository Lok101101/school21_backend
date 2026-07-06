// ============================================================
// СЕРВИС ЗАЯВОК
// ============================================================
class RequestService {
    constructor(api, template, notify) {
        this.api = api;
        this.template = template;
        this.notify = notify;
        this.requests = [];
        this.currentFilter = 'pending';
        this.currentPage = 1;
        this.ROWS_PER_PAGE = 5;
        this.currentRequestId = null;
        this.currentRequestStatus = null;
        this.templateTextToSave = '';
        this.onStatusChange = null;
        this.closeAllModals = null; 
        this.switchModal = null; 
    }

    // ============================================================
    // ЗАГРУЗКА ЗАЯВОК
    // ============================================================

    async loadRequests() {
        try {
            const result = await this.api.request('/requests', 'GET', null, true);

            if (!result.ok) {
                if (result.error && (result.error.includes('401') || result.error.includes('403'))) {
                    this.notify('Сессия истекла', 'error');
                    setTimeout(function() {
                        window.location.href = 'authorization.html';
                    }, 2000);
                    return false;
                }

                throw new Error(result.error || 'Ошибка загрузки');
            }

            let requests = [];
            if (result.data && result.data.practice_requests) {
                requests = result.data.practice_requests;
            } else if (Array.isArray(result.data)) {
                requests = result.data;
            } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
                requests = result.data.data;
            }

            this.requests = requests.map(function(request) {
                const nameParts = [];
                if (request.surname) {
                    nameParts.push(request.surname);
                }
                if (request.name) {
                    nameParts.push(request.name);
                }
                if (request.patronymic) {
                    nameParts.push(request.patronymic);
                }

                const fullName = nameParts.join(' ');

                let statusCode = 'pending';
                if (request.status && request.status.code) {
                    statusCode = request.status.code;
                } else if (request.status) {
                    statusCode = request.status;
                }

                let statusName = 'На рассмотрении';
                if (request.status && request.status.name) {
                    statusName = request.status.name;
                } else if (request.status) {
                    statusName = request.status;
                }

                let changeReason = null;
                if (request.status && request.status.change_reason) {
                    changeReason = request.status.change_reason;
                }

                return {
                    id: request.id,
                    surname: request.surname,
                    name: request.name,
                    patronymic: request.patronymic,
                    full_name: fullName,
                    phone: request.phone,
                    birth_date: request.birth_date,
                    course: request.course,
                    specialization: request.specialization,
                    direction: request.direction,
                    start_date: request.start_date,
                    end_date: request.end_date,
                    user_id: request.user_id || request.userId,
                    status_code: statusCode,
                    status_name: statusName,
                    change_reason: changeReason,
                    status: request.status
                };
            });

            return true;

        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            this.notify('Ошибка загрузки заявок', 'error');
            return false;
        }
    }

    // ============================================================
    // ФИЛЬТРАЦИЯ ЗАЯВОК
    // ============================================================

    filterRequests(status) {
        const filtered = [];
        for (let index = 0; index < this.requests.length; index++) {
            const request = this.requests[index];
            let requestStatus = request.status_code || request.status || '';

            if (typeof requestStatus === 'string') {
                const lowerStatus = requestStatus.toLowerCase();
                const lowerFilter = status.toLowerCase();
                if (lowerStatus === lowerFilter) {
                    filtered.push(request);
                }
            }
        }
        return filtered;
    }

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ
    // ============================================================

    formatDate(dateString) {
        if (!dateString) {
            return '—';
        }

        try {
            const dateObject = new Date(dateString);
            const day = dateObject.getDate().toString().padStart(2, '0');
            const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObject.getFullYear();
            return day + '.' + month + '.' + year;
        } catch (error) {
            return dateString;
        }
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ ЗАЯВОК
    // ============================================================

    renderApplications() {
        const tableBody = document.getElementById('applicationsTableBody');
        if (!tableBody) {
            return;
        }

        const filtered = this.filterRequests(this.currentFilter);
        const totalPages = Math.ceil(filtered.length / this.ROWS_PER_PAGE);

        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.ROWS_PER_PAGE;
        const pageData = filtered.slice(startIndex, startIndex + this.ROWS_PER_PAGE);

        if (pageData.length === 0) {
            let message = 'Нет заявок с таким статусом';
            if (this.requests.length === 0) {
                message = 'Загрузка...';
            }

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#888; padding:30px;">
                        ${message}
                    </td>
                </tr>
            `;

            this.renderPagination(totalPages);
            return;
        }

        let htmlContent = '';
        for (let index = 0; index < pageData.length; index++) {
            const request = pageData[index];
            const fullName = request.full_name || 'Не указано';
            const course = request.course || '—';
            const specialization = request.specialization || request.direction || '—';
            const startDate = this.formatDate(request.start_date);
            const endDate = this.formatDate(request.end_date);

            htmlContent = htmlContent + `
                <tr onclick="app.requestService.openRequestModal(${request.id})" style="cursor:pointer;">
                    <td>${fullName}</td>
                    <td>${course}</td>
                    <td>${specialization}</td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                </tr>
            `;
        }

        tableBody.innerHTML = htmlContent;
        this.renderPagination(totalPages);
    }

    // ============================================================
    // ПАГИНАЦИЯ
    // ============================================================

    renderPagination(totalPages) {
        const paginationContainer = document.getElementById('applicationsPagination');
        if (!paginationContainer) {
            return;
        }

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let htmlContent = '';

        // Кнопка "Назад"
        const isFirstPage = this.currentPage === 1;
        const prevClass = isFirstPage ? 'disabled' : '';
        htmlContent = htmlContent + '<button class="page-btn ' + prevClass + '" onclick="app.requestService.changePage(' + (this.currentPage - 1) + ')">←</button>';

        // Номера страниц
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            const isActive = pageNumber === this.currentPage ? 'active' : '';
            htmlContent = htmlContent + '<button class="page-btn ' + isActive + '" onclick="app.requestService.changePage(' + pageNumber + ')">' + pageNumber + '</button>';
        }

        // Кнопка "Вперёд"
        const isLastPage = this.currentPage === totalPages;
        const nextClass = isLastPage ? 'disabled' : '';
        htmlContent = htmlContent + '<button class="page-btn ' + nextClass + '" onclick="app.requestService.changePage(' + (this.currentPage + 1) + ')">→</button>';

        paginationContainer.innerHTML = htmlContent;
    }

    changePage(newPage) {
        const filtered = this.filterRequests(this.currentFilter);
        const totalPages = Math.ceil(filtered.length / this.ROWS_PER_PAGE);

        if (newPage < 1 || newPage > totalPages) {
            return;
        }

        this.currentPage = newPage;
        this.renderApplications();
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ============================================================

    switchAppFilter(status, buttonElement) {
        this.currentFilter = status;
        this.currentPage = 1;

        const allButtons = document.querySelectorAll('.filter-tabs .filter-btn');
        for (let index = 0; index < allButtons.length; index++) {
            const button = allButtons[index];
            button.classList.remove('active');
        }

        buttonElement.classList.add('active');
        this.renderApplications();
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ЗАЯВКИ
    // ============================================================

    openRequestModal(requestId) {
        let request = null;
        for (let index = 0; index < this.requests.length; index++) {
            const currentRequest = this.requests[index];
            if (currentRequest.id === requestId) {
                request = currentRequest;
                break;
            }
        }

        if (!request) {
            this.notify('Заявка не найдена', 'error');
            return;
        }

        this.currentRequestId = requestId;
        this.currentRequestStatus = request.status_code || request.status || 'pending';

        const userNameElement = document.getElementById('modalUserName');
        const phoneElement = document.getElementById('modalPhone');
        const birthdayElement = document.getElementById('modalBirthday');
        const courseElement = document.getElementById('modalCourse');
        const directionElement = document.getElementById('modalDirection');
        const startDateElement = document.getElementById('modalStartDate');
        const endDateElement = document.getElementById('modalEndDate');

        if (userNameElement) {
            userNameElement.textContent = request.full_name || 'Без имени';
        }

        if (phoneElement) {
            phoneElement.textContent = request.phone || '+7 999 123-45-67';
        }

        if (birthdayElement) {
            birthdayElement.textContent = request.birth_date || '—';
        }

        if (courseElement) {
            courseElement.textContent = request.course || '—';
        }

        if (directionElement) {
            directionElement.textContent = request.specialization || request.direction || '—';
        }

        if (startDateElement) {
            startDateElement.textContent = this.formatDate(request.start_date);
        }

        if (endDateElement) {
            endDateElement.textContent = this.formatDate(request.end_date);
        }

        // Настраиваем кнопки действий
        const actionsContainer = document.querySelector('#modal1 .modal-actions');
        if (actionsContainer) {
            if (this.currentRequestStatus === 'accepted') {
                actionsContainer.innerHTML = `
                    <div style="text-align:center; padding:10px; width:100%;">
                        <span style="font-size:18px; font-weight:600; color:#27AE60;">✅ Принята</span>
                    </div>
                `;
            } else if (this.currentRequestStatus === 'rejected') {
                let reasonHtml = '';
                if (request.change_reason) {
                    reasonHtml = '<br><span style="font-size:14px; color:#888;">Причина: ' + request.change_reason + '</span>';
                }

                actionsContainer.innerHTML = `
                    <div style="text-align:center; padding:10px; width:100%;">
                        <span style="font-size:18px; font-weight:600; color:#FF6B6B;">❌ Отклонена</span>
                        ${reasonHtml}
                    </div>
                `;
            } else {
                actionsContainer.innerHTML = `
                    <button class="modal-btn modal-btn-accept" onclick="app.requestService.handleAcceptRequest()">Принять</button>
                    <button class="modal-btn modal-btn-reject" onclick="app.requestService.openRejectModal()">Отклонить</button>
                `;
            }
        }

        // Открываем модальное окно
        const modalElement = document.getElementById('modal1');
        if (modalElement) {
            modalElement.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ОТКЛОНЕНИЯ
    // ============================================================

    openRejectModal() {
        if (!this.currentRequestId) {
            return;
        }

        if (this.currentRequestStatus === 'accepted' || this.currentRequestStatus === 'rejected') {
            this.notify('Эта заявка уже обработана', 'warning');
            return;
        }

        const modal1 = document.getElementById('modal1');
        if (modal1) {
            modal1.classList.remove('active');
        }

        const modal2 = document.getElementById('modal2');
        if (modal2) {
            modal2.classList.add('active');
        }
    }

    // ============================================================
    // ОБНОВЛЕНИЕ СТАТУСА ЗАЯВКИ
    // ============================================================

    async updateRequestStatus(requestId, newStatus, reason = null) {
        try {
            const requestBody = {
                new_status: newStatus
            };

            if (reason) {
                requestBody.reason = reason;
            }

            const result = await this.api.request('/requests/' + requestId + '/status', 'PATCH', requestBody, true);

            if (result.ok) {
                let statusMessage = '';
                if (newStatus === 'accepted') {
                    statusMessage = 'принята';
                } else {
                    statusMessage = 'отклонена';
                }

                this.notify('Заявка ' + statusMessage, 'success');

                await this.loadRequests();
                this.renderApplications();

                // Уведомление студенту
                let request = null;
                for (let index = 0; index < this.requests.length; index++) {
                    const currentRequest = this.requests[index];
                    if (currentRequest.id === requestId) {
                        request = currentRequest;
                        break;
                    }
                }

                if (request && this.onStatusChange) {
                    let message = '';
                    if (newStatus === 'accepted') {
                        message = 'Ваша заявка принята! 🎉';
                    } else {
                        const reasonText = reason || 'не указана';
                        message = 'Ваша заявка отклонена. Причина: ' + reasonText;
                    }

                    const notificationData = {
                        type: 'request_status',
                        subject: 'Статус заявки изменен',
                        message: message,
                        status: newStatus,
                        reason: reason
                    };

                    this.onStatusChange(request.user_id || request.userId, notificationData);
                }

                return true;
            }

            throw new Error(result.error || 'Ошибка');

        } catch (error) {
            this.notify('Ошибка: ' + error.message, 'error');
            return false;
        }
    }

    // ============================================================
    // ОБРАБОТЧИК ПРИНЯТИЯ ЗАЯВКИ
    // ============================================================

    async handleAcceptRequest() {
        if (!this.currentRequestId) {
            return;
        }

        if (this.currentRequestStatus === 'accepted' || this.currentRequestStatus === 'rejected') {
            this.notify('Эта заявка уже обработана', 'warning');
            return;
        }

        const isConfirmed = confirm('Принять заявку?');
        if (isConfirmed) {
            const success = await this.updateRequestStatus(this.currentRequestId, 'accepted');
            if (success) {
                // Используем внешний метод закрытия модалок
                if (typeof this.closeAllModals === 'function') {
                    this.closeAllModals();
                } else if (window.app && typeof window.app.closeAllModals === 'function') {
                    window.app.closeAllModals();
                } else {
                    // Fallback
                    const allModals = document.querySelectorAll('.modal-overlay');
                    for (let i = 0; i < allModals.length; i++) {
                        allModals[i].classList.remove('active');
                    }
                    document.body.style.overflow = 'auto';
                }
            }
        }
    }

    // ============================================================
    // ОБРАБОТЧИК ОТКЛОНЕНИЯ ЗАЯВКИ
    // ============================================================

    async handleSendRejection() {
        const textareaElement = document.querySelector('#modal2 .modal-textarea');
        let reason = '';

        if (textareaElement) {
            reason = textareaElement.value;
            if (reason) {
                reason = reason.trim();
            }
        }

        if (!reason) {
            this.notify('Укажите причину отказа', 'error');
            return;
        }

        if (!this.currentRequestId) {
            return;
        }

        if (this.currentRequestStatus === 'accepted' || this.currentRequestStatus === 'rejected') {
            this.notify('Эта заявка уже обработана', 'warning');
            this.closeAllModals();
            return;
        }

        const success = await this.updateRequestStatus(this.currentRequestId, 'rejected', reason);
        if (success) {
            // Используем внешний метод закрытия модалок
            if (typeof this.closeAllModals === 'function') {
                this.closeAllModals();
            } else if (window.app && typeof window.app.closeAllModals === 'function') {
                window.app.closeAllModals();
            } else {
                // Fallback
                const allModals = document.querySelectorAll('.modal-overlay');
                for (let i = 0; i < allModals.length; i++) {
                    allModals[i].classList.remove('active');
                }
                document.body.style.overflow = 'auto';
            }
        }
    }

    // ============================================================
    // СОХРАНЕНИЕ ШАБЛОНА ОТКАЗА
    // ============================================================

    handleSaveRejectionTemplate() {
        const nameInput = document.querySelector('#modal3 .modal-input');
        const reasonTextarea = document.querySelector('#modal3 .modal-textarea');

        let name = '';
        let text = '';

        if (nameInput) {
            name = nameInput.value;
            if (name) {
                name = name.trim();
            }
        }

        if (reasonTextarea) {
            text = reasonTextarea.value;
            if (text) {
                text = text.trim();
            }
        }

        if (!name) {
            this.notify('Введите название шаблона', 'error');
            return;
        }

        if (!text) {
            this.notify('Введите текст шаблона', 'error');
            return;
        }

        this.template.saveRejectionTemplate(name, text);
        this.notify('Шаблон сохранен!', 'success');

        const modal3 = document.getElementById('modal3');
        if (modal3) {
            modal3.classList.remove('active');
        }

        const modal2 = document.getElementById('modal2');
        if (modal2) {
            modal2.classList.add('active');
        }

        if (nameInput) {
            nameInput.value = '';
        }
    }
}