// ============================================================
// API КЛИЕНТ - АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
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
// 2. БАЗОВЫЙ API КЛИЕНТ
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
// 3. РЕГИСТРАЦИЯ
// ============================================================

async function registerUser(email, password, passwordConfirmation) {
    const requestBody = {
        email: email,
        password: password,
        password_confirmation: passwordConfirmation
    };

    const result = await apiRequest('/register', 'POST', requestBody, false);

    if (result.ok) {
        const data = result.data || {};
        let token = null;

        if (data.auth_token) {
            token = data.auth_token;
        } else if (data.token) {
            token = data.token;
        } else if (data.access_token) {
            token = data.access_token;
        } else if (data.api_token) {
            token = data.api_token;
        }

        if (token) {
            setAuthToken(token);
            sessionStorage.setItem('registrationEmail', email);
            return {
                success: true
            };
        } else {
            return {
                success: false,
                message: 'Токен не получен от сервера',
                rawData: data
            };
        }
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка регистрации';
        const errorErrors = result.data && result.data.errors ? result.data.errors : {};
        return {
            success: false,
            message: errorMessage,
            errors: errorErrors
        };
    }
}

// ============================================================
// 4. АВТОРИЗАЦИЯ
// ============================================================

async function loginUser(email, password) {
    const requestBody = {
        email: email,
        password: password
    };

    const result = await apiRequest('/login', 'POST', requestBody, false);

    if (result.ok) {
        const data = result.data || {};
        let token = null;

        if (data.auth_token) {
            token = data.auth_token;
        } else if (data.token) {
            token = data.token;
        } else if (data.access_token) {
            token = data.access_token;
        } else if (data.api_token) {
            token = data.api_token;
        }

        if (!token) {
            return {
                success: false,
                message: 'Токен не получен от сервера'
            };
        }

        setAuthToken(token);

        // Получаем данные пользователя
        const userResult = await getCurrentUser();

        if (userResult.success) {
            const user = userResult.user;

            sessionStorage.setItem('userEmail', user.email || email);
            sessionStorage.setItem('userId', user.id);
            sessionStorage.setItem('userName', user.name || user.full_name || '');

            let userRole = 'student';
            if (user.role) {
                userRole = user.role;
            } else if (user.role_name) {
                userRole = user.role_name;
            } else if (user.user_type) {
                userRole = user.user_type;
            }
            sessionStorage.setItem('userRole', userRole);

            if (user.group_id || user.groupId) {
                sessionStorage.setItem('userGroupId', user.group_id || user.groupId);
            }

            sessionStorage.setItem('userData', JSON.stringify(user));

            const lowerRole = userRole.toLowerCase();
            if (lowerRole === 'teamlead' || lowerRole === 'operator' || lowerRole === 'admin' || lowerRole === 'manager') {
                window.location.href = '/teamlid';
            } else {
                window.location.href = '/request';
            }

            return {
                success: true
            };
        } else {
            return {
                success: false,
                message: 'Не удалось получить данные пользователя'
            };
        }
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка входа';
        return {
            success: false,
            message: errorMessage
        };
    }
}

// ============================================================
// 5. ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ============================================================

async function getCurrentUser() {
    const result = await apiRequest('/users/me', 'GET', null, true);

    if (result.ok && result.data) {
        let user = null;
        if (result.data.user) {
            user = result.data.user;
        } else {
            user = result.data;
        }

        return {
            success: true,
            user: user
        };
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка получения данных пользователя';
        return {
            success: false,
            message: errorMessage
        };
    }
}

// ============================================================
// 6. ПРОВЕРКА АВТОРИЗАЦИИ
// ============================================================

async function checkAuth() {
    // Проверяем наличие токена
    const token = getAuthToken();
    if (!token) {
        return {
            isAuthenticated: false
        };
    }

    // Проверяем наличие данных в sessionStorage
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');

    if (userId && userRole) {
        return {
            isAuthenticated: true,
            user: {
                id: userId,
                email: sessionStorage.getItem('userEmail'),
                name: sessionStorage.getItem('userName'),
                role: userRole,
                groupId: sessionStorage.getItem('userGroupId')
            }
        };
    }

    // Пробуем получить данные с бэкенда
    const result = await getCurrentUser();

    if (result.success) {
        const user = result.user;

        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('userName', user.name || user.full_name || '');

        let userRole = 'student';
        if (user.role) {
            userRole = user.role;
        } else if (user.role_name) {
            userRole = user.role_name;
        } else if (user.user_type) {
            userRole = user.user_type;
        }
        sessionStorage.setItem('userRole', userRole);

        if (user.group_id || user.groupId) {
            sessionStorage.setItem('userGroupId', user.group_id || user.groupId);
        }

        sessionStorage.setItem('userData', JSON.stringify(user));

        return {
            isAuthenticated: true,
            user: user
        };
    }

    return {
        isAuthenticated: false
    };
}

