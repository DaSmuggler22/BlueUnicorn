// GitHub Repository Details
const token = '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'; // Your GitHub token
const owner = 'DaSmuggler22';
const repo = 'BlueUnicorn';

// Data URLs
const dataUrls = {
    orders: `https://raw.githubusercontent.com/${owner}/${repo}/main/orders.csv`,
    finishedStock: `https://raw.githubusercontent.com/${owner}/${repo}/main/finished_stock.csv`,
    batchesCompleted: `https://raw.githubusercontent.com/${owner}/${repo}/main/batches_completed.csv`,
    currentInventory: `https://raw.githubusercontent.com/${owner}/${repo}/main/current_inventory.csv`,
    reorderThresholds: `https://raw.githubusercontent.com/${owner}/${repo}/main/reorder_thresholds.csv`,
    targetStock: `https://raw.githubusercontent.com/${owner}/${repo}/main/target_stock.csv`
};

// Function to fetch CSV data
async function fetchCsvData(url) {
    const response = await fetch(url);
    const data = await response.text();
    return data;
}

// Function to write CSV data
async function writeCsvData(filename, data) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    const base64Data = btoa(unescape(encodeURIComponent(data)));
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${filename}`,
            content: base64Data,
            sha: await getFileSha(filename)
        })
    });
    return response.json();
}

// Function to get file SHA
async function getFileSha(filename) {
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
    const data = await response.json();
    return data.sha;
}

// Function to parse CSV data into an array of objects
function parseCsv(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

// Function to convert array of objects into CSV data
function convertToCsv(data) {
    const headers = Object.keys(data[0]);
    const lines = data.map(row => headers.map(header => row[header]).join(','));
    return [headers.join(','), ...lines].join('\n');
}

// Function to open forms
function openForm(formId) {
    document.getElementById(formId).style.display = 'flex';
}

// Function to close forms
function closeForm(formId) {
    document.getElementById(formId).style.display = 'none';
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

    document.getElementById('enter-order-btn').addEventListener('click', () => openForm('order-form-container'));
    document.getElementById('enter-batches-btn').addEventListener('click', () => openForm('batch-form-container'));
    document.getElementById('audit-inventory-btn').addEventListener('click', () => openForm('audit-form-container'));
    document.getElementById('create-consumption-report-btn').addEventListener('click', () => openForm('consumption-form-container'));
    document.getElementById('create-projection-btn').addEventListener('click', () => openForm('projection-form-container'));
    document.getElementById('enter-shipment-btn').addEventListener('click', () => openForm('shipment-form-container'));

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

// Form submission event listeners
document.getElementById('order-form').addEventListener('submit', handleOrderFormSubmit);
document.getElementById('batch-form').addEventListener('submit', handleBatchFormSubmit);
document.getElementById('audit-form').addEventListener('submit', handleAuditFormSubmit);
document.getElementById('consumption-form').addEventListener('submit', handleConsumptionFormSubmit);
document.getElementById('projection-form').addEventListener('submit', handleProjectionFormSubmit);
document.getElementById('shipment-form').addEventListener('submit', handleShipmentFormSubmit);

function closeOrderForm() {
    document.getElementById('order-form-container').style.display = 'none';
}

// Handle Order Form Submit
async function handleOrderFormSubmit(event) {
    event.preventDefault();
    const vendor = document.getElementById('vendor').value;
    const numBars = document.getElementById('numBars').value;
    const shipmentDate = document.getElementById('shipmentDate').value;

    const orders = await loadCSV('orders.csv');
    const newOrder = {
        'Order #': orders.length + 1,
        Vendor: vendor,
        '# of Bars': numBars,
        'Shipment Date': shipmentDate
    };
    orders.push(newOrder);

    await saveCSV('orders.csv', orders, 'Add new order');
    closeOrderForm();
    await populateOrdersToFulfill();
}

function openBatchForm() {
    document.getElementById('batch-form-container').style.display = 'flex';
}

function closeBatchForm() {
    document.getElementById('batch-form-container').style.display = 'none';
}

// Handle Batch Form Submit
async function handleBatchFormSubmit(event) {
    event.preventDefault();
    const flavor = document.getElementById('flavor').value;
    const quantity = document.getElementById('quantity').value;
    const date = document.getElementById('date').value;

    const batches = await loadCSV('batches_completed.csv');
    const newBatch = { Flavor: flavor, Quantity: quantity, Date: date };
    batches.push(newBatch);

    await saveCSV('batches_completed.csv', batches, 'Add new batch');
    await updateCurrentInventory(flavor, quantity);
    closeBatchForm();
    await populateBatchesCompleted();
}

function openAuditForm() {
    document.getElementById('audit-form-container').style.display = 'flex';
}

function closeAuditForm() {
    document.getElementById('audit-form-container').style.display = 'none';
}

// Handle Audit Form Submit
async function handleAuditFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const currentInventory = {};
    for (let [key, value] of formData.entries()) {
        currentInventory[key] = parseFloat(value);
    }

    await saveCSV('current_inventory.csv', [currentInventory], 'Audit inventory');
    closeAuditForm();
    await populateReorderAlerts();
}

function openConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'flex';
}

function closeConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'none';
}

// Handle Consumption Form Submit
async function handleConsumptionFormSubmit(event) {
    event.preventDefault();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const batches = await loadCSV('batches_completed.csv');
    const filteredBatches = batches.filter(batch => {
        const batchDate = new Date(batch.Date);
        return batchDate >= new Date(startDate) && batchDate <= new Date(endDate);
    });

    const consumptionReport = {};
    filteredBatches.forEach(batch => {
        const ingredientsUsage = getIngredientsUsage(batch.Flavor);
        for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
            if (!consumptionReport[ingredient]) {
                consumptionReport[ingredient] = 0;
            }
            consumptionReport[ingredient] += usage * (batch.Quantity / 120);
        }
    });

    // Display the consumption report
    displayConsumptionReport(consumptionReport, startDate, endDate);
    closeConsumptionForm();
}

// Handle Projection Form Submit
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

    // Display the projection report
    displayProjectionReport(projectionReport);
    closeProjectionForm();
}

function openShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'flex';
    populateOrderDropdown();
}

function closeShipmentForm() {
    document.getElementById('shipment-form-container').style.display = 'none';
}

// Handle Shipment Form Submit
async function handleShipmentFormSubmit(event) {
    event.preventDefault();
    const orderNumber = document.getElementById('order-number').value;

    const orders = await loadCSV('orders.csv');
    const order = orders.find(o => o['Order #'] == orderNumber);
    if (order) {
        await updateFinishedStock(order.Vendor, order['# of Bars']);
        const updatedOrders = orders.filter(o => o['Order #'] != orderNumber);
        await saveCSV('orders.csv', updatedOrders, 'Update orders');
    }

    closeShipmentForm();
    await populateOrdersToFulfill();
    await populateFinishedStock();
}

// Update finished stock based on shipment
async function updateFinishedStock(vendor, numBars) {
    const stock = await loadCSV('finished_stock.csv');
    const stockEntry = stock.find(item => item.Vendor === vendor);
    if (stockEntry) {
        stockEntry['# of Bars'] = Math.max(0, parseInt(stockEntry['# of Bars']) - numBars);
    }
    await saveCSV('finished_stock.csv', stock, 'Update finished stock');
    await populateFinishedStock();
}

// Update current inventory based on batch completion
async function updateCurrentInventory(flavor, quantity) {
    const inventory = await loadCSV('current_inventory.csv');
    const ingredientsUsage = getIngredientsUsage(flavor);
    const usageMultiplier = quantity / 120; // 120 bars per batch
    for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
        if (inventory[0][ingredient] !== undefined) {
            inventory[0][ingredient] -= usage * usageMultiplier;
        }
    }
    await saveCSV('current_inventory.csv', inventory, 'Update current inventory');
    await populateReorderAlerts();
}

// Populate Orders to Fulfill
async function populateOrdersToFulfill() {
    const orders = await loadCSV('orders.csv');
    const tbody = document.getElementById('orders-to-fulfill').querySelector('tbody');
    tbody.innerHTML = '';
    orders.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = order['Order #'];
        row.insertCell(1).innerText = order.Vendor;
        row.insertCell(2).innerText = order['# of Bars'];
        row.insertCell(3).innerText = order['Shipment Date'];
        const actionsCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const updatedOrders = orders.filter(o => o['Order #'] !== order['Order #']);
            await saveCSV('orders.csv', updatedOrders, 'Delete order');
            await populateOrdersToFulfill();
        });
        actionsCell.appendChild(deleteButton);
    });
}

// Populate Finished Stock
async function populateFinishedStock() {
    const stock = await loadCSV('finished_stock.csv');
    const tbody = document.getElementById('finished-stock').querySelector('tbody');
    tbody.innerHTML = '';
    stock.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = item.Flavor;
        row.insertCell(1).innerText = item['# of Bars'];
    });
}

// Populate Batches Completed
async function populateBatchesCompleted() {
    const batches = await loadCSV('batches_completed.csv');
    const tbody = document.getElementById('batches-completed').querySelector('tbody');
    tbody.innerHTML = '';
    batches.forEach(batch => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = batch.Flavor;
        row.insertCell(1).innerText = batch.Quantity;
        row.insertCell(2).innerText = batch.Date;
        const actionsCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            const updatedBatches = batches.filter(b => b !== batch);
            await saveCSV('batches_completed.csv', updatedBatches, 'Delete batch');
            await populateBatchesCompleted();
        });
        actionsCell.appendChild(deleteButton);
    });
}

// Populate Reorder Alerts
async function populateReorderAlerts() {
    const inventory = await loadCSV('current_inventory.csv');
    const thresholds = await loadCSV('reorder_thresholds.csv');
    const targetStock = await loadCSV('target_stock.csv');
    const tbody = document.getElementById('reorder-alerts-details');
    tbody.innerHTML = '';
    let id = 1;
    for (const [ingredient, currentStock] of Object.entries(inventory[0])) {
        const row = tbody.insertRow();
        const reorderThreshold = thresholds.find(threshold => threshold[0] === ingredient)[1];
        const target = targetStock.find(target => target[0] === ingredient)[1];
        row.insertCell(0).innerText = id++;
        row.insertCell(1).innerText = ingredient;
        row.insertCell(2).innerText = reorderThreshold;
        row.insertCell(3).innerText = currentStock;
        row.insertCell(4).innerText = target;
        row.insertCell(5).innerText = (target - currentStock).toFixed(2);

        const idCell = row.cells[0];
        if (currentStock < reorderThreshold) {
            idCell.style.backgroundColor = 'red';
        } else if (currentStock >= reorderThreshold && currentStock < target) {
            idCell.style.backgroundColor = 'yellow';
        } else {
            idCell.style.backgroundColor = 'green';
        }
    };
}

// Display Consumption Report
function displayConsumptionReport(report, startDate, endDate) {
    let reportWindow = window.open('', '_blank');
    reportWindow.document.write('<html><head><title>Consumption Report</title></head><body>');
    reportWindow.document.write('<h1>Consumption Report</h1>');
    reportWindow.document.write(`<p>Period: ${startDate} to ${endDate}</p>`);
    reportWindow.document.write('<table border="1"><tr><th>Ingredient</th><th>Kg Used</th></tr>');
    for (const [ingredient, kgUsed] of Object.entries(report)) {
        reportWindow.document.write(`<tr><td>${ingredient}</td><td>${kgUsed.toFixed(2)}</td></tr>`);
    }
    reportWindow.document.write('</table></body></html>');
    reportWindow.document.close();
}

// Display Projection Report
function displayProjectionReport(report) {
    let reportWindow = window.open('', '_blank');
    reportWindow.document.write('<html><head><title>Projection Report</title></head><body>');
    reportWindow.document.write('<h1>Projection Report</h1>');
    reportWindow.document.write('<table border="1"><tr><th>Ingredient</th><th>Kg Required</th></tr>');
    for (const [ingredient, kgRequired] of Object.entries(report)) {
        reportWindow.document.write(`<tr><td>${ingredient}</td><td>${kgRequired.toFixed(2)}</td></tr>`);
    }
    reportWindow.document.write('</table></body></html>');
    reportWindow.document.close();
}

// Utility functions for ingredient usage
function getIngredientsUsage(flavor) {
    const baseIngredients = {
        CanolaPro: 1670,
        Dextrin: 835,
        Chocolate: 3120,
        Erythritol: 465,
        Allulose: 465,
        Gelatin: 167,
        Salt: 12,
        CitricAcid: 16,
        DutchedCocoa: 91,
        CocoaButter: 160,
        ClingWrap: 4,
        CanolaSpray: 0.5,
        Criscoe: 0.05,
        PumpkinPro: 0.001,
        SunflowerPro: 0.001,
        ShippingBoxes: 1
    };

    const flavorSpecificIngredients = {
        Mint: { Mint: 100, GreenSprinkles: 5, WrappersMint: 120, CartonsMint: 12, LabelStickerMint: 1 },
        Raspberry: { Raspberry: 120, RedSprinkles: 5, WrappersRaspberry: 120, CartonsRaspberry: 12, LabelStickerRaspberry: 1 },
        Chocolate: { Chocolate: 100, BrownSprinkles: 5, WrappersChocolate: 120, CartonsChocolate: 12, LabelStickerChocolate: 1 }
    };

    return { ...baseIngredients, ...flavorSpecificIngredients[flavor] };
}

// Load CSV file
async function loadCSV(filename) {
    const csvContent = await fetchCsvData(dataUrls[filename.split('.')[0]]);
    return csvContent.split('\n').map(row => row.split(','));
}

// Save CSV file
async function saveCSV(filename, data, message) {
    const csvContent = data.map(row => row.join(',')).join('\n');
    await writeCsvData(filename, csvContent);
}

// Populate order dropdown
async function populateOrderDropdown() {
    const orders = await loadCSV('orders.csv');
    const orderDropdown = document.getElementById('order-number');
    orderDropdown.innerHTML = orders.map(order => `<option value="${order[0]}">${order[0]}</option>`).join('');
}
