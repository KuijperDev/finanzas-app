// firebase-storage.js
import { db, auth } from './firebase-init.js';
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  return user.uid;
}

export async function getUserCollection(path) {
  const uid = getUserId();
  const colRef = collection(db, 'users', uid, path);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveToUserCollection(path, data, id = null) {
  const uid = getUserId();
  const colRef = collection(db, 'users', uid, path);
  if (id) {
    const docRef = doc(colRef, id);
    await setDoc(docRef, data);
  } else {
    await addDoc(colRef, data);
  }
}

export async function deleteFromUserCollection(path, id) {
  const uid = getUserId();
  const docRef = doc(db, 'users', uid, path, id);
  await deleteDoc(docRef);
}
