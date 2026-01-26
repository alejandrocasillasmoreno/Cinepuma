const API_KEY = '9b6940210ea6faabd174810c5889f878';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentGenreId = null;

// Remediación Fase 3: Función para manejar el anuncio de carga a lectores de pantalla
function announceToScreenReader(message) {
    const announcer = document.getElementById('sr-announcer') || createAnnouncer();
    announcer.textContent = message;
}

function createAnnouncer() {
    const el = document.createElement('div');
    el.id = 'sr-announcer';
    el.setAttribute('aria-live', 'polite');
    el.className = 'visually-hidden';
    document.body.appendChild(el);
    return el;
}

export async function loadMoviesByGenre(genreId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (currentGenreId !== genreId) {
        currentGenreId = genreId;
        currentPage = 1;
        container.innerHTML = '<p style="color:white; text-align:center;" aria-busy="true">Cargando películas...</p>';
        container.nextElementSibling?.remove();
    }

    try {
        const url = `${BASE_URL}/discover/movie?with_genres=${genreId}&language=es-ES&sort_by=popularity.desc&page=${currentPage}&api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (currentPage === 1) {
            container.innerHTML = '';
            setupContainerStyles(container);
            createLoadMoreButton(container);
        }

        renderMovies(data.results, container);
        announceToScreenReader(`Se han cargado ${data.results.length} películas nuevas.`);
        toggleLoadMoreButton(data.results.length > 0);

    } catch (error) {
        container.innerHTML = '<p style="color:red; text-align:center;" role="alert">Error al cargar películas.</p>';
    }
}

function setupContainerStyles(container) {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    container.style.gap = '20px';
    container.style.padding = '20px';
}

function createLoadMoreButton(container) {
    if (container.nextElementSibling && container.nextElementSibling.id === 'load-more-genres') return;

    const btn = document.createElement('button');
    btn.id = 'load-more-genres';
    btn.innerText = 'Ver más películas';
    btn.className = 'btn-enviar'; // Reutilizamos tu clase de CSS remediada
    btn.style.cssText = "display:block; margin: 20px auto;";

    btn.addEventListener('click', () => {
        currentPage++;
        loadMoviesByGenre(currentGenreId, container.id);
    });

    container.parentNode.insertBefore(btn, container.nextElementSibling);
}

function toggleLoadMoreButton(hasResults) {
    const btn = document.getElementById('load-more-genres');
    if (btn) {
        btn.style.display = hasResults ? 'block' : 'none';
        if (!hasResults) {
            btn.innerText = "No hay más películas";
            btn.disabled = true;
        }
    }
}

export async function searchMoviesInGenre(query, genreId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    currentPage = 1;
    container.innerHTML = `<p style="color:white; text-align:center;" role="status">Buscando "${query}" en este género...</p>`;
    toggleLoadMoreButton(false);

    try {
        const url = `${BASE_URL}/search/movie?language=es-ES&api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();

        const filteredResults = data.results.filter(movie =>
            movie.genre_ids && movie.genre_ids.includes(Number(genreId))
        );

        if (filteredResults.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; color: white; grid-column: 1 / -1;" role="alert">
                    <p>No se encontraron resultados para "${query}" en este género.</p>
                    <button onclick="location.reload()" class="btn-enviar" style="background:none; border:1px solid #ff6b35;">Volver a ver todo</button>
                </div>`;
        } else {
            renderMovies(filteredResults, container);
            const clearBtnDiv = document.createElement('div');
            clearBtnDiv.style.gridColumn = "1 / -1";
            clearBtnDiv.style.textAlign = "center";
            clearBtnDiv.style.marginTop = "20px";
            clearBtnDiv.innerHTML = `<button onclick="location.reload()" class="btn-enviar">Ver todas las películas</button>`;
            container.appendChild(clearBtnDiv);
        }

    } catch (error) {
        container.innerHTML = '<p style="color:red; text-align:center;" role="alert">Error en la búsqueda.</p>';
    }
}

function renderMovies(movies, container) {
    if (!movies || movies.length === 0) return;

    if (container.innerHTML.includes('Buscando') || container.innerHTML.includes('Cargando')) {
        container.innerHTML = '';
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        // Fase 3: Usamos un <article> con un botón invisible para que sea navegable con teclado
        const card = document.createElement('article');
        card.className = 'movie-card';
        card.style.position = 'relative';

        // Estructura accesible: Imagen con alt real + botón que cubre la card para el click
        card.innerHTML = `
            <button class="card-action-btn" 
                    aria-label="Ver detalles de ${movie.title}"
                    style="background:none; border:none; padding:0; width:100%; cursor:pointer; text-align:inherit;">
                <img src="${IMG_URL + movie.poster_path}" 
                     alt="Póster de la película ${movie.title}" 
                     style="width: 100%; border-radius: 8px; display: block;">
                <h3 style="color: white; font-size: 1rem; margin-top: 10px; text-align: center;">${movie.title}</h3>
            </button>
        `;

        const btn = card.querySelector('button');
        btn.addEventListener('click', () => {
            window.location.href = `../../../html/detalle.html?id=${movie.id}`;
        });

        // Efectos visuales de hover ahora también se activan con el foco del teclado
        btn.addEventListener('focus', () => card.style.transform = 'scale(1.05)');
        btn.addEventListener('blur', () => card.style.transform = 'scale(1)');
        card.onmouseover = () => card.style.transform = 'scale(1.05)';
        card.onmouseout = () => card.style.transform = 'scale(1)';

        container.appendChild(card);
    });
}