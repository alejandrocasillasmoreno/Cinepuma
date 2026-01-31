// --- CONSTANTES ---
const API_KEY = '9b6940210ea6faabd174810c5889f878';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const TOP_RATED_URL = BASE_URL + '/movie/top_rated?language=es-ES&api_key=' + API_KEY;

const SEARCH_URL = BASE_URL + '/search/movie?language=es-ES&api_key=' + API_KEY;

// Elemento donde se inyectan las pelis (ID estandarizado)
const container = document.getElementById('movies-container');
let currentPage = 1;
let isFetching = false;
let currentMode = 'top_rated'; // 'top_rated' or 'search'
let currentQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    getMovies(TOP_RATED_URL, currentPage);

    // Handle Search
    const searchForm = document.getElementById('global-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('global-search-input');
            const query = input.value.trim();
            if (query) {
                currentMode = 'search';
                currentQuery = query;
                currentPage = 1; // Reset page for new search
                // Hide load more during search initially or reset it
                const btn = document.getElementById('load-more-btn');
                if (btn) btn.remove();

                getMovies(SEARCH_URL, currentPage, true);
            }
        });
    }
});

async function getMovies(url, page = 1, isSearch = false) {
    if (!container) return;
    if (isFetching) return;

    isFetching = true;

    // Solo mostrar "Cargando" si es la primera página
    if (page === 1) {
        container.innerHTML = '<p style="color:white; text-align:center;">Cargando...</p>';
    }

    try {
        let fetchUrl = url;
        if (isSearch) {
            fetchUrl = `${url}&query=${encodeURIComponent(currentQuery)}&page=${page}`;
        } else {
            fetchUrl = `${url}&page=${page}`;
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        renderMovies(data.results, page);
    } catch (error) {
        if (page === 1) {
            container.innerHTML = `<h2 style="color:white; text-align:center;">Error al cargar las películas.</h2>`;
        }
        console.error(error);
    } finally {
        isFetching = false;
    }
}

function renderMovies(movies, page) {
    // Si es la primera página, limpiar el contenedor y aplicar estilos
    if (page === 1) {
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        container.style.gap = '20px';
        container.style.padding = '20px';
        container.style.maxWidth = '1200px';
        container.style.margin = '0 auto';

        if (!movies || movies.length === 0) {
            container.innerHTML = '<h2>No se encontraron películas.</h2>';
            return;
        }
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s';

        card.innerHTML = `
            <img src="${IMG_URL + movie.poster_path}" 
                 alt="${movie.title}" 
                 style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            <h3 style="color: white; font-size: 1rem; margin-top: 10px; text-align: center;">${movie.title}</h3>
            <p style="color: #ffca2c; text-align: center; margin: 5px 0;">⭐ ${movie.vote_average.toFixed(1)}</p>
        `;

        card.onmouseover = () => card.style.transform = 'scale(1.05)';
        card.onmouseout = () => card.style.transform = 'scale(1)';

        card.addEventListener('click', () => {
            window.location.href = `detalle.html?id=${movie.id}`;
        });

        container.appendChild(card);
    });

    // Gestionar botón "Cargar más"
    inputLoadMoreButton();
}

function inputLoadMoreButton() {
    // Eliminar botón existente si lo hay (para moverlo al final)
    const existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();

    const btnContainer = document.createElement('div');
    btnContainer.id = 'load-more-btn'; // ID para fácil referencia
    btnContainer.style.gridColumn = "1 / -1";
    btnContainer.style.textAlign = "center";
    btnContainer.style.marginTop = "30px";
    btnContainer.style.paddingBottom = "30px";

    const button = document.createElement('button');
    button.textContent = "Ver más películas";
    button.className = 'btn-enviar';

    button.onclick = () => {
        currentPage++;
        if (currentMode === 'search') {
            getMovies(SEARCH_URL, currentPage, true);
        } else {
            getMovies(TOP_RATED_URL, currentPage, false);
        }
        button.textContent = "Cargando...";
        button.disabled = true;
    };

    btnContainer.appendChild(button);
    container.appendChild(btnContainer);
}