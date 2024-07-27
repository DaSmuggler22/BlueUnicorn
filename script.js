function submitData() {
    const orderNumber = document.getElementById('orderNumber').value;
    const vendor = document.getElementById('vendor').value;
    const numBars = document.getElementById('numBars').value;
    const shipmentDate = document.getElementById('shipmentDate').value;

    const content = `${orderNumber}, ${vendor}, ${numBars}, ${shipmentDate}\n`;
    updateFile('orders.csv', btoa(content)); // Assume CSV needs base64 encoding
}

async function updateFile(filename, content) {
    const url = `https://api.github.com/repos/DaSmuggler22/BlueUnicorn/contents/${filename}`;
    const token = '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'; // Use environment variables in production
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update ${filename}`,
                content: content
            })
        });
        const data = await response.json();
        if (data.commit) {
            document.getElementById('message').innerText = 'Update successful!';
        } else {
            document.getElementById('message').innerText = 'Update failed!';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Update failed!';
    }
}
