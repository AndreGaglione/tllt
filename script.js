const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9cePrDxFCkjLTA3dVYSpaPo0SkLz8xizF_7Ob24SVFhLOzdjIwP8HCkYxl7gYHcDGI46IgpVgZf4X/pub?output=csv';

let currentLanguage = localStorage.getItem('language') || 'IT';

// Funzione per convertire link Google Drive in thumbnail
function convertToDirectLink(driveUrl) {
    if (!driveUrl) return '';
    let match = driveUrl.match(/id=([\w-]+)/);
    if (!match) {
        match = driveUrl.match(/\/d\/([\w-]+)/);
    }
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}` : driveUrl;
}


function loadSiteData() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            const namesList = document.getElementById('namesList');
            const mobileNamesList = document.getElementById('mobileNamesList');
            const imagesContainer = document.getElementById('imagesContainer');
            const interviewContainer = document.getElementById('interviewContainer');
            const mobileSlider = document.getElementById('mobileSlider');
            const mobileInterview = document.getElementById('mobileInterview');

            data.forEach(row => {
                // Desktop list item
                const li = document.createElement('li');
                li.textContent = row.name;
                li.classList.add('name-item');

                // Mobile list item
                const mobileLi = document.createElement('li');
                mobileLi.textContent = row.name;
                mobileLi.classList.add('mobile-name-item');

                const clickHandler = () => {
                    // Evidenzia attivo (desktop)
                    document.querySelectorAll('.name-item').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');
                    
                    // Evidenzia attivo (mobile)
                    document.querySelectorAll('.mobile-name-item').forEach(el => el.classList.remove('active'));
                    mobileLi.classList.add('active');
                    
                    // Chiudi menu mobile
                    document.getElementById('mobileMenu').classList.remove('open');

                    // Immagini desktop
                    const imageLinks = (row["Image list"] || "").split(',').map(link => link.trim());
                    imagesContainer.innerHTML = imageLinks.map(link => `<img src="${link}" alt="image">`).join('');

                    // Slider mobile
                    if (imageLinks.length > 0) {
                        mobileSlider.innerHTML = `<div class="slider-container">
                            ${imageLinks.map(link => `<img src="${link}" alt="image">`).join('')}
                        </div>`;
                    }

                    // Intervista (sia desktop che mobile)
                    const interviewUrl = currentLanguage === 'ENG' ? row['interview - ENG'] : row['interview - IT'];
                    if (interviewUrl) {
                        fetch(interviewUrl)
                            .then(res => res.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const content = doc.querySelector('.doc-content');
                                if (content) {
                                    // Sostituisci [IMG: url] con <img src="...">
                                    let processedHtml = content.innerHTML.replace(/\[IMG:\s*([^\]]+)\]/g, (match, url) => {
                                        const cleanUrl = url.trim();
                                        return `<img src="${convertToDirectLink(cleanUrl)}" alt="inline image" class="inline-interview-img">`;
                                    });
                                    
                                    // Processa i paragrafi con * per le domande
                                    processedHtml = processQuestionParagraphs(processedHtml);
                                    
                                    interviewContainer.innerHTML = processedHtml;
                                    mobileInterview.innerHTML = processedHtml;
                                    
                                    // Gestisci link esterni
                                    setupExternalLinks();
                                    
                                    // Gestisci lightbox per immagini
                                    setupImageLightbox();
                                } else {
                                    const errorMsg = '<p>Unable to load interview content.</p>';
                                    interviewContainer.innerHTML = errorMsg;
                                    mobileInterview.innerHTML = errorMsg;
                                }
                            })
                            .catch(err => {
                                const errorMsg = '<p>Error loading interview content.</p>';
                                interviewContainer.innerHTML = errorMsg;
                                mobileInterview.innerHTML = errorMsg;
                            });
                    }
                };

                li.addEventListener('click', clickHandler);
                mobileLi.addEventListener('click', clickHandler);

                if (namesList) namesList.appendChild(li);
                if (mobileNamesList) mobileNamesList.appendChild(mobileLi);
            });
        }
    });
}

function setupLanguageToggle() {
    const langToggle = document.getElementById('languageToggle');
    const mobileLangToggle = document.getElementById('mobileLanguageToggle');
    
    function updateLanguage(newLang) {
        currentLanguage = newLang;
        localStorage.setItem('language', currentLanguage);
        if (langToggle) langToggle.textContent = currentLanguage;
        if (mobileLangToggle) mobileLangToggle.textContent = currentLanguage;
        
        // Reload content in new language
        const activeItem = document.querySelector('.name-item.active') || document.querySelector('.mobile-name-item.active');
        if (activeItem) activeItem.click();
    }
    
    if (langToggle) {
        langToggle.textContent = currentLanguage;
        langToggle.addEventListener('click', () => {
            const newLang = currentLanguage === 'IT' ? 'ENG' : 'IT';
            updateLanguage(newLang);
        });
    }
    
    if (mobileLangToggle) {
        mobileLangToggle.textContent = currentLanguage;
        mobileLangToggle.addEventListener('click', () => {
            const newLang = currentLanguage === 'IT' ? 'ENG' : 'IT';
            updateLanguage(newLang);
        });
    }
}

function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
        
        // Chiudi menu quando si clicca fuori
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        });
    }
}

function setupProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const interviewContainer = document.getElementById('interviewContainer');
    const mobileInterview = document.getElementById('mobileInterview');
    
    function updateProgress() {
        let container, scrollTop, scrollHeight, clientHeight;
        
        // Determina quale container usare (desktop o mobile)
        if (window.innerWidth <= 768) {
            container = mobileInterview;
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
        } else {
            container = interviewContainer;
            if (!container) return;
            scrollTop = container.scrollTop;
            scrollHeight = container.scrollHeight;
            clientHeight = container.clientHeight;
        }
        
        if (!container || scrollHeight <= clientHeight) {
            progressBar.style.opacity = '0';
            return;
        }
        
        const maxScroll = scrollHeight - clientHeight;
        const scrollPercent = (scrollTop / maxScroll) * 100;
        
        if (scrollPercent > 0) {
            progressBar.style.opacity = '1';
            progressBar.style.width = Math.min(scrollPercent, 100) + '%';
        } else {
            progressBar.style.opacity = '0';
        }
    }
    
    // Event listeners per desktop
    if (interviewContainer) {
        interviewContainer.addEventListener('scroll', updateProgress);
    }
    
    // Event listeners per mobile
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
}

function setupExternalLinks() {
    // Gestisci tutti i link nell'intervista per aprirli in nuova finestra
    const interviewLinks = document.querySelectorAll('.interview-section a, .mobile-interview a');
    interviewLinks.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

function setupImageLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    
    // Rendi tutte le immagini cliccabili per lightbox
    const images = document.querySelectorAll('.images-section img, .mobile-slider img, .inline-interview-img');
    
    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxImg.src = img.src;
            lightbox.classList.add('active');
        });
    });
    
    // Chiudi lightbox cliccando fuori dall'immagine
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
    
    // Chiudi lightbox con X
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
    
    // Chiudi lightbox con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
        }
    });
}

function processQuestionParagraphs(html) {
    // Pattern per paragrafi in tag <p>
    html = html.replace(/<p[^>]*>\s*\*([^*]+?)\*\s*<\/p>/gi, '<p class="question-paragraph">$1</p>');
    
    // Pattern per testo normale che inizia e finisce con * (separato da <br> o newline)
    html = html.replace(/(?:^|<br\s*\/?>|\n)\s*\*([^*\n<]+?)\*\s*(?=<br\s*\/?>|\n|$)/gi, '<div class="question-paragraph">$1</div>');
    
    // Pattern per span o altri elementi inline che contengono testo con *
    html = html.replace(/\*([^*<>\n]+?)\*/g, '<span class="question-text">$1</span>');
    
    return html;
}

window.addEventListener('DOMContentLoaded', () => {
    loadSiteData();
    setupLanguageToggle();
    setupMobileMenu();
    setupProgressBar();
});