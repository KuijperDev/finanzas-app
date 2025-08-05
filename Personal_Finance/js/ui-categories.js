import { getCategories, addCategory, addSubcategory, deleteCategory, deleteSubcategory } from './categories.js';

export function renderCategories() {
  const { ingresos, gastos } = getCategories();
  renderCategorySection('categorias-ingresos', ingresos, 'ingresos');
  renderCategorySection('categorias-gastos', gastos, 'gastos');
}

function renderCategorySection(containerId, list, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  list.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.classList.add('category');

    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.alignItems = 'center';

    const title = document.createElement('strong');
    title.textContent = cat.name;

    const actions = document.createElement('div');

    const addSubBtn = document.createElement('button');
    addSubBtn.textContent = '➕';
    addSubBtn.classList.add('add-subcategory-btn');
    addSubBtn.addEventListener('click', () => {
      const sub = prompt(`Nombre del subgrupo para "${cat.name}":`);
      if (sub) {
        addSubcategory(type, cat.name, sub);
        renderCategories();
      }
    });

    const deleteCatBtn = document.createElement('button');
    deleteCatBtn.textContent = '🗑️';
    deleteCatBtn.style.marginLeft = '10px';
    deleteCatBtn.style.cursor = 'pointer';
    deleteCatBtn.style.background = 'transparent';
    deleteCatBtn.style.border = 'none';
    deleteCatBtn.style.color = 'red';
    deleteCatBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar la categoría "${cat.name}" y todos sus subgrupos?`)) {
        deleteCategory(type, cat.name);
        renderCategories();
      }
    });

    actions.appendChild(addSubBtn);
    actions.appendChild(deleteCatBtn);

    titleRow.appendChild(title);
    titleRow.appendChild(actions);
    catDiv.appendChild(titleRow);

    const subList = document.createElement('ul');
    cat.sub.forEach(sub => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = sub;

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.style.cursor = 'pointer';
      delBtn.style.background = 'transparent';
      delBtn.style.border = 'none';
      delBtn.style.color = 'red';

      delBtn.addEventListener('click', () => {
        if (confirm(`¿Eliminar el subgrupo "${sub}" de "${cat.name}"?`)) {
          deleteSubcategory(type, cat.name, sub);
          renderCategories();
        }
      });

      li.appendChild(nameSpan);
      li.appendChild(delBtn);
      subList.appendChild(li);
    });

    catDiv.appendChild(subList);
    container.appendChild(catDiv);
  });
}


export function setupCategoryEvents() {
  // Añadir categorías
  document.querySelectorAll('.add-category-btn').forEach(button => {
    button.addEventListener('click', () => {
      const tipo = button.dataset.type; // 'gasto' o 'ingreso'
      const nombre = prompt(`Nombre de la nueva categoría de ${tipo}:`);
      if (nombre) {
        addCategory(tipo === 'gasto' ? 'gastos' : 'ingresos', nombre);
        renderCategories();
      }
    });
  });

  // Añadir subcategorías
  document.querySelectorAll('.add-subcategory-btn').forEach(button => {
    button.addEventListener('click', () => {
      const tipo = button.dataset.type; // 'gasto' o 'ingreso'
      const padre = prompt(`¿A qué categoría de ${tipo} quieres añadir un subgrupo?`);
      const sub = prompt(`Nombre del subgrupo:`);
      if (padre && sub) {
        addSubcategory(tipo === 'gasto' ? 'gastos' : 'ingresos', padre, sub);
        renderCategories();
      }
    });
  });
}

