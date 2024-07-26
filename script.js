const token = 'Y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';
const owner = 'DaSmuggler22';
const repo = 'BlueUnicorn';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('enter-order-btn').addEventListener('click', openOrderForm);
    document.getElementById('enter-batches-btn').addEventListener('click', openBatchForm);
    document.getElementById('audit-inventory-btn').addEventListener('click', openAuditForm);
    document.getElementById('create-consumption-report-btn').addEventListener('click', openConsumptionForm);
    document.getElementById('create-projection-btn').addEventListener('click', openProjectionForm);
    document.getElementById('enter-shipment-btn').addEventListener('click', openShipmentForm);

    document.getElementById('order-form').addEventListener('submit', handleOrderFormSubmit);
    document.getElementById('batch-form').addEventListener('submit', handleBatchFormSubmit);
    document.getElementById('audit-form').addEventListener('submit', handleAuditFormSubmit);
    document.getElementById('consumption-form').addEventListener('submit', handleConsumptionFormSubmit);
    document.getElementById('projection-form').addEventListener('submit', handleProjectionFormSubmit);
    document.getElementById('shipment-form').addEventListener('submit', handleShipmentFormSubmit);

    populateReorderAlerts();
    populateOrdersToFulfill();
    populateFinishedStock();
    populateBatchesCompleted();
});

async function fetchCSV(file) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });
    const text = await response.text();
    return text.split('\n').map(row => row.split(','));
}

