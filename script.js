const GITHUB_API_TOKEN = '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';
const REPO_OWNER = 'DaSmuggler22';
const REPO_NAME = 'BlueUnicorn';
const BRANCH = 'main';  // Adjust if you're using a different branch
const FILE_PATHS = {
    orders: 'orders.csv',
    finishedStock: 'finished_stock.csv',
    batchesCompleted: 'batches_completed.csv',
    currentInventory: 'current_inventory.csv',
    reorderThresholds: 'reorder_thresholds.csv',
    targetStock: 'target_stock.csv'
};

// Utility function to fetch and update CSV files from GitHub
async function fetchFileContent(path) {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, {
        headers: {
            Authorization: `token ${GITHUB_API_TOKEN}`,
            Accept: 'application/vnd.github.v3.raw'
        }
    });

    if (response.ok) {
        return await response.text();
    } else {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
}

async function updateFileContent(path, content, message) {
    const sha = await fetchFileSHA(path);
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_API_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha,
            branch: BRANCH
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to update ${path}: ${response.statusText}`);
    }
}

async function fetchFileSHA(path) {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, {
        headers: {
            Authorization: `token ${GITHUB_API_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data.sha;
    } else {
        throw new Error(`Failed to fetch SHA for ${path}: ${response.statusText}`);
    }
}

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

    // Load initial data from GitHub
    loadData();
});

async function loadData() {
    try {
        const orders = await fetchFileContent(FILE_PATHS.orders);
        const finishedStock = await fetchFileContent(FILE_PATHS.finishedStock);
        const batchesCompleted = await fetchFileContent(FILE_PATHS.batchesCompleted);
        const currentInventory = await fetchFileContent(FILE_PATHS.currentInventory);
        const reorderThresholds = await fetchFileContent(FILE_PATHS.reorderThresholds);
        const targetStock = await fetchFileContent(FILE_PATHS.targetStock);

        // Parse the CSV content and populate the tables
        populateOrdersToFulfill(parseCSV(orders));
        populateFinishedStock(parseCSV(finishedStock));
        populateBatchesCompleted(parseCSV(batchesCompleted));
        populateCurrentInventory(parseCSV(currentInventory));
        populateReorderThresholds(parseCSV(reorderThresholds));
        populateTargetStock(parseCSV(targetStock));
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
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

    const orderNumber = ordersToFulfill.length + 1;
    ordersToFulfill.push({ orderNumber, vendor, numBars, shipmentDate });

    // Update GitHub file
    await updateFileContent(FILE_PATHS.orders, generateCSV(ordersToFulfill), 'Update orders');

    closeOrderForm();
    populateOrdersToFulfill(ordersToFulfill);
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

    batchesCompleted.push({ flavor, quantity, date });
    updateCurrentInventory(flavor, quantity);

    // Update GitHub file
    await updateFileContent(FILE_PATHS.batchesCompleted, generateCSV(batchesCompleted), 'Update batches completed');

    closeBatchForm();
    populateBatchesCompleted(batchesCompleted);
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
    for (let [key, value] of formData.entries()) {
        currentInventory[key] = parseFloat(value);
    }

    // Update GitHub file
    await updateFileContent(FILE_PATHS.currentInventory, generateCSV(Object.entries(currentInventory).map(([key, value]) => ({ key, value }))), 'Update current inventory');

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

    const filteredBatches = batchesCompleted.filter(batch => {
        const batchDate = new Date(batch.date);
        return batchDate >= new Date(startDate) && batchDate <= new Date(endDate);
    });

    const consumptionReport = {};
    filteredBatches.forEach(batch => {
        const ingredientsUsage = getIngredientsUsage(batch.flavor);
        for (const [ingredient, usage] of Object.entries(ingredientsUsage)) {
            if (!consumptionReport[ingredient]) {
                consumptionReport[ingredient] = 0;
            }
            consumptionReport[ingredient] += usage * (batch.quantity / 120);
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

    // Update GitHub file
    await updateFileContent(FILE_PATHS.orders, generateCSV(ordersToFulfill), 'Update orders');

    closeShipmentForm();
    populateOrdersToFulfill(ordersToFulfill);
    populateFinishedStock();
}

function populateOrderDropdown() {
    const orderDropdown = document.getElementById('order-number');
    orderDropdown.innerHTML = ordersToFulfill.map(order => `<option value="${order.orderNumber}">${order.orderNumber}</option>`).join('');
}

function updateFinishedStock(vendor, numBars) {
    const stockEntry = finishedStock.find(stock => stock.vendor == vendor);
    if (stockEntry) {
        stockEntry.numBars -= numBars;
        if (stockEntry.numBars < 0) {
            stockEntry.numBars = 0;
        }
    }
    populateFinishedStock();
}

function getIngredientsUsage(flavor) {
    const usage = {
        "Mint Chocolate": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRasp: 12, CartonsMint: 12, CartonsChoc: 12, WrappersRasp: 120, WrappersMint: 120, WrappersChoc: 120, LabelStickersR: 1, LabelStickersM: 1, LabelStickersC: 1 },
        "Raspberry": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRasp: 12, CartonsMint: 12, CartonsChoc: 12, WrappersRasp: 120, WrappersMint: 120, WrappersChoc: 120, LabelStickersR: 1, LabelStickersM: 1, LabelStickersC: 1 },
        "Double Chocolate": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesAndCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinPro: 0.001, SunflowerPro: 0.001, ShippingBoxes: 1, CartonsRasp: 12, CartonsMint: 12, CartonsChoc: 12, WrappersRasp: 120, WrappersMint: 120, WrappersChoc: 120, LabelStickersR: 1, LabelStickersM: 1, LabelStickersC: 1 },
    };
    return usage[flavor];
}

function generateCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
}

