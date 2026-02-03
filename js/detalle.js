// 1. IMPORTACIONES DE FIREBASE COMPARTIDAS
import { auth, db } from "./firebase-init.js";
import {
    signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection, addDoc, query, onSnapshot, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// 2. CONFIGURACIÓN API PELÍCULAS (TMDB)
const API_KEY = '9b6940210ea6faabd174810c5889f878';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// 3. REFERENCIAS DOM
const starRatingContainer = document.getElementById('star-rating');
const reviewInput = document.getElementById('review-input');
const sendReviewBtn = document.getElementById('send-review-btn');
const userReviewsList = document.getElementById('user-reviews-list');
const averageRatingDisplay = document.getElementById('average-rating-display');

// Elementos de información de la película
const movieTitle = document.getElementById('movie-title');
const moviePoster = document.getElementById('movie-poster');
const movieRating = document.getElementById('movie-rating');
const movieDate = document.getElementById('movie-date');
const movieGenres = document.getElementById('movie-genres');
const movieSynopsis = document.getElementById('movie-synopsis');

// Variables de estado
let userId = 'anonymous';
let currentRating = 0;
let movieId = null; // Se obtendrá de la URL

// 4. INICIALIZACIÓN PRINCIPAL
async function init() {
    // A. Obtener ID de la película de la URL
    const urlParams = new URLSearchParams(window.location.search);
    movieId = urlParams.get('id');

    if (!movieId) {
        alert("No se especificó ninguna película.");
        window.location.href = 'index.html';
        return;
    }

    // B. Cargar detalles de la película
    await loadMovieDetails(movieId);

    // C. Inicializar UI de Valoración
    initRatingSlider();

    // D. Configurar Auth y Listeners de Firebase
    // D. Configurar Auth y Listeners de Firebase
    setupFirebase();

    // E. Cargar Trailer
    loadMovieTrailer(movieId);
}

// 5. CARGAR DETALLES DE LA PELÍCULA (TMDB)
async function loadMovieDetails(id) {
    try {
        const url = `${BASE_URL}/movie/${id}?language=es-ES&api_key=${API_KEY}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('Película no encontrada');

        const data = await res.json();

        // Actualizar DOM
        document.title = `Cinepuma - ${data.title}`;
        if (movieTitle) movieTitle.textContent = data.title;
        if (moviePoster) moviePoster.src = data.poster_path ? `${IMG_URL}${data.poster_path}` : 'https://placehold.co/200x300?text=No+Image';
        if (movieRating) movieRating.textContent = data.vote_average.toFixed(1);
        if (movieDate) movieDate.textContent = data.release_date;
        if (movieGenres) movieGenres.textContent = data.genres.map(g => g.name).join(', ');
        if (movieSynopsis) movieSynopsis.textContent = data.overview || "Sin descripción disponible.";



    } catch (error) {
        console.error("Error al cargar película:", error);
        if (movieTitle) movieTitle.textContent = "Error al cargar película";
        if (movieSynopsis) movieSynopsis.textContent = "No se pudo obtener la información de la película. Verifica tu conexión.";
    }
}

// 5b. CARGAR TRAILER
async function loadMovieTrailer(id) {
    const container = document.getElementById('trailer-container');
    if (!container) return;

    try {
        const url = `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=es-ES`; // Intentar español primero
        let res = await fetch(url);
        let data = await res.json();

        let trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');

        // Si no hay en español, intentar en inglés (idioma original)
        if (!trailer) {
            const urlEn = `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`;
            res = await fetch(urlEn);
            data = await res.json();
            trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
        }

        if (trailer) {
            container.innerHTML = `
                <h2 style="color:white; margin-bottom:15px;">Trailer Oficial</h2>
                <iframe width="100%" height="400" 
                        src="https://www.youtube.com/embed/${trailer.key}" 
                        title="YouTube video player" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        style="border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); max-width: 800px;">
                </iframe>
            `;
        } else {
            console.log("No se encontró trailer para esta película.");
            // Opcional: container.innerHTML = '<p style="color:#ccc;">Trailer no disponible</p>';
        }

    } catch (error) {
        console.error("Error cargando trailer:", error);
    }
}

// 6. LOGICA FIREBASE Y COMENTARIOS
function setupFirebase() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            console.log("Usuario autenticado:", user.email || "Anónimo", user.uid);
        } else {
            console.log("Usuario NO autenticado.");
            // Login anónimo automático si se desea, o dejar como invitado
        }

        // Siempre intentamos cargar reseñas
        loadReviewsRealtime();
    });

    if (sendReviewBtn) {
        sendReviewBtn.addEventListener('click', saveReview);
    }
}

// Guardar reseña
async function saveReview() {
    const reviewText = reviewInput.value.trim();

    if (currentRating === 0) {
        alert("Por favor, selecciona una valoración (estrellas).");
        return;
    }
    if (reviewText.length < 3) {
        alert("Escribe una opinión un poco más larga.");
        return;
    }

    try {
        const user = auth.currentUser;
        const userEmail = user ? user.email : "Anónimo";

        const reviewData = {
            movieId: movieId, // ID dinámico (string)
            userId: userId,
            userEmail: userEmail, // Nuevo campo
            rating: currentRating,
            reviewText: reviewText,
            timestamp: serverTimestamp() // Usar timestamp del servidor
        };

        const reviewsRef = collection(db, "movie_reviews");
        await addDoc(reviewsRef, reviewData);

        // Reset UI
        reviewInput.value = '';
        currentRating = 0; // Reset interno
        document.getElementById('rating-slider').value = 1; // Reset slider visual
        document.getElementById('rating-slider').dispatchEvent(new Event('input')); // Actualizar estrellas visuales

        alert("¡Opinión enviada!");

    } catch (error) {
        console.error("Error al guardar reseña:", error);
        alert("Error al enviar la opinión: " + error.message);
    }
}

// Cargar reseñas (Realtime)
function loadReviewsRealtime() {
    if (!userReviewsList) return;

    const reviewsRef = collection(db, "movie_reviews");

    // Query simple (sin orderBy explícito para evitar requerir índices compuestos complejos)
    const q = query(
        reviewsRef,
        where("movieId", "==", movieId)
    );

    onSnapshot(q, (snapshot) => {
        const reviews = [];
        let totalRating = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({ id: doc.id, ...data });
            totalRating += data.rating;
        });

        // Ordenar en cliente (más reciente primero)
        reviews.sort((a, b) => {
            const tA = a.timestamp ? a.timestamp.seconds : 0;
            const tB = b.timestamp ? b.timestamp.seconds : 0;
            return tB - tA;
        });

        // Calcular media local de Cinepuma
        const numReviews = reviews.length;
        const avg = numReviews > 0 ? (totalRating / numReviews).toFixed(1) : '0.0';

        if (averageRatingDisplay) {
            averageRatingDisplay.textContent = `Media de la comunidad: ${avg} / 5 (${numReviews} opiniones)`;
        }

        renderReviews(reviews);
    }, (error) => {
        console.error("Error obteniendo reseñas:", error); // A veces falla si falta índice compuesto

        // Fallback por si falta índice (orderBy + where puede requerirlo)
        // Intentamos sin orderBy y ordenamos en cliente
        if (error.code === 'failed-precondition') {
            console.warn("Falta índice compuesto. Cargando sin orden estricto de servidor.");
            const qSimple = query(reviewsRef, where("movieId", "==", movieId));
            onSnapshot(qSimple, (snap) => {
                const res = [];
                snap.forEach(d => res.push(d.data()));
                res.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                renderReviews(res);
            });
        }
    });
}

function renderReviews(reviews) {
    userReviewsList.innerHTML = '';

    if (reviews.length === 0) {
        userReviewsList.innerHTML = '<p class="no-reviews">Sé el primero en opinar sobre esta película.</p>';
        return;
    }

    reviews.forEach(review => {
        const div = document.createElement('div');
        div.className = 'user-review';

        // Estrellas HTML
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += i < review.rating ? '★' : '☆';
        }

        const date = review.timestamp ? new Date(review.timestamp.seconds * 1000).toLocaleDateString() : 'Reciente';

        // Formatear nombre usuario (ej: juan@gmail.com -> Juan)
        let authorName = "Anónimo";
        if (review.userEmail && review.userEmail !== "Anónimo") {
            authorName = review.userEmail.split('@')[0];
            authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
        }

        div.innerHTML = `
            <div class="review-header">
                <div>
                    <span class="review-author" style="font-weight:bold; color:#ff6b35; margin-right:10px;">${authorName}</span>
                    <span class="review-stars">${stars}</span>
                </div>
                <span class="review-date" style="font-size:0.8rem; color:#aaa;">${date}</span>
            </div>
            <p class="review-text" style="margin-top:5px;">"${review.reviewText}"</p>
        `;
        userReviewsList.appendChild(div);
    });
}


// 7. UI SLIDER (Reutilizado y simplificado)
function initRatingSlider() {
    starRatingContainer.innerHTML = '';

    // Crear label para el slider
    const label = document.createElement('label');
    label.setAttribute('for', 'rating-slider');
    label.textContent = 'Selecciona tu valoración: ';
    label.style.color = '#ff6b35';
    label.style.fontWeight = 'bold';
    label.style.display = 'block';
    label.style.marginBottom = '10px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'rating-slider';
    slider.setAttribute('aria-label', 'Valoración de la película del 1 al 5');
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = "0"; // Inicial sin valor

    const display = document.createElement('div');
    display.style.fontSize = "2rem";
    display.style.color = "#ffd700";
    display.style.marginLeft = "10px";

    const updateDisplay = (val) => {
        currentRating = parseInt(val);
        let s = '';
        for (let i = 1; i <= 5; i++) s += i <= currentRating ? '★' : '☆';
        display.textContent = s;
    };

    slider.addEventListener('input', (e) => updateDisplay(e.target.value));

    starRatingContainer.appendChild(label);
    starRatingContainer.appendChild(slider);
    starRatingContainer.appendChild(display);
    updateDisplay(0); // init empty
}

// Arrancar
document.addEventListener('DOMContentLoaded', init);
