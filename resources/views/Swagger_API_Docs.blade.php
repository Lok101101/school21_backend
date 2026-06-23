<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Документация API Школа 21</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
    <style>
        html {
            box-sizing: border-box;
            overflow: -webkit-scrollbar;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #fafafa;
        }
        .swagger-ui .info .title {
            font-family: sans-serif;
            color: #1c2d42;
        }
        .auth-wrapper, .authorization__btn {
            display: none !important;
        }
    </style>
</head>
<body>

<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>

<script>
    window.onload = function() {
        const spec = {
            "openapi": "3.0.3",
            "info": {
                "title": "API Школа 21",
                "version": "1.0.0",
                "description": "Не забывайте в каждом запросе передавать заголовок Content-Type: application/json"
            },
            "servers": [
                {
                    "url": "https://school21test.strangled.net/api",
                    "description": "Тестовый сервер API"
                }
            ],
            "tags": [
                {
                    "name": "Аутентификация",
                    "description": "Регистрация, вход и выход из системы"
                },
                {
                    "name": "Верификация Email",
                    "description": "Генерация, отправка и проверка одноразовых кодов"
                },
                {
                    "name": "Заявки на практику",
                    "description": "Создание, получение и управление статусами заявок на практику"
                }
            ],
            "paths": {
                "/register": {
                    "post": {
                        "tags": ["Аутентификация"],
                        "summary": "Регистрация нового пользователя",
                        "description": "Принимает валидные email и пароль. Создает запись в БД, генерирует персональный токен доступа `auth_token` и возвращает его клиенту в cookie. Сам текст ответа пустой. После получения токена браузер сам будет подставлять его при запросах, если у запроса указать credentials: 'include' (Fetch API)",
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/register"
                                    },
                                    "example": {
                                        "email": "student21@gmail.com",
                                        "password": "SecretPassword123",
                                        "password_confirmation": "SecretPassword123"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Пользователь успешно создан. В заголовках возвращается HttpOnly cookie.",
                                "headers": {
                                    "Set-Cookie": {
                                        "schema": {
                                            "type": "string"
                                        },
                                        "description": "Устанавливает токен авторизации на 30 дней."
                                    }
                                }
                            },
                            "422": {
                                "description": "Ошибка валидации данных. Возвращается стандартный массив ошибок Laravel.",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Значение поля email должно быть действительным электронным адресом.",
                                            "errors": {
                                                "email": [
                                                    "Значение поля email должно быть действительным электронным адресом."
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/login": {
                    "post": {
                        "tags": ["Аутентификация"],
                        "summary": "Авторизация",
                        "description": "Проверяет учетные данные пользователя. При успехе генерирует токен и устанавливает его в cookie `auth_token` по аналогии с /register.",
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/login"
                                    },
                                    "example": {
                                        "email": "student21@gmail.com",
                                        "password": "SecretPassword123"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Успешная авторизация. Устанавливается HttpOnly cookie.",
                                "headers": {
                                    "Set-Cookie": {
                                        "schema": {
                                            "type": "string"
                                        }
                                    }
                                }
                            },
                            "401": {
                                "description": "Неверный email или пароль",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Неверный email или пароль"
                                        }
                                    }
                                }
                            },
                            "422": {
                                "description": "Ошибка валидации входных данных (например, передан невалидный email или пустые поля).",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Значение поля email должно быть действительным электронным адресом.",
                                            "errors": {
                                                "email": [
                                                    "Значение поля email должно быть действительным электронным адресом."
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/logout": {
                    "post": {
                        "tags": ["Аутентификация"],
                        "summary": "Выход из системы",
                        "description": "Требует наличия токена в cookie. Удаляет текущий токен доступа из базы данных и очищает сookie `auth_token` на клиенте.",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешный выход. Токен отозван, cookie очищены",
                                "headers": {
                                    "Set-Cookie": {
                                        "schema": {
                                            "type": "string",
                                        },
                                        "description": "Обнуляет cookie удаляя её значение."
                                    }
                                },
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            }
                        }
                    }
                },
                "/email-verify-code": {
                    "post": {
                        "tags": ["Верификация Email"],
                        "summary": "Отправка кода подтверждения почты пользователю",
                        "description": "Требует наличия токена в cookie. Генерирует случайный новый 6-значный цифровой код подтверждения со сроком жизни 5 минут, сохраняет его в БД и отправляет на email пользователя.",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "responses": {
                            "201": {
                                "description": "Код успешно сгенерирован и отправлен.",
                            },
                            "400": {
                                "description": "Почта данного пользователя уже подтверждена.",
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "500": {
                                "description": "Ошибка почтового сервера (SMTP). Ошибка отправки письма."
                            }
                        }
                    }
                },
                "/verify-email": {
                    "post": {
                        "tags": ["Верификация Email"],
                        "summary": "Верификация почты отправленным кодом",
                        "description": "Требует наличия токена в cookie. Проверяет переданный 6-значный код. Если код существует в БД, привязан к текущему пользователю, не был использован ранее и его срок жизни не истёк — email пользователя помечается верифицированным, а код помечается использованным.",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/email-verify-code"
                                    },
                                    "example": {
                                        "code": "582910"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Email успешно верифицирован."
                            },
                            "400": {
                                "description": "Неправильный/истекший код, либо почта уже была подтверждена.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/ErrorResponse"
                                        },
                                        "examples": {
                                            "wrongCode": {
                                                "summary": "Неправильный или устаревший код",
                                                "value": {
                                                    "message": "Неправильный код"
                                                }
                                            },
                                            "alreadyVerified": {
                                                "summary": "Почта уже верифицирована",
                                                "value": {
                                                    "message": "Почта уже подтверждена"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "422": {
                                "description": "Ошибка валидации (поле code отсутствует или не является строкой).",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Поле code обязательно.",
                                            "errors": {
                                                "code": [
                                                    "Поле коде обязательно."
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/requests": {
                    "post": {
                        "tags": ["Заявки на практику"],
                        "summary": "Создание новой заявки на практику",
                        "description": "Требует наличия токена в cookie. Принимает данные от студента, валидирует их и создаёт заявку от имени текущего авторизованного пользователя со статусом `На рассмотрении`",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/CreatePracticeRequest"
                                    },
                                    "example": {
                                        "name": "Иван",
                                        "surname": "Иванов",
                                        "patronymic": "Иванович",
                                        "specialization": "Информационные системы",
                                        "course": 3,
                                        "start_date": "2026-07-01",
                                        "end_date": "2026-08-31"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Заявка успешно создана",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "practice_request": {
                                                    "type": "object",
                                                    "properties": {
                                                        "name": {
                                                            "type": "string",
                                                            "example": "Иван"
                                                        },
                                                        "surname": {
                                                            "type": "string",
                                                            "example": "Иванов"
                                                        },
                                                        "patronymic": {
                                                            "type": "string",
                                                            "example": "Иванович"
                                                        },
                                                        "specialization": {
                                                            "type": "string",
                                                            "example": "Информационные системы"
                                                        },
                                                        "course": {
                                                            "type": "integer",
                                                            "example": 3
                                                        },
                                                        "start_date": {
                                                            "type": "string",
                                                            "format": "date",
                                                            "example": "2026-07-01"
                                                        },
                                                        "end_date": {
                                                            "type": "string",
                                                            "format": "date",
                                                            "example": "2026-08-31"
                                                        },
                                                        "created_at": {
                                                            "type": "string",
                                                            "format": "date-time",
                                                            "example": "2026-06-21T20:00:00.000000Z"
                                                        },
                                                        "updated_at": {
                                                            "type": "string",
                                                            "format": "date-time",
                                                            "example": "2026-06-21T20:05:00.000000Z"
                                                        },
                                                        "id": {
                                                            "type": "integer",
                                                            "example": 1
                                                        },
                                                        "status": {
                                                            "type": "object",
                                                            "description": "Текущий статус заявки",
                                                            "properties": {
                                                                "code": {
                                                                    "type": "string",
                                                                    "example": "pending"
                                                                },
                                                                "name": {
                                                                    "type": "string",
                                                                    "example": "На рассмотрении"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "422": {
                                "description": "Ошибка валидации данных",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Поле name обязательно для заполнения.",
                                            "errors": {
                                                "name": ["Поле name обязательно для заполнения."],
                                                "course": ["Значение поля course должно быть между 1 и 10."],
                                                "end_date": ["Поле end_date должно быть датой после start_date."]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "get": {
                        "tags": ["Заявки на практику"],
                        "summary": "Получение списка всех заявок",
                        "description": "Требует наличия токена в cookie. Возвращает массив всех существующих заявок на практику из базы данных.",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "practice_requests": {
                                                    "type": "array",
                                                    "items": {
                                                        "$ref": "#/components/schemas/PracticeRequestModel"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            }
                        }
                    }
                },
                "/requests/{id}/status": {
                    "patch": {
                        "tags": ["Заявки на практику"],
                        "summary": "Обновление статуса заявки",
                        "description": "Требует наличия токена в cookie. Ищет заявку по параметру `id` из URL. Если заявка не найдена — возвращает 404. Если найдена — обновляет её статус в соответствии с переданным кодом нового статуса и добавляет причину изменения статуса из опционального поля `reason`. Список доступных статусов: `pending`, `accepted`, `rejected`, `canceled`",
                        "security": [
                            {
                                "CookieAuth": []
                            }
                        ],
                        "parameters": [
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "description": "Идентификатор обновляемой заявки на практику.",
                                "schema": {
                                    "type": "integer"
                                }
                            }
                        ],
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/UpdatePracticeRequestStatus"
                                    },
                                    "example": {
                                        "new_status": "rejected",
                                        "reason": "Вы нам не подходите"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Статус успешно обновлен. Возвращается объект обновленной заявки.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "practice_request": {
                                                    "allOf": [
                                                        { "$ref": "#/components/schemas/PracticeRequestModel" },
                                                        {
                                                            "type": "object",
                                                            "properties": {
                                                                "status": {
                                                                    "type": "object",
                                                                    "description": "Человекочитаемое название нового статуса.",
                                                                    "properties": {
                                                                        "code": {
                                                                            "type": "string",
                                                                            "example": "rejected"
                                                                        },
                                                                        "name": {
                                                                            "type": "string",
                                                                            "example": "Отклонена"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "404": {
                                "description": "Заявка с указанным ID не найдена.",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Такой заявки не существует"
                                        }
                                    }
                                }
                            },
                            "422": {
                                "description": "Ошибка валидации (например, передан несуществующий код статуса или" +
                                    " попытка установить статус `canceled` на заявку не со статусом `pending`)",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "wrongCode": {
                                                "summary": "Несуществующий код",
                                                "value": {
                                                    "message": "Значение поля new_status не существует.",
                                                    "errors": {
                                                        "new_status": ["Значение поля new_status не существует."]
                                                    }
                                                }
                                            },
                                            "tryCanceledWithNotPending": {
                                                "summary": "Попытка установить статус `canceled` на заявку не со статусом `pending`",
                                                "value": {
                                                    "message": "Установить статус canceled можно только на заявку со статусом pending"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "components": {
                "securitySchemes": {
                    "CookieAuth": {
                        "type": "apiKey",
                        "in": "cookie",
                        "name": "auth_token",
                        "description": "Laravel Sanctum токен, автоматически передаваемый клиентом в куках запроса. Middleware `SanctumTokenInCookie` извлечет его."
                    }
                },
                "responses": {
                    "401Unauthorized": {
                        "description": "Нет токена в cookie/невалидный или устаревший токен",
                        "content": {
                            "application/json": {
                                "example": {
                                    "message": "Нет токена в cookie"
                                },
                            }
                        },
                    }
                },
                "schemas": {
                    "register": {
                        "type": "object",
                        "required": ["email", "password", "password_confirmation"],
                        "properties": {
                            "email": {
                                "type": "string",
                                "format": "email",
                                "description": "Электронная почта. Должна быть уникальной в таблице `users` (`unique:users,email`)."
                            },
                            "password": {
                                "type": "string",
                                "minLength": 8,
                                "description": "Пароль пользователя. **Строгие правила Laravel Validation Rules:**\n* Минумум 8 символов (`min:8`)\n* Должен содержать буквы (`letters`)\n* Должен содержать цифры (`numbers`)\n* Должен содержать символы в верхнем и нижнем регистрах (`mixedCase`)\n* Должен быть подтвержден полем `password_confirmation` (`confirmed`)"
                            },
                            "password_confirmation": {
                                "type": "string",
                                "description": "Обязательное поле-подтверждение для проверки совпадения с основным паролем."
                            }
                        }
                    },
                    "login": {
                        "type": "object",
                        "required": ["email", "password"],
                        "properties": {
                            "email": {
                                "type": "string",
                                "format": "email",
                                "description": "Электронная почта пользователя."
                            },
                            "password": {
                                "type": "string",
                                "description": "Текущий пароль."
                            }
                        }
                    },
                    "email-verify-code": {
                        "type": "object",
                        "required": ["code"],
                        "properties": {
                            "code": {
                                "type": "string",
                                "description": "Одноразовый 6-значный код безопасности, отправленный ранее на email."
                            }
                        }
                    },
                    "CreatePracticeRequest": {
                        "type": "object",
                        "required": ["name", "surname", "specialization", "course", "start_date", "end_date"],
                        "properties": {
                            "name": {
                                "type": "string",
                                "maxLength": 255,
                                "description": "Имя студента."
                            },
                            "surname": {
                                "type": "string",
                                "maxLength": 255,
                                "description": "Фамилия студента."
                            },
                            "patronymic": {
                                "type": "string",
                                "maxLength": 255,
                                "description": "Отчество студента (если имеется)."
                            },
                            "specialization": {
                                "type": "string",
                                "maxLength": 255,
                                "description": "Направление/специализация обучения."
                            },
                            "course": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 10,
                                "description": "Номер курса (значение от 1 до 10)."
                            },
                            "start_date": {
                                "type": "string",
                                "format": "date",
                                "description": "Дата начала практики. Формат: `ГГГГ-ММ-ДД`. Должна быть не раньше текущего дня."
                            },
                            "end_date": {
                                "type": "string",
                                "format": "date",
                                "description": "Дата окончания практики. Формат: `ГГГГ-ММ-ДД`. Должна быть строго после даты начала (`start_date`)."
                            }
                        }
                    },
                    "UpdatePracticeRequestStatus": {
                        "type": "object",
                        "required": ["new_status"],
                        "properties": {
                            "new_status": {
                                "type": "string",
                                "description": "Текстовый строковый код статуса. Должен обязательно быть существующим кодом статуса.",
                                "enum": ["pending", "accepted", "rejected"]
                            },
                            "reason": {
                                "type": "string",
                                "nullable": true,
                                "example": "Вы нам не подходите",
                                "description": "Причина изменения статуса (необязательное поле)"
                            }
                        }
                    },
                    "PracticeRequestModel": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "example": "Иван"
                            },
                            "surname": {
                                "type": "string",
                                "example": "Иванов"
                            },
                            "patronymic": {
                                "type": "string",
                                "example": "Иванович"
                            },
                            "specialization": {
                                "type": "string",
                                "example": "Информационные системы"
                            },
                            "course": {
                                "type": "integer",
                                "example": 3
                            },
                            "start_date": {
                                "type": "string",
                                "format": "date",
                                "example": "2026-07-01"
                            },
                            "end_date": {
                                "type": "string",
                                "format": "date",
                                "example": "2026-08-31"
                            },
                            "created_at": {
                                "type": "string",
                                "format": "date-time",
                                "example": "2026-06-21T20:00:00.000000Z"
                            },
                            "updated_at": {
                                "type": "string",
                                "format": "date-time",
                                "example": "2026-06-21T20:05:00.000000Z"
                            },
                            "id": {
                                "type": "integer",
                                "example": 1
                            },
                            "status": {
                                "type": "object",
                                "description": "Текущий статус заявки",
                                "properties": {
                                    "code": {
                                        "type": "string",
                                        "example": "rejected"
                                    },
                                    "name": {
                                        "type": "string",
                                        "example": "Отклонена",
                                    },
                                    "change_reason": {
                                        "type": "string",
                                        "example": "Вы нам не подходите"
                                    }
                                }
                            }
                        },
                        "description": "Объект заявки на практику."
                    }
                }
            }
        };

        const ui = SwaggerUIBundle({
            spec: spec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout",
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2
        });
        window.ui = ui;
    };
</script>
</body>
</html>
