// js/auth.js
import { auth } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export function registrarUsuario(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function iniciarSesion(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function cerrarSesion() {
  return signOut(auth);
}

export function escucharUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}
