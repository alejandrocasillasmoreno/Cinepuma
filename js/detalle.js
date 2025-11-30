// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, collection, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONSTANTES DE LA API ---
// NOTA: Reemplaza con tu clave de API si es necesario, aunque se usa una genérica por defecto.
const API_KEY = '9b6940210ea6faabd174810c5889f878'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const MOVIE_DETAIL_URL = (id) => `${BASE_URL}/movie/${id}?language=es-ES&api_key=${API_KEY}`;

// --- FIREBASE SETUP GLOBALES ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

let db, auth;
let currentMovieId = null;
let currentUserId = null;
let selectedRating = 0; // Estado para la valoración por estrellas del usuario (1-5)

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // 1. FIREBASE INITIALIZATION AND AUTH
    // ----------------------------------------------------
    const initializeFirebase = async () => {
        try {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            
            // Autenticación con token personalizado o anónimo
            if (typeof __initial_auth_token !== 'undefined') {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
            
            // Obtener o generar un ID de usuario único
            currentUserId = auth.currentUser?.uid || crypto.randomUUID();
            console.log("Firebase y autenticación inicializados. User ID:", currentUserId);
            return true;
        } catch (error) {
            console.error("Error al inicializar Firebase o la autenticación:", error);
            // Mostrar un mensaje de error visible al usuario
            document.getElementById('average-rating-display').innerHTML = 
                '<span style="color:red;">Error de conexión a la base de datos. Las reseñas no están disponibles.</span>';
            return false;
        }
    };


    // ----------------------------------------------------
    // 2. OBTENER ID Y RENDERIZAR DETALLES DE TMDB
    // ----------------------------------------------------

    const getMovieIdFromUrl = () => {
        // Obtiene el ID de la película desde el parámetro 'id' en la URL
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        currentMovieId = id ? parseInt(id, 10) : null;
        return currentMovieId;
    };

    /**
     * Obtiene los detalles de la película desde la API de TMDB.
     */
    async function getMovieDetails(movieId) {
        if (!movieId) {
             console.error("ID de película no proporcionado en la URL.");
            return null;
        }
        try {
            const url = MOVIE_DETAIL_URL(movieId);
            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`Error al cargar los detalles: ${res.status}`);
            }
            return await res.json();
        } catch (error) {
            console.error("Fallo en la obtención de detalles de TMDB:", error);
            const detailsContainer = document.getElementById('movie-details');
            detailsContainer.innerHTML = `
                <h1 style="color: #ff6b35; text-align: center; margin-top: 50px;">
                    Error al cargar la película desde TMDB.
                </h1>
            `;
            // Ocultar la sección de reseñas si falla la carga de detalles
            document.querySelector('.reviews-section').style.display = 'none';
            return null;
        }
    }

    /**
     * Renderiza los detalles de la película en el elemento <main>.
     */
    const renderMovieDetails = (movie) => {
        const detailsContainer = document.getElementById('movie-details');
        
        if (!movie || movie.success === false) {
             detailsContainer.innerHTML = `
                <h1 style="color: #ff6b35; text-align: center; margin-top: 50px;">
                    Película no encontrada o ID inválido.
                </h1>
                <p style="color: #ccc; text-align: center;">
                    Vuelve a la página de mejores valoradas para seleccionar una película.
                </p>
            `;
            document.querySelector('.reviews-section').style.display = 'none';
            return;
        }

        const genres = movie.genres.map(g => g.name).join(', ');
        
        // Contenido dinámico de la película
        detailsContainer.innerHTML = `
            <div class="movie-header">
                <img src="${IMG_URL + movie.poster_path}" alt="Póster de ${movie.title}" class="poster-img" 
                    onerror="this.onerror=null; this.src='https://placehold.co/200x300/0d274c/ff6b35?text=Póster+No+Disp.';">
                
                <div class="movie-info">
                    <h1>${movie.title}</h1>
                    <p class="rating">
                        <span class="star-icon">★</span> 
                        <!-- Nota de TMDB -->
                        <span class="score">${movie.vote_average.toFixed(1)}</span>/10 (${movie.vote_count.toLocaleString()} votos TMDB)
                    </p>
                    <div class="meta-data">
                        <p><strong>Fecha de estreno:</strong> ${movie.release_date}</p>
                        <p><strong>Géneros:</strong> ${genres || 'No especificado'}</p>
                        <p><strong>Duración:</strong> ${movie.runtime || 'N/A'} min</p>
                    </div>
                </div>
            </div>
            <div class="synopsis-box">
                <h2>Sinopsis</h2>
                <p id="synopsis">${movie.overview || 'Sin sinopsis disponible.'}</p>
            </div>
        `;
        document.title = `Cinepuma - ${movie.title}`;
    };


    // ----------------------------------------------------
    // 3. LÓGICA DE VALORACIÓN CON DESLIZADOR (SLIDER) (FRONTEND)
    // ----------------------------------------------------

    /**
     * Dibuja las estrellas visualmente para el valor dado (1 a 5).
     * @param {number} value Valor de la valoración (1-5).
     * @returns {string} HTML de las estrellas visuales.
     */
    const renderVisualStars = (value) => {
        let starHtml = '';
        const filledStars = parseInt(value, 10);
        const emptyColor = '#4a4a4a'; // Gris oscuro
        const filledColor = '#FFC107'; // Amarillo/Naranja
        
        for (let i = 1; i <= 5; i++) {
            // Relleno de estrellas basado en el valor actual del slider
            starHtml += `<span class="star-icon" style="font-size: 2.5rem; color: ${i <= filledStars ? filledColor : emptyColor};">★</span>`;
        }
        return starHtml;
    }


    /**
     * Configura el deslizable (slider) para que el usuario seleccione su valoración.
     * @param {boolean} reinitializing Indica si se está re-inicializando (por ejemplo, después de cargar de Firestore)
     */
    const setupRatingSlider = (reinitializing = false) => {
        const starContainer = document.getElementById('star-rating');
        if (!starContainer) {
            console.error("Contenedor de estrellas #star-rating no encontrado.");
            return;
        }

        let slider = document.getElementById('rating-slider');
        let visualDisplay = starContainer.querySelector('.rating-visual-display');

        // Si es la primera inicialización, creamos el HTML del slider y el display
        if (!reinitializing || !slider) {
            starContainer.innerHTML = `
                <div class="rating-visual-display" style="text-align: center; margin-bottom: 10px;"></div>
                <input type="range" id="rating-slider" min="0" max="5" step="1" value="${selectedRating}" 
                       style="width: 100%; height: 20px; cursor: pointer; background: #ff6b35;">
                <p id="slider-value-text" style="text-align: center; font-weight: bold; color: #ff6b35;">
                    ${selectedRating === 0 ? 'Sin calificar' : selectedRating + ' estrellas'}
                </p>
            `;
            
            slider = document.getElementById('rating-slider');
            visualDisplay = starContainer.querySelector('.rating-visual-display');
        } else {
             // Si ya existe, actualizamos las referencias
             slider = document.getElementById('rating-slider');
             visualDisplay = starContainer.querySelector('.rating-visual-display');
        }

        const updateDisplay = (value) => {
            const displayValue = parseInt(value, 10);
            visualDisplay.innerHTML = renderVisualStars(displayValue);
            document.getElementById('slider-value-text').textContent = 
                displayValue === 0 ? 'Sin calificar' : `${displayValue} estrellas`;
        }

        if (!slider.hasAttribute('data-listeners-set')) {
            // Añadir listener de cambio (para cuando el usuario suelta el control) y click
            slider.addEventListener('change', function changeHandler() {
                selectedRating = parseInt(this.value, 10);
                updateDisplay(selectedRating);
                console.log("Valoración seleccionada:", selectedRating);
            });

            // Añadir listener de input (para actualización en tiempo real mientras desliza)
            slider.addEventListener('input', function inputHandler() {
                updateDisplay(parseInt(this.value, 10));
            });
            
            slider.setAttribute('data-listeners-set', 'true');
        }

        // Si se está re-inicializando (por carga de Firestore), o al inicio, 
        // actualizamos el valor del slider y el display
        if (reinitializing) {
             slider.value = selectedRating;
        }
        updateDisplay(selectedRating);
    };


    // ----------------------------------------------------
    // 4. PERSISTENCIA Y CARGA DE RESEÑAS (FIRESTORE)
    // ----------------------------------------------------
    
    // Ruta de la colección pública de reseñas
    const getReviewsCollection = () => {
        // Colección pública: /artifacts/{appId}/public/data/reviews_and_ratings
        return collection(db, `artifacts/${appId}/public/data/reviews_and_ratings`);
    };

    /**
     * Guarda la reseña y valoración del usuario actual en Firestore.
     */
    const saveUserReview = async (reviewText, ratingValue) => {
        if (!currentMovieId || !currentUserId) {
            console.error("No se puede guardar: ID de película o usuario faltante.");
            return;
        }
        
        // La valoración debe ser de 1 a 5 para guardar, 0 significa "Sin calificar"
        if (ratingValue === 0) {
            // Mismo feedback de error que al hacer clic
            const btn = document.getElementById('send-review-btn');
            const originalText = btn.textContent;
            btn.textContent = "¡ERROR! Debes seleccionar una valoración (1-5).";
            btn.style.backgroundColor = 'red';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#ff6b35';
            }, 4000);
            return;
        }


        const reviewData = {
            movieId: currentMovieId,
            userId: currentUserId,
            rating: ratingValue, // 1 a 5
            reviewText: reviewText,
            timestamp: serverTimestamp(),
            // Usamos un nombre de usuario simplificado para mostrar
            userName: `Usuario_${currentUserId.substring(0, 4)}`, 
        };

        // Usa doc(..., movieId_userId) para que cada usuario solo pueda tener 1 review por película (o la actualiza)
        const docRef = doc(getReviewsCollection(), `${currentMovieId}_${currentUserId}`);

        try {
            await setDoc(docRef, reviewData);
            console.log("Reseña y valoración guardada con éxito.");
            document.getElementById('review-input').value = ''; // Limpiar el input de la reseña
            
            // Feedback visual sin alert()
            const btn = document.getElementById('send-review-btn');
            const originalText = btn.textContent;
            btn.textContent = "¡Opinión Enviada!";
            btn.style.backgroundColor = '#18a818'; // Verde para éxito
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#ff6b35';
            }, 3000);

        } catch (e) {
            console.error("Error al añadir documento: ", e);
            // Mensaje de error visible
            const btn = document.getElementById('send-review-btn');
            const originalText = btn.textContent;
            btn.textContent = "Error al guardar (Ver consola)";
            btn.style.backgroundColor = 'red';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#ff6b35';
            }, 4000);
        }
    };

    /**
     * Escucha en tiempo real las reseñas para esta película y actualiza el promedio.
     */
    const listenForReviews = () => {
        if (!db || !currentMovieId) return;

        const reviewsRef = getReviewsCollection();
        // Consulta para solo obtener las reseñas de la película actual
        const q = query(reviewsRef, where("movieId", "==", currentMovieId));

        // Escucha en tiempo real los cambios
        onSnapshot(q, (snapshot) => {
            const reviewsList = [];
            let totalRating = 0;
            let reviewCount = 0;
            let userReviewFound = false; 
            let userRating = 0; // Almacena la valoración del usuario actual

            snapshot.forEach((doc) => {
                const data = doc.data();
                reviewsList.push(data);
                
                if (data.rating && data.rating >= 1 && data.rating <= 5) {
                    totalRating += data.rating;
                    reviewCount++;
                }
                
                // LÓGICA: Comprobar si es la reseña del usuario actual para inicializar su input
                if (data.userId === currentUserId) {
                    userRating = data.rating;
                    userReviewFound = true;
                }
            });

            // Actualiza la valoración seleccionada globalmente para reflejar la última guardada por el usuario
            if (userReviewFound) {
                 selectedRating = userRating;
            } else {
                 // Si el usuario actual no tiene reseña, asegurarse de que el input esté en 0
                 selectedRating = 0;
            }
            
            // Llamar a setupRatingSlider para actualizar la UI del input del usuario con el valor cargado
            // Pasamos 'true' para indicar que solo debe actualizar el display y no re-añadir listeners
            setupRatingSlider(true); 

            // 1. Calcular y mostrar el promedio de valoración
            const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;
            updateAverageRatingDisplay(averageRating, reviewCount);
            
            // 2. Mostrar la lista de reseñas
            // Ordenar por timestamp (el más nuevo primero)
            renderReviewsList(reviewsList.sort((a, b) => {
                const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                return timeB - timeA;
            })); 

        }, (error) => {
            console.error("Error al escuchar reseñas:", error);
            document.getElementById('average-rating-display').innerHTML = 
                '<span style="color:red;">Error al cargar valoraciones.</span>';
        });
    };

    /**
     * Renderiza el promedio de valoración en la UI.
     */
    const updateAverageRatingDisplay = (avg, count) => {
        const displayDiv = document.getElementById('average-rating-display');
        let starHtml = '';
        const emptyColor = '#4a4a4a'; 
        const filledColor = '#ffc107'; 
        
        // Estrellas basadas en el promedio (redondeado al entero más cercano)
        const filledStars = Math.round(avg);
        
        for (let i = 1; i <= 5; i++) {
            // Relleno de estrellas basado en el promedio redondeado
            starHtml += `<span class="star-icon" style="color: ${i <= filledStars ? filledColor : emptyColor};">★</span>`;
        }

        const avgText = avg > 0 ? avg.toFixed(1) : '0.0';
        const countText = count === 1 ? '1 valoración' : `${count} valoraciones`;
        
        displayDiv.innerHTML = `
            Valoración Media de Usuarios: 
            ${starHtml} 
            (${avgText} / 5, basado en ${countText})
        `;
    };

    /**
     * Renderiza la lista de reseñas en la UI.
     */
    const renderReviewsList = (reviews) => {
        const reviewsListElement = document.getElementById('user-reviews-list');
        reviewsListElement.innerHTML = ''; // Limpiar la lista existente
        const emptyColor = '#4a4a4a'; 
        const filledColor = '#ffc107'; 


        if (reviews.length === 0) {
             reviewsListElement.innerHTML = `
                <div class="user-review initial-message">
                    <strong>ComunidadPuma:</strong> <span>¡Sé el primero en opinar!</span>
                </div>
            `;
            return;
        }

        reviews.forEach(review => {
            // Asegurarse de que el rating es un número válido entre 1 y 5
            const rating = Math.min(5, Math.max(1, review.rating || 0));

            let starRatingHtml = '';
            // Renderizar las estrellas de 1 a 5
            for (let i = 1; i <= 5; i++) {
                starRatingHtml += `<span class="star" style="color: ${i <= rating ? filledColor : emptyColor};">★</span>`;
            }

            const newReviewDiv = document.createElement('div');
            newReviewDiv.classList.add('user-review');
            
            // Formatear el timestamp si existe
            const timestamp = review.timestamp?.toDate ? review.timestamp.toDate().toLocaleDateString() : 'Fecha no disponible';

            newReviewDiv.innerHTML = `
                <div>
                    <strong>${review.userName}</strong> 
                    <span class="review-rating">${starRatingHtml}</span> 
                    <small style="color: #999;">(${timestamp})</small>
                </div>
                <span>${review.reviewText}</span>
            `;
            reviewsListElement.appendChild(newReviewDiv);
        });
    };

    // ----------------------------------------------------
    // 5. INICIALIZACIÓN PRINCIPAL
    // ----------------------------------------------------

    const init = async () => {
        const movieId = getMovieIdFromUrl();
        
        if (movieId) {
            // 5.1. Cargar detalles de TMDB
            const movieDetails = await getMovieDetails(movieId);
            renderMovieDetails(movieDetails);
            
            // 5.2. Configurar el deslizable (slider) inmediatamente
            if (document.getElementById('star-rating')) {
                setupRatingSlider(); 
            }
            
            if (movieDetails) {
                // 5.3. Inicializar Firebase y Auth
                const isFirebaseReady = await initializeFirebase();
                
                if (isFirebaseReady) {
                    // 5.4. Iniciar escucha de reseñas en tiempo real. 
                    // Esto cargará la valoración previa del usuario y actualizará el estado visual.
                    listenForReviews(); 

                    // 5.5. Configurar el botón de envío
                    const sendReviewBtn = document.getElementById('send-review-btn');
                    sendReviewBtn.addEventListener('click', () => {
                        const reviewText = document.getElementById('review-input').value.trim();
                        
                        if (selectedRating === 0 || reviewText === "") {
                            // Feedback de error para el usuario
                            const errorMsg = selectedRating === 0 ? 
                                "selecciona una valoración (1-5)" : 
                                "escribe un comentario";
                            
                            const btn = document.getElementById('send-review-btn');
                            const originalText = btn.textContent;
                            btn.textContent = `¡ERROR! Debes ${errorMsg}.`;
                            btn.style.backgroundColor = 'red';
                            setTimeout(() => {
                                btn.textContent = originalText;
                                btn.style.backgroundColor = '#ff6b35';
                            }, 4000);

                            return;
                        }
                        
                        saveUserReview(reviewText, selectedRating);
                    });
                } else {
                    // Si Firebase falla, deshabilitar la entrada
                    document.getElementById('review-input').disabled = true;
                    document.getElementById('send-review-btn').disabled = true;
                }
            }
        } else {
            // Si no hay ID en la URL, mostrar la pantalla de "no encontrado"
            renderMovieDetails(null); 
        }
    };

    init();
});