import db from './db-local.js';
import { saveTransaction as remoteSaveTransaction, deleteTransaction as remoteDeleteTransaction, loadTransactions as remoteLoadTransactions } from './storage.js';

// Añadir transacción local + sync
export async function addTransaction(tx, userId) {
  await db.transacciones.put({ ...tx, syncStatus: 'pending', userId });
  try {
    await remoteSaveTransaction(tx, tx.id, userId);
    await db.transacciones.where('id').equals(tx.id).modify({ syncStatus: 'synced' });
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Actualizar transacción local + sync
export async function updateTransaction(tx, userId) {
  await db.transacciones.put({ ...tx, syncStatus: 'pending', userId });
  try {
    await remoteSaveTransaction(tx, tx.id, userId);
    await db.transacciones.where('id').equals(tx.id).modify({ syncStatus: 'synced' });
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Eliminar transacción local + sync
export async function removeTransaction(id, userId) {
  await db.transacciones.where('id').equals(id).modify({ syncStatus: 'pending_delete' });
  try {
    await remoteDeleteTransaction(id, userId);
    await db.transacciones.where('id').equals(id).delete();
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Obtener transacciones (local primero, si hay datos)
export async function getTransactions(userId) {
  const localTxs = await db.transacciones.where('userId').equals(userId).toArray();
  if (localTxs.length > 0) return localTxs.filter(tx => tx.syncStatus !== 'pending_delete');  
  try {
    const remoteTxs = await remoteLoadTransactions(userId);
    await db.transacciones.where('userId').equals(userId).delete();
    for (const tx of remoteTxs) {
      await db.transacciones.put({ ...tx, syncStatus: 'synced', userId });
    }
    return remoteTxs;
  } catch (e) {
    return localTxs.filter(tx => tx.syncStatus !== 'pending_delete');
  }
}

// Sincronizar pendientes
export async function syncPendingTransactions(userId) {
  const pendings = await db.transacciones.where('syncStatus').anyOf('pending', 'pending_delete').toArray();
  for (const tx of pendings) {
    try {
      if (tx.syncStatus === 'pending') {
        await remoteSaveTransaction(tx, tx.id, userId);
        await db.transacciones.where('id').equals(tx.id).modify({ syncStatus: 'synced' });
      } else if (tx.syncStatus === 'pending_delete') {
        await remoteDeleteTransaction(tx.id, userId);
        await db.transacciones.where('id').equals(tx.id).delete();
      }
    } catch (e) {
      if (!e.message.includes('Quota exceeded')) throw e;
    }
  }
}