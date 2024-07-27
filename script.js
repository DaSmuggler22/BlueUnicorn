function submitData(filename, formElement) {
    let formData = new FormData(formElement);
    let content = "";
    for (let [key, value] of formData.entries()) {
        content += `${value},`;
    }
    content = content.slice(0, -1) + '\n'; // Remove last comma and add a newline
    updateFile(filename, btoa(content)); // Assuming CSV needs base64 encoding
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
            document.getElementById('message').style.color = 'green';
        } else {
            document.getElementById('message').innerText = 'Update failed!';
            document.getElementById('message').style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Update failed!';
        document.getElementById('message').style.color = 'red';
    }
}
