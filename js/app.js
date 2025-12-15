// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    setLogLevel 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Habilitar logs para depuración de Firestore
setLogLevel('debug');

// 2. CONSTANTES Y VARIABLES GLOBALES
const appContainer = document.querySelector('body'); // Usaremos el body para inyectar contenido si es necesario
const messageContainer = document.getElementById('auth-ui-messages'); // Contenedor de mensajes de error/éxito
        
// Variables globales de entorno (Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cinepuma-login';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let auth;
let db;
let userId = null;
let authReady = false;

// 3. INICIALIZACIÓN DE FIREBASE
async function initializeFirebase() {
    // Si la configuración no está disponible, mostramos un error de configuración y NO detenemos el flujo del DOM
    if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.projectId) {
        console.error("Firebase Configuración de base de datos no disponible o incompleta. Funcionalidad de BD deshabilitada.");
        if (messageContainer) {
            showModal('Advertencia', 'Base de datos no configurada. El Login y Registro solo funcionarán si ya tienes un entorno Firebase activo.', 'warning');
        }
        // Aunque la BD no esté, intentamos inicializar Auth para que los métodos de Login funcionen si hay config
        try {
            const app = initializeApp({}); // Inicialización mínima para que getAuth no falle si hay config
            auth = getAuth(app);
            // Si la autenticación falla por falta de config, se manejará en los handlers.
        } catch (e) {
            console.error("Error al inicializar solo Auth:", e);
        }
        
        // Ejecutamos el listener de eventos del formulario
        setupFormListeners();
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Autenticación inicial con token personalizado o anónimo
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        // Listener de estado de autenticación
        onAuthStateChanged(auth, (user) => {
            authReady = true;
            if (user && user.isAnonymous === false) { // Solo si es un usuario real (no anónimo de la inicialización)
                userId = user.uid;
                // SIMULACIÓN DE REDIRECCIÓN a index.html (esto debería ser un window.location.href en una app real)
                console.log(`Usuario autenticado (${user.email}). Redirigiendo a index.html...`);
                showDashboard(user.email);
            } else if (user && user.isAnonymous === true) {
                // Usuario anónimo, no hacemos nada, dejamos que vea la UI de login
                setupFormListeners();
            } else {
                userId = null;
                // Aseguramos que los listeners se activen si no hay sesión
                setupFormListeners();
            }
        });

    } catch (error) {
        console.error("Error al inicializar Firebase:", error);
        showModal('Error Crítico', `No se pudo conectar a Firebase. Detalles: ${error.message}`, 'error');
    }
}

// 4. FUNCIONES DE AUTENTICACIÓN

// Maneja el Login
async function handleLogin(email, password) {
    if (!auth) {
        showModal('Error', 'El servicio de autenticación no está disponible.', 'error');
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged maneja la redirección
        showModal('Inicio de Sesión Exitoso', 'Redirigiendo a tu panel de control...', 'success');
    } catch (error) {
        console.error("Error de Login:", error);
        // FirebaseError: auth/user-not-found, auth/wrong-password, etc.
        showModal('Error de Inicio de Sesión', `Error: ${error.message}`, 'error');
    }
}

// Maneja el Registro
async function handleRegister(email, password) {
    if (!auth) {
        showModal('Error', 'El servicio de autenticación no está disponible.', 'error');
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Guarda los datos iniciales del usuario justo después del registro
        await saveUserData(userCredential.user.uid, email);

        // onAuthStateChanged maneja la redirección
        showModal('Registro Exitoso', 'Tu cuenta ha sido creada y tus datos iniciales guardados. Redirigiendo...', 'success');
    } catch (error) {
        console.error("Error de Registro:", error);
        // FirebaseError: auth/email-already-in-use, auth/weak-password, etc.
        showModal('Error de Registro', `Error: ${error.message}`, 'error');
    }
}

