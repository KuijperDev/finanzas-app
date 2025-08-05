import { saveAccounts, loadAccounts } from './storage.js';
import { getTransactions } from './transactions.js'; // ⬅️ Asegúrate de tener esta línea arriba


const accountsContainer = document.getElementById('accounts-list');
const accountForm = document.getElementById('add-account-form');

// === Obtener todas las cuentas ===
export function getAccounts() {
  return loadAccounts();
}

// === Añadir una cuenta nueva ===
export function addAccount(account) {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
  renderAccounts();
}

// === Actualizar una cuenta existente ===
export function updateAccount(updatedAccount) {
  const accounts = getAccounts().map(acc =>
    acc.id === updatedAccount.id ? updatedAccount : acc
  );
  saveAccounts(accounts);
  renderAccounts();
}

// === Eliminar una cuenta ===
export function deleteAccount(id) {
  const confirmDelete = confirm("¿Estás seguro de eliminar esta cuenta?");
  if (!confirmDelete) return;

  const accounts = getAccounts().filter(acc => acc.id !== id);
  saveAccounts(accounts);
  renderAccounts();
}

// === Renderizar todas las cuentas ===
export function renderAccounts() {
  const accounts = getAccounts();
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
        currentBalance < 0 ? 'red' : '#aaa'; // Gris si es 0
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
      deleteAccount(id);
    });
  });
}

function formatCurrency(amount) {
  return typeof amount !== 'number' || isNaN(amount)
    ? '—'
    : amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// === Rellenar formulario con datos de cuenta para editar ===
function fillAccountForm(account) {
  document.getElementById('account-id').value = account.id;
  document.getElementById('account-name').value = account.name;
  document.getElementById('account-balance').value = account.initialBalance;
  accountForm.style.display = 'flex';
}
