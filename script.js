async function submitCsvData(filename, formElement) {
    let content = "";
    const inputs = formElement.querySelectorAll("input[type='text']"); // Get all text inputs from the form
    inputs.forEach(input => {
        content += `${input.value},`;
    });
    content = content.slice(0, -1) + '\n'; // Remove the last comma and add newline

    const token = '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'; // Use environment variables in production
    const url = `https://api.github.com/repos/DaSmuggler22/BlueUnicorn/contents/${filename}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update ${filename}`,
                content: btoa(unescape(encodeURIComponent(content))) // Encode in base64
            })
        });
        const data = await response.json();
        if (data.content) {
            document.getElementById('csv_message').innerText = 'Update successful for ' + filename;
            document.getElementById('csv_message').style.color = 'green';
        } else {
            document.getElementById('csv_message').innerText = 'Update failed for ' + filename;
            document.getElementById('csv_message').style.color = 'red';
        }
    } catch (error) {
        console.error('Error updating CSV data:', error);
        document.getElementById('csv_message').innerText = 'Network or other error: ' + error.message;
        document.getElementById('csv_message').style.color = 'red';
    }
}
