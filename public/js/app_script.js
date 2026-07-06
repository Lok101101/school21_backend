// ============================================================
// СТУДЕНТ - ЕДИНЫЙ СКРИПТ
// ============================================================


// ============================================================
// 1. РАБОТА С ТОКЕНОМ
// ============================================================

function getAuthToken() {
    const tokenFromLocalStorage = localStorage.getItem('auth_token');
    if (tokenFromLocalStorage) {
        return tokenFromLocalStorage;
    }

    const tokenFromSessionStorage = sessionStorage.getItem('auth_token');
    if (tokenFromSessionStorage) {
        return tokenFromSessionStorage;
    }

    return null;
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_token', token);
    }
}

function removeAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
}

// ============================================================
// 2. API КЛИЕНТ
// ============================================================

async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = true) {
    try {
        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (requiresAuth) {
            const token = getAuthToken();
            if (token) {
                requestOptions.headers['Authorization'] = 'Bearer ' + token;
            }
        }

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        const fullUrl = API_BASE + endpoint;
        const response = await fetch(fullUrl, requestOptions);

        let responseData = null;
        try {
            responseData = await response.json();
        } catch (parseError) {
            responseData = null;
        }

        if (response.status === 401) {
            removeAuthToken();
        }

        return {
            ok: response.ok,
            status: response.status,
            data: responseData
        };

    } catch (error) {
        console.error('Network error:', error);
        return {
            ok: false,
            status: 0,
            data: {
                message: 'Ошибка соединения с сервером'
            }
        };
    }
}

// ============================================================
// 3. ЗАЯВКИ
// ============================================================

async function getRequests() {
    const result = await apiRequest('/requests/my', 'GET', null, true);

    if (result.ok) {
        let requests = [];

        if (result.data && result.data.practice_requests) {
            requests = result.data.practice_requests;
        } else if (Array.isArray(result.data)) {
            requests = result.data;
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
            requests = result.data.data;
        }

        return {
            success: true,
            data: requests
        };

    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка получения заявок';
        return {
            success: false,
            message: errorMessage
        };
    }
}

async function createRequest(requestData) {
    const result = await apiRequest('/requests', 'POST', requestData, true);

    if (result.ok) {
        let request = null;
        if (result.data && result.data.practice_request) {
            request = result.data.practice_request;
        }

        return {
            success: true,
            data: request
        };

    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка создания заявки';
        const errorErrors = result.data && result.data.errors ? result.data.errors : {};

        return {
            success: false,
            message: errorMessage,
            errors: errorErrors
        };
    }
}

async function updateRequestStatus(requestId, newStatus) {
    const requestBody = {
        new_status: newStatus
    };

    const result = await apiRequest('/requests/' + requestId + '/status', 'PATCH', requestBody, true);

    if (result.ok) {
        let request = null;
        if (result.data && result.data.practice_request) {
            request = result.data.practice_request;
        }

        return {
            success: true,
            data: request
        };

    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка обновления статуса';
        return {
            success: false,
            message: errorMessage
        };
    }
}

// ============================================================
// 4. УТИЛИТЫ
// ============================================================

function getStatusText(statusCode) {
    if (statusCode === 'pending') {
        return 'На рассмотрении';
    }

    if (statusCode === 'accepted') {
        return 'Одобрена';
    }

    if (statusCode === 'rejected') {
        return 'Отклонена';
    }

    if (statusCode === 'canceled') {
        return 'Отменена';
    }

    return statusCode;
}

function getChangeReason(request) {
    if (request.status && request.status.change_reason) {
        return request.status.change_reason;
    }

    if (request.change_reason) {
        return request.change_reason;
    }

    return null;
}

