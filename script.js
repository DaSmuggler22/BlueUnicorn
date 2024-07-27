async function updateFile(filename, content) {
    const filePath = `path/to/${filename}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // Fetch the file to get the SHA to update the file
    const fileResponse = await fetch(url, {
        headers: { 'Authorization': `token ${token}` }
    });
    const fileData = await fileResponse.json();
    const sha = fileData.sha;

    // PUT request to update the file
    const updateResponse = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update ${filename}`,
            content: btoa(content),
            sha: sha
        })
    });
    const updateData = await updateResponse.json();
    return updateData;
}
