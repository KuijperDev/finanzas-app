// === IMPORTACIONES ===
import { renderTransactions, insertEditableRow, renderEditableTable, updateSortIndicators, setCurrentUserId } from './ui.js';
import { exportToCSV } from './export.js';
import { handleFileImport } from './import.js';
import { initAccounts, addAccount, updateAccount } from './accounts.js';
import { renderCategories, setupCategoryEvents } from './ui-categories.js';
import { getFilters, initFilters } from './filters.js';
import { registrarUsuario, iniciarSesion, cerrarSesion, escucharUsuario } from './auth.js';
import { setupForm } from './form.js';


// === TEMA OSCURO ===
const themeToggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  });
}

// === DETECTAR USUARIO ACTIVO (Firebase) ===
escucharUsuario(user => {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');

  if (user) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    initApp(user);
  } else {
    if (loginContainer) loginContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    initLogin();
  }
});

function initLogin() {
  const usuarioSelectLogin = document.getElementById('usuario-select-login');
  const nuevoUsuarioLogin = document.getElementById('nuevo-usuario-login');
  const btnLogin = document.getElementById('btn-login');
  const btnAgregarLogin = document.getElementById('btn-agregar-usuario-login');

  if (usuarioSelectLogin) usuarioSelectLogin.style.display = 'none';

  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const email = prompt("Introduce tu email:");
      const password = prompt("Introduce tu contraseña:");

      try {
        await iniciarSesion(email, password);
        location.reload();
      } catch (e) {
        alert("Error al iniciar sesión: " + e.message);
      }
    });

    btnAgregarLogin.addEventListener('click', async () => {
      const email = nuevoUsuarioLogin.value.trim();
      const password = prompt("Elige una contraseña");

      try {
        await registrarUsuario(email, password);
        location.reload();
      } catch (e) {
        alert("Error al crear usuario: " + e.message);
      }
    });
  }
}

async function initApp(user) {
  const userId = user.uid; // UID del usuario autenticado
  setupForm(userId);
  setCurrentUserId(userId);
  await renderTransactions(userId);
  const span = document.getElementById('usuario-activo');
  if (span) span.textContent = user.email || 'Usuario';

  const userIcon = document.getElementById('user-icon');
  const userDropdown = document.getElementById('user-dropdown');
  const logoutBtnDropdown = document.getElementById('btn-cerrar-sesion');

  if (userIcon && userDropdown) {
    userIcon.addEventListener('click', () => {
      userDropdown.classList.toggle('hidden');
    });
  }

  if (logoutBtnDropdown) {
    logoutBtnDropdown.addEventListener('click', async () => {
      await cerrarSesion();
      location.reload();
    });
  }

  // Mostrar transacciones, filtros y más
  renderTransactions(userId);
  initFilters(() => renderTransactions(userId), userId);
  updateSortIndicators();

  // Manejo de pestañas
  const transactionsView = document.getElementById('transactions-view');
  const accountsView = document.getElementById('accounts-view');
  const categoriesView = document.getElementById('categories-view');

  const tabTransactions = document.getElementById('tab-transactions');
  const tabAccounts = document.getElementById('tab-accounts');
  const tabCategories = document.getElementById('tab-categories');

  async function activateTab(tabName) {
    transactionsView.style.display = tabName === 'transactions' ? 'block' : 'none';
    accountsView.style.display = tabName === 'accounts' ? 'block' : 'none';
    categoriesView.style.display = tabName === 'categories' ? 'block' : 'none';

    tabTransactions.classList.toggle('active', tabName === 'transactions');
    tabAccounts.classList.toggle('active', tabName === 'accounts');
    tabCategories.classList.toggle('active', tabName === 'categories');

    localStorage.setItem('activeTab', tabName);

    const addBtn = document.getElementById('add-row-btn');
    if (addBtn) addBtn.textContent = '➕';

    if (tabName === 'accounts') await initAccounts(userId);
    if (tabName === 'categories') {
      await renderCategories(userId);
      setupCategoryEvents(userId);
    }
    if (tabName === 'transactions') await initAccounts(userId);
  }

  tabTransactions.addEventListener('click', () => activateTab('transactions'));
  tabAccounts.addEventListener('click', () => activateTab('accounts'));
  tabCategories.addEventListener('click', () => activateTab('categories'));

  const savedTab = localStorage.getItem('activeTab') || 'transactions';
  activateTab(savedTab);

  // Botones principales
  const addBtn = document.getElementById('add-row-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const existingRow = document.getElementById('editable-row');
      if (existingRow) {
        document.getElementById('cancel-row-btn')?.click();
        addBtn.textContent = '➕';
      } else {
        insertEditableRow(userId);
        addBtn.textContent = '❌';
      }
    });
  }

  const editBtn = document.getElementById('edit-table-btn');
  let isEditing = false;
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      isEditing ? renderTransactions(userId) : renderEditableTable(userId);
      editBtn.textContent = isEditing ? '✏️' : '👁';
      isEditing = !isEditing;
    });
  }

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportToCSV(userId));
  }

  const importBtn = document.getElementById('import-xlsx-btn');
  const fileInput = document.getElementById('file-input');
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileImport(file, userId);
        fileInput.value = '';
      }
    });
  }

  const addAccountBtn = document.getElementById('add-account-btn');
  const accountForm = document.getElementById('add-account-form');

  if (addAccountBtn && accountForm) {
    addAccountBtn.addEventListener('click', () => {
      accountForm.reset();
      document.getElementById('account-id').value = '';
      accountForm.style.display = 'flex';
    });
  }

  if (accountForm) {
    accountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('account-id').value || crypto.randomUUID();
      const name = document.getElementById('account-name').value.trim();
      const initialBalance = parseFloat(document.getElementById('account-balance').value);

      if (!name || isNaN(initialBalance)) {
        alert('❌ Por favor completa todos los campos correctamente.');
        return;
      }

      const account = { id, name, initialBalance };

      if (document.getElementById('account-id').value) {
        updateAccount(account, userId);
      } else {
        addAccount(account, userId);
      }

      accountForm.reset();
      accountForm.style.display = 'none';
      document.getElementById('account-id').value = '';
    });
  }

  getFilters();
}