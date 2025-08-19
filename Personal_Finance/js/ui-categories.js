import { getCategories } from './categories-sync.js';

export async function renderCategories(userId) {
  const data = await getCategories(userId);
  const gastosCont = document.getElementById('categorias-gastos');
  const ingresosCont = document.getElementById('categorias-ingresos');
  gastosCont.innerHTML = '';
  ingresosCont.innerHTML = '';

  // Render gastos
  data.gastos.forEach(cat => {
    const catEl = document.createElement('div');
    catEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span><strong>${cat.name}</strong></span>
        <div>
          <button class="add-subcategory-btn" data-type="gasto" data-parent="${cat.name}">➕ Subcat.</button>
          <button class="delete-category-btn" data-type="gasto" data-name="${cat.name}">🗑️</button>
        </div>
      </div>
      <ul>
        ${(cat.sub||[]).map(sub => `
          <li style="margin-left:1.2em;">
            ${sub}
            <button class="delete-subcategory-btn" data-type="gasto" data-parent="${cat.name}" data-name="${sub}">🗑️</button>
          </li>
        `).join('')}
      </ul>
    `;
    gastosCont.appendChild(catEl);
  });

  // Render ingresos
  data.ingresos.forEach(cat => {
    const catEl = document.createElement('div');
    catEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span><strong>${cat.name}</strong></span>
        <div>
          <button class="add-subcategory-btn" data-type="ingreso" data-parent="${cat.name}">➕ Subcat.</button>
          <button class="delete-category-btn" data-type="ingreso" data-name="${cat.name}">🗑️</button>
        </div>
      </div>
      <ul>
        ${(cat.sub||[]).map(sub => `
          <li style="margin-left:1.2em;">
            ${sub}
            <button class="delete-subcategory-btn" data-type="ingreso" data-parent="${cat.name}" data-name="${sub}">🗑️</button>
          </li>
        `).join('')}
      </ul>
    `;
    ingresosCont.appendChild(catEl);
  });
}

// Esta función ya NO se usa, pero si la necesitas como plantilla,
// aquí está adaptada para modales visuales (sin prompt/confirm):
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
    addSubBtn.setAttribute('data-type', type);
    addSubBtn.setAttribute('data-parent', cat.name);

    const deleteCatBtn = document.createElement('button');
    deleteCatBtn.textContent = '🗑️';
    deleteCatBtn.classList.add('delete-category-btn');
    deleteCatBtn.setAttribute('data-type', type);
    deleteCatBtn.setAttribute('data-name', cat.name);

    actions.appendChild(addSubBtn);
    actions.appendChild(deleteCatBtn);

    titleRow.appendChild(title);
    titleRow.appendChild(actions);
    catDiv.appendChild(titleRow);

    const subList = document.createElement('ul');
    (cat.sub || []).forEach(sub => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = sub;

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.classList.add('delete-subcategory-btn');
      delBtn.setAttribute('data-type', type);
      delBtn.setAttribute('data-parent', cat.name);
      delBtn.setAttribute('data-name', sub);

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
      // Solo dispara el modal visual, NO prompt ni confirm
      // El modal se gestiona en main.js
      // Si quieres refrescar la UI al crear, ya lo haces tras submit del modal
      await renderCategories(userId);
    }
  });
}