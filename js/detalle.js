// 1. IMPORTACIONES DE FIREBASE (Necesarias para la funcionalidad del slider y reseñas)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, query, onSnapshot, doc, setLogLevel
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Habilitar logs para depuración de Firestore
setLogLevel('debug');

// 2. CONSTANTES GLOBALES (Necesarias para Canvas/Firebase)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cinepuma-reviews';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// Nota: initialAuthToken es manejado dentro de initializeFirebase

// Referencias a los elementos del DOM
const starRatingContainer = document.getElementById('star-rating');
const reviewInput = document.getElementById('review-input');
const sendReviewBtn = document.getElementById('send-review-btn');
const userReviewsList = document.getElementById('user-reviews-list');
const averageRatingDisplay = document.getElementById('average-rating-display');

// Variable para la referencia de la base de datos y autenticación
let db;
let auth;
let userId = 'anonymous';

// Variables para la película actual (usaremos un ID fijo de ejemplo por ahora)
const movieId = 'ejemplo-pelicula-001'; // ID de película fijo para el ejemplo

// 3. INICIALIZACIÓN DE FIREBASE Y AUTENTICACIÓN
async function initializeFirebase() {
    // Si el contenedor del slider no existe, salimos
    if (!starRatingContainer) {
        console.error("El contenedor '#star-rating' no existe. Deteniendo la inicialización.");
        return; 
    }
    
    // Muestra el slider inmediatamente al iniciar el script, independientemente de Firebase.
    initRatingSlider();

    // === CHEQUEO CRÍTICO DE CONFIGURACIÓN DE FIREBASE (El parche) ===
    // Si la configuración no está completa (es decir, le falta el projectId),
    // mostramos un error en la UI y detenemos el intento de inicializar la base de datos.
    if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.projectId) {
        console.error("Firebase Configuración de base de datos no disponible o incompleta. Funcionalidad de guardar/cargar opiniones deshabilitada.");
        starRatingContainer.innerHTML += '<p style="color:red; margin-top: 10px; font-weight: bold;">⚠️ Error de Configuración de BD: Las opiniones no se guardarán.</p>';
        return; 
    }
    // ===================================================

    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // Intenta iniciar sesión con el token personalizado o de forma anónima
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        // Listener para obtener el UID del usuario una vez autenticado
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                console.log("Usuario autenticado. UID:", userId);
                loadReviews();
            } else {
                console.log("Usuario anónimo o no autenticado.");
            }
        });

    } catch (error) {
        console.error("Error al inicializar Firebase o autenticar:", error);
        starRatingContainer.textContent = 'Error al cargar el sistema de valoración. (Revisa la consola para detalles)';
    }
}

// 4. LÓGICA DEL SLIDER Y ESTRELLAS
let currentRating = 0; // Valor de la valoración actual

function initRatingSlider() {
    // 1. Limpiar el contenido de carga (¡ESTO DEBE EJECUTARSE!)
    starRatingContainer.innerHTML = '';
    
    // 2. Crear el input de tipo range (el slider)
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'rating-slider';
    slider.min = 1;
    slider.max = 5;
    slider.step = 0.5;
    slider.value = 1;

    // 3. Crear el display visual de estrellas
    const starDisplay = document.createElement('div');
    starDisplay.id = 'visual-stars';
    // Utilizamos las clases de CSS que ya tienes definidas
    starDisplay.style.display = 'flex'; 
    starDisplay.style.alignItems = 'center'; 
    starDisplay.style.marginLeft = '10px'; 

    // Función para actualizar las estrellas visuales
    const updateStars = (value) => {
        starDisplay.innerHTML = ''; // Limpiar estrellas anteriores
        currentRating = parseFloat(value);
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.style.fontSize = '2rem'; // Para que las estrellas se vean grandes

            // Lógica para media estrella
            const isFilled = i <= currentRating;
            const isHalf = i - 0.5 === currentRating;

            if (isFilled && !isHalf) {
                star.innerHTML = '★'; // Estrella completa
                star.classList.add('filled');
            } else if (isHalf) {
                // Para simplificar y asegurar visibilidad, usamos estrella completa para media valoración
                // NOTA: Si quieres media estrella, usa Unicode '½' o un SVG, pero '★' es más seguro.
                star.innerHTML = '★'; 
                star.classList.add('filled');
            }
            else {
                star.innerHTML = '☆'; // Estrella vacía
                star.classList.remove('filled');
            }
            starDisplay.appendChild(star);
        }
    };

    // 4. Evento para el slider: actualiza el valor y las estrellas
    slider.addEventListener('input', (e) => {
        updateStars(e.target.value);
    });

    // 5. Añadir los elementos al contenedor
    starRatingContainer.appendChild(slider);
    starRatingContainer.appendChild(starDisplay);

    // Inicializar las estrellas con el valor por defecto (1)
    updateStars(slider.value);
    console.log("Slider de valoración inicializado y visible.");
}

