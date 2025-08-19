import { getAccounts } from './accounts-sync.js';
import { getCategories } from './categories-sync.js';
import { auth } from './firebase-init.js';

export function getFilters() {
  return {
    account: document.getElementById('filter-account')?.value || '',
    type: document.getElementById('filter-type')?.value || '',
    category: document.getElementById('filter-category')?.value || '',
    subcategory: document.getElementById('filter-subcategory')?.value || '',
    concept: document.getElementById('filter-concept')?.value.toLowerCase() || '',
    from: document.getElementById('filter-from')?.value || '',
    to: document.getElementById('filter-to')?.value || ''
  };
}

export async function initFilters(onChangeCallback) {
  const user = auth.currentUser;
  if (!user) {
    alert("Debes iniciar sesión para cargar los filtros.");
    return;
  }

  const userId = user.uid;

  const accountSelect = document.getElementById('filter-account');
  const accounts = await getAccounts(userId);
  if (accountSelect) {
    accounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.name;
      opt.textContent = acc.name;
      accountSelect.appendChild(opt);
    });
  }

  const categorySelect = document.getElementById('filter-category');
  const subcategorySelect = document.getElementById('filter-subcategory');
  const typeSelect = document.getElementById('filter-type');
  const categories = await getCategories(userId);

  function updateCategoryOptions() {
    const type = typeSelect.value;
    const { ingresos, gastos } = categories;
    const list = type === 'Ingreso' ? ingresos : type === 'Gasto' ? gastos : ingresos.concat(gastos);

    categorySelect.innerHTML = '<option value="">Todas las categorías</option>';
    list.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });

    subcategorySelect.innerHTML = '<option value="">Todas las subcategorías</option>';
  }

  function updateSubcategoryOptions() {
    const type = typeSelect.value;
    const cat = categorySelect.value;
    const { ingresos, gastos } = categories;
    const list = type === 'Ingreso' ? ingresos : type === 'Gasto' ? gastos : ingresos.concat(gastos);

    const selected = list.find(c => c.name === cat);
    subcategorySelect.innerHTML = '<option value="">Todas las subcategorías</option>';

    if (selected) {
      selected.sub.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subcategorySelect.appendChild(opt);
      });
    }
  }

  ['filter-account', 'filter-type', 'filter-category', 'filter-subcategory', 'filter-concept', 'filter-from', 'filter-to'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (id === 'filter-type') updateCategoryOptions();
        if (id === 'filter-category') updateSubcategoryOptions();
        onChangeCallback(); // Rerender
      });
    }
  });

  updateCategoryOptions();

  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('filter-account').value = '';
      document.getElementById('filter-type').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-subcategory').value = '';
      document.getElementById('filter-concept').value = '';
      document.getElementById('filter-from').value = '';
      document.getElementById('filter-to').value = '';

      updateCategoryOptions();
      updateSubcategoryOptions();
      onChangeCallback();
    });
  }
}
