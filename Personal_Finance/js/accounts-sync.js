import db from './db-local.js';
import { saveAccount as remoteSaveAccount, deleteAccount as remoteDeleteAccount, loadAccounts as remoteLoadAccounts } from './storage.js';

// Añadir cuenta local + sync
export async function addAccount(account, userId) {
  await db.cuentas.put({ ...account, syncStatus: 'pending', userId });
  try {
    await remoteSaveAccount(account, account.id, userId);
    await db.cuentas.where('id').equals(account.id).modify({ syncStatus: 'synced' });
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Actualizar cuenta local + sync
export async function updateAccount(account, userId) {
  await db.cuentas.put({ ...account, syncStatus: 'pending', userId });
  try {
    await remoteSaveAccount(account, account.id, userId);
    await db.cuentas.where('id').equals(account.id).modify({ syncStatus: 'synced' });
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Eliminar cuenta local + sync
export async function removeAccount(id, userId) {
  await db.cuentas.where('id').equals(id).modify({ syncStatus: 'pending_delete', userId });
  try {
    await remoteDeleteAccount(id, userId);
    await db.cuentas.where('id').equals(id).delete();
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

// Obtener cuentas (local primero, si hay datos)
export async function getAccounts(userId) {
  const localAccounts = await db.cuentas.where('userId').equals(userId).toArray();
  if (localAccounts.length > 0) return localAccounts.filter(acc => acc.syncStatus !== 'pending_delete');
  try {
    const remoteAccounts = await remoteLoadAccounts(userId);
    await db.cuentas.where('userId').equals(userId).delete();
    for (const acc of remoteAccounts) {
      await db.cuentas.put({ ...acc, syncStatus: 'synced', userId });
    }
    return remoteAccounts;
  } catch (e) {
    return localAccounts.filter(acc => acc.syncStatus !== 'pending_delete');
  }
}

// Sincronizar pendientes
export async function syncPendingAccounts(userId) {
  const pendings = await db.cuentas.where('syncStatus').anyOf('pending', 'pending_delete').toArray();
  for (const acc of pendings) {
    try {
      if (acc.syncStatus === 'pending') {
        await remoteSaveAccount(acc, acc.id, userId);
        await db.cuentas.where('id').equals(acc.id).modify({ syncStatus: 'synced' });
      } else if (acc.syncStatus === 'pending_delete') {
        await remoteDeleteAccount(acc.id, userId);
        await db.cuentas.where('id').equals(acc.id).delete();
      }
    } catch (e) {
      if (!e.message.includes('Quota exceeded')) throw e;
    }
  }
}