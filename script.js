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

function openOrderForm() {
    document.getElementById('order-form-container').style.display = 'flex';
}

function closeOrderForm() {
    document.getElementById('order-form-container').style.display = 'none';
}

function handleOrderFormSubmit(event) {
    event.preventDefault();
    const vendor = document.getElementById('vendor').value;
    const numBars = document.getElementById('numBars').value;
    const shipmentDate = document.getElementById('shipmentDate').value;

    const orderNumber = ordersToFulfill.length + 1;
    ordersToFulfill.push({ orderNumber, vendor, numBars, shipmentDate });

    closeOrderForm();
    populateOrdersToFulfill();
}

function openBatchForm() {
    document.getElementById('batch-form-container').style.display = 'flex';
}

function closeBatchForm() {
    document.getElementById('batch-form-container').style.display = 'none';
}

function handleBatchFormSubmit(event) {
    event.preventDefault();
    const flavor = document.getElementById('flavor').value;
    const quantity = document.getElementById('quantity').value;
    const date = document.getElementById('date').value;

    batchesCompleted.push({ flavor, quantity, date });
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

function handleAuditFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    for (let [key, value] of formData.entries()) {
        currentInventory[key] = parseFloat(value);
    }
    closeAuditForm();
    populateReorderAlerts();
}

function openConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'flex';
}

function closeConsumptionForm() {
    document.getElementById('consumption-form-container').style.display = 'none';
}

function handleConsumptionFormSubmit(event) {
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

function handleProjectionFormSubmit(event) {
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

function handleShipmentFormSubmit(event) {
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
        stockEntry.numBars -= numBars;
        if (stockEntry.numBars < 0) {
            stockEntry.numBars = 0;
        }
    }
    populateFinishedStock();
}

function getIngredientsUsage(flavor) {
    const usage = {
        "Mint": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinProtein: 0.001, SunflowerProtein: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 },
        "Raspberry": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinProtein: 0.001, SunflowerProtein: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 },
        "Chocolate": { CanolaPro: 1670, Dextrin: 835, Chocolate: 3120, Erythritol: 465, Allulose: 465, Gelatin: 167, Salt: 12, CitricAcid: 16, DutchedCocoa: 91, CocoaButter: 160, Raspberry: 120, CookiesCream: 100, Mint: 100, RedSprinkles: 5, BrownSprinkles: 5, GreenSprinkles: 5, ClingWrap: 4, CanolaSpray: 0.5, Criscoe: 0.05, PumpkinProtein: 0.001, SunflowerProtein: 0.001, ShippingBoxes: 1, CartonsRaspberry: 12, CartonsMint: 12, CartonsChocolate: 12, WrappersRaspberry: 120, WrappersMint: 120, WrappersChocolate: 120, LabelStickerRaspberry: 1, LabelStickerMint: 1, LabelStickerChocolate: 1 }
    };
    return usage[flavor];
}

function populateOrdersToFulfill() {
    const tbody = document.getElementById('orders-to-fulfill').querySelector('tbody');
    tbody.innerHTML = '';
    ordersToFulfill.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = order.orderNumber;
        row.insertCell(1).innerText = order.vendor;
        row.insertCell(2).innerText = order.numBars;
        row.insertCell(3).innerText = order.shipmentDate;
        const actionsCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => {
            ordersToFulfill = ordersToFulfill.filter(o => o.orderNumber !== order.orderNumber);
            populateOrdersToFulfill();
        });
        actionsCell.appendChild(deleteButton);
    });
}

function populateBatchesCompleted() {
    const tbody = document.getElementById('batches-completed').querySelector('tbody');
    tbody.innerHTML = '';
    batchesCompleted.forEach(batch => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = batch.flavor;
        row.insertCell(1).innerText = batch.quantity;
        row.insertCell(2).innerText = batch.date;
        const actionsCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => {
            batchesCompleted = batchesCompleted.filter(b => b !== batch);
            populateBatchesCompleted();
        });
        actionsCell.appendChild(deleteButton);
    });
}

function populateFinishedStock() {
    const tbody = document.getElementById('finished-stock').querySelector('tbody');
    tbody.innerHTML = '';
    finishedStock.forEach(stock => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = stock.flavor;
        row.insertCell(1).innerText = stock.numBars;
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