// ============================================================
// 7. ВЫХОД ИЗ СИСТЕМЫ
// ============================================================

async function logoutUser() {
    const result = await apiRequest('/logout', 'POST', null, true);

    removeAuthToken();
    sessionStorage.clear();
    localStorage.removeItem('auth_token');

    if (result.ok) {
        window.location.href = 'authorization.html';
    } else {
        window.location.href = 'authorization.html';
    }
}

// ============================================================
// 8. ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (СИНХРОННО)
// ============================================================

function getCurrentUserSync() {
    const email = sessionStorage.getItem('userEmail');
    const id = sessionStorage.getItem('userId');
    const name = sessionStorage.getItem('userName');
    const role = sessionStorage.getItem('userRole');
    const groupId = sessionStorage.getItem('userGroupId');
    const userDataString = sessionStorage.getItem('userData');

    let parsedUserData = null;
    if (userDataString) {
        try {
            parsedUserData = JSON.parse(userDataString);
        } catch (parseError) {
            parsedUserData = null;
        }
    }

    const finalRole = role || 'student';
    const isTeamlead = finalRole === 'teamlead' || finalRole === 'admin' || finalRole === 'operator' || finalRole === 'manager';

    return {
        id: id,
        email: email,
        name: name,
        role: finalRole,
        groupId: groupId,
        userData: parsedUserData,
        isTeamlead: isTeamlead
    };
}

// ============================================================
// 9. ОТПРАВКА КОДА ПОДТВЕРЖДЕНИЯ
// ============================================================

async function sendVerificationCode() {
    const token = getAuthToken();

    if (!token) {
        return {
            success: false,
            message: 'Токен отсутствует. Пожалуйста, войдите заново.'
        };
    }

    const result = await apiRequest('/email-verify-code', 'POST', null, true);

    if (result.ok) {
        return {
            success: true
        };
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Ошибка отправки кода';
        return {
            success: false,
            message: errorMessage
        };
    }
}

// ============================================================
// 10. ПРОВЕРКА КОДА ПОДТВЕРЖДЕНИЯ
// ============================================================

async function verifyEmail(code) {
    const requestBody = {
        code: code
    };

    const result = await apiRequest('/verify-email', 'POST', requestBody, true);

    if (result.ok) {
        return {
            success: true
        };
    } else {
        const errorMessage = result.data && result.data.message ? result.data.message : 'Неверный или просроченный код';
        return {
            success: false,
            message: errorMessage
        };
    }
}

// ============================================================
// 11. ВАЛИДАЦИЯ
// ============================================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
}

function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    return minLength && hasLetters && hasNumbers && hasMixedCase;
}

// ============================================================
// 12. УВЕДОМЛЕНИЯ
// ============================================================

