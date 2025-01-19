"use strict";
function toggleModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        if (modal.classList.toggle('hidden')) {
            const content = modal.querySelector('.content');
            content.innerHTML = '';
            const approveBtn = modal.querySelector('#approve');
            approveBtn.remove();
        }
    }
}
async function query(url, method, body, query) {
    const request = await fetch(url + (query ? `?${new URLSearchParams(query).toString()}` : ''), {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!request.ok) {
        throw new Error(await request.text());
    }
    return request;
}
function validateString(str) {
    return str && str.length > 0;
}
function addRow(element, options) {
    element.classList.add(options.className);
    let p = element.appendChild(document.createElement('p'));
    p.innerText = options.name;
    p.classList.add('title');
    p = element.appendChild(document.createElement('p'));
    p.innerText = options.value;
    return p;
}
function addInput(element, options) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);
    const label = document.createElement('label');
    label.htmlFor = options.label;
    label.innerText = options.labelName;
    const input = document.createElement('input');
    input.type = options.type;
    input.id = options.label;
    container.appendChild(label);
    container.appendChild(input);
    element.appendChild(container);
    return input;
}
function addSelect(element, options) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);
    const label = document.createElement('label');
    label.htmlFor = options.label;
    label.innerText = options.labelName;
    const select = document.createElement('select');
    select.id = options.label;
    const mainOption = document.createElement('option');
    mainOption.innerText = options.mainOption;
    mainOption.disabled = true;
    select.appendChild(mainOption);
    container.appendChild(label);
    container.appendChild(select);
    element.appendChild(container);
    return select;
}
async function addSelectSql(element, options) {
    const select = addSelect(element, options);
    const result = await query(options.query.url, options.query.method, options.query.body, options.query.query);
    const rows = await result.json();
    for (const row of rows) {
        const option = document.createElement('option');
        option.innerText = row.value;
        option.value = row.id;
        select.appendChild(option);
        if (row.value === options.value) {
            select.value = row.id;
        }
    }
    return select;
}
async function addItems(li, listCont, cargosIds) {
    if (cargosIds && cargosIds.length > 0) {
        let result;
        let row;
        for (const cargoId of cargosIds) {
            result = await query('cargo', 'GET', undefined, { id: cargoId });
            row = await result.json();
            addItem(li, listCont, row[0]);
        }
    }
}
function validateCount(li, cars, carsNew) {
    if (cars && carsNew) {
        return +li.getAttribute('cars-last-count') - carsNew + cars >= 0;
    }
    else if (cars) {
        return +li.getAttribute('cars-last-count') - cars >= 0;
    }
    return +li.getAttribute('cargos-last-count') - 1 >= 0;
}
function getSubtype(value) {
    switch (value) {
        case 'Легковая':
            return 1;
        case 'Грузовая':
            return 2;
        case 'Тягач':
            return 3;
        default:
            return 0;
    }
}
function addItem(li, listCont, options) {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    listItem.setAttribute('edited', 'false');
    if (!options) {
        listItem.classList.add('editable');
    }
    else {
        listItem.id = options.id;
    }
    const id = options ? options.id : crypto.randomUUID();
    const itemId = listItem.appendChild(document.createElement('div'));
    itemId.classList.add('item-id');
    itemId.innerHTML = `<p class="title">ID: ${id}</p>`;
    const itemName = listItem.appendChild(document.createElement('div'));
    itemName.classList.add('item-name');
    itemName.innerHTML = '<p class="title">Наименование:</p>';
    const itemNameInput = addInput(itemName, {
        uuid: id,
        classes: ['inp'],
        label: 'name',
        labelName: '',
        type: 'text'
    });
    itemNameInput.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemNameP = itemName.appendChild(document.createElement('p'));
    if (options && options.name) {
        itemNameP.innerText = options.name;
        itemNameInput.value = options.name;
    }
    itemNameP.setAttribute('value', itemNameInput.value);
    const itemType = listItem.appendChild(document.createElement('div'));
    itemType.classList.add('item-type');
    itemType.innerHTML = '<p class="title">Тип "Пассажира":</p>';
    const itemTypeSelect = addSelect(itemType, {
        uuid: id,
        classes: ['inp'],
        label: 'type',
        labelName: '',
        mainOption: 'Выберите тип'
    });
    let option = itemTypeSelect.appendChild(document.createElement('option'));
    option.value = 'Груз';
    option.innerText = 'Груз';
    option = itemTypeSelect.appendChild(document.createElement('option'));
    option.value = 'Автомобиль';
    option.innerText = 'Автомобиль';
    itemTypeSelect.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemTypeP = itemType.appendChild(document.createElement('p'));
    if (options && options.type) {
        itemTypeP.innerText = options.type;
        itemTypeSelect.value = options.type;
    }
    itemTypeP.setAttribute('value', itemTypeSelect.value);
    const itemSubtype = listItem.appendChild(document.createElement('div'));
    itemSubtype.classList.add('item-subtype');
    if (itemTypeSelect.value !== 'Автомобиль') {
        itemSubtype.classList.add('hidden');
    }
    itemSubtype.innerHTML = '<p class="title">Тип автомобиля:</p>';
    const itemSubtypeSelect = addSelect(itemSubtype, {
        uuid: id,
        classes: ['inp'],
        label: 'subtype',
        labelName: '',
        mainOption: 'Выберите тип'
    });
    option = itemSubtypeSelect.appendChild(document.createElement('option'));
    option.value = 'Легковая';
    option.innerText = 'Легковая';
    option = itemSubtypeSelect.appendChild(document.createElement('option'));
    option.value = 'Грузовая';
    option.innerText = 'Грузовая';
    option = itemSubtypeSelect.appendChild(document.createElement('option'));
    option.value = 'Тягач';
    option.innerText = 'Тягач';
    itemSubtypeSelect.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemSubtypeP = itemSubtype.appendChild(document.createElement('p'));
    if (options && options.car_type) {
        itemSubtypeP.innerText = options.car_type;
        itemSubtypeSelect.value = options.car_type;
    }
    itemSubtypeP.setAttribute('value', itemSubtypeSelect.value);
    const itemButtons = listItem.appendChild(document.createElement('div'));
    itemButtons.classList.add('item-buttons');
    const buttonEdit = itemButtons.appendChild(document.createElement('img'));
    buttonEdit.src = "../assets/edit.svg";
    buttonEdit.alt = "Edit";
    buttonEdit.addEventListener('click', () => {
        itemNameInput.value = itemNameP.getAttribute('value');
        itemTypeSelect.value = itemTypeP.getAttribute('value');
        itemSubtypeSelect.value = itemSubtypeP.getAttribute('value');
        listItem.classList.add('editable');
        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonDelete = itemButtons.appendChild(document.createElement('img'));
    buttonDelete.src = "../assets/delete-button.svg";
    buttonDelete.alt = "Delete";
    buttonDelete.addEventListener('click', async () => {
        const card = listItem.parentElement.parentElement.parentElement;
        await query('trip', 'POST', {
            itemId: id,
            remove: true,
            cargo: {
                remove: true
            }
        }, {
            id: card.id,
            cargoId: id
        });
        if (itemTypeSelect.value === 'Автомобиль') {
            card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count')
                + getSubtype(itemSubtypeSelect.value)).toString());
            card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
        }
        else {
            card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count') + 1).toString());
            card.querySelector('.cargos-last-count').innerText = card.getAttribute('cargos-last-count');
        }
        listItem.remove();
    });
    const buttonApprove = itemButtons.appendChild(document.createElement('img'));
    buttonApprove.src = "../assets/approve.png";
    buttonApprove.alt = "Approve";
    buttonApprove.addEventListener('click', async () => {
        var _a;
        if (!validateString(itemNameInput.value)) {
            alert('Следует заполнить все поля');
            return;
        }
        let validationResult;
        const card = listItem.parentElement.parentElement.parentElement;
        if (itemTypeSelect.value === 'Груз') {
            validationResult = validateCount(card);
        }
        else if (itemTypeSelect.value === 'Автомобиль' && itemTypeP.getAttribute('value') !== 'Автомобиль') {
            validationResult = validateCount(card, getSubtype(itemSubtypeSelect.value));
        }
        else {
            validationResult = validateCount(card, getSubtype(itemSubtypeP.getAttribute('value')), getSubtype(itemSubtypeSelect.value));
        }
        if (!validationResult) {
            alert(`Недостаточно места на пароме.\n ` +
                `Оставшееся место для грузов - ${li.getAttribute('cargos-last-count')}, для автомобилей - ${li.getAttribute('cars-last-count')}`);
            return;
        }
        if (listItem.getAttribute('edited') === 'true') {
            const uuid = listCont.parentElement.parentElement.id;
            if (listItem.id) {
                await query('cargo', 'POST', {
                    name: itemNameInput.value,
                    type: itemTypeSelect.value,
                    subType: itemTypeSelect.value === 'Автомобиль' ? itemSubtypeSelect.value : undefined
                }, {
                    id: id,
                });
                if (itemTypeSelect.value === 'Автомобиль' && itemTypeP.getAttribute('value') != 'Автомобиль') {
                    card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count') + 1).toString());
                    card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count')
                        - getSubtype(itemSubtypeSelect.value)).toString());
                    card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
                    card.querySelector('.cargos-last-count').innerText = card.getAttribute('cargos-last-count');
                }
                else if (itemTypeSelect.value === 'Груз' && itemTypeP.getAttribute('value') != 'Груз') {
                    card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count')
                        + getSubtype(itemSubtypeP.getAttribute('value'))).toString());
                    card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count') - 1).toString());
                    card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
                    card.querySelector('.cargos-last-count').innerText = card.getAttribute('cargos-last-count');
                }
                else if (itemTypeSelect.value === 'Автомобиль') {
                    card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count') + getSubtype(itemSubtypeP.getAttribute('value'))
                        - getSubtype(itemSubtypeSelect.value)).toString());
                    card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
                }
            }
            else {
                await query('trip', 'POST', {
                    itemId: id,
                    cargo: {
                        id: id,
                        name: itemNameInput.value,
                        type: itemTypeSelect.value,
                        subType: itemTypeSelect.value === 'Автомобиль' ? itemSubtypeSelect.value : undefined
                    }
                }, {
                    id: uuid,
                    cargoId: id
                });
                if (itemTypeSelect.value === 'Автомобиль') {
                    card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count')
                        - getSubtype(itemSubtypeSelect.value)).toString());
                    card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
                }
                else {
                    card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count') - 1).toString());
                    card.querySelector('.cargos-last-count').innerText = card.getAttribute('cargos-last-count');
                }
            }
            itemNameP.innerText = itemNameInput.value;
            itemTypeP.innerText = itemTypeSelect.options[itemTypeSelect.selectedIndex].text;
            itemSubtypeP.innerText = (_a = itemSubtypeSelect.options[itemSubtypeSelect.selectedIndex]) === null || _a === void 0 ? void 0 : _a.text;
            itemNameP.setAttribute('value', itemNameInput.value);
            itemTypeP.setAttribute('value', itemTypeSelect.value);
            itemSubtypeP.setAttribute('value', itemSubtypeSelect.value);
            listItem.id = id;
            enableDragAndDropListItem(listItem);
        }
        listItem.classList.remove('editable');
        listItem.setAttribute('edited', 'false');
        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonCancel = itemButtons.appendChild(document.createElement('img'));
    buttonCancel.src = "../assets/cancel.png";
    buttonCancel.alt = "Cancel";
    buttonCancel.addEventListener('click', () => {
        if (listItem.id) {
            listItem.classList.remove('editable');
            itemNameInput.value = itemNameP.getAttribute('value');
            itemTypeSelect.value = itemTypeP.getAttribute('value');
            itemSubtypeSelect.value = itemSubtypeP.getAttribute('value');
            if (itemTypeSelect.value !== 'Автомобиль') {
                itemSubtype.classList.add('hidden');
            }
            buttonEdit.classList.toggle('hidden');
            buttonDelete.classList.toggle('hidden');
            buttonApprove.classList.toggle('hidden');
            buttonCancel.classList.toggle('hidden');
        }
        else {
            listItem.remove();
        }
    });
    if (options) {
        buttonApprove.classList.add('hidden');
        buttonCancel.classList.add('hidden');
        if (itemTypeSelect.value === 'Автомобиль') {
            li.setAttribute('cars-last-count', (+li.getAttribute('cars-last-count')
                - getSubtype(itemSubtypeSelect.value)).toString());
        }
        else {
            li.setAttribute('cargos-last-count', (+li.getAttribute('cargos-last-count') - 1).toString());
        }
    }
    else {
        buttonEdit.classList.add('hidden');
        buttonDelete.classList.add('hidden');
    }
    itemTypeSelect.addEventListener('change', () => {
        if (itemTypeSelect.value === 'Автомобиль') {
            itemSubtype.classList.remove('hidden');
        }
        else {
            itemSubtype.classList.add('hidden');
        }
    });
    listCont.appendChild(listItem);
}
async function createListElement(options) {
    const list = document.querySelector('.cards-list');
    const li = document.createElement('li');
    li.classList.add('card');
    li.id = options.id;
    li.setAttribute('cars-last-count', options.cars_count.toString());
    li.setAttribute('cargos-last-count', options.cargos_count.toString());
    const id = document.createElement('div');
    id.innerText = `ID: ${options.id}`;
    li.appendChild(id);
    const mainInfo = document.createElement('div');
    mainInfo.classList.add('main-info');
    let p = mainInfo.appendChild(document.createElement('p'));
    p.innerText = 'Основная информация';
    const buttonsMain = document.createElement('div');
    buttonsMain.classList.add('buttons');
    const buttonEdit = buttonsMain.appendChild(document.createElement('img'));
    buttonEdit.src = '../assets/edit.svg';
    buttonEdit.alt = 'edit';
    buttonEdit.addEventListener('click', () => {
        info.classList.toggle('editable');
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonApprove = buttonsMain.appendChild(document.createElement('img'));
    buttonApprove.src = '../assets/approve.png';
    buttonApprove.alt = 'approve';
    buttonApprove.classList.add('hidden');
    buttonApprove.addEventListener('click', async () => {
        if (info.getAttribute('edited') === 'true') {
            const ferry = await query('ferry', 'GET', undefined, {
                id: ferrySelect.value
            });
            const result = await ferry.json();
            const new_cars_count = result[0].cars_count;
            const new_cargos_count = result[0].cargos_count;
            let sum_cargos = 0;
            let sum_cars = 0;
            const items = li.querySelectorAll('.item-subtype');
            items.forEach(item => {
                if (item.classList.contains('hidden'))
                    sum_cargos += 1;
                else {
                    const subtype = item.querySelector('p:not(.title)');
                    sum_cars += getSubtype(subtype.getAttribute('value'));
                }
            });
            console.log(sum_cars, sum_cargos);
            if (new_cargos_count - sum_cargos < 0 || new_cars_count - sum_cars < 0) {
                alert('Невозможно сменить паром: недостаточно мест.');
                return;
            }
            li.querySelector('.cargos-last-count').innerText = String(new_cargos_count - sum_cargos);
            li.querySelector('.cars-last-count').innerText = String(new_cars_count - sum_cars);
            await query('trip', 'POST', {
                destination: destinationSelect.value,
                ferry: ferrySelect.value
            }, {
                id: options.id
            });
            destinationP.innerText = destinationSelect.options[destinationSelect.selectedIndex].text;
            ferryP.innerText = ferrySelect.options[ferrySelect.selectedIndex].text;
            destinationP.setAttribute('value', destinationSelect.value);
            ferryP.setAttribute('value', ferrySelect.value);
        }
        info.setAttribute('edited', 'false');
        info.classList.toggle('editable');
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonCancel = buttonsMain.appendChild(document.createElement('img'));
    buttonCancel.src = '../assets/cancel.png';
    buttonCancel.alt = 'edit';
    buttonCancel.classList.add('hidden');
    buttonCancel.addEventListener('click', () => {
        info.classList.toggle('editable');
        if (info.getAttribute('edited') === 'true') {
            destinationSelect.value = destinationP.getAttribute('value');
            ferrySelect.value = ferryP.getAttribute('value');
        }
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    mainInfo.appendChild(buttonsMain);
    li.appendChild(mainInfo);
    const info = document.createElement('div');
    info.classList.add('info');
    info.setAttribute('edited', 'false');
    const destination = document.createElement('div');
    const destinationP = addRow(destination, {
        name: 'Место назначения',
        value: options.destination,
        className: 'trip-destination'
    });
    const destinationSelect = await addSelectSql(destination, {
        uuid: options.id,
        classes: ['inp'],
        label: 'city',
        labelName: '',
        mainOption: 'Город',
        query: {
            url: '/destination',
            method: 'GET'
        },
        value: options.destination,
    });
    destinationP.setAttribute('value', destinationSelect.value);
    destinationSelect.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    });
    info.appendChild(destination);
    const ferry = document.createElement('div');
    const ferryP = addRow(ferry, {
        name: 'Паром',
        value: options.ferry,
        className: 'trip-ferry'
    });
    const ferrySelect = await addSelectSql(ferry, {
        uuid: options.id,
        classes: ['inp'],
        label: 'ferry',
        labelName: '',
        mainOption: 'Название',
        query: {
            url: '/ferry',
            method: 'GET'
        },
        value: options.ferry
    });
    ferryP.setAttribute('value', ferrySelect.value);
    ferrySelect.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    });
    info.appendChild(ferry);
    const cargosCount = document.createElement('div');
    cargosCount.classList.add('not-editable');
    const cargosCountP = cargosCount.appendChild(document.createElement('p'));
    cargosCountP.classList.add('title');
    cargosCountP.innerText = 'Оставшееся число грузомест';
    p = cargosCount.appendChild(document.createElement('p'));
    p.classList.add('cargos-last-count');
    info.appendChild(cargosCount);
    const carsCount = document.createElement('div');
    carsCount.classList.add('not-editable');
    const carsCountP = carsCount.appendChild(document.createElement('p'));
    carsCountP.classList.add('title');
    carsCountP.innerText = 'Оставшееся число машиномест';
    p = carsCount.appendChild(document.createElement('p'));
    p.classList.add('cars-last-count');
    info.appendChild(carsCount);
    li.appendChild(info);
    const cardList = li.appendChild(document.createElement('div'));
    cardList.classList.add('card-list');
    const cardListP = cardList.appendChild(document.createElement('p'));
    cardListP.innerHTML = 'Список перевозки:';
    const listCont = cardList.appendChild(document.createElement('div'));
    listCont.classList.add('list-cont');
    const addBtn = li.appendChild(document.createElement('button'));
    addBtn.classList.add('add-card-btn');
    addBtn.innerText = 'Добавить груз';
    addBtn.addEventListener('click', () => {
        addItem(li, listCont);
    });
    const deleteBtn = li.appendChild(document.createElement('button'));
    deleteBtn.classList.add('delete-card-btn');
    deleteBtn.innerText = 'Удалить карточку';
    deleteBtn.addEventListener('click', async () => {
        await query('trip', 'DELETE', undefined, { id: li.id });
        li.remove();
    });
    await addItems(li, listCont, options.cargos);
    li.querySelector('.cargos-last-count').innerText = li.getAttribute('cargos-last-count');
    li.querySelector('.cars-last-count').innerText = li.getAttribute('cars-last-count');
    list.insertBefore(li, list.lastElementChild);
    return li;
}
async function addListElement() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');
        const destination = await addSelectSql(content, {
            classes: ['title'],
            label: 'city',
            labelName: 'Место назначения',
            mainOption: 'Город',
            query: {
                url: '/destination',
                method: 'GET'
            },
        });
        const ferry = await addSelectSql(content, {
            classes: ['title'],
            label: 'ferry',
            labelName: 'Паром',
            mainOption: 'Название',
            query: {
                url: '/ferry',
                method: 'GET'
            },
        });
        async function createNewListElement() {
            const uuid = crypto.randomUUID();
            await query('/trip', 'PUT', {
                id: uuid,
                destination: destination.value,
                ferry: ferry.value,
            });
            const result = await query('ferry', 'GET', undefined, { id: ferry.value });
            const rows = await result.json();
            const li = await createListElement({
                id: uuid,
                destination: destination.options[destination.selectedIndex].text,
                ferry: ferry.options[ferry.selectedIndex].text,
                cargos: [],
                cars_count: rows[0].cars_count,
                cargos_count: rows[0].cargos_count
            });
            enableDragAndDropCard(li);
        }
        const modalButtons = modal.querySelector('.modal-buttons');
        const approveBtn = document.createElement('img');
        approveBtn.src = '../assets/approve.png';
        approveBtn.alt = 'Approve';
        approveBtn.id = 'approve';
        approveBtn.addEventListener('click', () => {
            try {
                createNewListElement();
                toggleModal();
            }
            catch (e) {
                window.alert(e.message);
            }
        });
        modalButtons.insertBefore(approveBtn, modalButtons.firstChild);
        toggleModal();
    }
}
function enableDragAndDropCard(card) {
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
    });
    card.addEventListener('drop', async (e) => {
        var _a, _b;
        e.preventDefault();
        card.classList.remove('drag-over');
        const data = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
        if (!data)
            return;
        const { itemId, sourceDestination } = JSON.parse(data);
        const draggedItem = document.getElementById(itemId);
        const targetList = card.querySelector('.list-cont');
        const targetDestination = (_b = card.querySelectorAll('.trip-destination p')[1]) === null || _b === void 0 ? void 0 : _b.innerText.trim();
        if (draggedItem && targetList && targetDestination === sourceDestination) {
            const cardId = card.id;
            if (!cardId)
                return;
            const item = document.getElementById(itemId);
            const itemTypeSelect = item.querySelector('.item-type select');
            const itemSubtypeSelect = item.querySelector('.item-subtype select');
            let validationResult;
            if (itemTypeSelect.value === 'Автомобиль') {
                validationResult = validateCount(card, getSubtype(itemSubtypeSelect.value));
            }
            else {
                validationResult = validateCount(card);
            }
            if (!validationResult) {
                alert('Недостаточно места на пароме');
                return;
            }
            if (!targetList.querySelector('.list-item')) {
                const placeholder = document.createElement('div');
                placeholder.classList.add('list-item-placeholder');
                targetList.appendChild(placeholder);
            }
            const sourceCard = draggedItem.closest('.card');
            const sourceCardId = sourceCard === null || sourceCard === void 0 ? void 0 : sourceCard.id;
            if (sourceCardId) {
                await query('/trip', 'POST', {
                    itemId,
                    remove: true
                }, {
                    id: sourceCardId
                });
            }
            await query('/trip', 'POST', {
                itemId,
            }, {
                id: cardId
            });
            targetList.appendChild(draggedItem);
            const placeholder = targetList.querySelector('.list-item-placeholder');
            if (placeholder)
                placeholder.remove();
            console.log(itemTypeSelect.value);
            console.log(itemSubtypeSelect.value);
            if (itemTypeSelect.value === 'Автомобиль') {
                card.setAttribute('cars-last-count', (+card.getAttribute('cars-last-count')
                    - getSubtype(itemSubtypeSelect.value)).toString());
                sourceCard.setAttribute('cars-last-count', (+sourceCard.getAttribute('cars-last-count')
                    + getSubtype(itemSubtypeSelect.value)).toString());
            }
            else {
                card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count') - 1).toString());
                sourceCard.setAttribute('cargos-last-count', (+sourceCard.getAttribute('cargos-last-count') + 1).toString());
            }
            card.querySelector('.cargos-last-count').innerText = card.getAttribute('cargos-last-count');
            card.querySelector('.cars-last-count').innerText = card.getAttribute('cars-last-count');
            sourceCard.querySelector('.cargos-last-count').innerText = sourceCard.getAttribute('cargos-last-count');
            sourceCard.querySelector('.cars-last-count').innerText = sourceCard.getAttribute('cars-last-count');
        }
        else {
            alert('Невозможно перенести элемент: точки назначения не совпадают.');
        }
    });
}
function enableDragAndDropListItem(item) {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
        var _a;
        const sourceCard = item.closest('.card');
        const sourceDestination = (_a = sourceCard === null || sourceCard === void 0 ? void 0 : sourceCard.querySelectorAll('.trip-destination p')[1]) === null || _a === void 0 ? void 0 : _a.innerText.trim();
        if (e.dataTransfer && sourceDestination) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                itemId: item.id,
                sourceDestination
            }));
        }
        item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
}
function enableDragAndDrop() {
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(enableDragAndDropListItem);
    const cards = document.querySelectorAll('.card');
    cards.forEach(enableDragAndDropCard);
}
async function createDestination() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');
        const id = crypto.randomUUID();
        const idCont = document.createElement('div');
        idCont.innerHTML = `<p>ID: ${id}</p>`;
        content.appendChild(idCont);
        const cityCont = document.createElement('div');
        const cityInput = addInput(cityCont, {
            classes: [],
            label: 'city',
            labelName: 'Место назначения',
            type: 'text'
        });
        content.appendChild(cityCont);
        const modalButtons = modal.querySelector('.modal-buttons');
        const approveBtn = document.createElement('img');
        approveBtn.src = '../assets/approve.png';
        approveBtn.alt = 'Approve';
        approveBtn.id = 'approve';
        approveBtn.addEventListener('click', async () => {
            if (!validateString(cityInput.value)) {
                alert(`Не заполнено поле ${cityInput.labels[0].innerText}`);
                return;
            }
            await query('destination', 'PUT', {
                id: id,
                value: cityInput.value,
            });
            const citySelects = document.querySelectorAll(`[id^='city']:not(.modal div)`);
            citySelects.forEach(citySelect => {
                const option = document.createElement('option');
                option.value = id;
                option.innerText = cityInput.value;
                citySelect.appendChild(option);
            });
            toggleModal();
        });
        modalButtons.insertBefore(approveBtn, modalButtons.firstChild);
        toggleModal();
    }
}
async function init() {
    const result = await query('allTrips', 'GET');
    const rows = await result.json();
    for (const row of rows) {
        await createListElement(row);
    }
    enableDragAndDrop();
}
