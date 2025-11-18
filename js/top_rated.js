

// --- CONSTANTES ---
const API_KEY = '9b6940210ea6faabd174810c5889f878'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Endpoint de Mejor Valoradas (¡Verifica que esta línea sea EXACTA!)
const TOP_RATED_URL = BASE_URL + '/movie/top_rated?language=es-ES&api_key=' + API_KEY;
const SEARCH_URL = BASE_URL + '/search/movie?language=es-ES&api_key=' + API_KEY;

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');

// Función principal que se ejecuta al cargar la página
window.onload = () => {
    getMovies(TOP_RATED_URL);
};

async function getMovies(url) {
    const res = await fetch(url);
    
    // Si la respuesta no es OK (ej. 401, 404), mostramos el error:
    if (!res.ok) {
        main.innerHTML = `<h2 style="color:red; margin: 20px;">Error al cargar las películas. Código: ${res.status}. (Verifica tu API Key)</h2>`;
        return;
    }

    const data = await res.json();
    showMovies(data.results);
}

function showMovies(data) {
    main.innerHTML = '';

    if (!data || data.length === 0) {
        main.innerHTML = '<h2>No se encontraron películas.</h2>';
        return;
    }

    data.forEach(movie => {
        const { title, poster_path, vote_average, id } = movie;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        
        // Verifica la existencia del póster antes de construir el HTML
        if(poster_path) {
            movieEl.innerHTML = `
                <img src="${IMG_URL + poster_path}" alt="${title}">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <span class="${getClassByRate(vote_average)}">${vote_average.toFixed(1)}</span>
                </div>
            `;
            
            // Navegación a detalle.html
            movieEl.addEventListener('click', () => {
                window.location.href = `detalle.html?id=${id}`;
            });
            
            main.appendChild(movieEl);
        }
    });
}

function getClassByRate(vote) {
    if(vote >= 8) return 'green';
    else if(vote >= 5) return 'orange';
    else return 'red';
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value;
    if(searchTerm && searchTerm !== '') {
        getMovies(SEARCH_URL + '&query=' + searchTerm);
    } else {
        getMovies(TOP_RATED_URL);
    }
});