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
