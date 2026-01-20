
const API_KEY = '9b6940210ea6faabd174810c5889f878';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentGenreId = null;

export async function loadMoviesByGenre(genreId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Contenedor no encontrado:", containerId);
        return;
    }

    // Reset si cambia el género
    if (currentGenreId !== genreId) {
        currentGenreId = genreId;
        currentPage = 1;
        container.innerHTML = '<p style="color:white; text-align:center;">Cargando películas...</p>';
        container.nextElementSibling?.remove(); // Remover botón anterior si existe
    }

    try {
        const url = `${BASE_URL}/discover/movie?with_genres=${genreId}&language=es-ES&sort_by=popularity.desc&page=${currentPage}&api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (currentPage === 1) {
            container.innerHTML = ''; // Limpiar "Cargando..."
            setupContainerStyles(container);
            createLoadMoreButton(container);
        }

        renderMovies(data.results, container);
        toggleLoadMoreButton(data.results.length > 0);

    } catch (error) {
        console.error("Error cargando género:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar películas.</p>';
    }
}

function setupContainerStyles(container) {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    container.style.gap = '20px';
    container.style.padding = '20px';
}

function createLoadMoreButton(container) {
    // Evitar duplicados
    if (container.nextElementSibling && container.nextElementSibling.id === 'load-more-genres') return;

    const btn = document.createElement('button');
    btn.id = 'load-more-genres';
    btn.innerText = 'Ver más películas';
    btn.className = 'btn-load-more'; // Clase para CSS si se quiere
    btn.style.cssText = "display:block; margin: 20px auto; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;";

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
        if (!hasResults) btn.innerText = "No hay más películas";
    }
}

const SEARCH_URL = BASE_URL + '/search/movie?language=es-ES&api_key=' + API_KEY;

export async function searchMoviesInGenre(query, genreId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Reset pagination for search (simple version: no pagination for search results yet)
    currentPage = 1;
    container.innerHTML = '<p style="color:white; text-align:center;">Buscando en este género...</p>';
    toggleLoadMoreButton(false); // Hide load more during search for now

    try {
        const url = `${SEARCH_URL}&query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();

        // CLIENT-SIDE FILTERING: Check if genre_ids includes the current genreId
        // TMDB genre_ids is an array of numbers. genreId is passed as number.
        const filteredResults = data.results.filter(movie =>
            movie.genre_ids && movie.genre_ids.includes(Number(genreId))
        );

        if (filteredResults.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; color: white; grid-column: 1 / -1;">
                    <p>No se encontraron resultados para "${query}" en este género.</p>
                    <button onclick="location.reload()" style="background:none; border:1px solid #ff6b35; color:#ff6b35; padding:5px 10px; cursor:pointer; border-radius:5px; margin-top:10px;">Volver a ver todo</button>
                </div>`;
        } else {
            renderMovies(filteredResults, container);

            // Add a "Clear Search" button if needed, or rely on reload. 
            // For now, let's append a "Show all" button at the bottom if successful search
            const clearBtn = document.createElement('div');
            clearBtn.style.gridColumn = "1 / -1";
            clearBtn.style.textAlign = "center";
            clearBtn.style.marginTop = "20px";
            clearBtn.innerHTML = `<button onclick="location.reload()" style="background:#ff6b35; color:white; border:none; padding:10px 20px; cursor:pointer; border-radius:5px;">Ver todas las películas</button>`;
            container.appendChild(clearBtn);
        }

    } catch (error) {
        console.error("Error searching in genre:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error en la búsqueda.</p>';
    }
}

function renderMovies(movies, container) {
    if (!movies || movies.length === 0) { // Safety check if called directly
        if (currentPage === 1) container.innerHTML = '<p>No se encontraron películas.</p>';
        return;
    }

    // Clear container if it was showing "Searching..." or previous results (controlled by caller usually, but safe here)
    if (container.innerHTML.includes('Buscando') || container.innerHTML.includes('Cargando')) {
        container.innerHTML = '';
        setupContainerStyles(container);
    }

    // If it's a fresh render (not append), we might want to clear. 
    // But renderMovies is also used by 'Load More'. 
    // 'searchMoviesInGenre' clears it first. 'loadMoviesByGenre' clears it if page 1.
    // So distinct behavior is handled by callers.

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
        `;

        card.addEventListener('click', () => {
            window.location.href = `../../../html/detalle.html?id=${movie.id}`;
        });

        card.onmouseover = () => card.style.transform = 'scale(1.05)';
        card.onmouseout = () => card.style.transform = 'scale(1)';

        container.appendChild(card);
    });
}