// 5. FUNCIÓN DE GUARDADO DE DATOS EN FIRESTORE
async function saveUserData(uid, email) {
    if (!db) {
        console.warn("Firestore no inicializado. No se puede guardar datos de perfil.");
        return;
    }
    
    // Ruta de datos privada del usuario: /artifacts/{appId}/users/{userId}/user_data/profile
    const userProfileRef = doc(db, `artifacts/${appId}/users/${uid}/user_data`, 'profile');
    
    const dataToSave = {
        email: email,
        lastLogin: new Date(),
        // Solo establece registrationDate si es la primera vez
        registrationDate: new Date(), 
        appName: 'CinePuma App',
        role: 'standard' 
    };

    try {
        await setDoc(userProfileRef, dataToSave, { merge: true });
        console.log(`[Firestore] Datos guardados/actualizados para el usuario: ${uid}`);
    } catch (error) {
        console.error("[Firestore] Error al guardar datos:", error);
        showModal('Error de Base de Datos', 'Los datos del usuario no pudieron ser guardados en Firestore.', 'error');
    }
}

// 6. MANEJO DE EVENTOS DEL FORMULARIO
function setupFormListeners() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authForm = document.getElementById('auth-form');

    if (!emailInput || !passwordInput || !loginBtn || !registerBtn || !authForm) {
        console.error("No se encontraron todos los elementos del formulario de Login en el DOM. Asegúrate de que login.html tenga los IDs: 'email', 'password', 'login-btn', 'register-btn', 'auth-form'.");
        return;
    }

    // Prevención del submit por defecto del formulario
    authForm.addEventListener('submit', (e) => e.preventDefault());

    // Evento del botón de Login
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        handleLogin(email, password);
    });

    // Evento del botón de Registro
    registerBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (email && password && password.length >= 6) {
            handleRegister(email, password);
        } else {
            showModal('Campos Requeridos', 'El email y una contraseña de al menos 6 caracteres son obligatorios para registrarse.', 'warning');
        }
    });
}

// 7. SIMULACIÓN DE REDIRECCIÓN Y DASHBOARD
// Esto reemplaza el contenido del body para simular la "redirección a index.html"
function showDashboard(email) {
    if (appContainer) {
        appContainer.innerHTML = `
            <header class="mb-8">
                <!-- Contenido del header original (simplificado) -->
                <div class="logo"><h1>CinePuma</h1></div>
            </header>
            
            <div class="container max-w-lg mx-auto p-8 bg-white rounded-lg shadow-xl">
                <h2 class="text-3xl font-extrabold text-indigo-600 text-center mb-6">
                    ¡Bienvenido, ${email.split('@')[0]}!
                </h2>
                <div class="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-400 mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Panel de Control (index.html simulado)</h3>
                    <p class="text-gray-600 mt-2">
                        Has iniciado sesión con éxito. Tus datos se guardaron en: 
                        <code class="block mt-2 text-xs break-all">artifacts/${appId}/users/${userId}/user_data/profile</code>
                    </p>
                    <p class="mt-4 text-sm font-mono bg-white p-2 rounded">
                        <span class="font-bold">ID de Usuario:</span> ${userId}
                    </p>
                </div>
                
                <button id="logout-btn" class="submit-button w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded">
                    Cerrar Sesión
                </button>
            </div>
            <div id="auth-ui-messages" class="w-full max-w-sm mx-auto my-4"></div>
        `;

        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        
        // Llamada a saveUserData al iniciar sesión (para actualizar lastLogin)
        if (db) {
            saveUserData(userId, email);
        }
    }
}

// 8. FUNCIÓN DE MODAL DE ALERTA (Reemplazo de alert())
function showModal(title, message, type) {
    const modal = document.getElementById('auth-ui-messages');
    if (!modal) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        return;
    }

    const colorMap = {
        'success': 'bg-green-100 border-green-400 text-green-700 border-l-4',
        'error': 'bg-red-100 border-red-400 text-red-700 border-l-4',
        'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700 border-l-4'
    };

    modal.innerHTML = `
        <div class="p-4 mb-4 border rounded-lg ${colorMap[type]} transition-all duration-300" role="alert">
            <p class="font-bold">${title}</p>
            <p class="text-sm">${message}</p>
        </div>
    `;
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        modal.innerHTML = '';
    }, 5000);
}

// 9. INICIO DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', initializeFirebase);