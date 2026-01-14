// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, // <--- Nueva importación para recuperar clave
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
                setTimeout(() => {
                    const path = window.location.pathname;
                    if (path.includes('registro') || path.includes('login') || path.includes('contraseña_olvidada')) {
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
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('Inicio de Sesión Exitoso', 'Redirigiendo a CinePuma...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (error) {
        showModal('Error', 'Credenciales incorrectas.', 'error');
    }
}

async function handleRegister(email, password, nombre_usuario) {
    if (!auth) return;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential.user.uid, email, nombre_usuario);
        showModal('Registro Exitoso', 'Cuenta creada. Redirigiendo...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        showModal('Error de Registro', error.message, 'error');
    }
}

// NUEVA FUNCIÓN: RECUPERAR CONTRASEÑA
async function handleResetPassword(email) {
    if (!auth) return;
    try {
        await sendPasswordResetEmail(auth, email);
        showModal('Correo Enviado', 'Revisa tu bandeja de entrada para cambiar tu clave.', 'success');
    } catch (error) {
        let mensaje = "Error al enviar el correo.";
        if (error.code === 'auth/user-not-found') mensaje = "Este correo no está registrado.";
        showModal('Error', mensaje, 'error');
    }
}

// 5. FUNCIÓN DE GUARDADO (Mapeo SQL)
async function saveUserData(uid, email, nombre_usuario) {
    if (!db) return;
    const userRef = doc(db, "usuarios", uid);
    const dataToSave = {
        nombre_usuario: nombre_usuario,
        correo: email,
        contrasena: "Protegida por Auth",
        fecha_registro: serverTimestamp()
    };
    try {
        await setDoc(userRef, dataToSave);
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }
}

// 6. MANEJO DE EVENTOS
function setupFormListeners() {
    const emailInput = document.getElementById('email') || document.getElementById('recovery-email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name'); 
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const recoveryForm = document.getElementById('recovery-form'); // El form de tu nuevo HTML
    const authForm = document.getElementById('auth-form');

    if (authForm) authForm.addEventListener('submit', (e) => e.preventDefault());
    
    // Escuchador para Recuperación de Contraseña
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('recovery-email').value;
            if (email) handleResetPassword(email);
        });
    }

    if (loginBtn) {
        loginBtn.onclick = () => {
            if (emailInput.value && passwordInput.value) handleLogin(emailInput.value, passwordInput.value);
            else showModal('Atención', 'Faltan datos.', 'warning');
        };
    }

    if (registerBtn) {
        registerBtn.onclick = () => {
            if (emailInput.value && passwordInput.value.length >= 6 && nameInput.value) {
                handleRegister(emailInput.value, passwordInput.value, nameInput.value);
            } else {
                showModal('Datos incompletos', 'Revisa los campos.', 'warning');
            }
        };
    }
}

// 7. UI Y MODALES
function showModal(title, message, type) {
    // Busca el contenedor en el HTML actual (asegúrate de que exista id="auth-ui-messages")
    let modal = document.getElementById('auth-ui-messages');
    
    // Si no existe, lo crea dinámicamente para no romper el código
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-ui-messages';
        document.body.appendChild(modal);
    }

    const styles = {
        'success': 'background: #28a745; color: white;',
        'error': 'background: #dc3545; color: white;',
        'warning': 'background: #ffc107; color: black;'
    };
    modal.innerHTML = `
        <div style="padding: 15px; margin: 10px auto; border-radius: 8px; text-align:center; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; min-width: 300px; ${styles[type]}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
    setTimeout(() => { modal.innerHTML = ''; }, 3500);
}

// LÓGICA DEL OJO
const pInput = document.getElementById('password');
const tBtn = document.getElementById('toggleBtn');
if (tBtn && pInput) {
    tBtn.addEventListener('click', () => {
        const isPass = pInput.type === 'password';
        pInput.type = isPass ? 'text' : 'password';
        document.getElementById('eyeIcon').textContent = isPass ? '🫣' : '👁️';
    });
}

document.addEventListener('DOMContentLoaded', initializeFirebase);