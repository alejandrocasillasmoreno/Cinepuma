// 1. IMPORTACIONES DE FIREBASE (Versión CDN para compatibilidad directa)
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
    setDoc 
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

        // Observador del estado del usuario
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Usuario activo:", user.email);
                showDashboard(user.email);
            } else {
                setupFormListeners();
            }
        });
    } catch (error) {
        console.error("Error crítico al iniciar Firebase:", error);
    }
}

// 4. FUNCIONES DE AUTENTICACIÓN (CON SPINNER)

async function handleLogin(email, password) {
    if (!auth) return;
    const loginBtn = document.getElementById('login-btn');
    
    // Activar estado de carga
    if (loginBtn) loginBtn.classList.add('loading');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('Inicio de Sesión Exitoso', 'Cargando CinePuma...', 'success');
    } catch (error) {
        // Desactivar estado de carga si hay error para permitir reintento
        if (loginBtn) loginBtn.classList.remove('loading');
        showModal('Error', `Credenciales incorrectas: ${error.message}`, 'error');
    }
}

async function handleRegister(email, password, nombre, apellidos) {
    if (!auth) return;
    const registerBtn = document.getElementById('register-btn');
    
    // Activar estado de carga
    if (registerBtn) registerBtn.classList.add('loading');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential.user.uid, email, nombre, apellidos);
        showModal('Registro Exitoso', 'Cuenta creada correctamente.', 'success');
    } catch (error) {
        // Desactivar estado de carga si hay error
        if (registerBtn) registerBtn.classList.remove('loading');
        showModal('Error de Registro', error.message, 'error');
    }
}

// 5. FUNCIÓN DE GUARDADO DE DATOS (FIRESTORE)
async function saveUserData(uid, email, nombre = "", apellidos = "") {
    if (!db) return;
    const userProfileRef = doc(db, `artifacts/${appId}/users/${uid}/user_data`, 'profile');
    const dataToSave = {
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        lastLogin: new Date(),
        registrationDate: new Date(), 
        appName: 'CinePuma App',
        role: 'standard' 
    };

    try {
        await setDoc(userProfileRef, dataToSave, { merge: true });
        console.log("Datos guardados en Firestore.");
    } catch (error) {
        console.error("Error Firestore:", error);
    }
}

// 6. MANEJO DE EVENTOS (CONEXIÓN CON BOTONES)
function setupFormListeners() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');
    const surnameInput = document.getElementById('surname');
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authForm = document.getElementById('auth-form');

    if (!authForm) return;

    authForm.addEventListener('submit', (e) => e.preventDefault());

    // Listener para Botón de LOGIN
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            if (email && password) {
                handleLogin(email, password);
            } else {
                showModal('Datos incompletos', 'Email y contraseña son obligatorios.', 'warning');
            }
        });
    }

    // Listener para Botón de REGISTRO
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const nombre = nameInput ? nameInput.value : "";
            const apellidos = surnameInput ? surnameInput.value : "";

            if (email && password.length >= 6 && nombre) {
                handleRegister(email, password, nombre, apellidos);
            } else {
                showModal('Datos incompletos', 'Nombre, Email y Contraseña (6+ carac.) son obligatorios.', 'warning');
            }
        });
    }
}

// 7. UI Y MODALES
function showDashboard(email) {
    if (appContainer) {
        appContainer.innerHTML = `
            <div class="container" style="text-align:center; margin-top:50px;">
                <h2>¡Bienvenido, ${email}!</h2>
                <p>Tu sesión en CinePuma está activa.</p>
                <button id="logout-btn" class="submit-button" style="background: #e74c3c; border:none; padding:10px 20px; color:white; border-radius:20px; cursor:pointer;">Cerrar Sesión</button>
            </div>
            <div id="auth-ui-messages"></div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    }
}

function showModal(title, message, type) {
    const modal = document.getElementById('auth-ui-messages');
    if (!modal) return;

    const colors = {
        'success': 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;',
        'error': 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;',
        'warning': 'background: #fff3cd; color: #856404; border: 1px solid #ffeeba;'
    };

    modal.innerHTML = `
        <div style="padding: 15px; margin: 20px auto; max-width: 400px; border-radius: 8px; font-family: sans-serif; ${colors[type]}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
    setTimeout(() => { if(modal) modal.innerHTML = ''; }, 4000);
}
//Logica ojo
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('toggleBtn');
const eyeIcon = document.getElementById('eyeIcon');

toggleBtn.addEventListener('click', () => {
  // Verificamos si es password o texto
  const isPassword = passwordInput.type === 'password';
  
  // Cambiamos el tipo
  passwordInput.type = isPassword ? 'text' : 'password';
  
  // Cambiamos el icono como feedback visual
  eyeIcon.textContent = isPassword ? '🫣' : '👁️';
});

document.addEventListener('DOMContentLoaded', initializeFirebase);