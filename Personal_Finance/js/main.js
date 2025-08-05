// === IMPORTACIONES ===
import { renderTransactions, insertEditableRow, renderEditableTable, updateSortIndicators } from './ui.js';
import { exportToCSV } from './export.js';
import { handleFileImport } from './import.js';
import { renderAccounts, addAccount, updateAccount } from './accounts.js';
import { renderCategories, setupCategoryEvents } from './ui-categories.js';
import { getFilters, initFilters } from './filters.js';
import { getActiveUser, addUser, deleteUser, setActiveUser, getUsers } from './user.js';

// === TEMA OSCURO ===
const themeToggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  if(themeToggleBtn) themeToggleBtn.textContent = '☀️';
}

if(themeToggleBtn){
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const usuarioActivo = getActiveUser();
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');

  if (usuarioActivo) {
    if(loginContainer) loginContainer.style.display = 'none';
    if(appContainer) appContainer.style.display = 'block';
    initApp();
  } else {
    if(loginContainer) loginContainer.style.display = 'flex';
    if(appContainer) appContainer.style.display = 'none';
    initLogin();
  }
});

function initLogin() {
  const usuarioSelectLogin = document.getElementById('usuario-select-login');
  const nuevoUsuarioLogin = document.getElementById('nuevo-usuario-login');
  const btnLogin = document.getElementById('btn-login');
  const btnAgregarLogin = document.getElementById('btn-agregar-usuario-login');

  // Rellenar select usuarios
  if (usuarioSelectLogin) {
    const usuarios = getUsers();
    usuarioSelectLogin.innerHTML = '';
    usuarios.forEach(user => {
      const option = document.createElement('option');
      option.value = user;
      option.textContent = user;
      usuarioSelectLogin.appendChild(option);
    });
  }

  if(btnLogin){
    btnLogin.addEventListener('click', () => {
      const selectedUser = usuarioSelectLogin.value;
      if (!selectedUser) {
        alert('Selecciona un usuario para iniciar sesión.');
        return;
      }
      setActiveUser(selectedUser);
      location.reload();
    });
  }

  if(btnAgregarLogin){
    btnAgregarLogin.addEventListener('click', () => {
      const username = nuevoUsuarioLogin.value.trim();
      if (!username) {
        alert('Introduce un nombre válido para el nuevo usuario.');
        return;
      }
      const usuarios = getUsers();
      if (usuarios.includes(username)) {
        alert('❌ Ese usuario ya existe.');
        return;
      }
      addUser(username);
      setActiveUser(username);
      location.reload();
    });
  }
}

function initApp() {
  // Mostrar nombre usuario activo
  const span = document.getElementById('usuario-activo');
  if(span) span.textContent = getActiveUser() || 'Sin usuario';

 

  // Botones menú usuario
  const userIcon = document.getElementById('user-icon');
  const userDropdown = document.getElementById('user-dropdown');
  const addUserBtnDropdown = document.getElementById('btn-agregar-usuario');
  const deleteUserBtnDropdown = document.getElementById('btn-eliminar-usuario');
  const logoutBtnDropdown = document.getElementById('btn-cerrar-sesion');

  if (userIcon && userDropdown) {
    userIcon.addEventListener('click', () => {
      userDropdown.classList.toggle('hidden');
    });
  }

 

  if (deleteUserBtnDropdown) {
    deleteUserBtnDropdown.addEventListener('click', () => {
      const user = getActiveUser();
      if (!user) {
        alert('❌ No hay usuario activo.');
        return;
      }
      const confirmDelete = confirm(`¿Eliminar al usuario "${user}" y todos sus datos?`);
      if (confirmDelete) {
        deleteUser(user);
        setActiveUser(null);
        location.reload();
      }
    });
  }

  if (logoutBtnDropdown) {
    logoutBtnDropdown.addEventListener('click', () => {
      setActiveUser(null);
      location.reload();
    });
  }

 

  // Mostrar transacciones, filtros y más
  renderTransactions();
  initFilters(renderTransactions);
  updateSortIndicators();

  // Manejo de pestañas
  const transactionsView = document.getElementById('transactions-view');
  const accountsView = document.getElementById('accounts-view');
  const categoriesView = document.getElementById('categories-view');

  const tabTransactions = document.getElementById('tab-transactions');
  const tabAccounts = document.getElementById('tab-accounts');
  const tabCategories = document.getElementById('tab-categories');

  function activateTab(tabName) {
    transactionsView.style.display = tabName === 'transactions' ? 'block' : 'none';
    accountsView.style.display = tabName === 'accounts' ? 'block' : 'none';
    categoriesView.style.display = tabName === 'categories' ? 'block' : 'none';

    tabTransactions.classList.toggle('active', tabName === 'transactions');
    tabAccounts.classList.toggle('active', tabName === 'accounts');
    tabCategories.classList.toggle('active', tabName === 'categories');

    localStorage.setItem('activeTab', tabName);

    const addBtn = document.getElementById('add-row-btn');
    if (addBtn) addBtn.textContent = '➕';

    if (tabName === 'accounts') renderAccounts();
    if (tabName === 'categories') {
      renderCategories();
      setupCategoryEvents();
    }
  }

  tabTransactions.addEventListener('click', () => activateTab('transactions'));
  tabAccounts.addEventListener('click', () => activateTab('accounts'));
  tabCategories.addEventListener('click', () => activateTab('categories'));

  const savedTab = localStorage.getItem('activeTab') || 'transactions';
  activateTab(savedTab);

  // Botones principales (añadir transacción, editar tabla, exportar, importar...)
  const addBtn = document.getElementById('add-row-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const existingRow = document.getElementById('editable-row');
      if (existingRow) {
        document.getElementById('cancel-row-btn')?.click();
        addBtn.textContent = '➕';
      } else {
        insertEditableRow();
        addBtn.textContent = '❌';
      }
    });
  }

  const editBtn = document.getElementById('edit-table-btn');
  let isEditing = false;
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      isEditing ? renderTransactions() : renderEditableTable();
      editBtn.textContent = isEditing ? '✏️' : '👁';
      isEditing = !isEditing;
    });
  }

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  const importBtn = document.getElementById('import-xlsx-btn');
  const fileInput = document.getElementById('file-input');
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileImport(file);
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
        updateAccount(account);
      } else {
        addAccount(account);
      }

      accountForm.reset();
      accountForm.style.display = 'none';
      document.getElementById('account-id').value = '';
    });
  }

  // Inicializar filtros
  getFilters();
}
