// storage.js
import { getActiveUser } from './user.js'; // Asegúrate de tener este módulo

function prefijo(claveBase) {
  const user = getActiveUser();
  return `${claveBase}_${user}`;
}

export function saveTransactions(data) {
  localStorage.setItem(prefijo('finanzas-transactions'), JSON.stringify(data));
}

export function loadTransactions() {
  const data = localStorage.getItem(prefijo('finanzas-transactions'));
  return data ? JSON.parse(data) : [];
}

export function saveAccounts(data) {
  localStorage.setItem(prefijo('finanzas-accounts'), JSON.stringify(data));
}

export function loadAccounts() {
  const data = localStorage.getItem(prefijo('finanzas-accounts'));
  return data ? JSON.parse(data) : [];
}



