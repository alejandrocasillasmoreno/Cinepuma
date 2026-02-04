import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Configuración de CinePuma
const firebaseConfig = {
    apiKey: "AIzaSyChKzHT4ZT-z6156HacMYDdImWFrq98174",
    authDomain: "cinepuma-2026.firebaseapp.com",
    projectId: "cinepuma-2026",
    storageBucket: "cinepuma-2026.firebasestorage.app",
    messagingSenderId: "628367090771",
    appId: "1:628367090771:web:4394f16d34a7ba130992a6"
};

// Inicializar servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Referencia al elemento del DOM (asegúrate de que existe en el HTML)
const welcomeElement = document.getElementById('user-welcome');

// Escuchar estado de la sesión
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuario logueado
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if(welcomeElement) {
                    welcomeElement.innerHTML = `Hola, <strong>${userData.nombre_usuario}</strong> | <button id="logout-link" style="background:none; border:none; padding:0; color:#ff4b2b; font-weight:bold; cursor:pointer;">Cerrar Sesión</button>`;
                    
                    // Activar botón de logout
                    document.getElementById('logout-link').addEventListener('click', () => {
                        signOut(auth).then(() => window.location.reload());
                    });
                }
            }
        } catch (error) {
            console.error("Error al recuperar datos del usuario:", error);
        }
    } else {
        // Usuario no logueado
        if(welcomeElement) {
            welcomeElement.innerHTML = `<a href="login.html" style="color:white; text-decoration:none; font-weight:bold;">Iniciar Sesión</a>`;
        }
    }
});