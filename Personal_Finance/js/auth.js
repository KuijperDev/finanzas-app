// js/auth.js
import { auth } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';

export function registrarUsuario(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function iniciarSesion(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      throw new Error('Contraseña incorrecta');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No existe ninguna cuenta con este correo');
    } else {
      throw new Error('Error al iniciar sesión: ' + error.message);
    }
  }
}

export function cerrarSesion() {
  return signOut(auth);
}

export function escucharUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}
