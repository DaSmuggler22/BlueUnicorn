function submitData(filename, formElement) {
    let content = "";
    const inputs = formElement.querySelectorAll("input[type='text']"); // Get all text inputs in the form
    inputs.forEach(input => {
        content += `${input.value},`;
    });
    content = content.slice(0, -1) + '\n'; // Remove the last comma and add a newline
    updateFile(filename, btoa(content)); // Assuming CSV needs base64 encoding
}

async function updateFile(filename, content) {
    const url = `https://api.github.com/repos/DaSmuggler22/BlueUnicorn/contents/${filename}`;
    const token = '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'; // Important: Use environment variables in production to handle the token securely
    try {
        const getFileResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        const fileData = await getFileResponse.json();
        const sha = fileData.sha; // Get the SHA of the file to update

        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update ${filename}`,
                content: content,
                sha: sha
            })
        });
        const data = await putResponse.json();
        if (data.content) {
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
