const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9cePrDxFCkjLTA3dVYSpaPo0SkLz8xizF_7Ob24SVFhLOzdjIwP8HCkYxl7gYHcDGI46IgpVgZf4X/pub?output=csv';

let currentLanguage = localStorage.getItem('language') || 'IT';

function convertToDirectLink(driveUrl) {
    if (!driveUrl) return '';
    const match = driveUrl.match(/id=([^&]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}` : driveUrl;
}

function loadSiteData() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            const namesList = document.getElementById('namesList');
            const imagesContainer = document.getElementById('imagesContainer');
            const interviewContainer = document.getElementById('interviewContainer');

            data.forEach(row => {
                const li = document.createElement('li');
                li.textContent = row.name;
                li.classList.add('name-item');

                li.addEventListener('click', () => {
                    // Evidenzia attivo
                    document.querySelectorAll('.name-item').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');

                    // Immagini
                    const imageLinks = (row["Image list"] || "").split(',').map(link => link.trim());
                    imagesContainer.innerHTML = imageLinks.map(link => `<img src="${link}" alt="image">`).join('');

                    // Intervista
                    const interviewUrl = currentLanguage === 'ENG' ? row['interview - ENG'] : row['interview - IT'];
                    if (interviewUrl) {
                        fetch(interviewUrl)
                            .then(res => res.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const content = doc.querySelector('.doc-content');
                                if (content) {
                                    interviewContainer.innerHTML = content.innerHTML;
                                } else {
                                    interviewContainer.innerHTML = '<p>Unable to load interview content.</p>';
                                }
                            })
                            .catch(err => {
                                interviewContainer.innerHTML = '<p>Error loading interview content.</p>';
                            });
                    }
                });

                namesList.appendChild(li);
            });
        }
    });
}

function setupLanguageToggle() {
    const langToggle = document.getElementById('languageToggle');
    langToggle.textContent = currentLanguage;
    langToggle.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'IT' ? 'ENG' : 'IT';
        localStorage.setItem('language', currentLanguage);
        langToggle.textContent = currentLanguage;
        const activeItem = document.querySelector('.name-item.active');
        if (activeItem) activeItem.click(); // Reload content in the new language
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadSiteData();
    setupLanguageToggle();

    // Scroll per nascondere e mostrare il contenitore immagini
    let lastScrollTop = 0;
    const imagesWrapper = document.querySelector('.images-wrapper');
    window.addEventListener('scroll', function() {
        let scrollTop = window.scrollY || document.documentElement.scrollTop;
        imagesWrapper.style.transform = scrollTop > lastScrollTop ? 'translateY(-100%)' : 'translateY(0)';
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
});