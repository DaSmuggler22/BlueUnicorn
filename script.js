window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const backToTopButton = document.getElementById("back-to-top");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
}

function scrollToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function switchLanguage(language) {
    const englishContent = document.getElementById('english-content');
    const spanishContent = document.getElementById('spanish-content');
    const pageTitle = document.querySelector('title');
    const dropdownMenu = document.querySelector('.dropdown-content');
    const englishButton = document.getElementById('english-btn');
    const spanishButton = document.getElementById('spanish-btn');
    const headerTitle = document.querySelector('header h1');
    const menuButton = document.querySelector('.dropbtn');

    if (language === 'english') {
        englishContent.style.display = 'block';
        spanishContent.style.display = 'none';
        pageTitle.innerText = 'Employee Training';
        headerTitle.innerText = 'Employee Training Portal';
        menuButton.innerText = 'Menu';
        dropdownMenu.innerHTML = `
            <a href="#food-handlers-permit">1. Food Handlers Permit Utah</a>
            <a href="#cleaning-sanitization">2. Cleaning & Sanitation Checklists</a>
            <a href="#cloths-aprons">3. Cloths & Aprons (Linens) Use and Storage</a>
            <a href="#contamination-response">4. Contamination Event Response</a>
            <a href="#food-defense">5. Food Defense Plan</a>
            <a href="#health-hygiene">6. Health & Hygiene</a>
            <a href="#sink-process">7. Process for 2-Compartment Sink</a>
            <a href="#workplace-safety">8. Safety in the Workplace</a>
        `;
        englishButton.style.backgroundColor = '#FF9D6E';
        spanishButton.style.backgroundColor = '#10069F';
    } else if (language === 'spanish') {
        englishContent.style.display = 'none';
        spanishContent.style.display = 'block';
        pageTitle.innerText = 'Capacitación para Empleados';
        headerTitle.innerText = 'Portal de Capacitación para Empleados';
        menuButton.innerText = 'Menú';
        dropdownMenu.innerHTML = `
            <a href="#food-handlers-permit-es">1. Tarjeta de Manipulador de Alimentos de Utah</a>
            <a href="#cleaning-sanitization-es">2. Limpieza y Saneamiento</a>
            <a href="#cloths-aprons-es">3. Uso y Almacenamiento de Paños y Delantales (Lencería)</a>
            <a href="#contamination-response-es">4. Respuesta al Evento de Contaminación</a>
            <a href="#food-defense-es">5. Plan de Defensa de Alimentos</a>
            <a href="#health-hygiene-es">6. Salud e Higiene</a>
            <a href="#sink-process-es">7. Proceso para Fregadero de 2 Compartimentos</a>
            <a href="#workplace-safety-es">8. Seguridad en el Lugar de Trabajo</a>
        `;
        englishButton.style.backgroundColor = '#10069F';
        spanishButton.style.backgroundColor = '#FF9D6E';
    }
}
