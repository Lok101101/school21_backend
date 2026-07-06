// ============================================================
// API СЕРВИС
// ============================================================
class ApiService {
    constructor() {
        this.API_BASE = window.API_BASE || 'http://127.0.0.1:8000/api';
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    async request(endpoint, method = 'GET', body = null, needAuth = true) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (needAuth) {
                const currentToken = this.token || localStorage.getItem('auth_token');
                if (currentToken) {
                    headers['Authorization'] = 'Bearer ' + currentToken;
                }
            }

            const requestOptions = {
                method: method,
                headers: headers
            };

            if (body) {
                requestOptions.body = JSON.stringify(body);
            }

            const fullUrl = this.API_BASE + endpoint;
            const response = await fetch(fullUrl, requestOptions);

            const responseText = await response.text();
            let responseData = null;

            if (responseText) {
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    responseData = { message: responseText };
                }
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.setToken(null);
                    throw new Error('Сессия истекла');
                }

                const errorMessage = responseData?.message || 'Ошибка ' + response.status;
                throw new Error(errorMessage);
            }

            return {
                ok: true,
                data: responseData
            };

        } catch (error) {
            console.error('API Error:', error);
            return {
                ok: false,
                error: error.message
            };
        }
    }
}
