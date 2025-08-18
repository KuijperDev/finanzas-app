// js/firebase-init.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEnkJN4FJH3aX18PAGR8UlFR9HfpLCWG0",
  authDomain: "roles-finance.firebaseapp.com",
  projectId: "roles-finance",
  storageBucket: "roles-finance.firebasestorage.app",
  messagingSenderId: "366249881587",
  appId: "1:366249881587:web:82f080c43874fba6fc6c86",
  measurementId: "G-S4M80FJTZ6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const auth = getAuth(app);

const db = initializeFirestore(app, {
  cache: "persistent" 
});

export { auth, db };