function getConfirmationMessage(statusCode, changeReason) {
    if (statusCode === 'pending') {
        return 'Спасибо! Заявка отправлена. Мы уже начали её обработку. Данные переданы для проверки. Пожалуйста, ожидайте ответа. Уведомление о статусе вашей заявки появится на сайте и придёт вам на почту в ближайшее время.';
    }

    if (statusCode === 'accepted') {
        return 'Отлично! Ваша заявка прошла проверку и одобрена. Все проверки пройдены. Доступ к общему чату группы уже открыт.';
    }

    if (statusCode === 'rejected') {
        let reasonText = '';
        if (changeReason) {
            reasonText = ' Причина: ' + changeReason;
        }
        return 'К сожалению, заявка отклонена.' + reasonText + ' Вы можете повторно отправить заявку, но не более 2 раз.';
    }

    if (statusCode === 'canceled') {
        return 'Заявка отменена. Вы можете подать новую заявку.';
    }

    return 'Статус заявки неизвестен.';
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        return dateString;
    }

    return dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');

    if (!container) {
        const tempElement = document.createElement('div');
        tempElement.id = 'notification-container';
        tempElement.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(tempElement);
        container = tempElement;
    }

    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification ' + type;
    notificationElement.textContent = message;
    container.appendChild(notificationElement);

    requestAnimationFrame(function() {
        notificationElement.classList.add('show');
    });

    setTimeout(function() {
        notificationElement.classList.remove('show');
        setTimeout(function() {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, 300);
    }, 3000);
}

async function logoutUser() {
    const result = await apiRequest('/logout', 'POST', null, true);

    if (result.ok) {
        removeAuthToken();
        sessionStorage.clear();
        window.location.href = '/';
        return true;
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка выхода';
        console.warn(errorMessage);
        window.location.href = '/';
        return false;
    }
}

