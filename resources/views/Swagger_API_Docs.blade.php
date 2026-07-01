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
                "description": "<h4>Не забывайте в каждом запросе передавать заголовки Content-Type: application/json и Accept: application/json<br><br>" +
                    "Для доступа к защищенным методам необходимо передавать токен в заголовке Authorization: Bearer {token}<br><br>" +
                    "Уже зарегистрированные аккаунты для тестирования:<br>" +
                    "С ролью student:<br> " +
                    "email: student1@gmail.com (почта уже подтверждена)<br>" +
                    "password: Test12345<br>" +
                    "Другие аккаунты с ролью student доступны на почтах student2@gmail.com, student3@gmail.com, " +
                    "student4@gmail.com, student5@gmail.com (пароль везде тот же)<br><br>" +
                    "С ролью teamlead (город Уфа):<br>" +
                    "email: teamlead@gmail.com<br>" +
                    "password: Test12345</h4>"
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
                        "description": "Принимает валидные email и пароль. Создает запись в БД, генерирует персональный токен доступа `auth_token` и возвращает его в теле ответа.",
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
                                "description": "Пользователь успешно создан. Возвращается токен авторизации.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "auth_token": {
                                                    "type": "string",
                                                    "description": "Персональный токен доступа (Bearer)."
                                                }
                                            }
                                        }
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
                        "description": "Проверяет учетные данные пользователя. При успехе генерирует токен и возвращает его в теле ответа.",
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
                                "description": "Успешная авторизация. Возвращается токен доступа.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "auth_token": {
                                                    "type": "string"
                                                }
                                            }
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
                        "description": "Требует наличия Bearer токена в заголовке Authorization. Удаляет текущий токен доступа из базы данных.",
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешный выход. Токен отозван",
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
                        "description": "Требует авторизации. Генерирует случайный новый 6-значный цифровой код подтверждения со сроком жизни 5 минут, сохраняет его в БД и отправляет на email пользователя.",
                        "security": [
                            {
                                "BearerAuth": []
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
                        "description": "Требует авторизации. Проверяет переданный 6-значный код. Если код существует в БД, привязан к текущему пользователю, не был использован ранее и его срок жизни не истёк — email пользователя помечается верифицированным, а код помечается использованным.",
                        "security": [
                            {
                                "BearerAuth": []
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
                    "get": {
                        "tags": ["Заявки на практику"],
                        "summary": "Получение списка всех заявок из города тимлида",
                        "description": "Требует авторизации, подтверждённого email и роли `teamlead`. Возвращает массив всех существующих заявок на практику из города тимлида.",
                        "security": [
                            {
                                "BearerAuth": []
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
                            },
                            "403": {
                                "description": "Не подтверждена почта/отсутствует роль teamlead",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "trySetNotCanceledStatusWithoutTeamleadRole": {
                                                "summary": "Нет роли teamlead",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    },
                    "post": {
                        "tags": ["Заявки на практику"],
                        "summary": "Создание новой заявки на практику",
                        "description": "Требует авторизации и подтверждённого email. Принимает данные от " +
                            "студента, валидирует их и создаёт заявку от имени текущего авторизованного пользователя " +
                            "со статусом `На рассмотрении`. Если у пользователя уже есть активная практика/заявка на рассмотрении/три заявки за последнюю неделю — возвращает " +
                            "ошибку",
                        "security": [
                            {
                                "BearerAuth": []
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
                                        "city": "Уфа",
                                        "phone": "79990000000",
                                        "birth_date": "2006-05-04",
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
                                                        "city": {
                                                            "type": "string",
                                                            "example": "Уфа"
                                                        },
                                                        "phone": {
                                                            "type": "string",
                                                            "example": "79990000000"
                                                        },
                                                        "birth_date": {
                                                            "type": "string",
                                                            "format": "date",
                                                            "example": "2006-05-04"
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
                            "403": {
                                "description": "Почта не подтверждена",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Почта не подтверждена"
                                        }
                                    }
                                }
                            },
                            "422": {
                                "description": "Ошибка валидации данных / Есть активная практика / Есть заявка на рассмотрении / Подано уже 3 заявки за неделю",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "validationError": {
                                                "summary": "Ошибка валидации",
                                                "value": {
                                                    "message": "Поле name обязательно для заполнения.",
                                                    "errors": {
                                                        "name": ["Поле name обязательно для заполнения."],
                                                        "course": ["Значение поля course должно быть между 1 и 10."],
                                                        "end_date": ["Поле end_date должно быть датой после start_date."]
                                                    }
                                                }
                                            },
                                            "hasActivePracticeError": {
                                                "summary": "Есть активная практика",
                                                "value": {
                                                    "message": "У пользователя уже есть активная практика"
                                                }
                                            },
                                            "hasPendingRequestError": {
                                                "summary": "Есть заявка на рассмотрении",
                                                "value": {
                                                    "message": "У пользователя есть заявка на рассмотрении"
                                                }
                                            },
                                            "hasThreeRequestsPerLastWeekError": {
                                                "summary": "Три заявки за последнюю неделю",
                                                "value": {
                                                    "message": "Пользователь подал уже 3 заявки за неделю"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/requests/my": {
                    "get": {
                        "tags": ["Заявки на практику"],
                        "summary": "Получение списка всех заявок пользователя",
                        "description": "Требует авторизации и подтверждённого email. Возвращает " +
                            "список всех заявок текущего авторизованного пользователя",
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "practice_requests": [
                                                {
                                                    "id": 1,
                                                    "name": "Иван",
                                                    "surname": "Иванов",
                                                    "patronymic": "Иванович",
                                                    "city": "Уфа",
                                                    "phone": "79990000000",
                                                    "birth_date": "2006-05-04",
                                                    "specialization": "Backend Web Developer",
                                                    "course": 3,
                                                    "start_date": "2026-09-01",
                                                    "end_date": "2026-10-31",
                                                    "created_at": "2026-06-23T19:47:00.000000Z",
                                                    "updated_at": "2026-06-23T20:37:38.000000Z",
                                                    "status": {
                                                        "code": "rejected",
                                                        "name": "Отклонена",
                                                        "change_reason": "Вы нам не подходите"
                                                    }
                                                },
                                                {
                                                    "id": 3,
                                                    "name": "Иван",
                                                    "surname": "Иванов",
                                                    "patronymic": "Иванович",
                                                    "city": "Уфа",
                                                    "phone": "79990000000",
                                                    "birth_date": "2006-05-04",
                                                    "specialization": "Backend Web Developer",
                                                    "course": 3,
                                                    "start_date": "2026-09-01",
                                                    "end_date": "2026-10-31",
                                                    "created_at": "2026-06-23T20:47:39.000000Z",
                                                    "updated_at": "2026-06-23T20:47:39.000000Z",
                                                    "status": {
                                                        "code": "pending",
                                                        "name": "На рассмотрении"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            "401": {
                                "description": "Токен отсутствует или недействителен",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Unauthenticated."
                                        },
                                    }
                                },
                            },
                            "403": {
                                "description": "Почта не подтверждена",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Почта не подтверждена"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/requests/{id}/status": {
                    "patch": {
                        "tags": ["Заявки на практику"],
                        "summary": "Обновление статуса заявки",
                        "description": "Требует авторизации и подтверждённого email. " +
                            "Для изменения статуса на `accepted` или `rejected` требуется " +
                            "роль `teamlead`. Поменять статус на `canceled` может сам пользователь для своей заявки. " +
                            "<br><br>Ищет заявку по параметру `id` из URL. Если заявка не найдена — возвращает 404. " +
                            "Если найдена — обновляет её статус в соответствии с переданным кодом нового " +
                            "статуса и добавляет причину изменения статуса из опционального поля `reason`. " +
                            "Если статус меняется на `accepted` — создаёт новую группу практики, либо берёт " +
                            "уже существующую и добавляет туда пользователя. При смене статуса на `accepted` или `rejected` " +
                            "пользователю отправляется уведомление на почту и сайт через вебсокеты.<br> " +
                            "Список доступных статусов: `accepted`, `rejected`, `canceled` (статус `pending` устанавливается автоматически при создании)",
                        "security": [
                            {
                                "BearerAuth": []
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
                            "403": {
                                "description": "Доступ запрещён (не подтверждена почта / попытка сменить статус без прав / изменение чужой заявки)",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "trySetNotCanceledStatusWithoutTeamleadRole": {
                                                "summary": "Нет прав доступа / изменение чужой заявки",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
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
                                    " попытка изменить статус у заявки не со статусом `pending`)",
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
                                            "tryChangeWithNotPending": {
                                                "summary": "Попытка изменить статус заявки не со статусом pending",
                                                "value": {
                                                    "message": "Изменить статус можно только у заявки со статусом pending"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/groups/my": {
                    "get": {
                        "summary": "Получение списка групп пользователя",
                        "description": "Требует авторизации и подтверждённого email. Возвращает массив всех существующих групп практик пользователя",
                        "tags": ["Группы практик"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка групп.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "user_groups": {
                                                    "type": "array",
                                                    "description": "Массив групп практик пользователя",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": { "type": "integer", "description": "ID группы" },
                                                            "name": { "type": "string", "description": "Название группы" },
                                                            "city": { "type": "string", "description": "Город практики" },
                                                            "start_date": { "type": "string", "format": "date", "description": "Дата начала" },
                                                            "end_date": { "type": "string", "format": "date", "description": "Дата окончания" },
                                                            "created_at": { "type": "string", "format": "date-time", "description": "Дата создания" },
                                                            "updated_at": { "type": "string", "format": "date-time", "description": "Дата обновления" },
                                                            "is_active": { "type": "boolean", "description": "Флаг активности группы" }
                                                        }
                                                    }
                                                }
                                            },
                                            "example": {
                                                "user_groups": [
                                                    {
                                                        "id": 6,
                                                        "name": "01.09.2026 - 31.10.2026",
                                                        "city": "Уфа",
                                                        "start_date": "2026-09-01",
                                                        "end_date": "2026-05-31",
                                                        "created_at": "2026-06-26T08:49:16.000000Z",
                                                        "updated_at": "2026-06-26T08:49:16.000000Z",
                                                        "is_active": false
                                                    },
                                                    {
                                                        "id": 7,
                                                        "name": "01.09.2026 - 31.10.2026",
                                                        "city": "Уфа",
                                                        "start_date": "2026-09-01",
                                                        "end_date": "2026-10-31",
                                                        "created_at": "2026-06-26T08:50:04.000000Z",
                                                        "updated_at": "2026-06-26T08:50:04.000000Z",
                                                        "is_active": true
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "403": {
                                "$ref": "#/components/responses/emailNotVerified"
                            },
                        }
                    }
                },
                "/groups": {
                    "get": {
                        "summary": "Получение списка всех групп из города тимлида",
                        "description": "Требует авторизации, подтверждённого email и роли `teamlead`. " +
                            "Возвращает массив всех существующих групп практик из города тимлида",
                        "tags": ["Группы практик"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка групп.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "groups": {
                                                    "type": "array",
                                                    "description": "Массив групп практик",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": { "type": "integer", "description": "ID группы" },
                                                            "name": { "type": "string", "description": "Название группы" },
                                                            "city": { "type": "string", "description": "Город практики" },
                                                            "start_date": { "type": "string", "format": "date", "description": "Дата начала" },
                                                            "end_date": { "type": "string", "format": "date", "description": "Дата окончания" },
                                                            "created_at": { "type": "string", "format": "date-time", "description": "Дата создания" },
                                                            "updated_at": { "type": "string", "format": "date-time", "description": "Дата обновления" },
                                                            "is_active": { "type": "boolean", "description": "Флаг активности группы" }
                                                        }
                                                    }
                                                }
                                            },
                                            "example": {
                                                "groups": [
                                                    {
                                                        "id": 6,
                                                        "name": "01.09.2026 - 31.10.2026",
                                                        "city": "Уфа",
                                                        "start_date": "2026-09-01",
                                                        "end_date": "2026-05-31",
                                                        "created_at": "2026-06-26T08:49:16.000000Z",
                                                        "updated_at": "2026-06-26T08:49:16.000000Z",
                                                        "is_active": false
                                                    },
                                                    {
                                                        "id": 7,
                                                        "name": "01.09.2026 - 31.10.2026",
                                                        "city": "Уфа",
                                                        "start_date": "2026-09-01",
                                                        "end_date": "2026-10-31",
                                                        "created_at": "2026-06-26T08:50:04.000000Z",
                                                        "updated_at": "2026-06-26T08:50:04.000000Z",
                                                        "is_active": true
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "403": {
                                "description": "Не подтверждена почта/отсутствует роль teamlead",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "trySetNotCanceledStatusWithoutTeamleadRole": {
                                                "summary": "Нет роли teamlead",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                },
                "/groups/{id}/members": {
                    "get": {
                        "summary": "Получение списка участников группы",
                        "description": "Требует авторизации и подтверждённого email. Возвращает список всех участников указанной в параметре `id` группы. " +
                            "Тимлид может получать участников любой группы своего города. Студент может получать участников " +
                            "только той группы, в которой он состоит.",
                        "tags": ["Группы практик"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "parameters": [
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "description": "Идентификатор группы",
                                "schema": {
                                    "type": "integer"
                                }
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка участников.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "group_members": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": { "type": "integer", "description": "ID пользователя" },
                                                            "name": { "type": "string", "description": "Имя студента" },
                                                            "surname": { "type": "string", "description": "Фамилия студента" },
                                                            "patronymic": { "type": "string", "description": "Отчество студента" }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "example": {
                                            "group_members": [
                                                {
                                                    "id": 12,
                                                    "name": "Иван",
                                                    "surname": "Иванов",
                                                    "patronymic": "Иванович"
                                                },
                                                {
                                                    "id": 15,
                                                    "name": "Петр",
                                                    "surname": "Петров",
                                                    "patronymic": "Петрович"
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "403": {
                                "description": "Доступ запрещён (не подтверждена почта / пользователь не в группе / тимлид другого города)",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "accessDenied": {
                                                "summary": "Доступ запрещён",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "404": {
                                "description": "Группа не найдена",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Такой группы не существует"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/groups/{id}/messages": {
                    "get": {
                        "summary": "Получение истории сообщений группы",
                        "description": "Требует авторизации и подтверждённого email. Возвращает массив сообщений указанной в " +
                            "параметре `id` группы с данными об отправителях. " +
                            "Тимлид может получать сообщения любой группы своего города. Студент может получать сообщения " +
                            "только той группы, в которой он состоит.",
                        "tags": ["Группы практик"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "parameters": [
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "description": "Идентификатор группы",
                                "schema": {
                                    "type": "integer"
                                }
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение списка сообщений.",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "group_messages": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": { "type": "integer", "description": "ID сообщения" },
                                                            "text": { "type": "string", "description": "Текст сообщения" },
                                                            "created_at": { "type": "string", "format": "date-time", "description": "Дата и время отправки" },
                                                            "senderInfo": {
                                                                "type": "object",
                                                                "properties": {
                                                                    "id": { "type": "integer", "description": "ID отправителя" },
                                                                    "name": { "type": "string", "description": "Имя" },
                                                                    "surname": { "type": "string", "description": "Фамилия" },
                                                                    "patronymic": { "type": "string", "description": "Отчество" }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "example": {
                                            "group_messages": [
                                                {
                                                    "id": 1,
                                                    "text": "Привет всем!",
                                                    "created_at": "2026-06-28T10:00:00.000000Z",
                                                    "senderInfo": {
                                                        "id": 12,
                                                        "name": "Иван",
                                                        "surname": "Иванов",
                                                        "patronymic": "Иванович"
                                                    }
                                                },
                                                {
                                                    "id": 2,
                                                    "text": "Как успехи с практикой?",
                                                    "created_at": "2026-06-28T10:05:00.000000Z",
                                                    "senderInfo": {
                                                        "id": 5,
                                                        "name": "Тимлид",
                                                        "surname": "Тимлид",
                                                        "patronymic": "Тимлид"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "403": {
                                "description": "Доступ запрещён (не подтверждена почта / пользователь не в группе / тимлид другого города)",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "accessDenied": {
                                                "summary": "Доступ запрещён",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "404": {
                                "description": "Группа не найдена",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Такой группы не существует"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "post": {
                        "summary": "Отправка сообщения в группу",
                        "description": "Требует авторизации, подтверждённого email и нахождение пользователя " +
                            "в группе. Принимает текст сообщения от пользователя, ищет группу по параметру `id` из URL, " +
                            "создаёт сообщение в базе и рассылает его всем участникам группы",
                        "tags": ["Группы практик"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "parameters": [
                            {
                                "name": "id",
                                "in": "path",
                                "required": true,
                                "description": "Идентификатор группы, в которую будет отправлено сообщение",
                            }
                        ],
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "text": {
                                                "type": "string",
                                                "description": "Текст сообщения",
                                            }
                                        }
                                    },
                                    "example": {
                                        "text": "Текст сообщения"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Успешная отправка сообщения"
                            },
                            "401": {
                                "$ref": "#/components/responses/401Unauthorized"
                            },
                            "403": {
                                "description": "Почта не подтверждена/пользователь не состоит в этой группе",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "unverifiedEmail": {
                                                "summary": "Не подтверждена почта",
                                                "value": {
                                                    "message": "Почта не подтверждена"
                                                }
                                            },
                                            "userIsNotMember": {
                                                "summary": "Пользователь не состоит в этой группе",
                                                "value": {
                                                    "message": "Доступ запрещён"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "404": {
                                "description": "Группа с указанным ID не найдена",
                                "content": {
                                    "application/json": {
                                        "example": {
                                            "message": "Такой группы не существует"
                                        }
                                    }
                                }
                            },
                            "422": {
                                "description": "Ошибка валидации/группа неактивна",
                                "content": {
                                    "application/json": {
                                        "examples": {
                                            "validationError": {
                                                "summary": "Ошибка валидации",
                                                "value": {
                                                    "message": "Поле text обязательно.",
                                                    "errors": {
                                                        "text": [
                                                            "Поле text обязательно."
                                                        ]
                                                    }
                                                }
                                            },
                                            "groupIsInactive": {
                                                "summary": "Группа неактивна",
                                                "value": {
                                                    "message": "Группа неактивна"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                },
                "/users/me": {
                    "get": {
                        "summary": "Получение ID и роли пользователя",
                        "description": "Требует авторизации. Возвращает ID и роль текущего авторизованного пользователя",
                        "tags": ["Пользователи"],
                        "security": [
                            {
                                "BearerAuth": []
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Успешное получение информации",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "integer",
                                                    "description": "Идентификатор пользователя"
                                                },
                                                "role": {
                                                    "type": "string",
                                                    "description": "Роль пользователя"
                                                }
                                            },
                                            "example": {
                                                "id": 6,
                                                "role": "student"
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
                }
            },
            "components": {
                "securitySchemes": {
                    "BearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT",
                        "description": "Передайте полученный при логине токен в заголовке Authorization: Bearer {token}"
                    }
                },
                "responses": {
                    "401Unauthorized": {
                        "description": "Токен отсутствует или недействителен",
                        "content": {
                            "application/json": {
                                "example": {
                                    "message": "Unauthenticated."
                                }
                            }
                        },
                    },
                    "emailNotVerified": {
                        "description": "Почта не подтверждена",
                        "content": {
                            "application/json": {
                                "example": {
                                    "message": "Почта не подтверждена"
                                }
                            }
                        }
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
                    "ErrorResponse": {
                        "type": "object",
                        "properties": {
                            "message": {
                                "type": "string",
                                "description": "Сообщение об ошибке."
                            },
                            "errors": {
                                "type": "object",
                                "description": "Детальные ошибки валидации (если есть)."
                            }
                        }
                    },
                    "CreatePracticeRequest": {
                        "type": "object",
                        "required": ["name", "surname", "city", "phone", "birth_date", "specialization", "course", "start_date", "end_date"],
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
                            "city": {
                                "type": "string",
                                "maxLength": 50,
                                "description": "Город, в котором планируется практика."
                            },
                            "phone": {
                                "type": "string",
                                "maxLength": 50,
                                "description": "Контактный номер телефона."
                            },
                            "birth_date": {
                                "type": "string",
                                "format": "date",
                                "description": "Дата рождения студента. Формат: `ГГГГ-ММ-ДД`. Должна быть в прошлом."
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
                            "city": {
                                "type": "string",
                                "example": "Уфа"
                            },
                            "phone": {
                                "type": "string",
                                "example": "79990000000"
                            },
                            "birth_date": {
                                "type": "string",
                                "format": "date",
                                "example": "2006-05-04"
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
