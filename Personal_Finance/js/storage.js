import { db, auth } from './firebase-init.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function getUserId(userId) {
  if (userId) return userId;
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");
  return user.uid;
}

function getUserCollection(path, userId) {
  const uid = getUserId(userId);
  return collection(db, 'users', uid, path);
}

// ======================
// TRANSACCIONES
// ======================

export async function loadTransactions(userId) {
  const userRef = collection(db, 'users', userId, 'transactions');
  const snapshot = await getDocs(userRef);
  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,         // ✅ AÑADIMOS el ID de Firebase
    ...doc.data()
  }));
   return transactions;
}

export async function saveTransaction(transaction, id = null, userId) {
  const colRef = getUserCollection('transactions', userId);
  const docRef = id ? doc(colRef, id) : doc(colRef);
  await setDoc(docRef, transaction);
}

export async function deleteTransaction(id, userId) {
  const docRef = doc(db, 'users', userId, 'transactions', String(id));
  await deleteDoc(docRef);
}

// ======================
// CUENTAS
// ======================
export async function loadAccounts(userId) {
  const snapshot = await getDocs(getUserCollection('accounts', userId));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveAccount(account, id = null, userId) {
  const colRef = getUserCollection('accounts', userId);
  const docRef = id ? doc(colRef, id) : doc(colRef);
  await setDoc(docRef, account);
}

export async function deleteAccount(id, userId) {
  const colRef = getUserCollection('accounts', userId);
  const docRef = doc(colRef, id);
  await deleteDoc(docRef);
}