// ============================================================
// 5. ОСНОВНАЯ ЛОГИКА
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('content-container');
    let allRequests = [];
    let currentRequest = null;
    let rejectedCount = 0;

    // --- Загрузка заявок ---
    async function loadRequests() {
        const result = await getRequests();

        if (result.success) {
            allRequests = result.data;

            allRequests.sort(function(a, b) {
                if (a.id < b.id) {
                    return 1;
                }
                if (a.id > b.id) {
                    return -1;
                }
                return 0;
            });

            currentRequest = allRequests.length > 0 ? allRequests[0] : null;

            let rejectedRequests = 0;
            for (let index = 0; index < allRequests.length; index++) {
                const request = allRequests[index];
                const statusCode = request.status && request.status.code ? request.status.code : request.status;
                if (statusCode === 'rejected') {
                    rejectedRequests = rejectedRequests + 1;
                }
            }
            rejectedCount = rejectedRequests;

        } else {
            showNotification('Не удалось загрузить данные о заявках: ' + result.message, 'error');
        }
    }

    // --- Рендер формы заявки ---
    function renderApplicationForm() {
        const canSubmit = rejectedCount < 2;

        if (!currentRequest && canSubmit) {
            container.innerHTML = `
                <div class="card">
                    <div class="form-title">Расскажи нам немного о себе</div>

                    <div class="form-group">
                        <input type="text" class="form-input active-border" placeholder="Фамилия" id="app-surname">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="Имя" id="app-name">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="Отчество" id="app-patronymic">
                    </div>

                    <div class="form-group">
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" value="man" name="gender" checked> Мужчина
                            </label>
                            <label class="radio-label">
                                <input type="radio" value="woman" name="gender"> Женщина
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <input type="date" class="form-input" placeholder="Дата рождения" id="app-birthdate" style="color:#555;">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="+7 000 000 00 00" id="app-phone">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="Направление" id="app-specialization">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="Курс" id="app-course">
                    </div>
                    <div class="form-group">
                        <select class="form-select" id="app-city">
                            <option value="" disabled selected>Город</option>
                            <option value="Москва">Москва</option>
                            <option value="Санкт-Петербург">Санкт-Петербург</option>
                            <option value="Казань">Казань</option>
                            <option value="Уфа">Уфа</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="date" class="form-input" placeholder="Дата начала практики" id="app-start-date" style="color:#555;">
                    </div>
                    <div class="form-group">
                        <input type="date" class="form-input" placeholder="Дата окончания практики" id="app-end-date" style="color:#555;">
                    </div>

                    <button class="btn-submit" id="submit-request-btn">Отправить заявку</button>
                </div>
            `;

            const submitButton = document.getElementById('submit-request-btn');
            if (submitButton) {
                submitButton.addEventListener('click', handleSubmitRequest);
            }

        } else if (!currentRequest && !canSubmit) {
            container.innerHTML = `
                <div class="card status-card">
                    <div class="status-title">Вы исчерпали лимит попыток</div>
                    <div class="status-desc">К сожалению, вы не можете подать новую заявку, так как у вас 2 отклонённые заявки.</div>
                </div>
            `;

        } else {
            renderRequestInfo();
        }
    }

    // --- Рендер информации о заявке ---
    function renderRequestInfo() {
        const statusCode = currentRequest.status && currentRequest.status.code ? currentRequest.status.code : (currentRequest.status || 'unknown');
        const statusName = currentRequest.status && currentRequest.status.name ? currentRequest.status.name : getStatusText(statusCode);
        const canCancel = statusCode === 'pending';
        const isAccepted = statusCode === 'accepted';
        const canSubmit = rejectedCount < 2;
        const changeReason = getChangeReason(currentRequest);

        let reasonHtml = '';
        if (statusCode === 'rejected' && changeReason) {
            reasonHtml = '<p style="color:#FF6B6B; margin-top:10px;"><strong>Причина отказа:</strong> ' + changeReason + '</p>';
        }

        let buttonsHtml = '';
        if (canCancel) {
            buttonsHtml = buttonsHtml + '<button class="status-btn btn-purple" id="cancel-request-btn">Отменить заявку</button>';
        }
        if (isAccepted) {
            buttonsHtml = buttonsHtml + '<button class="status-btn btn-green" id="continue-btn">Продолжить</button>';
        }
        if ((statusCode === 'rejected' || statusCode === 'canceled') && canSubmit) {
            buttonsHtml = buttonsHtml + '<button class="status-btn btn-retry" id="new-request-btn">Подать новую заявку</button>';
        }

        container.innerHTML = `
            <div class="card status-card">
                <div class="status-title">Ваша заявка</div>
                <div class="status-desc">
                    <p><strong>Статус:</strong> ${statusName}</p>
                    <p><strong>ФИО:</strong> ${currentRequest.surname} ${currentRequest.name} ${currentRequest.patronymic || ''}</p>
                    <p><strong>Город:</strong> ${currentRequest.city || '—'}</p>
                    <p><strong>Направление:</strong> ${currentRequest.specialization}</p>
                    <p><strong>Курс:</strong> ${currentRequest.course}</p>
                    <p><strong>Период:</strong> ${formatDate(currentRequest.start_date)} — ${formatDate(currentRequest.end_date)}</p>
                    ${reasonHtml}
                </div>
                ${buttonsHtml}
            </div>
        `;

        if (canCancel) {
            const cancelButton = document.getElementById('cancel-request-btn');
            if (cancelButton) {
                cancelButton.addEventListener('click', handleCancelRequest);
            }
        }

        if (isAccepted) {
            const continueButton = document.getElementById('continue-btn');
            if (continueButton) {
                continueButton.addEventListener('click', function() {
                    window.location.href = '/practicant';
                });
            }
        }

        if ((statusCode === 'rejected' || statusCode === 'canceled') && canSubmit) {
            const newRequestButton = document.getElementById('new-request-btn');
            if (newRequestButton) {
                newRequestButton.addEventListener('click', function() {
                    currentRequest = null;
                    renderApplicationForm();
                });
            }
        }
    }

    // --- Рендер подтверждения ---
    function renderConfirmation() {
        if (!currentRequest) {
            container.innerHTML = `
                <div class="card status-card">
                    <div class="status-title">Нет заявки</div>
                    <div class="status-desc">Вы ещё не подали заявку. Перейдите на вкладку «Заявка».</div>
                </div>
            `;
            return;
        }

        const statusCode = currentRequest.status && currentRequest.status.code ? currentRequest.status.code : (currentRequest.status || 'unknown');
        const statusName = currentRequest.status && currentRequest.status.name ? currentRequest.status.name : getStatusText(statusCode);
        const changeReason = getChangeReason(currentRequest);
        const message = getConfirmationMessage(statusCode, changeReason);
        const isAccepted = statusCode === 'accepted';
        const canCancel = statusCode === 'pending';

        let reasonHtml = '';
        if (statusCode === 'rejected' && changeReason) {
            reasonHtml = '<div class="status-desc" style="color:#FF6B6B; margin-top:10px;"><strong>Причина отказа:</strong> ' + changeReason + '</div>';
        }

        let buttonsHtml = '';
        if (canCancel) {
            buttonsHtml = buttonsHtml + '<button class="status-btn btn-purple" id="cancel-confirm-btn">Отменить заявку</button>';
        }
        if (isAccepted) {
            buttonsHtml = buttonsHtml + '<button class="status-btn btn-green" id="continue-confirm-btn">Продолжить</button>';
        }

        container.innerHTML = `
            <div class="card status-card">
                <div class="status-title">${statusName}</div>
                <div class="status-desc">${message}</div>
                ${reasonHtml}
                ${buttonsHtml}
            </div>
        `;

        if (canCancel) {
            const cancelButton = document.getElementById('cancel-confirm-btn');
            if (cancelButton) {
                cancelButton.addEventListener('click', handleCancelRequest);
            }
        }

        if (isAccepted) {
            const continueButton = document.getElementById('continue-confirm-btn');
            if (continueButton) {
                continueButton.addEventListener('click', function() {
                    window.location.href = '/practicant';
                });
            }
        }
    }

    // --- Обработчики ---
    async function handleSubmitRequest() {
        if (rejectedCount >= 2) {
            showNotification('Вы не можете подать заявку, так как исчерпали лимит попыток.', 'error');
            return;
        }

        const surnameElement = document.getElementById('app-surname');
        const nameElement = document.getElementById('app-name');
        const patronymicElement = document.getElementById('app-patronymic');
        const cityElement = document.getElementById('app-city');
        const specializationElement = document.getElementById('app-specialization');
        const courseElement = document.getElementById('app-course');
        const startDateElement = document.getElementById('app-start-date');
        const endDateElement = document.getElementById('app-end-date');
        const birthdateElement = document.getElementById('app-birthdate');
        const phoneElement = document.getElementById('app-phone');
        const genderElement = document.querySelector('input[name="gender"]:checked');

        let surname = '';
        if (surnameElement) {
            surname = surnameElement.value;
            if (surname) {
                surname = surname.trim();
            }
        }

        let name = '';
        if (nameElement) {
            name = nameElement.value;
            if (name) {
                name = name.trim();
            }
        }

        let patronymic = '';
        if (patronymicElement) {
            patronymic = patronymicElement.value;
            if (patronymic) {
                patronymic = patronymic.trim();
            }
        }

        let city = '';
        if (cityElement) {
            city = cityElement.value;
        }

        let specialization = '';
        if (specializationElement) {
            specialization = specializationElement.value;
            if (specialization) {
                specialization = specialization.trim();
            }
        }

        let courseValue = 0;
        if (courseElement) {
            const courseText = courseElement.value.trim();
            courseValue = parseInt(courseText, 10);
            if (isNaN(courseValue)) {
                courseValue = 0;
            }
        }

        let startDate = '';
        if (startDateElement) {
            startDate = startDateElement.value;
        }

        let endDate = '';
        if (endDateElement) {
            endDate = endDateElement.value;
        }

        let birthdate = '';
        if (birthdateElement) {
            birthdate = birthdateElement.value;
        }

        let phone = '';
        if (phoneElement) {
            phone = phoneElement.value;
            if (phone) {
                phone = phone.trim();
            }
        }

        let gender = 'man';
        if (genderElement) {
            gender = genderElement.value;
        }

        let isValid = true;

        if (!surname) {
            isValid = false;
        }

        if (!name) {
            isValid = false;
        }

        if (!specialization) {
            isValid = false;
        }

        if (courseValue < 1 || courseValue > 10) {
            isValid = false;
        }

        if (!startDate) {
            isValid = false;
        }

        if (!endDate) {
            isValid = false;
        }

        if (!isValid) {
            showNotification('Пожалуйста, заполните все обязательные поля.', 'error');
            return;
        }

        const requestData = {
            surname: surname,
            name: name,
            patronymic: patronymic || null,
            city: city || null,
            specialization: specialization,
            course: courseValue,
            start_date: startDate,
            end_date: endDate,
            birth_date: birthdate || null,
            phone: phone || null,
            gender: gender
        };

        const result = await createRequest(requestData);

        if (result.success) {
            await loadRequests();
            showNotification('Заявка успешно создана!', 'success');
            switchTab('confirmation');
        } else {
            if (result.errors) {
                const errorKeys = Object.keys(result.errors);
                const errorMessages = [];
                for (let index = 0; index < errorKeys.length; index++) {
                    const key = errorKeys[index];
                    const value = result.errors[key];
                    if (Array.isArray(value)) {
                        for (let errorIndex = 0; errorIndex < value.length; errorIndex++) {
                            errorMessages.push(value[errorIndex]);
                        }
                    } else {
                        errorMessages.push(value);
                    }
                }
                showNotification(errorMessages.join('\n'), 'error');
            } else {
                showNotification(result.message, 'error');
            }
        }
    }

    async function handleCancelRequest() {
        if (!currentRequest) {
            return;
        }

        const isConfirmed = confirm('Вы уверены, что хотите отменить заявку?');
        if (!isConfirmed) {
            return;
        }

        const result = await updateRequestStatus(currentRequest.id, 'canceled');

        if (result.success) {
            await loadRequests();
            showNotification('Заявка отменена.', 'success');
            switchTab('confirmation');
        } else {
            showNotification(result.message, 'error');
        }
    }

    // --- Переключение вкладок ---
    function switchTab(tabName) {
        const allNavItems = document.querySelectorAll('.nav-item');
        for (let index = 0; index < allNavItems.length; index++) {
            const navItem = allNavItems[index];
            navItem.classList.remove('active');
        }

        const targetNavItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }

        if (tabName === 'application') {
            renderApplicationForm();
        } else if (tabName === 'confirmation') {
            renderConfirmation();
        }
    }

    // --- Навигация ---
    const allNavItems = document.querySelectorAll('.nav-item');
    for (let index = 0; index < allNavItems.length; index++) {
        const navItem = allNavItems[index];
        navItem.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            if (tabName) {
                switchTab(tabName);
            }
        });
    }

    // --- Инициализация ---
    await loadRequests();
    switchTab('application');

    // Экспорт функций
    window.switchTab = switchTab;
});

// ============================================================
// 6. ПОПАП ПРОФИЛЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const profileIcon = document.getElementById('profile-icon');
    const profilePopup = document.querySelector('.profile');
    const logoutButton = document.querySelector('.logout-button');
    const profileEmailElement = document.querySelector('.profile-email');

    if (!profileIcon || !profilePopup) {
        return;
    }

    const userEmail = sessionStorage.getItem('userEmail') || sessionStorage.getItem('registrationEmail') || 'user@example.com';
    if (profileEmailElement) {
        profileEmailElement.textContent = userEmail;
    }

    profileIcon.addEventListener('click', function(event) {
        event.stopPropagation();
        if (profilePopup.classList.contains('show')) {
            profilePopup.classList.remove('show');
        } else {
            profilePopup.classList.add('show');
        }
    });

    document.addEventListener('click', function(event) {
        const isInsidePopup = profilePopup.contains(event.target);
        const isProfileIcon = event.target === profileIcon;

        if (!isInsidePopup && !isProfileIcon) {
            profilePopup.classList.remove('show');
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            const isConfirmed = confirm('Вы уверены, что хотите выйти?');
            if (!isConfirmed) {
                return;
            }
            await logoutUser();
        });
    }
});
