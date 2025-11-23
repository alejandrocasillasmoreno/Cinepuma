// Lógica de Búsqueda de Cinepuma

document.addEventListener('DOMContentLoaded', () => {

    // 1. Modelo de Datos Simulado
    // *** URLs actualizadas a fuentes estables (TheMovieDB CDN) ***
    const allMovies = [
        // Películas Populares (con URLs estables y públicas)
        { 
            title: "NOVOCAINES NO SIENTE DOLOR", 
            image: "https://m.media-amazon.com/images/M/MV5BNjZhNDdhNGItMGU4NC00NDc1LTgyOTYtMzA4ZjM4ZjBhZWIyXkEyXkFqcGc@._V1_.jpg", 
            description: "Una historia de terror y acción que te mantendrá al borde del asiento." 
        },
        { 
            title: "NOBODY 2", 
            image: "https://dx35vtwkllhj9.cloudfront.net/universalstudios/nobody-2/images/regions/us/updates1/onesheet.jpg", 
            description: "Nadie sabrá nada de su regreso." 
        },
        { 
            title: "THE SMASHING MACHINE", 
            image: "https://m.media-amazon.com/images/M/MV5BOWYxZTM1ZGMtMjg5MC00NzcyLTk0ZTEtZWI0ZThkNDJiYjZmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg", 
            description: "Pelea por los mejores del ring." 
        },
        { 
            title: "BAILARINA", 
            image: "https://m.media-amazon.com/images/S/pv-target-images/c22dbf9c379fa8152b72a1d4f27e642cbd21acb0eb6b782343ff2adcfe2db103.jpg", 
            description: "Acompaña a John Wick en su nueva aventura." 
        },
        
        // Películas del Carrusel (Se mantienen las URLs que tenías para el carrusel)
        { title: "EL CONTADOR 2", image: "https://portalgeek.co/wp-content/uploads/2025/04/el-contador-2.webp", description: "La acción regresa más intensa que nunca." },
        { title: "OPPENHEIMER", image: "https://img.pccomponentes.com/pcblog/7571/oppenheimer-portada-pelicula.jpg", description: "El mundo cambiará para siempre." },
        { title: "THE BATMAN", image: "https://beam-images.warnermediacdn.com/BEAM_LWM_DELIVERABLES/dfa50804-e6f6-4fa2-a732-693dbc50527b/37082735-6715-11ef-96ad-02805d6a02df?host=wbd-images.prod-vod.h264.io&partner=beamcom&w=500", description: "La venganza llega a Gotham." },
        { title: "CHAINSAW MAN", image: "https://img.asmedia.epimg.net/resizer/v2/JQICFOMJHJBVTJR4VLEKL655DE.jpg?auth=0ab8fe8c6b795be44361cc7f4d113dbe6d62a02c7ea6555dd8ff35c18053e675&width=1472&height=828&smart=true", description: "El arco de Reze" },
    ];


    // 2. Referencias a Elementos DOM
    const searchInput = document.getElementById('searchInput');
    const movieRowContainer = document.getElementById('movieRowContainer');
    const movieSectionTitle = document.getElementById('movieSectionTitle');

    if (!movieRowContainer) {
        console.error("ERROR CRÍTICO: No se encontró el contenedor de películas (#movieRowContainer).");
        return; 
    }
    if (!movieSectionTitle) {
        console.warn("ADVERTENCIA: No se encontró el título de la sección (#movieSectionTitle).");
    }


    // 3. Función para Crear una Tarjeta de Película
    const createMovieCard = (movie) => {
        const card = document.createElement('div');
        card.className = 'movie-card'; 
        
        card.innerHTML = `
            <img src="${movie.image}" 
                 alt="Póster de ${movie.title}" 
                 
                 onerror="this.onerror=null;this.src='https://placehold.co/150x220/333333/FFFFFF?text=No+Poster';" >
            
            <div class="movie-title">${movie.title}</div> 
        `;

        card.addEventListener('click', () => {
            console.log(`Clicked movie: ${movie.title}. Detail page redirection goes here.`);
        });
        
        return card;
    };


    // 4. Función para Renderizar la Lista de Películas
    const renderMovies = (movies, title) => {
        if (!movieRowContainer) return; 

        movieRowContainer.innerHTML = ''; 
        if (movieSectionTitle) {
            movieSectionTitle.textContent = title;
        }

        if (movies.length === 0) {
            movieRowContainer.innerHTML = '<p style="color: #f8f8f8; margin-top: 20px; width: 100%; text-align: center;">No se encontraron películas que coincidan con la búsqueda.</p>';
        } else {
            movies.forEach(movie => {
                movieRowContainer.appendChild(createMovieCard(movie));
            });
        }
    };


    // 5. Manejador Principal de la Lógica de Búsqueda
    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase().trim();

        if (query.length > 0) {
            const filteredMovies = allMovies.filter(movie =>
                movie.title.toLowerCase().includes(query)
            );
            
            renderMovies(filteredMovies, `Resultados para: "${query}"`);

        } else {
            renderMovies(allMovies.slice(0, 4), "Películas Populares");
        }
    };


    // 6. Inicialización
    renderMovies(allMovies.slice(0, 4), "Películas Populares"); 

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    } else {
        console.error("ERROR CRÍTICO: Elemento #searchInput no encontrado.");
    }
});