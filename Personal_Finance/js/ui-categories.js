import { getCategories, addCategory, addSubcategory, deleteCategory, deleteSubcategory } from './categories.js';

export async function renderCategories(userId) {
  const { ingresos, gastos } = await getCategories(userId);
  renderCategorySection('categorias-ingresos', ingresos, 'ingresos', userId);
  renderCategorySection('categorias-gastos', gastos, 'gastos', userId);
}

function renderCategorySection(containerId, list, type, userId) {
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
    addSubBtn.addEventListener('click', async () => {
      const sub = prompt(`Nombre del subgrupo para "${cat.name}":`);
      if (sub) {
        await addSubcategory(type, cat.name, sub, userId);
        await renderCategories(userId);
      }
    });

    const deleteCatBtn = document.createElement('button');
    deleteCatBtn.textContent = '🗑️';
    deleteCatBtn.style.marginLeft = '10px';
    deleteCatBtn.style.cursor = 'pointer';
    deleteCatBtn.style.background = 'transparent';
    deleteCatBtn.style.border = 'none';
    deleteCatBtn.style.color = 'red';
    deleteCatBtn.addEventListener('click', async () => {
      if (confirm(`¿Eliminar la categoría "${cat.name}" y todos sus subgrupos?`)) {
        await deleteCategory(type, cat.name, userId);
        await renderCategories(userId);
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

      delBtn.addEventListener('click', async () => {
        if (confirm(`¿Eliminar el subgrupo "${sub}" de "${cat.name}"?`)) {
          await deleteSubcategory(type, cat.name, sub, userId);
          await renderCategories(userId);
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
let categoryEventsSetup = false;
export function setupCategoryEvents(userId) {
  // Delegación para botón ➕ de nueva categoría
  if (categoryEventsSetup) return;
  categoryEventsSetup = true;
  document.body.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('add-category-btn')) {
      const tipo = target.dataset.type; // 'gasto' o 'ingreso'
      const nombre = prompt(`Nombre de la nueva categoría de ${tipo}:`);
      if (nombre) {
        await addCategory(tipo === 'gasto' ? 'gastos' : 'ingresos', nombre, userId);
        await renderCategories(userId);
      }
    }
  });
}