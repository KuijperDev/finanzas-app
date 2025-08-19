import {
  loadTransactions,
  saveTransaction,
  deleteTransaction
} from './storage.js';

let transactions = [];

// Cargar todas las transacciones del usuario actual
export async function initTransactions(userId) {
  transactions = await loadTransactions(userId);
}

// Obtener todas las transacciones en memoria
export function getTransactions() {
  return transactions;
}

// Generar ID incremental numérico
function getNextTransactionId(userId) {
  if (!transactions.length) return 1;
  return Math.max(...transactions.map(tx => Number(tx.id) || 0)) + 1;
}

// Añadir una nueva transacción
export async function addTransaction(transaction, userId) {
  const id = getNextTransactionId(userId);
  const tx = { ...transaction, id };
  await saveTransaction(tx, String(id), userId);
  transactions.push(tx);
}

// Eliminar transacción
export async function removeTransaction(id, userId) {
  await deleteTransaction(id, userId);
  transactions = transactions.filter(tx => tx.id !== id);
}

// Actualizar una transacción existente
export async function updateTransaction(updatedTx, userId) {
  const idStr = String(updatedTx.id);
  await saveTransaction(updatedTx, idStr, userId);

  // Actualizar en memoria
  const index = transactions.findIndex(tx => tx.id === updatedTx.id);
  if (index !== -1) {
    transactions[index] = updatedTx;
  }
}