async function updateCSV(file, data) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });
    const json = await response.json();
    const content = btoa(data.map(row => row.join(',')).join('\n'));
    const sha = json.sha;

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${file}`,
            content: content,
            sha: sha
        })
    });
}

function openOrderForm() {
    document.getElementById('order-form-container').style.display = 'flex';
}

function closeOrderForm() {
    document.getElementById('order-form-container').style.display = 'none';
}

async function handleOrderFormSubmit(event) {
    event.preventDefault();
    const vendor = document.getElementById('vendor').value;
    const numBars = document.getElementById('numBars').value;
    const shipmentDate = document.getElementById('shipmentDate').value;

    const data = await fetchCSV('orders.csv');
    const orderNumber = data.length;
    data.push([orderNumber, vendor, numBars, shipmentDate]);

    await updateCSV('orders.csv', data);

    closeOrderForm();
    populateOrdersToFulfill();
}

function openBatchForm() {
    document.getElementById('batch-form-container').style.display = 'flex';
}

function closeBatchForm() {
    document.getElementById('batch-form-container').style.display = 'none';
}

async function handleBatchFormSubmit(event) {
    event.preventDefault();
    const flavor = document.getElementById('flavor').value;
    const quantity = document.getElementById('quantity').value;
    const date = document.getElementById('date').value;

    const data = await fetchCSV('batches_completed.csv');
    data.push([flavor, quantity, date]);

    await updateCSV('batches_completed.csv', data);

    updateCurrentInventory(flavor, quantity);
    closeBatchForm();
    populateBatchesCompleted();
}

function openAuditForm() {
    document.getElementById('audit-form-container').style.display = 'flex';
}

function closeAuditForm() {
    document.getElementById('audit-form-container').style.display = 'none';
}

async function handleAuditFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = [];
    for (let [key, value] of formData.entries()) {
        currentInventory[key] = parseFloat(value);
        data.push([key, parseFloat(value)]);
    }
    await updateCSV('current_inventory.csv', data);

    closeAuditForm();
    populateReorderAlerts();
}

function openConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'flex';
}

function closeConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'none';
}

async function handleConsumptionFormSubmit(event) {
    event.preventDefault();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const data = await fetchCSV('batches_completed.csv');
    const filteredBatches = data.filter(batch => {
        const batchDate = new Date(batch[2]);
        return batchDate >= new Date(startDate) && batchDate <= new Date(endDate);
    });

    const consumptionReport = {};
    filteredBatches.forEach(batch => {
        const flavor = batch[0];
        const quantity = parseFloat(batch[1]);
        const ingredientsUsage = getIngredientsUsage(flavor);
        for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
            if (!consumptionReport[ingredient]) {
                consumptionReport[ingredient] = 0;
            }
            consumptionReport[ingredient] += usage * (quantity / 120);
        }
    });

    console.log(consumptionReport);
    closeConsumptionForm();
    // Display the consumption report as needed
}

function openProjectionForm() {
    document.getElementById('projection-form-container').style.display = 'flex';
}

function closeProjectionForm() {
    document.getElementById('projection-form-container').style.display = 'none';
}

async function handleProjectionFormSubmit(event) {
    event.preventDefault();
    const projectedOrders = document.getElementById('projected-orders').value.split(',').reduce((acc, curr) => {
        const [flavor, quantity] = curr.split(':').map(s => s.trim());
        acc[flavor] = parseInt(quantity);
        return acc;
    }, {});

    const projectionReport = {};
    for (const [flavor, quantity] of Object.entries(projectedOrders)) {
        const ingredientsUsage = getIngredientsUsage(flavor);
        for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
            if (!projectionReport[ingredient]) {
                projectionReport[ingredient] = 0;
            }
            projectionReport[ingredient] += usage * (quantity / 120);
        }
    }

    console.log(projectionReport);
    closeProjectionForm();
    // Display the projection report as needed
}

function openShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'flex';
    populateOrderDropdown();
}

function closeShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'none';
}

async function handleShipmentFormSubmit(event) {
    event.preventDefault();
    const orderNumber = document.getElementById('order-number').value;

    const order = ordersToFulfill.find(o => o.orderNumber == orderNumber);
    if (order) {
        updateFinishedStock(order.vendor, order.numBars);
        ordersToFulfill = ordersToFulfill.filter(o => o.orderNumber != orderNumber);
    }

    closeShipmentForm();
    populateOrdersToFulfill();
    populateFinishedStock();
}

function populateOrderDropdown() {
    const orderDropdown = document.getElementById('order-number');
    orderDropdown.innerHTML = ordersToFulfill.map(order => `<option value="${order.orderNumber}">${order.orderNumber}</option>`).join('');
}

function updateFinishedStock(vendor, numBars) {
    const stockEntry = finishedStock.find(stock => stock.vendor == vendor);
    if (stockEntry) {
        stockEntry.numBars = parseInt(stockEntry.numBars) + parseInt(numBars);
    } else {
        finishedStock.push({ vendor, numBars });
    }
    updateCSV('finished_stock.csv', finishedStock.map(stock => [stock.vendor, stock.numBars]));
}

async function updateCurrentInventory(flavor, quantity) {
    const data = await fetchCSV('current_inventory.csv');
    const ingredientsUsage = getIngredientsUsage(flavor);
    data.forEach(inventory => {
        const ingredient = inventory[0];
        if (ingredientsUsage[ingredient]) {
            inventory[1] = parseFloat(inventory[1]) - (ingredientsUsage[ingredient] * (quantity / 120));
        }
    });
    await updateCSV('current_inventory.csv', data);
    populateReorderAlerts();
}

async function populateOrdersToFulfill() {
    const data = await fetchCSV('orders.csv');
    const tbody = document.getElementById('orders-to-fulfill').querySelector('tbody');
    tbody.innerHTML = '';
    data.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = order[0];
        row.insertCell(1).innerText = order[1];
        row.insertCell(2).innerText = order[2];
        row.insertCell(3).innerText = order[3];
        const actionsCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const newData = data.filter(o => o[0] !== order[0]);
            await updateCSV('orders.csv', newData);
            populateOrdersToFulfill();
        });
        actionsCell.appendChild(deleteButton);
    });
}

async function populateFinishedStock() {
    const data = await fetchCSV('finished_stock.csv');
    const tbody = document.getElementById('finished-stock').querySelector('tbody');
    tbody.innerHTML = '';
    data.forEach(stock => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = stock[0];
        row.insertCell(1).innerText = stock[1];
    });
}

async function populateBatchesCompleted() {
    const data = await fetchCSV('batches_completed.csv');
    const tbody = document.getElementById('batches-completed').querySelector('tbody');
    tbody.innerHTML = '';
    data.forEach(batch => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = batch[0];
        row.insertCell(1).innerText = batch[1];
        row.insertCell(2).innerText = batch[2];
        const actionsCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const newData = data.filter(b => b !== batch);
            await updateCSV('batches_completed.csv', newData);
            populateBatchesCompleted();
        });
        actionsCell.appendChild(deleteButton);
    });
}

async function populateReorderAlerts() {
    const data = await fetchCSV('current_inventory.csv');
    const tbody = document.getElementById('reorder-alerts-details');
    tbody.innerHTML = '';
    let id = 1;
    data.forEach(inventory => {
        const ingredient = inventory[0];
        const currentStock = parseFloat(inventory[1]);
        const row = tbody.insertRow();
        row.insertCell(0).innerText = id++;
        row.insertCell(1).innerText = ingredient;
        row.insertCell(2).innerText = reorderThresholds[ingredient] || 'N/A';
        row.insertCell(3).innerText = currentStock.toFixed(2);
        row.insertCell(4).innerText = targetStock[ingredient] || 'N/A';
        const kgForTargetReorder = (targetStock[ingredient] || 0) - currentStock;
        row.insertCell(5).innerText = kgForTargetReorder.toFixed(2);

        const idCell = row.cells[0];
        if (currentStock < (reorderThresholds[ingredient] || 0)) {
            idCell.style.backgroundColor = 'red';
        } else if (currentStock >= (reorderThresholds[ingredient] || 0) && currentStock < (targetStock[ingredient] || 0)) {
            idCell.style.backgroundColor = 'yellow';
        } else {
            idCell.style.backgroundColor = 'green';
        }
    });
}
