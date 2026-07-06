// ============================================================
// СЕРВИС ШАБЛОНОВ
// ============================================================
class TemplateService {
    constructor(notify) {
        this.notify = notify;
        this.isNotifyDropdownOpen = false;
        this.isRejectionDropdownOpen = false;
        
        // Привязываем обработчики после загрузки DOM
        const self = this;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                self.bindRejectionTemplateButton();
            });
        } else {
            setTimeout(function() {
                self.bindRejectionTemplateButton();
            }, 100);
        }
    }

    // ============================================================
    // ПРИВЯЗКА КНОПКИ СОХРАНЕНИЯ ШАБЛОНА ОТКАЗА
    // ============================================================

    bindRejectionTemplateButton() {
        // Кнопка "Сохранить шаблон" в модалке отказа
        const saveTemplateBtn = document.querySelector('#modal2 .text-btn');
        if (!saveTemplateBtn) {
            console.warn('Кнопка сохранения шаблона не найдена');
            return;
        }

        // Удаляем старые обработчики
        const newBtn = saveTemplateBtn.cloneNode(true);
        saveTemplateBtn.parentNode.replaceChild(newBtn, saveTemplateBtn);

        const self = this;
        newBtn.addEventListener('click', function() {
            self.openSaveRejectionTemplateModal();
        });
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ДЛЯ СОХРАНЕНИЯ ШАБЛОНА ОТКАЗА
    // ============================================================

    openSaveRejectionTemplateModal() {
        // Получаем текст из textarea
        const textarea = document.querySelector('#modal2 .modal-textarea');
        const text = textarea ? textarea.value.trim() : '';

        if (!text) {
            this.notify('Введите текст причины отказа', 'warning');
            if (textarea) {
                textarea.focus();
                textarea.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    textarea.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        // Открываем модалку для сохранения шаблона
        const modal3 = document.getElementById('modal3');
        if (modal3) {
            modal3.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Заполняем поле текста
        const templateTextarea = document.querySelector('#modal3 .modal-textarea');
        if (templateTextarea) {
            templateTextarea.value = text;
        }

        // Очищаем поле названия
        const nameInput = document.querySelector('#modal3 .modal-input');
        if (nameInput) {
            nameInput.value = '';
            setTimeout(function() {
                nameInput.focus();
            }, 100);
        }

        // Привязываем обработчик для кнопки сохранения
        this.bindSaveRejectionTemplateButton();
    }

    // ============================================================
    // ПРИВЯЗКА КНОПКИ СОХРАНЕНИЯ В МОДАЛКЕ #modal3
    // ============================================================

    bindSaveRejectionTemplateButton() {
        const saveBtn = document.querySelector('#modal3 .btn-save-full');
        if (!saveBtn) return;

        // Удаляем старые обработчики
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        const self = this;
        newSaveBtn.addEventListener('click', function() {
            self.saveRejectionTemplateFromModal();
        });
    }

    // ============================================================
    // СОХРАНЕНИЕ ШАБЛОНА ОТКАЗА ИЗ МОДАЛЬНОГО ОКНА
    // ============================================================

    saveRejectionTemplateFromModal() {
        const nameInput = document.querySelector('#modal3 .modal-input');
        const textarea = document.querySelector('#modal3 .modal-textarea');

        const name = nameInput ? nameInput.value.trim() : '';
        const text = textarea ? textarea.value.trim() : '';

        if (!name) {
            this.notify('Введите название шаблона', 'warning');
            if (nameInput) {
                nameInput.focus();
                nameInput.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    nameInput.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        if (!text) {
            this.notify('Введите текст отказа', 'warning');
            if (textarea) {
                textarea.focus();
                textarea.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    textarea.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        // Сохраняем шаблон
        this.saveRejectionTemplate(name, text);
        this.notify('Шаблон "' + name + '" сохранен!', 'success');

        // Закрываем модалку
        const modal3 = document.getElementById('modal3');
        if (modal3) {
            modal3.classList.remove('active');
        }
        document.body.style.overflow = 'auto';

        // Очищаем поля
        if (nameInput) nameInput.value = '';
        if (textarea) textarea.value = '';

        // Обновляем выпадающий список
        this.updateRejectionDropdownContent(
            document.querySelector('#modal2 .template-dropdown')
        );
    }

    // ============================================================
    // ШАБЛОНЫ ОТКАЗА
    // ============================================================

    getRejectionTemplates() {
        try {
            const storedData = localStorage.getItem('rejectionTemplates');
            if (storedData) {
                return JSON.parse(storedData);
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    saveRejectionTemplate(name, text) {
        const templates = this.getRejectionTemplates();
        const newTemplate = {
            id: Date.now(),
            name: name,
            text: text,
            created_at: new Date().toISOString()
        };
        templates.push(newTemplate);
        localStorage.setItem('rejectionTemplates', JSON.stringify(templates));
        return templates;
    }

    deleteRejectionTemplate(templateId) {
        let templates = this.getRejectionTemplates();
        const updatedTemplates = [];
        for (let index = 0; index < templates.length; index++) {
            const template = templates[index];
            if (template.id !== templateId) {
                updatedTemplates.push(template);
            }
        }
        localStorage.setItem('rejectionTemplates', JSON.stringify(updatedTemplates));
        return updatedTemplates;
    }

    // ============================================================
    // ВЫПАДАЮЩИЙ СПИСОК ШАБЛОНОВ ОТКАЗА
    // ============================================================

    renderRejectionTemplateDropdown() {
        const dropdownButton = document.querySelector('#modal2 .dropdown-btn');
        if (!dropdownButton) {
            console.warn('Кнопка dropdown-btn не найдена');
            return;
        }

        // Создаем контейнер для выпадающего списка
        let dropdownContainer = dropdownButton.nextElementSibling;
        if (!dropdownContainer || !dropdownContainer.classList.contains('template-dropdown')) {
            dropdownContainer = document.createElement('div');
            dropdownContainer.className = 'template-dropdown';
            dropdownContainer.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-width: 200px;
                display: none;
                z-index: 100;
                max-height: 200px;
                overflow-y: auto;
            `;

            const parentElement = dropdownButton.parentNode;
            if (parentElement) {
                parentElement.style.position = 'relative';
                parentElement.appendChild(dropdownContainer);
            }
        }

        const self = this;

        // Обработчик открытия/закрытия
        dropdownButton.onclick = function(event) {
            event.stopPropagation();
            if (dropdownContainer.style.display === 'block') {
                dropdownContainer.style.display = 'none';
                self.isRejectionDropdownOpen = false;
            } else {
                self.updateRejectionDropdownContent(dropdownContainer);
                dropdownContainer.style.display = 'block';
                self.isRejectionDropdownOpen = true;
            }
        };

        // Закрытие при клике вне
        document.addEventListener('click', function(event) {
            const isClickOnButton = dropdownButton && dropdownButton.contains(event.target);
            const isClickOnContainer = dropdownContainer && dropdownContainer.contains(event.target);
            
            if (!isClickOnButton && !isClickOnContainer) {
                if (dropdownContainer) {
                    dropdownContainer.style.display = 'none';
                    self.isRejectionDropdownOpen = false;
                }
            }
        });

        // Привязываем кнопку сохранения шаблона
        this.bindRejectionTemplateButton();

        // Первоначальное заполнение
        this.updateRejectionDropdownContent(dropdownContainer);
    }

    updateRejectionDropdownContent(container) {
        if (!container) return;
        
        const templates = this.getRejectionTemplates();
        const self = this;

        if (templates.length === 0) {
            container.innerHTML = `
                <div style="padding:15px; color:#888; font-size:13px; text-align:center;">
                    Нет шаблонов
                </div>
            `;
            return;
        }

        let html = '';
        for (let index = 0; index < templates.length; index++) {
            const template = templates[index];
            html += `
                <div class="template-item" data-id="${template.id}" style="
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
                    <span style="font-size:14px; color:#333;">${template.name}</span>
                    <button class="delete-rejection-template" data-id="${template.id}" style="
                        background: none;
                        border: none;
                        color: #FF6B6B;
                        cursor: pointer;
                        font-size: 16px;
                        padding: 0 5px;
                    ">✕</button>
                </div>
            `;
        }
        container.innerHTML = html;

        // Обработчики выбора шаблона
        const items = container.querySelectorAll('.template-item');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.addEventListener('click', function(event) {
                if (event.target.classList.contains('delete-rejection-template')) {
                    return;
                }

                const templateId = parseInt(item.dataset.id, 10);
                const templatesList = self.getRejectionTemplates();
                
                let selectedTemplate = null;
                for (let j = 0; j < templatesList.length; j++) {
                    if (templatesList[j].id === templateId) {
                        selectedTemplate = templatesList[j];
                        break;
                    }
                }

                if (selectedTemplate) {
                    const textarea = document.querySelector('#modal2 .modal-textarea');
                    if (textarea) {
                        textarea.value = selectedTemplate.text;
                    }
                    container.style.display = 'none';
                    self.isRejectionDropdownOpen = false;
                }
            });
        }

        // Обработчики удаления
        const deleteButtons = container.querySelectorAll('.delete-rejection-template');
        for (let i = 0; i < deleteButtons.length; i++) {
            const deleteBtn = deleteButtons[i];
            deleteBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                const templateId = parseInt(deleteBtn.dataset.id, 10);
                const isConfirmed = confirm('Удалить шаблон?');
                if (isConfirmed) {
                    self.deleteRejectionTemplate(templateId);
                    self.updateRejectionDropdownContent(container);
                    self.notify('Шаблон удален', 'info');
                }
            });
        }
    }

    // ============================================================
    // ШАБЛОНЫ УВЕДОМЛЕНИЙ
    // ============================================================

    getNotifyTemplates() {
        try {
            const storedData = localStorage.getItem('notifyTemplates');
            if (storedData) {
                return JSON.parse(storedData);
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    saveNotifyTemplate(name, subject, description) {
        const templates = this.getNotifyTemplates();
        const newTemplate = {
            id: Date.now(),
            name: name,
            subject: subject,
            description: description,
            created_at: new Date().toISOString()
        };
        templates.push(newTemplate);
        localStorage.setItem('notifyTemplates', JSON.stringify(templates));
        return templates;
    }

    deleteNotifyTemplate(templateId) {
        let templates = this.getNotifyTemplates();
        const updatedTemplates = [];
        for (let index = 0; index < templates.length; index++) {
            const template = templates[index];
            if (template.id !== templateId) {
                updatedTemplates.push(template);
            }
        }
        localStorage.setItem('notifyTemplates', JSON.stringify(updatedTemplates));
        return updatedTemplates;
    }

    // ============================================================
    // ШАБЛОНЫ УВЕДОМЛЕНИЙ - ВЫПАДАЮЩИЙ СПИСОК
    // ============================================================

    renderNotifyTemplateDropdown() {
        const dropdownButton = document.getElementById('notifyTemplateBtn');
        if (!dropdownButton) {
            console.warn('Кнопка notifyTemplateBtn не найдена');
            return;
        }

        // Создаем контейнер
        let dropdownContainer = document.getElementById('notifyTemplateDropdownContainer');
        
        if (!dropdownContainer) {
            dropdownContainer = this.createNotifyDropdownContainer();
        }

        // Привязываем обработчик
        const self = this;
        dropdownButton.onclick = function(event) {
            event.stopPropagation();
            if (dropdownContainer.style.display === 'block') {
                dropdownContainer.style.display = 'none';
                self.isNotifyDropdownOpen = false;
            } else {
                self.updateNotifyDropdownContent(dropdownContainer);
                dropdownContainer.style.display = 'block';
                self.isNotifyDropdownOpen = true;
                
                const rect = dropdownButton.getBoundingClientRect();
                dropdownContainer.style.top = (rect.bottom + window.scrollY + 5) + 'px';
                dropdownContainer.style.right = (window.innerWidth - rect.right + window.scrollX) + 'px';
            }
        };

        this.updateNotifyDropdownContent(dropdownContainer);
    }

    createNotifyDropdownContainer() {
        const container = document.createElement('div');
        container.id = 'notifyTemplateDropdownContainer';
        container.className = 'template-dropdown';
        container.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 220px;
            max-width: 300px;
            display: none;
            z-index: 9999;
            max-height: 250px;
            overflow-y: auto;
        `;
        document.body.appendChild(container);

        const self = this;
        document.addEventListener('click', function(event) {
            const button = document.getElementById('notifyTemplateBtn');
            const containerElement = document.getElementById('notifyTemplateDropdownContainer');
            
            if (!containerElement) return;
            
            const isClickOnButton = button && button.contains(event.target);
            const isClickOnContainer = containerElement.contains(event.target);
            
            if (!isClickOnButton && !isClickOnContainer) {
                containerElement.style.display = 'none';
                self.isNotifyDropdownOpen = false;
            }
        });

        return container;
    }

    updateNotifyDropdownContent(container) {
        if (!container) return;
        
        const templates = this.getNotifyTemplates();
        const self = this;

        if (templates.length === 0) {
            container.innerHTML = `
                <div style="padding:15px; color:#888; font-size:13px; text-align:center;">
                    Нет сохраненных шаблонов
                </div>
            `;
            return;
        }

        let html = '';
        for (let index = 0; index < templates.length; index++) {
            const template = templates[index];
            html += `
                <div class="template-item" data-id="${template.id}" style="
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
                    <span style="font-size:14px; color:#333;">${template.name}</span>
                    <button class="delete-template-btn" data-id="${template.id}" style="
                        background: none;
                        border: none;
                        color: #FF6B6B;
                        cursor: pointer;
                        font-size: 16px;
                        padding: 0 5px;
                        font-weight: bold;
                    ">✕</button>
                </div>
            `;
        }
        container.innerHTML = html;

        // Обработчики для выбора шаблона
        const items = container.querySelectorAll('.template-item');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.addEventListener('click', function(event) {
                if (event.target.classList.contains('delete-template-btn')) {
                    return;
                }

                const templateId = parseInt(item.dataset.id, 10);
                const templatesList = self.getNotifyTemplates();
                
                let selectedTemplate = null;
                for (let j = 0; j < templatesList.length; j++) {
                    if (templatesList[j].id === templateId) {
                        selectedTemplate = templatesList[j];
                        break;
                    }
                }

                if (selectedTemplate) {
                    const subjectInput = document.getElementById('notifySubject');
                    const descriptionInput = document.getElementById('notifyDescription');

                    if (subjectInput) {
                        subjectInput.value = selectedTemplate.subject || '';
                    }
                    if (descriptionInput) {
                        descriptionInput.value = selectedTemplate.description || '';
                    }

                    container.style.display = 'none';
                    self.isNotifyDropdownOpen = false;
                    self.notify('Шаблон "' + selectedTemplate.name + '" применен', 'success');
                }
            });
        }

        // Обработчики для удаления шаблонов
        const deleteButtons = container.querySelectorAll('.delete-template-btn');
        for (let i = 0; i < deleteButtons.length; i++) {
            const deleteBtn = deleteButtons[i];
            deleteBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                const templateId = parseInt(deleteBtn.dataset.id, 10);
                const isConfirmed = confirm('Удалить шаблон?');
                if (isConfirmed) {
                    self.deleteNotifyTemplate(templateId);
                    self.updateNotifyDropdownContent(container);
                    self.notify('Шаблон удален', 'info');
                }
            });
        }
    }

    // ============================================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ДЛЯ СОХРАНЕНИЯ ШАБЛОНА УВЕДОМЛЕНИЯ
    // ============================================================

    openSaveTemplateModal() {
        const notifyModal = document.getElementById('modalNotify');
        if (notifyModal) {
            notifyModal.classList.remove('active');
        }

        const templateModal = document.getElementById('modalNotifyTemplate');
        if (templateModal) {
            templateModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        const subjectInput = document.getElementById('notifySubject');
        const descriptionInput = document.getElementById('notifyDescription');
        
        const templateSubjectInput = document.getElementById('notifyTemplateSubject');
        const templateDescriptionInput = document.getElementById('notifyTemplateDescription');
        const templateNameInput = document.getElementById('notifyTemplateName');

        if (templateSubjectInput && subjectInput) {
            templateSubjectInput.value = subjectInput.value || '';
        }

        if (templateDescriptionInput && descriptionInput) {
            templateDescriptionInput.value = descriptionInput.value || '';
        }

        if (templateNameInput) {
            templateNameInput.value = '';
            setTimeout(function() {
                templateNameInput.focus();
            }, 100);
        }

        this.bindSaveTemplateButton();
    }

    bindSaveTemplateButton() {
        const saveBtn = document.getElementById('notifyTemplateSaveBtn');
        if (!saveBtn) return;

        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        const self = this;
        newSaveBtn.addEventListener('click', function() {
            self.saveTemplateFromModal();
        });
    }

    saveTemplateFromModal() {
        const nameInput = document.getElementById('notifyTemplateName');
        const subjectInput = document.getElementById('notifyTemplateSubject');
        const descriptionInput = document.getElementById('notifyTemplateDescription');

        const name = nameInput ? nameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const description = descriptionInput ? descriptionInput.value.trim() : '';

        if (!name) {
            this.notify('Введите название шаблона', 'warning');
            if (nameInput) {
                nameInput.focus();
                nameInput.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    nameInput.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        if (!subject) {
            this.notify('Введите тему уведомления', 'warning');
            if (subjectInput) {
                subjectInput.focus();
                subjectInput.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    subjectInput.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        if (!description) {
            this.notify('Введите текст уведомления', 'warning');
            if (descriptionInput) {
                descriptionInput.focus();
                descriptionInput.style.borderColor = '#FF6B6B';
                setTimeout(function() {
                    descriptionInput.style.borderColor = '';
                }, 2000);
            }
            return;
        }

        this.saveNotifyTemplate(name, subject, description);
        this.notify('Шаблон "' + name + '" сохранен!', 'success');

        const modal = document.getElementById('modalNotifyTemplate');
        if (modal) {
            modal.classList.remove('active');
        }
        document.body.style.overflow = 'auto';

        if (nameInput) nameInput.value = '';
        if (subjectInput) subjectInput.value = '';
        if (descriptionInput) descriptionInput.value = '';

        this.renderNotifyTemplateDropdown();
    }
}