// Lógica de Búsqueda y Películas Populares (Dinámico 100% con TMDB)

const API_KEY = '9b6940210ea6faabd174810c5889f878';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original'; // Mejor calidad para carrusel
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';

const POPULAR_URL = BASE_URL + '/movie/popular?language=es-ES&api_key=' + API_KEY;
const NOW_PLAYING_URL = BASE_URL + '/movie/now_playing?language=es-ES&api_key=' + API_KEY;
const SEARCH_URL = BASE_URL + '/search/movie?language=es-ES&api_key=' + API_KEY;

let currentPage = 1;
let currentMode = 'popular'; // 'popular' o 'search'
let currentQuery = '';

document.addEventListener('DOMContentLoaded', () => {

    // 2. Referencias a Elementos DOM
    const searchInput = document.getElementById('searchInput');
    const movieRowContainer = document.getElementById('movieRowContainer');
    const movieSectionTitle = document.getElementById('movieSectionTitle');

    // Crear botón "Cargar más"
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.innerText = 'Cargar más películas';
    loadMoreBtn.className = 'btn btn-primary d-block mx-auto my-4'; // Bootstrap simple classes
    loadMoreBtn.style.display = 'none'; // Oculto al inicio
    movieRowContainer.after(loadMoreBtn);

    // 3. Función para Crear una Tarjeta de Película
    const createMovieCard = (movie) => {
        const card = document.createElement('div');
        card.className = 'movie-card';

        const posterSrc = movie.poster_path ? POSTER_URL + movie.poster_path : 'https://placehold.co/150x220/333333/FFFFFF?text=No+Poster';

        card.innerHTML = `
            <img src="${posterSrc}" 
                 alt="Póster de ${movie.title}" 
                 onerror="this.onerror=null;this.src='https://placehold.co/150x220/333333/FFFFFF?text=Error';" >
            
            <div class="movie-title">${movie.title}</div> 
        `;

        card.addEventListener('click', () => {
            // REDIRECCIÓN CORRECTA A DETALLE
            window.location.href = `detalle.html?id=${movie.id}`;
        });

        return card;
    };


    // 4. Función para Renderizar la Lista de Películas
    const renderMovies = (movies, title, append = false) => {
        if (!movieRowContainer) return;

        if (!append) {
            movieRowContainer.innerHTML = '';
            if (movieSectionTitle) movieSectionTitle.textContent = title;
            currentPage = 1;
        }

        if (!movies || movies.length === 0) {
            if (!append) movieRowContainer.innerHTML = '<p style="color: #f8f8f8; margin-top: 20px; width: 100%; text-align: center;">No se encontraron películas.</p>';
            loadMoreBtn.style.display = 'none';
        } else {
            movies.forEach(movie => {
                if (movie.poster_path) {
                    movieRowContainer.appendChild(createMovieCard(movie));
                }
            });
            loadMoreBtn.style.display = 'block';
        }
    };

    // 5. Funciones de Fetch Generica
    async function fetchMovies(url) {
        try {
            const res = await fetch(url);
            const data = await res.json();
            return data.results;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    // Cargar Carrusel (Now Playing)
    async function loadCarousel() {
        const carouselInner = document.querySelector('.carousel-inner');
        const carouselIndicators = document.querySelector('.carousel-indicators');

        if (!carouselInner || !carouselIndicators) return;

        const movies = await fetchMovies(NOW_PLAYING_URL);
        const topMovies = movies.slice(0, 5); // Top 5 para carrusel

        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';

        topMovies.forEach((movie, index) => {
            // Indicator
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.bsTarget = '#carruselCinepuma';
            btn.dataset.bsSlideTo = index;
            btn.ariaLabel = `Slide ${index + 1}`;
            if (index === 0) {
                btn.className = 'active';
                btn.ariaCurrent = 'true';
            }
            carouselIndicators.appendChild(btn);

            // Item
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            item.dataset.bsInterval = '4000';
            item.style.cursor = 'pointer';

            // Redirección al clickar en el slide
            item.addEventListener('click', () => {
                window.location.href = `detalle.html?id=${movie.id}`;
            });

            const backdrop = movie.backdrop_path ? IMG_URL + movie.backdrop_path : 'https://placehold.co/800x400?text=No+Image';

            item.innerHTML = `
                <img src="${backdrop}" class="d-block w-100 imagen-carrusel" alt="${movie.title}" style="object-fit: cover; height: 500px;">
                <div class="carousel-caption d-none d-md-block" style="background: rgba(0,0,0,0.5); border-radius: 10px; padding: 10px;">
                    <h5>${movie.title}</h5>
                    <p>${movie.overview ? movie.overview.substring(0, 100) + '...' : '...'}</p>
                </div>
            `;
            carouselInner.appendChild(item);
        });
    }

    // Cargar Grilla Principal
    async function loadMainGrid(page = 1, append = false) {
        let url = '';
        if (currentMode === 'popular') {
            url = `${POPULAR_URL}&page=${page}`;
        } else {
            url = `${SEARCH_URL}&query=${currentQuery}&page=${page}`;
        }

        const movies = await fetchMovies(url);
        renderMovies(movies, currentMode === 'popular' ? "Películas Populares" : `Resultados para: "${currentQuery}"`, append);
    }

    // 6. Manejador de Búsqueda (SUBMIT explícito)
    const searchForm = document.getElementById('search-form');

    const performSearch = (query) => {
        currentQuery = query;
        if (query.length > 0) {
            currentMode = 'search';
        } else {
            currentMode = 'popular';
        }
        loadMainGrid(1, false);
    };

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            performSearch(query);
        });
    }

    // 7. Inicialización y Chequeo de URL
    loadCarousel();

    // Revisar si hay búsqueda en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('search');

    if (urlQuery) {
        if (searchInput) searchInput.value = urlQuery; // Rellenar input
        performSearch(urlQuery);
    } else {
        loadMainGrid(1, false);
    }
});
