// ============================================================
// СЕРВИС ГРУПП
// ============================================================
class GroupService {
    constructor(api, notify) {
        this.api = api;
        this.notify = notify;
        this.groups = [];
        this.membersCache = {};
    }

    // ============================================================
    // ЗАГРУЗКА ГРУПП
    // ============================================================

    async loadGroups() {
        try {
            const result = await this.api.request('/groups', 'GET', null, true);
            if (!result.ok) {
                throw new Error(result.error || 'Ошибка загрузки групп');
            }

            let groups = [];
            if (result.data && result.data.groups) {
                groups = result.data.groups;
            } else if (Array.isArray(result.data)) {
                groups = result.data;
            } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
                groups = result.data.data;
            }

            // Загружаем количество участников для каждой группы
            for (let index = 0; index < groups.length; index++) {
                const group = groups[index];
                try {
                    const membersResult = await this.api.request('/groups/' + group.id + '/members', 'GET', null, true);
                    if (membersResult.ok) {
                        const members = membersResult.data && membersResult.data.group_members ? membersResult.data.group_members : [];
                        const membersCount = members.length;
                        group.members_count = membersCount;
                        group.students_count = membersCount;
                        this.membersCache[group.id] = membersCount;
                    } else {
                        group.members_count = 0;
                        group.students_count = 0;
                        this.membersCache[group.id] = 0;
                    }
                } catch (error) {
                    console.error('Ошибка загрузки участников для группы ' + group.id + ':', error);
                    group.members_count = 0;
                    group.students_count = 0;
                    this.membersCache[group.id] = 0;
                }
            }

            this.groups = groups;
            return groups;

        } catch (error) {
            console.error('Ошибка загрузки групп:', error);
            this.notify('Ошибка загрузки групп', 'error');
            return [];
        }
    }

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ ГРУППЫ
    // ============================================================

    formatGroupDate(group) {
        if (group.name) {
            return group.name;
        }

        let startDate = '';
        let endDate = '';

        if (group.start_date) {
            const startDateObject = new Date(group.start_date);
            startDate = startDateObject.toLocaleDateString('ru-RU');
        }

        if (group.end_date) {
            const endDateObject = new Date(group.end_date);
            endDate = endDateObject.toLocaleDateString('ru-RU');
        }

        if (startDate && endDate) {
            return startDate + ' - ' + endDate;
        }
        if (startDate) {
            return startDate;
        }
        if (endDate) {
            return endDate;
        }

        return 'Группа';
    }

    // ============================================================
    // ОТОБРАЖЕНИЕ ГРУПП
    // ============================================================

    renderGroups(groups) {
        const activeGroups = [];
        const completedGroups = [];

        for (let index = 0; index < groups.length; index++) {
            const group = groups[index];
            if (group.is_active === true) {
                activeGroups.push(group);
            } else {
                completedGroups.push(group);
            }
        }

        // Рендерим активные группы
        const activeContainer = document.getElementById('groupViewActive');
        if (activeContainer) {
            const grid = activeContainer.querySelector('.groups-grid');
            if (grid) {
                if (activeGroups.length === 0) {
                    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; padding:40px;">Нет активных групп</div>';
                } else {
                    let htmlContent = '';
                    for (let index = 0; index < activeGroups.length; index++) {
                        const group = activeGroups[index];
                        const count = group.students_count || group.members_count || 0;
                        const groupName = group.name || 'Группа';
                        const formattedDate = this.formatGroupDate(group);

                        htmlContent = htmlContent + `
                            <div class="group-card" onclick="app.groupService.openGroupModal('${group.id}', '${groupName}', ${count}, 'active')">
                                <div class="group-date">${formattedDate}</div>
                                <div class="group-count">${count > 0 ? count + ' человек' : '—'}</div>
                            </div>
                        `;
                    }
                    grid.innerHTML = htmlContent;
                }
            }
        }

        // Рендерим завершённые группы
        const completedContainer = document.getElementById('groupViewCompleted');
        if (completedContainer) {
            if (completedGroups.length === 0) {
                completedContainer.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">Нет завершенных групп</div>';
            } else {
                // Группируем по годам
                const groupsByYear = {};
                for (let index = 0; index < completedGroups.length; index++) {
                    const group = completedGroups[index];
                    let year = '2025';
                    if (group.start_date) {
                        const dateObject = new Date(group.start_date);
                        year = dateObject.getFullYear().toString();
                    } else if (group.created_at) {
                        const dateObject = new Date(group.created_at);
                        year = dateObject.getFullYear().toString();
                    }

                    if (!groupsByYear[year]) {
                        groupsByYear[year] = [];
                    }
                    groupsByYear[year].push(group);
                }

                // Сортируем годы по убыванию
                const sortedYears = Object.keys(groupsByYear).sort(function(a, b) {
                    if (a < b) {
                        return 1;
                    }
                    if (a > b) {
                        return -1;
                    }
                    return 0;
                });

                let accordionsHtml = '';

                for (let yearIndex = 0; yearIndex < sortedYears.length; yearIndex++) {
                    const year = sortedYears[yearIndex];
                    const yearGroups = groupsByYear[year];
                    const isOpen = yearIndex === 0 ? 'open' : '';
                    const isActive = yearIndex === 0 ? 'active' : '';

                    let groupsHtml = '';
                    for (let groupIndex = 0; groupIndex < yearGroups.length; groupIndex++) {
                        const group = yearGroups[groupIndex];
                        const count = group.students_count || group.members_count || 0;
                        const groupName = group.name || 'Группа';
                        const formattedDate = this.formatGroupDate(group);

                        groupsHtml = groupsHtml + `
                            <div class="group-card" onclick="app.groupService.openGroupModal('${group.id}', '${groupName}', ${count}, 'completed')">
                                <div class="group-date">${formattedDate}</div>
                                <div class="group-count">${count > 0 ? count + ' человек' : '—'}</div>
                            </div>
                        `;
                    }

                    accordionsHtml = accordionsHtml + `
                        <div class="accordion-item">
                            <div class="accordion-header ${isActive}" onclick="app.groupService.toggleAccordion(this)">
                                <span>${year} год</span>
                                <span class="arrow">&#709;</span>
                            </div>
                            <div class="accordion-body ${isOpen}">
                                <div class="groups-grid">
                                    ${groupsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                }

                completedContainer.innerHTML = accordionsHtml;
            }
        }
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ГРУПП
    // ============================================================

    switchGroupView(viewType, buttonElement) {
        const allButtons = document.querySelector('#groups .filter-tabs').querySelectorAll('.filter-btn');
        for (let index = 0; index < allButtons.length; index++) {
            const button = allButtons[index];
            button.classList.remove('active');
        }
        buttonElement.classList.add('active');

        const activeView = document.getElementById('groupViewActive');
        const completedView = document.getElementById('groupViewCompleted');

        if (viewType === 'active') {
            activeView.style.display = 'block';
            completedView.style.display = 'none';
        } else {
            activeView.style.display = 'none';
            completedView.style.display = 'block';
        }
    }

    // ============================================================
    // УПРАВЛЕНИЕ АККОРДЕОНОМ
    // ============================================================

    toggleAccordion(headerElement) {
        const bodyElement = headerElement.nextElementSibling;
        const isOpen = bodyElement.classList.contains('open');

        const allBodyElements = document.querySelectorAll('.accordion-body');
        for (let index = 0; index < allBodyElements.length; index++) {
            const body = allBodyElements[index];
            body.classList.remove('open');
            const header = body.previousElementSibling;
            if (header) {
                header.classList.remove('active');
            }
        }

        if (!isOpen) {
            bodyElement.classList.add('open');
            headerElement.classList.add('active');
        }
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ГРУППЫ
    // ============================================================

    async openGroupModal(groupId, groupName, memberCount, groupType) {
        // Находим группу в кэше
        let group = null;
        for (let index = 0; index < this.groups.length; index++) {
            const currentGroup = this.groups[index];
            if (String(currentGroup.id) === String(groupId)) {
                group = currentGroup;
                break;
            }
        }

        // Устанавливаем заголовок
        const titleElement = document.getElementById('groupTitle');
        if (titleElement) {
            titleElement.textContent = groupName || 'Группа';
        }

        // Устанавливаем количество участников
        const countElement = document.getElementById('groupCount');
        if (countElement) {
            if (memberCount > 0) {
                countElement.textContent = memberCount + ' чел.';
            } else {
                countElement.textContent = 'Загрузка...';
            }
        }

        // Показываем загрузку в таблице
        const tableBody = document.getElementById('groupTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td style="text-align:center; color:#888; padding:20px;">Загрузка...</td></tr>';
        }

        // Настраиваем кнопки действий
        const actionsContainer = document.getElementById('groupModalActions');
        if (groupType === 'active') {
            actionsContainer.innerHTML = `
                <button class="btn-green" onclick="app.groupService.openNotifyForGroup('${groupId}')">Отправить уведомление</button>
                <button class="btn-green" onclick="app.chatService.goToGroupChat('${groupId}')">Перейти в чат</button>
            `;
        } else {
            actionsContainer.innerHTML = `
                <button class="btn-green" onclick="app.notificationService.viewGroupArchive('${groupId}')">Посмотреть архив чата</button>
            `;
        }

        // Открываем модальное окно
        const modalElement = document.getElementById('modalGroup');
        if (modalElement) {
            modalElement.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Загружаем участников
        const loadedMembersCount = await this.loadGroupMembers(groupId);

        // Обновляем количество участников
        if (countElement && loadedMembersCount !== undefined) {
            if (group) {
                group.students_count = loadedMembersCount;
                group.members_count = loadedMembersCount;
                this.membersCache[groupId] = loadedMembersCount;
            }
            if (loadedMembersCount > 0) {
                countElement.textContent = loadedMembersCount + ' чел.';
            } else {
                countElement.textContent = '—';
            }
        }
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА УВЕДОМЛЕНИЯ
    // ============================================================

    openNotifyForGroup(groupId) {
        // Закрываем модальное окно группы
        const modalGroup = document.getElementById('modalGroup');
        if (modalGroup) {
            modalGroup.classList.remove('active');
        }
        document.body.style.overflow = 'auto';

        // Открываем модальное окно уведомления
        const modalNotify = document.getElementById('modalNotify');
        if (modalNotify) {
            modalNotify.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Находим группу
        let group = null;
        for (let index = 0; index < this.groups.length; index++) {
            const currentGroup = this.groups[index];
            if (String(currentGroup.id) === String(groupId)) {
                group = currentGroup;
                break;
            }
        }

        // Устанавливаем выбранную группу в выпадающем списке
        if (group) {
            const selectElement = document.getElementById('notifyGroup');
            if (selectElement) {
                let optionExists = false;
                for (let optionIndex = 0; optionIndex < selectElement.options.length; optionIndex++) {
                    if (String(selectElement.options[optionIndex].value) === String(groupId)) {
                        selectElement.value = groupId;
                        optionExists = true;
                        break;
                    }
                }

                if (!optionExists) {
                    const newOption = document.createElement('option');
                    newOption.value = groupId;
                    newOption.textContent = group.name || 'Группа ' + groupId;
                    selectElement.appendChild(newOption);
                    selectElement.value = groupId;
                }
            }
        }
    }
    // ============================================================
    // ЗАГРУЗКА УЧАСТНИКОВ ГРУППЫ
    // ============================================================
    async loadGroupMembers(groupId) {
        const tableBody = document.getElementById('groupTableBody');
        if (!tableBody) {
            return 0;
        }

        try {
            const result = await this.api.request('/groups/' + groupId + '/members', 'GET', null, true);

            if (!result.ok) {
                // Обработка ошибок авторизации
                if (result.status === 401) {
                    tableBody.innerHTML = '<tr><td style="text-align:center; color:#e74c3c; padding:20px;">Требуется авторизация</td></tr>';
                    return 0;
                }

                if (result.status === 403) {
                    let errorMessage = 'Доступ запрещён';
                    if (result.data && result.data.message) {
                        if (result.data.message.includes('почта')) {
                            errorMessage = 'Почта не подтверждена';
                        } else if (result.data.message.includes('не в группе')) {
                            errorMessage = 'Вы не состоите в этой группе';
                        } else if (result.data.message.includes('другого города')) {
                            errorMessage = 'Тимлид может просматривать только группы своего города';
                        }
                    }
                    tableBody.innerHTML = '<tr><td style="text-align:center; color:#e74c3c; padding:20px;">' + errorMessage + '</td></tr>';
                    return 0;
                }

                if (result.status === 404) {
                    tableBody.innerHTML = '<tr><td style="text-align:center; color:#e74c3c; padding:20px;">Группа не найдена</td></tr>';
                    return 0;
                }

                throw new Error(result.error || 'Ошибка загрузки участников');
            }

            // Извлекаем список участников
            let members = [];
            if (result.data && result.data.group_members) {
                members = result.data.group_members;
            }

            const membersCount = members.length;

            if (!members || members.length === 0) {
                tableBody.innerHTML = '<tr><td style="text-align:center; color:#888; padding:20px;">В группе пока нет участников</td></tr>';
                return 0;
            }

            // Формируем HTML-таблицу с полной информацией
            let htmlContent = `
                <tr>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">ФИО</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Город</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Курс</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Направление</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Телефон</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Дата рождения</th>
                    <th style="padding: 10px 15px; border-bottom: 2px solid #e0e0e0; text-align: left; font-weight: 600; color: #555;">Период практики</th>
                </tr>
            `;

            for (let index = 0; index < members.length; index++) {
                const member = members[index];
                
                // Формируем ФИО
                const nameParts = [];
                if (member.surname && member.surname.trim()) {
                    nameParts.push(member.surname);
                }
                if (member.name && member.name.trim()) {
                    nameParts.push(member.name);
                }
                if (member.patronymic && member.patronymic.trim()) {
                    nameParts.push(member.patronymic);
                }
                const fullName = nameParts.join(' ') || 'Не указано';

                // Форматируем дату рождения
                let birthDate = '—';
                if (member.birth_date) {
                    try {
                        const date = new Date(member.birth_date);
                        birthDate = date.toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                    } catch (e) {
                        birthDate = member.birth_date;
                    }
                }

                // Форматируем период практики
                let period = '—';
                if (member.start_date && member.end_date) {
                    try {
                        const start = new Date(member.start_date);
                        const end = new Date(member.end_date);
                        period = start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + 
                                ' - ' + 
                                end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                    } catch (e) {
                        period = member.start_date + ' - ' + member.end_date;
                    }
                } else if (member.start_date) {
                    try {
                        const start = new Date(member.start_date);
                        period = start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                    } catch (e) {
                        period = member.start_date;
                    }
                }

                // Форматируем телефон
                let phone = member.phone || '—';
                if (phone && phone.length === 11 && phone.startsWith('7')) {
                    phone = '+' + phone.slice(0, 1) + ' ' + phone.slice(1, 4) + ' ' + phone.slice(4, 7) + ' ' + phone.slice(7, 9) + ' ' + phone.slice(9);
                }

                htmlContent = htmlContent + `
                    <tr>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #333; font-weight: 500;">${fullName}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${member.city || '—'}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${member.course || '—'}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${member.specialization || '—'}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${phone}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${birthDate}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; color: #555;">${period}</td>
                    </tr>
                `;
            }

            tableBody.innerHTML = htmlContent;
            return membersCount;

        } catch (error) {
            console.error('Ошибка загрузки участников:', error);
            tableBody.innerHTML = '<tr><td style="text-align:center; color:#e74c3c; padding:20px;">Ошибка загрузки участников</td></tr>';
            return 0;
        }
    }
}