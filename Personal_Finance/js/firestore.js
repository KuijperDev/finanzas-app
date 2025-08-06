// firestore.js
import { db } from './firebase-init.js';
import { collection, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function importTransactionsToFirestore(transactions, userId) {
  if (!userId) throw new Error("No se ha especificado el userId");

  const batch = writeBatch(db);

  transactions.forEach(tx => {
    const txRef = doc(collection(db, 'users', userId, 'transactions'), String(tx.id));
    batch.set(txRef, tx);
  });

  await batch.commit();
}
