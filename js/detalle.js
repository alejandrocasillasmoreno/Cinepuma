// js/detail.js

// --- CONSTANTES ---
const API_KEY = '9b6940210ea6faabd174810c5889f878'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const movieDetailsContainer = document.getElementById('movie-details');
const detailTitle = document.getElementById('detail-title');

// --- UTILIDADES ---

// Función para obtener parámetros de la URL (el ID)
function getQueryVariable(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if(pair[0] == variable){
            return pair[1];
        }
    }
    return(false);
}

// Función para asignar color a la puntuación
function getClassByRate(vote) {
    if(vote >= 8) return 'green';
    else if(vote >= 5) return 'orange';
    else return 'red';
}

// --- LÓGICA PRINCIPAL ---

// Función que se ejecuta al cargar la página
window.onload = () => {
    const movieId = getQueryVariable('id');
    if (movieId) {
        fetchMovieDetails(movieId);
    } else {
        movieDetailsContainer.innerHTML = '<p class="error-message">Error: No se ha especificado ninguna película.</p>';
    }
};

// Petición a la API para los detalles y créditos (Director)
async function fetchMovieDetails(id) {
    // Endpoint para detalles + créditos
    const detailUrl = `${BASE_URL}/movie/${id}?append_to_response=credits&language=es-ES&api_key=${API_KEY}`;
    
    try {
        const res = await fetch(detailUrl);
        if (!res.ok) throw new Error('Película no encontrada.');
        const movie = await res.json();
        
        // Buscamos al Director en el array de 'crew'
        const director = movie.credits.crew.find(person => person.job === 'Director');
        const directorName = director ? director.name : 'Desconocido';

        renderMovieDetails(movie, directorName);

    } catch (error) {
        console.error("Error al cargar detalles:", error);
        movieDetailsContainer.innerHTML = `<h2 class="error-message">No se pudieron cargar los detalles de la película.</h2>`;
    }
}

// Renderiza el HTML de los detalles en la página
function renderMovieDetails(movie, directorName) {
    // 1. Actualiza el título del navegador
    detailTitle.innerText = `${movie.title} - CinePuma`;

    // 2. Genera el HTML completo
    const detailsHTML = `
        <div class="movie-header">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" class="detail-poster">
            <div class="info-block">
                <h2>${movie.title}</h2>
                <div class="rating-large">
                    Puntuación: <span class="${getClassByRate(movie.vote_average)}">${movie.vote_average.toFixed(1)}</span>
                </div>
                <p class="tagline">${movie.tagline || ''}</p>
                
                <div class="main-details">
                    <p><strong>Director:</strong> ${directorName}</p>
                    <p><strong>Fecha de estreno:</strong> ${movie.release_date}</p>
                    <p><strong>Géneros:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>
                </div>
            </div>
        </div>
        
        <div class="movie-overview-full">
            <h3>Sinopsis</h3>
            <p>${movie.overview || 'Sinopsis no disponible.'}</p>
        </div>
    `;

    // 3. Inyecta el HTML en el contenedor
    movieDetailsContainer.innerHTML = detailsHTML;
}

// FUNCIONALIDAD: Búsqueda (Copia la lógica del index para mantener la barra de búsqueda activa)
const form = document.getElementById('form');
const search = document.getElementById('search');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value;
    if(searchTerm && searchTerm !== '') {
        // Redirigimos al index para hacer la búsqueda
        window.location.href = `index.html?search=${searchTerm}`;
    }
});