function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');

    if (!container) {
        const tempContainer = document.createElement('div');
        tempContainer.id = 'notification-container';
        tempContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            width: 100%;
        `;
        document.body.appendChild(tempContainer);
        container = tempContainer;
    }

    // Цвета для разных типов уведомлений
    let backgroundColor = '#17a2b8'; // info - синий
    let textColor = '#ffffff';

    if (type === 'error') {
        backgroundColor = '#dc3545'; // красный
        textColor = '#ffffff';
    } else if (type === 'success') {
        backgroundColor = '#28a745'; // зелёный
        textColor = '#ffffff';
    } else if (type === 'warning') {
        backgroundColor = '#ffc107'; // жёлтый
        textColor = '#212529';
    } else if (type === 'info') {
        backgroundColor = '#17a2b8'; // синий
        textColor = '#ffffff';
    }

    const notificationElement = document.createElement('div');
    notificationElement.style.cssText = `
        padding: 14px 20px;
        border-radius: 8px;
        color: ${textColor};
        background: ${backgroundColor};
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        opacity: 0;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(255,255,255,0.1);
    `;
    notificationElement.textContent = message;
    container.appendChild(notificationElement);

    // Анимация появления
    requestAnimationFrame(function() {
        notificationElement.style.transform = 'translateX(0)';
        notificationElement.style.opacity = '1';
    });

    // Автоматическое скрытие через 4 секунды
    setTimeout(function() {
        notificationElement.style.transform = 'translateX(120%)';
        notificationElement.style.opacity = '0';
        setTimeout(function() {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, 400);
    }, 4000);

    // Возвращаем элемент для возможности ручного закрытия
    return notificationElement;
}

// ============================================================
// 13. ЗАЩИТА ОТ БРУТФОРСА
// ============================================================

function getLoginAttempts() {
    const attempts = sessionStorage.getItem('loginAttempts');
    if (attempts) {
        return parseInt(attempts, 10);
    }
    return 0;
}

function incrementLoginAttempts() {
    const currentAttempts = getLoginAttempts();
    const newAttempts = currentAttempts + 1;
    sessionStorage.setItem('loginAttempts', String(newAttempts));
}

function resetLoginAttempts() {
    sessionStorage.removeItem('loginAttempts');
}

// ============================================================
// 14. ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- РЕГИСТРАЦИЯ ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const passwordConfirmInput = document.getElementById('reg-password-confirm');
        const checkbox = document.getElementById('agree');
        const submitButton = document.getElementById('register-submit');

        if (submitButton) {
            submitButton.addEventListener('click', async function(event) {
                event.preventDefault();

                // Блокируем кнопку
                submitButton.disabled = true;
                submitButton.textContent = 'Регистрация...';

                let email = '';
                if (emailInput) {
                    email = emailInput.value;
                    if (email) {
                        email = email.trim();
                    }
                }

                let password = '';
                if (passwordInput) {
                    password = passwordInput.value;
                }

                let passwordConfirm = '';
                if (passwordConfirmInput) {
                    passwordConfirm = passwordConfirmInput.value;
                }

                let isAgreed = false;
                if (checkbox) {
                    isAgreed = checkbox.checked;
                }

                // Валидация
                if (!email || !validateEmail(email)) {
                    showNotification('Введите корректный email (например, user@example.com)', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зарегистрироваться';
                    return;
                }

                if (!password || !validatePassword(password)) {
                    showNotification('Пароль должен содержать минимум 8 символов, буквы (верхний и нижний регистр) и цифры.', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зарегистрироваться';
                    return;
                }

                if (password !== passwordConfirm) {
                    showNotification('Пароли не совпадают', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зарегистрироваться';
                    return;
                }

                if (!isAgreed) {
                    showNotification('Необходимо согласиться на обработку персональных данных', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зарегистрироваться';
                    return;
                }

                try {
                    const result = await registerUser(email, password, passwordConfirm);

                    if (result.success) {
                        const token = getAuthToken();

                        if (!token) {
                            showNotification('Ошибка: токен не сохранен. Попробуйте войти вручную.', 'error');
                            submitButton.disabled = false;
                            submitButton.textContent = 'Зарегистрироваться';
                            return;
                        }

                        sessionStorage.setItem('registrationEmail', email);

                        showNotification('Отправка кода подтверждения...', 'info');

                        const codeResult = await sendVerificationCode();

                        if (codeResult.success) {
                            showNotification('Регистрация успешна! Код подтверждения отправлен на почту.', 'success');
                            setTimeout(function() {
                                window.location.href = '/verification';
                            }, 1500);
                        } else {
                            showNotification('Регистрация успешна, но не удалось отправить код: ' + codeResult.message, 'error');
                            setTimeout(function() {
                                window.location.href = '/verification';
                            }, 2000);
                        }
                    } else {
                        if (result.errors && result.errors.email) {
                            showNotification(result.errors.email[0], 'error');
                        } else if (result.errors && result.errors.password) {
                            showNotification(result.errors.password[0], 'error');
                        } else {
                            showNotification(result.message, 'error');
                        }
                        submitButton.disabled = false;
                        submitButton.textContent = 'Зарегистрироваться';
                    }
                } catch (error) {
                    console.error('Ошибка регистрации:', error);
                    showNotification('Произошла ошибка. Попробуйте позже.', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зарегистрироваться';
                }
            });
        }
    }

    // --- АВТОРИЗАЦИЯ ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const submitButton = document.getElementById('login-submit');

        if (submitButton) {
            submitButton.addEventListener('click', async function(event) {
                event.preventDefault();

                let email = '';
                if (emailInput) {
                    email = emailInput.value;
                    if (email) {
                        email = email.trim();
                    }
                }

                let password = '';
                if (passwordInput) {
                    password = passwordInput.value;
                }

                const attempts = getLoginAttempts();

                if (attempts >= 5) {
                    showNotification('Слишком много попыток входа. Попробуйте через 30 секунд.', 'error');
                    submitButton.disabled = true;
                    submitButton.style.opacity = '0.6';

                    setTimeout(function() {
                        submitButton.disabled = false;
                        submitButton.style.opacity = '1';
                        resetLoginAttempts();
                    }, 30000);

                    return;
                }

                if (!email || !validateEmail(email)) {
                    showNotification('Введите корректный email', 'error');
                    return;
                }

                if (!password) {
                    showNotification('Введите пароль', 'error');
                    return;
                }

                // Блокируем кнопку
                submitButton.disabled = true;
                submitButton.textContent = 'Вход...';

                try {
                    const result = await loginUser(email, password);

                    if (result.success) {
                        resetLoginAttempts();
                        showNotification('Вход выполнен успешно!', 'success');
                    } else {
                        if (passwordInput) {
                            passwordInput.value = '';
                        }
                        incrementLoginAttempts();
                        showNotification(result.message, 'error');
                        submitButton.disabled = false;
                        submitButton.textContent = 'Войти';
                    }
                } catch (error) {
                    console.error('Ошибка входа:', error);
                    showNotification('Произошла ошибка. Попробуйте позже.', 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Войти';
                }
            });
        }
    }

    // --- ВЕРИФИКАЦИЯ ---
    const verificationForm = document.getElementById('verification-form');
    if (verificationForm) {
        // Проверка токена при загрузке страницы
        const token = getAuthToken();

        if (!token) {
            showNotification('Сессия не найдена. Пожалуйста, зарегистрируйтесь заново.', 'error');
            setTimeout(function() {
                window.location.href = '/register';
            }, 3000);
        } else {
            // Автоматически отправляем код, если его еще не отправляли
            const codeSent = sessionStorage.getItem('verificationCodeSent');
            if (!codeSent) {
                const sendCodeResult = sendVerificationCode();
                sendCodeResult.then(function(result) {
                    if (result.success) {
                        showNotification('Код подтверждения отправлен на вашу почту', 'success');
                        sessionStorage.setItem('verificationCodeSent', 'true');
                    } else {
                        showNotification('Не удалось отправить код: ' + result.message, 'error');
                    }
                });
            }
        }

        const codeInput = document.getElementById('code-input');
        const verifyButton = document.getElementById('verify-btn');
        const resendLink = document.getElementById('resend-code');

        if (verifyButton) {
            verifyButton.addEventListener('click', async function(event) {
                event.preventDefault();

                let code = '';
                if (codeInput) {
                    code = codeInput.value;
                    if (code) {
                        code = code.trim();
                    }
                }

                if (code.length !== 6 || isNaN(code)) {
                    showNotification('Введите 6-значный числовой код', 'error');
                    return;
                }

                verifyButton.disabled = true;
                verifyButton.textContent = 'Проверка...';

                try {
                    const result = await verifyEmail(code);

                    if (result.success) {
                        showNotification('Email подтверждён!', 'success');
                        sessionStorage.removeItem('verificationCodeSent');
                        setTimeout(function() {
                            window.location.href = '/';
                        }, 1500);
                    } else {
                        showNotification(result.message, 'error');
                        verifyButton.disabled = false;
                        verifyButton.textContent = 'Подтвердить';
                    }
                } catch (error) {
                    console.error('Ошибка верификации:', error);
                    showNotification('Произошла ошибка. Попробуйте позже.', 'error');
                    verifyButton.disabled = false;
                    verifyButton.textContent = 'Подтвердить';
                }
            });
        }

        if (resendLink) {
            resendLink.addEventListener('click', async function(event) {
                event.preventDefault();

                const currentToken = getAuthToken();

                if (!currentToken) {
                    showNotification('Сессия истекла. Перерегистрируйтесь.', 'error');
                    window.location.href = '/register';
                    return;
                }

                resendLink.style.opacity = '0.5';
                resendLink.style.pointerEvents = 'none';
                resendLink.textContent = 'Отправка...';

                try {
                    const result = await sendVerificationCode();

                    if (result.success) {
                        showNotification('Код отправлен повторно на вашу почту', 'success');
                        sessionStorage.setItem('verificationCodeSent', 'true');
                    } else {
                        showNotification(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка отправки кода:', error);
                    showNotification('Произошла ошибка. Попробуйте позже.', 'error');
                } finally {
                    resendLink.style.opacity = '1';
                    resendLink.style.pointerEvents = 'auto';
                    resendLink.textContent = 'Отправить код повторно';
                }
            });
        }
    }
});

// ============================================================
// 15. ОТЛАДОЧНЫЕ ФУНКЦИИ
// ============================================================

async function checkAndShowAuth() {
    const result = await checkAuth();
    return result;
}

function logout() {
    removeAuthToken();
    sessionStorage.clear();
    localStorage.removeItem('auth_token');
    showNotification('Вы вышли из системы', 'info');
    window.location.href = '/';
}

// ============================================================
// 16. ЭКСПОРТ
// ============================================================

window.apiRequest = apiRequest;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserSync = getCurrentUserSync;
window.checkAuth = checkAuth;
window.checkAndShowAuth = checkAndShowAuth;
window.sendVerificationCode = sendVerificationCode;
window.verifyEmail = verifyEmail;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.showNotification = showNotification;
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
