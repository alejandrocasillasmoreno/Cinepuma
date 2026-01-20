// 1. IMPORTACIONES DE FIREBASE
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// IMPORTAR INSTANCIAS COMPARTIDAS
import { auth, db } from "./firebase-init.js";

// 2. CONFIGURACIÓN YA NO ES NECESARIA AQUÍ (está en firebase-init.js)

// 3. INICIALIZACIÓN
async function initializeFirebase() {
    try {
        // auth y db ya están inicializados

        onAuthStateChanged(auth, (user) => {

            if (user) {
                console.log("Sesión activa:", user.email);
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
        console.error("Error crítico:", error);
    }
}

// 4. FUNCIONES DE AUTENTICACIÓN
async function handleLogin(email, password) {
    if (!auth) return;
    const btn = document.getElementById('login-btn');

    // ACTIVA EL SÍMBOLO DE CARGA (Basado en tu CSS)
    if (btn) btn.classList.add('loading');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('Inicio de Sesión Exitoso', 'Bienvenido a CinePuma', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (error) {
        // DESACTIVA EL SÍMBOLO DE CARGA SI HAY ERROR
        if (btn) btn.classList.remove('loading');
        showModal('Error', 'Credenciales incorrectas.', 'error');
    }
}

async function handleRegister(email, password, nombre_usuario) {
    if (!auth) return;
    const btn = document.getElementById('register-btn');

    if (btn) btn.classList.add('loading');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential.user.uid, email, nombre_usuario);
        showModal('Registro Exitoso', 'Cuenta creada correctamente.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        if (btn) btn.classList.remove('loading');
        showModal('Error de Registro', error.message, 'error');
    }
}

async function handleResetPassword(email) {
    if (!auth) return;
    const btn = document.querySelector('.submit-button'); // Botón de la página de recuperación
    if (btn) btn.classList.add('loading');

    try {
        await sendPasswordResetEmail(auth, email);
        showModal('Correo Enviado', 'Revisa tu bandeja de entrada.', 'success');
        if (btn) btn.classList.remove('loading');
    } catch (error) {
        if (btn) btn.classList.remove('loading');
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
        console.error("Error al guardar en Firestore:", error);
    }
}

// 6. MANEJO DE EVENTOS
function setupFormListeners() {
    const emailInput = document.getElementById('email') || document.getElementById('recovery-email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const recoveryForm = document.getElementById('recovery-form');
    const authForm = document.getElementById('auth-form');

    if (authForm) authForm.addEventListener('submit', (e) => e.preventDefault());

    if (recoveryForm) {
        recoveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('recovery-email').value;
            if (email) handleResetPassword(email);
        });
    }

    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            if (email && password) handleLogin(email, password);
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
    let modal = document.getElementById('auth-ui-messages');
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
        <div style="padding: 15px; margin: 10px auto; border-radius: 8px; text-align:center; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); ${styles[type]}">
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