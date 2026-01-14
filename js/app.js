// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// 2. CONFIGURACIÓN REAL DE CINEPUMA 2026
const firebaseConfig = {
  apiKey: "AIzaSyChKzHT4ZT-z6156HacMYDdImWFrq98174",
  authDomain: "cinepuma-2026.firebaseapp.com",
  projectId: "cinepuma-2026",
  storageBucket: "cinepuma-2026.firebasestorage.app",
  messagingSenderId: "628367090771",
  appId: "1:628367090771:web:4394f16d34a7ba130992a6",
  measurementId: "G-VG5Z808JE5"
};

let auth;
let db;

// 3. INICIALIZACIÓN
async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Sesión activa detectada:", user.email);
                // Si ya hay sesión, redireccionamos al index después de un pequeño delay
                // para permitir que se vean los mensajes de éxito si vienen de login/registro
                setTimeout(() => {
                    if (window.location.pathname.includes('registro') || window.location.pathname.includes('login')) {
                        window.location.href = 'index.html';
                    }
                }, 1500);
            } else {
                setupFormListeners();
            }
        });
    } catch (error) {
        console.error("Error crítico al iniciar Firebase:", error);
    }
}

// 4. FUNCIONES DE AUTENTICACIÓN
async function handleLogin(email, password) {
    if (!auth) return;
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.classList.add('loading');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('Inicio de Sesión Exitoso', 'Redirigiendo a CinePuma...', 'success');
        // Redirección manual inmediata por si el observer tarda
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (error) {
        if (loginBtn) loginBtn.classList.remove('loading');
        showModal('Error', 'Credenciales incorrectas.', 'error');
    }
}

async function handleRegister(email, password, nombre_usuario) {
    if (!auth) return;
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) registerBtn.classList.add('loading');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Guardamos con la estructura SQL que pediste
        await saveUserData(userCredential.user.uid, email, nombre_usuario);
        showModal('Registro Exitoso', 'Cuenta creada. Redirigiendo...', 'success');
        // Redirección manual inmediata
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        if (registerBtn) registerBtn.classList.remove('loading');
        showModal('Error de Registro', error.message, 'error');
    }
}

// 5. FUNCIÓN DE GUARDADO (Mapeo SQL: id, nombre_usuario, correo, contrasena, fecha_registro)
async function saveUserData(uid, email, nombre_usuario) {
    if (!db) return;
    
    // Usamos el UID como Primary Key y guardamos en la colección /usuarios
    const userRef = doc(db, "usuarios", uid);
    
    const dataToSave = {
        nombre_usuario: nombre_usuario,      // VARCHAR(50)
        correo: email,                       // VARCHAR(100) STRING
        contrasena: "Protegida por Auth",    // Seguridad
        fecha_registro: serverTimestamp()    // DEFAULT CURRENT_TIMESTAMP
    };

    try {
        await setDoc(userRef, dataToSave);
        console.log("Datos de usuario guardados en Firestore.");
    } catch (error) {
        console.error("Error al guardar datos restringidos:", error);
    }
}

// 6. MANEJO DE EVENTOS
function setupFormListeners() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name'); 
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authForm = document.getElementById('auth-form');

    if (authForm) {
        authForm.addEventListener('submit', (e) => e.preventDefault());
    }

    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            if (email && password) handleLogin(email, password);
            else showModal('Atención', 'Faltan datos.', 'warning');
        };
    }

    if (registerBtn) {
        registerBtn.onclick = () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const nombre = nameInput ? nameInput.value : "";

            if (email && password.length >= 6 && nombre) {
                handleRegister(email, password, nombre);
            } else {
                showModal('Datos incompletos', 'Nombre, Email y Contraseña (mín. 6) son requeridos.', 'warning');
            }
        };
    }
}

// 7. UI Y MODALES
function showModal(title, message, type) {
    const modal = document.getElementById('auth-ui-messages');
    if (!modal) return;
    const styles = {
        'success': 'background: #28a745; color: white;',
        'error': 'background: #dc3545; color: white;',
        'warning': 'background: #ffc107; color: black;'
    };
    modal.innerHTML = `
        <div style="padding: 15px; margin: 10px auto; border-radius: 8px; text-align:center; transition: all 0.3s; ${styles[type]}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
    setTimeout(() => { modal.innerHTML = ''; }, 3500);
}

// LOGICA DEL OJO (Feedback visual)
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('toggleBtn');
const eyeIcon = document.getElementById('eyeIcon');

if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.textContent = isPassword ? '🫣' : '👁️';
    });
}

document.addEventListener('DOMContentLoaded', initializeFirebase);