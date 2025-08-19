// === IMPORTACIONES ===
import { renderTransactions, insertEditableRow, renderEditableTable, updateSortIndicators, setCurrentUserId } from './ui.js';
import { exportToCSV } from './export.js';
import { handleFileImport } from './import.js';
import { initAccounts } from './accounts.js';
import { renderCategories, setupCategoryEvents } from './ui-categories.js';
import { getFilters, initFilters } from './filters.js';
import { registrarUsuario, iniciarSesion, cerrarSesion, escucharUsuario } from './auth.js';
import { setupForm } from './form.js';

import { addAccount, updateAccount, removeAccount, getAccounts, syncPendingAccounts } from './accounts-sync.js';
import { addCategory, addSubcategory, deleteCategory, deleteSubcategory, getCategories, syncPendingCategories } from './categories-sync.js';

let currentUserId = null; // 👈 DECLARA GLOBAL

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
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      loginError.style.display = 'none';
      loginError.textContent = '';

      try {
        await iniciarSesion(email, password);
        location.reload();
      } catch (e) {
        loginError.textContent = "Error al iniciar sesión: " + e.message;
        loginError.style.display = 'block';
      }
    });
  }
}

async function initApp(user) {
  const userId = user.uid; // UID del usuario autenticado
  currentUserId = userId;  // 👈 ASIGNA GLOBAL

  // Al iniciar, intenta sincronizar pendientes:
  await syncPendingCategories(user.uid);

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

  // MODAL CATEGORÍA
  document.querySelectorAll('.add-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('input-categoria-tipo').value = btn.dataset.type;
      document.getElementById('form-categoria').reset();
      document.getElementById('categoria-error').style.display = 'none';
      document.getElementById('modal-categoria').classList.remove('hidden');
    });
  });

  document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('input-categoria-nombre').value.trim();
    const tipo = document.getElementById('input-categoria-tipo').value;
    const errorBox = document.getElementById('categoria-error');
    errorBox.style.display = 'none';
    if (!nombre) {
      errorBox.textContent = "El nombre es obligatorio.";
      errorBox.style.display = 'block';
      return;
    }
    try {     
      await addCategory(tipo, nombre, currentUserId);
      document.getElementById('modal-categoria').classList.add('hidden');
      await renderCategories(currentUserId);
    } catch (err) {
      errorBox.textContent = "Error: " + err.message;
      errorBox.style.display = 'block';
    }
  });

  document.getElementById('btn-categoria-cancelar').addEventListener('click', () => {
    document.getElementById('modal-categoria').classList.add('hidden');
  });

  // MODAL SUBCATEGORÍA
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-subcategory-btn')) {
      document.getElementById('input-subcategoria-tipo').value = e.target.dataset.type;
      document.getElementById('input-subcategoria-padre').value = e.target.dataset.parent;
      document.getElementById('form-subcategoria').reset();
      document.getElementById('subcategoria-error').style.display = 'none';
      document.getElementById('modal-subcategoria').classList.remove('hidden');
    }
  });

  document.getElementById('form-subcategoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('input-subcategoria-nombre').value.trim();
    const tipo = document.getElementById('input-subcategoria-tipo').value;
    const padre = document.getElementById('input-subcategoria-padre').value;
    const errorBox = document.getElementById('subcategoria-error');
    errorBox.style.display = 'none';
    if (!nombre) {
      errorBox.textContent = "El nombre es obligatorio.";
      errorBox.style.display = 'block';
      return;
    }
    try {
      await addSubcategory(tipo, padre, nombre, currentUserId);
      document.getElementById('modal-subcategoria').classList.add('hidden');
      await renderCategories(currentUserId);
    } catch (err) {
      errorBox.textContent = "Error: " + err.message;
      errorBox.style.display = 'block';
    }
  });

  document.getElementById('btn-subcategoria-cancelar').addEventListener('click', () => {
    document.getElementById('modal-subcategoria').classList.add('hidden');
  });

  // MODAL ELIMINAR (categoría o subcategoría)
  let eliminarTipo = null, eliminarNombre = null, eliminarPadre = null;
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-category-btn')) {
      eliminarTipo = e.target.dataset.type;
      eliminarNombre = e.target.dataset.name;
      eliminarPadre = null;
      document.getElementById('modal-eliminar-title').textContent = '¿Eliminar categoría?';
      document.getElementById('modal-eliminar-text').textContent = `Se eliminará la categoría "${eliminarNombre}" y sus subcategorías.`;
      document.getElementById('modal-eliminar').classList.remove('hidden');
    }
    if (e.target.classList.contains('delete-subcategory-btn')) {
      eliminarTipo = e.target.dataset.type;
      eliminarPadre = e.target.dataset.parent;
      eliminarNombre = e.target.dataset.name;
      document.getElementById('modal-eliminar-title').textContent = '¿Eliminar subcategoría?';
      document.getElementById('modal-eliminar-text').textContent = `Se eliminará la subcategoría "${eliminarNombre}" de "${eliminarPadre}".`;
      document.getElementById('modal-eliminar').classList.remove('hidden');
    }
  });
  document.getElementById('btn-eliminar-confirmar').addEventListener('click', async () => {
    if (eliminarTipo && eliminarNombre && !eliminarPadre) {
      await deleteCategory(eliminarTipo, eliminarNombre, currentUserId);
    } else if (eliminarTipo && eliminarPadre && eliminarNombre) {
      await deleteSubcategory(eliminarTipo, eliminarPadre, eliminarNombre, currentUserId);
    }
    document.getElementById('modal-eliminar').classList.add('hidden');
    await renderCategories(currentUserId);
  });
  document.getElementById('btn-eliminar-cancelar').addEventListener('click', () => {
    document.getElementById('modal-eliminar').classList.add('hidden');
  });

}