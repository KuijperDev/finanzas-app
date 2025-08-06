import {
  loadAccounts,
  saveAccount,
  deleteAccount
} from './storage.js';

import { getTransactions } from './transactions.js';

const accountsContainer = document.getElementById('accounts-list');
const accountForm = document.getElementById('add-account-form');

let accounts = [];

// Inicializar y renderizar cuentas desde Firestore (llama SIEMPRE a esta al entrar en la pestaña cuentas)
export async function initAccounts(userId) {
  accounts = await loadAccounts(userId);
  renderAccounts(userId);
  renderAccountOptionsInForm();
  renderAccountOptionsInForm('filter-account');
}

// Devuelve el array actual de cuentas
export async function getAccounts(userId) {
  await initAccounts(userId);
  return accounts;
}

// Añadir una cuenta nueva (guarda en Firestore y actualiza la lista)
// Si no hay id, genera uno (puedes usar crypto.randomUUID() para evitar colisiones)
export async function addAccount(account, userId) {
  if (!account.id) {
    account.id = crypto.randomUUID(); // Si quieres mantener IDs incrementales, usa generateAccountId()
  }
  await saveAccount(account, account.id, userId);
  accounts.push(account);
  renderAccounts(userId);
  renderAccountOptionsInForm(userId);
  
}

// Actualiza una cuenta existente
export async function updateAccount(updatedAccount, userId) {
  await saveAccount(updatedAccount, updatedAccount.id, userId);
  accounts = accounts.map(acc =>
    acc.id === updatedAccount.id ? updatedAccount : acc
  );
  renderAccounts(userId);
  renderAccountOptionsInForm(userId); 
}

// Elimina una cuenta
export async function removeAccount(id, userId) {
  const confirmDelete = confirm("¿Estás seguro de eliminar esta cuenta?");
  if (!confirmDelete) return;

  await deleteAccount(id, userId);
  accounts = accounts.filter(acc => acc.id !== id);
  renderAccounts(userId);
  renderAccountOptionsInForm(userId); 
}

// Renderiza la lista de cuentas en la UI
export function renderAccounts(userId) {
  const transactions = getTransactions();
  accountsContainer.innerHTML = '';

  if (!accounts.length) {
    accountsContainer.innerHTML = '<p>No hay cuentas añadidas aún.</p>';
    return;
  }

  accounts.forEach(account => {
    const relatedTxs = transactions.filter(tx => tx.account === account.name);
    const totalMovements = relatedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const currentBalance = account.initialBalance + totalMovements;

    const card = document.createElement('div');
    card.className = 'account-card';
    const balanceColor =
      currentBalance > 0 ? 'green' :
      currentBalance < 0 ? 'red' : '#aaa';
    card.innerHTML = `
      <p><strong>${account.name}</strong></p>
      <p><strong style="color: ${balanceColor};">${formatCurrency(currentBalance)}</strong></p>
      <div style="margin-top: 10px;">
        <button class="edit-account-btn" data-id="${account.id}">✏️</button>
        <button class="delete-account-btn" data-id="${account.id}">🗑️</button>
      </div>
    `;

    accountsContainer.appendChild(card);
  });

  document.querySelectorAll('.edit-account-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const account = getAccounts().find(acc => acc.id === id);
      if (account) {
        fillAccountForm(account);
      }
    });
  });

  document.querySelectorAll('.delete-account-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      removeAccount(id, userId);
    });
  });
}

// Formato moneda
function formatCurrency(amount) {
  return typeof amount !== 'number' || isNaN(amount)
    ? '—'
    : amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// Rellena el formulario para editar una cuenta
function fillAccountForm(account) {
  document.getElementById('account-id').value = account.id;
  document.getElementById('account-name').value = account.name;
  document.getElementById('account-balance').value = account.initialBalance;
  accountForm.style.display = 'flex';
}

// (Opcional) Generar ID incremental local
function generateAccountId() {
  const maxId = accounts.reduce((max, acc) => Math.max(max, parseInt(acc.id) || 0), 0);
  return String(maxId + 1);
}

export async function renderAccountOptionsInForm(selectId = 'cuenta', userId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // Forzar carga desde Firestore si userId se pasa explícitamente
  if (userId) {
    accounts = await loadAccounts(userId);
  }

  const selectedValue = select.value;
  select.innerHTML = '';

  if (selectId === 'filter-account') {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas las cuentas';
    select.appendChild(defaultOption);
  }

  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.name;
    option.textContent = account.name;
    select.appendChild(option);
  });

  if ([...select.options].some(opt => opt.value === selectedValue)) {
    select.value = selectedValue;
  }
}


