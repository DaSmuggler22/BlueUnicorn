const token = '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';
const owner = 'DaSmuggler22';
const repo = 'BlueUnicorn';

async function fetchFile(filename) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch file from GitHub');
    }
    return await response.text();
}

async function updateFile(filename, content, message) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    const getResponse = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    const getData = await getResponse.json();
    const sha = getData.sha;

    const base64Content = btoa(content);
    const body = {
        message,
        content: base64Content,
        sha
    };

    const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!putResponse.ok) {
        throw new Error('Failed to update file on GitHub');
    }
}

async function loadCSV(filename) {
    const csvContent = await fetchFile(filename);
    return csvContent.split('\n').map(row => row.split(','));
}

async function saveCSV(filename, data, message) {
    const csvContent = data.map(row => row.join(',')).join('\n');
    await updateFile(filename, csvContent, message);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await populateOrdersToFulfill();
        await populateFinishedStock();
        await populateBatchesCompleted();
        await populateReorderAlerts();
    } catch (error) {
        console.error(error.message);
    }

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
});

async function openOrderForm() {
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

    const orders = await loadCSV('orders.csv');
    const orderNumber = orders.length + 1;
    orders.push([orderNumber, vendor, numBars, shipmentDate]);

    await saveCSV('orders.csv', orders, 'Add new order');
    closeOrderForm();
    await populateOrdersToFulfill();
}

async function openBatchForm() {
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

    const batches = await loadCSV('batches_completed.csv');
    batches.push([flavor, quantity, date]);

    await saveCSV('batches_completed.csv', batches, 'Add new batch');
    await updateCurrentInventory(flavor, quantity);
    closeBatchForm();
    await populateBatchesCompleted();
}

async function openAuditForm() {
    document.getElementById('audit-form-container').style.display = 'flex';
}

function closeAuditForm() {
    document.getElementById('audit-form-container').style.display = 'none';
}

async function handleAuditFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const inventory = {};
    for (let [key, value] of formData.entries()) {
        inventory[key] = parseFloat(value);
    }

    const inventoryData = Object.entries(inventory).map(([key, value]) => [key, value]);
    await saveCSV('current_inventory.csv', inventoryData, 'Audit inventory');
    closeAuditForm();
    await populateReorderAlerts();
}

async function openConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'flex';
}

function closeConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'none';
}

async function handleConsumptionFormSubmit(event) {
    event.preventDefault();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const batches = await loadCSV('batches_completed.csv');
    const filteredBatches = batches.filter(batch => {
        const batchDate = new Date(batch[2]);
        return batchDate >= new Date(startDate) && batchDate <= new Date(endDate);
    });

    const consumptionReport = {};
    filteredBatches.forEach(batch => {
        const ingredientsUsage = getIngredientsUsage(batch[0]);
        for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
            if (!consumptionReport[ingredient]) {
                consumptionReport[ingredient] = 0;
            }
            consumptionReport[ingredient] += usage * (batch[1] / 120);
        }
    });

    // Display the consumption report as needed
    console.log(consumptionReport);
    closeConsumptionForm();
}

async function openProjectionForm() {
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

    // Display the projection report as needed
    console.log(projectionReport);
    closeProjectionForm();
}

async function openShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'flex';
    await populateOrderDropdown();
}

function closeShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'none';
}

async function handleShipmentFormSubmit(event) {
    event.preventDefault();
    const orderNumber = document.getElementById('order-number').value;

    const orders = await loadCSV('orders.csv');
    const order = orders.find(o => o[0] == orderNumber);
    if (order) {
        await updateFinishedStock(order[1], order[2]);
        const updatedOrders = orders.filter(o => o[0] != orderNumber);
        await saveCSV('orders.csv', updatedOrders, 'Update orders');
    }

    closeShipmentForm();
    await populateOrdersToFulfill();
    await populateFinishedStock();
}

async function populateOrdersToFulfill() {
    const orders = await loadCSV('orders.csv');
    const tbody = document.getElementById('orders-to-fulfill').querySelector('tbody');
    tbody.innerHTML = '';
    orders.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = order[0];
        row.insertCell(1).innerText = order[1];
        row.insertCell(2).innerText = order[2];
        row.insertCell(3).innerText = order[3];
        const actionsCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const updatedOrders = orders.filter(o => o[0] != order[0]);
            await saveCSV('orders.csv', updatedOrders, 'Delete order');
            await populateOrdersToFulfill();
        });
        actionsCell.appendChild(deleteButton);
    });
}

async function populateFinishedStock() {
    const stock = await loadCSV('finished_stock.csv');
    const tbody = document.getElementById('finished-stock').querySelector('tbody');
    tbody.innerHTML = '';
    stock.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = item[0];
        row.insertCell(1).innerText = item[1];
    });
}

async function populateBatchesCompleted() {
    const batches = await loadCSV('batches_completed.csv');
    const tbody = document.getElementById('batches-completed').querySelector('tbody');
    tbody.innerHTML = '';
    batches.forEach(batch => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = batch[0];
        row.insertCell(1).innerText = batch[1];
        row.insertCell(2).innerText = batch[2];
        const actionsCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const updatedBatches = batches.filter(b => b != batch);
            await saveCSV('batches_completed.csv', updatedBatches, 'Delete batch');
            await populateBatchesCompleted();
        });
        actionsCell.appendChild(deleteButton);
    });
}

async function populateReorderAlerts() {
    const inventory = await loadCSV('current_inventory.csv');
    const thresholds = await loadCSV('reorder_thresholds.csv');
    const targetStock = await loadCSV('target_stock.csv');
    const tbody = document.getElementById('reorder-alerts-details');
    tbody.innerHTML = '';
    let id = 1;
    inventory.forEach(item => {
        const row = tbody.insertRow();
        const [ingredient, currentStock] = item;
        const reorderThreshold = thresholds.find(threshold => threshold[0] === ingredient)[1];
        const target = targetStock.find(target => target[0] === ingredient)[1];
        row.insertCell(0).innerText = id++;
        row.insertCell(1).innerText = ingredient;
        row.insertCell(2).innerText = reorderThreshold;
        row.insertCell(3).innerText = currentStock;
        row.insertCell(4).innerText = target;
        row.insertCell(5).innerText = (target - currentStock).toFixed(2);
    });
}

async function populateOrderDropdown() {
    const orders = await loadCSV('orders.csv');
    const orderDropdown = document.getElementById('order-number');
    orderDropdown.innerHTML = orders.map(order => `<option value="${order[0]}">${order[0]}</option>`).join('');
}

async function updateFinishedStock(vendor, numBars) {
    const stock = await loadCSV('finished_stock.csv');
    const stockEntry = stock.find(item => item[0] === vendor);
    if (stockEntry) {
        stockEntry[1] = Math.max(0, stockEntry[1] - numBars);
    }
    await saveCSV('finished_stock.csv', stock, 'Update finished stock');
    await populateFinishedStock();
}

function getIngredientsUsage(flavor) {
    const usage = {
        "Mint": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 },
        "Raspberry": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 },
        "Chocolate": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 },
    };
    return usage[flavor];
}
