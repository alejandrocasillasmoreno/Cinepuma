

// --- CONSTANTES ---
const API_KEY = '9b6940210ea6faabd174810c5889f878'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';


const MOCK_REVIEWS = {
    '550': [ // Ejemplo: Reseñas para la película con ID 550 (Fight Club)
        { user: 'AlejandroCine', text: '¡Una obra maestra! La vi en CinePuma y me encantó.', rating: 10 },
        { user: 'HéctorPuma', text: 'Muy buena, aunque un poco confusa al final.', rating: 8 },
    ],
    'default': [
        { user: 'ComunidadPuma', text: '¡Sé el primero en dejar una reseña para esta película!', rating: 0 }
    ]
};


const reviewsList = document.getElementById('user-reviews-list');
const reviewInput = document.getElementById('review-input');
const sendReviewBtn = document.getElementById('send-review-btn');
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
// Lógica de Reseñas
function renderReviews(movieId) {
    if (!reviewsList) return; 

    const currentReviews = MOCK_REVIEWS[movieId] || MOCK_REVIEWS['default'];
    reviewsList.innerHTML = ''; 

    currentReviews.forEach(review => {
        const ratingHtml = review.rating > 0 ? `(${review.rating}/10)` : '';
        const reviewEl = document.createElement('div');
        reviewEl.classList.add('user-review');
        
        reviewEl.innerHTML = `
            <strong>${review.user} ${ratingHtml}:</strong> 
            <p>${review.text}</p>
        `;
        reviewsList.appendChild(reviewEl);
    });
}

function handleReviewSubmission(movieId) {
    const reviewText = reviewInput.value.trim();
    if (reviewText === "") {
        alert("Por favor, escribe tu opinión antes de enviar.");
        return;
    }

    const newReview = {
        user: 'UsuarioPuma', 
        text: reviewText,
        rating: Math.floor(Math.random() * 5) + 6 
    };

    if (!MOCK_REVIEWS[movieId]) {
        MOCK_REVIEWS[movieId] = [];
    }
    MOCK_REVIEWS[movieId].unshift(newReview); 

    reviewInput.value = '';
    renderReviews(movieId);

    alert("¡Tu opinión ha sido publicada exitosamente!");
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

         // 1. Muestra la información de la película
            renderMovieDetails(movie, directorName);

            // 2. Dibuja las reseñas simuladas
            renderReviews(id); 

            // 3. Activa el botón de envío para esa película
            if (sendReviewBtn) {
                sendReviewBtn.onclick = () => handleReviewSubmission(id); 
            }
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

// FUNCIONALIDAD: Búsqueda 
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