function populateOrdersToFulfill(orders) {
    const tbody = document.getElementById('orders-to-fulfill').querySelector('tbody');
    tbody.innerHTML = '';
    orders.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = order.orderNumber;
        row.insertCell(1).innerText = order.vendor;
        row.insertCell(2).innerText = order.numBars;
        row.insertCell(3).innerText = order.shipmentDate;
        const actionsCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            ordersToFulfill = ordersToFulfill.filter(o => o.orderNumber !== order.orderNumber);
            await updateFileContent(FILE_PATHS.orders, generateCSV(ordersToFulfill), 'Update orders');
            populateOrdersToFulfill(ordersToFulfill);
        });
        actionsCell.appendChild(deleteButton);
    });
}

function populateFinishedStock(stock) {
    const tbody = document.getElementById('finished-stock').querySelector('tbody');
    tbody.innerHTML = '';
    stock.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = item.flavor;
        row.insertCell(1).innerText = item.numBars;
    });
}

function populateBatchesCompleted(batches) {
    const tbody = document.getElementById('batches-completed').querySelector('tbody');
    tbody.innerHTML = '';
    batches.forEach(batch => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = batch.flavor;
        row.insertCell(1).innerText = batch.quantity;
        row.insertCell(2).innerText = batch.date;
        const actionsCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', async () => {
            batchesCompleted = batchesCompleted.filter(b => b !== batch);
            await updateFileContent(FILE_PATHS.batchesCompleted, generateCSV(batchesCompleted), 'Update batches completed');
            populateBatchesCompleted(batchesCompleted);
        });
        actionsCell.appendChild(deleteButton);
    });
}

function populateCurrentInventory(inventory) {
    currentInventory = {};
    inventory.forEach(item => {
        currentInventory[item.key] = parseFloat(item.value);
    });
    populateReorderAlerts();
}

function populateReorderThresholds(thresholds) {
    reorderThresholds = {};
    thresholds.forEach(item => {
        reorderThresholds[item.key] = parseFloat(item.value);
    });
}

function populateTargetStock(targets) {
    targetStock = {};
    targets.forEach(item => {
        targetStock[item.key] = parseFloat(item.value);
    });
}

function populateReorderAlerts() {
    const tbody = document.getElementById('reorder-alerts-details');
    tbody.innerHTML = '';
    let id = 1;
    for (const [ingredient, currentStock] of Object.entries(currentInventory)) {
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
    }
}