// 5. FUNCIÓN PARA ENVIAR LA OPINIÓN A FIRESTORE
async function saveReview() {
    if (!db) {
        alertModal('Error de conexión', 'La base de datos no está inicializada. No se puede guardar la opinión.', 'error');
        return;
    }

    const reviewText = reviewInput.value.trim();
    if (currentRating === 0 || reviewText.length < 5) {
        alertModal('Opinión incompleta', 'Por favor, selecciona una valoración (1-5) y escribe una opinión con al menos 5 caracteres.', 'warning');
        return;
    }

    try {
        const reviewData = {
            movieId: movieId,
            userId: userId, 
            rating: currentRating,
            reviewText: reviewText,
            timestamp: new Date()
        };

        // Ruta de colección pública: /artifacts/{appId}/public/data/{nombre_coleccion}
        const reviewsRef = collection(db, `artifacts/${appId}/public/data/movie_reviews`);
        await addDoc(reviewsRef, reviewData);

        alertModal('¡Opinión enviada!', 'Tu valoración ha sido guardada con éxito. Actualizando la lista...', 'success');
        
        // Limpiar el formulario
        reviewInput.value = '';
        document.getElementById('rating-slider').value = 1;
        document.getElementById('rating-slider').dispatchEvent(new Event('input')); // Resetear estrellas
        
    } catch (error) {
        console.error("Error al guardar la opinión:", error);
        alertModal('Error al guardar', 'Hubo un problema al enviar tu opinión. Inténtalo de nuevo.', 'error');
    }
}

// 6. FUNCIÓN PARA CARGAR Y MOSTRAR OPINIONES EN TIEMPO REAL
function loadReviews() {
    if (!db) {
        userReviewsList.textContent = 'Base de datos no disponible.';
        return;
    }

    // Crear la referencia a la colección y la consulta (solo para la película actual)
    const reviewsRef = collection(db, `artifacts/${appId}/public/data/movie_reviews`);
    // Usamos una query simple ya que estamos filtrando en el cliente por movieId. 
    // Si fuera una app de producción, usaríamos where('movieId', '==', movieId)
    const q = query(reviewsRef); 

    // onSnapshot escucha los cambios en tiempo real
    onSnapshot(q, (snapshot) => {
        const reviews = [];
        let totalRating = 0;
        let numReviews = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.movieId === movieId) { // Filtrar solo por el ID de la película actual
                reviews.push({ id: doc.id, ...data });
                totalRating += data.rating;
                numReviews++;
            }
        });

        // 7. Calcular y mostrar la valoración media
        const averageRating = numReviews > 0 ? (totalRating / numReviews).toFixed(1) : 'N/A';
        averageRatingDisplay.textContent = `Valoración Media: ${averageRating} / 5 (${numReviews} votos)`;

        // 8. Renderizar la lista de reseñas
        renderReviews(reviews.sort((a, b) => b.timestamp - a.timestamp)); // Ordenar por más reciente

    }, (error) => {
        console.error("Error al escuchar las reseñas:", error);
        userReviewsList.textContent = 'Error al cargar las reseñas.';
    });
}

function renderReviews(reviews) {
    userReviewsList.innerHTML = ''; // Limpiar la lista
    
    if (reviews.length === 0) {
        userReviewsList.innerHTML = `<p class="initial-message text-center p-4" style="color:#cccccc; font-style:italic;">Aún no hay opiniones. ¡Sé el primero en dejar una!</p>`;
        return;
    }

    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'user-review';
        
        // Crear las estrellas de la reseña
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                starsHtml += `<span class="star filled">★</span>`;
            } else if (i - 0.5 === review.rating) {
                starsHtml += `<span class="star filled">½</span>`; // Media estrella
            } else {
                starsHtml += `<span class="star">☆</span>`;
            }
        }

        // Mostrar el ID de usuario (solo los primeros 8 caracteres)
        const displayUserId = review.userId.substring(0, 8) + '...';
        
        reviewElement.innerHTML = `
            <p>
                <strong>Usuario ID:</strong> ${displayUserId} <br>
                <span class="review-rating">${starsHtml}</span> (${review.rating}/5)
            </p>
            <p>"${review.reviewText}"</p>
            <p class="text-xs text-gray-500 mt-1">${review.timestamp ? new Date(review.timestamp.seconds * 1000).toLocaleDateString() : 'Fecha desconocida'}</p>
        `;
        userReviewsList.appendChild(reviewElement);
    });
}

// 7. FUNCIÓN DE MODAL DE ALERTA (Para reemplazar alert())
function alertModal(title, message, type) {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Implementación simple de un modal de alerta en la consola/o interfaz
    // Para entornos sin UI, usamos la consola:
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed; top: 10px; right: 10px; padding: 15px; border-radius: 5px; 
        color: white; z-index: 1000; font-family: Arial, sans-serif;
        background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
        opacity: 0.9;
        transition: opacity 0.5s;
    `;
    alertDiv.innerHTML = `<strong>${title}</strong>: ${message}`;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = 0;
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}


// 8. ASIGNACIÓN DE EVENTOS
// Al ser un módulo, este código se ejecuta automáticamente, pero es buena práctica
// usar DOMContentLoaded para asegurar que todos los elementos HTML existan.
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    if (sendReviewBtn) {
        sendReviewBtn.addEventListener('click', saveReview);
    }
});