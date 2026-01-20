import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChKzHT4ZT-z6156HacMYDdImWFrq98174",
  authDomain: "cinepuma-2026.firebaseapp.com",
  projectId: "cinepuma-2026",
  storageBucket: "cinepuma-2026.firebasestorage.app",
  messagingSenderId: "628367090771",
  appId: "1:628367090771:web:4394f16d34a7ba130992a6",
  measurementId: "G-VG5Z808JE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
