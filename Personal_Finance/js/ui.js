// ✅ Todos los imports deben ir arriba

import { addTransaction, updateTransaction, removeTransaction, getTransactions, syncPendingTransactions } from './transactions-sync.js';
import { getAccounts } from "./accounts-sync.js";
import { getCategories } from "./categories-sync.js";
import { saveTransaction } from "./storage.js";
import { getFilters } from "./filters.js";
//import { deleteTransaction } from "./storage.js";
const tableBody = document.querySelector("#transactions-table tbody");
const balance = document.getElementById("balance");

let currentUserId = null;

// Establecer el userId desde main.js
export function setCurrentUserId(uid) {
  currentUserId = uid;
}

// === Mostrar todas las transacciones ===
export async function renderTransactions(userId) {
  //await initTransactions(userId);
  let transactions = await getTransactions(userId);
  transactions = transactions.slice();

  // Aplicar filtros
  const filters = getFilters();
  transactions = transactions.filter((tx) => {
    if (filters.account && tx.account !== filters.account) return false;
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.category && tx.category !== filters.category) return false;
    if (filters.subcategory && tx.subcategory !== filters.subcategory)
      return false;
    if (filters.concept && !tx.concept.toLowerCase().includes(filters.concept))
      return false;
    const txDate = parseDate(tx.date);
    if (filters.from && txDate < parseDate(filters.from)) return false;
    if (filters.to && txDate > parseDate(filters.to)) return false;

    return true;
  });

  if (currentSortField) {
    transactions.sort((a, b) => {
      let valA = a[currentSortField];
      let valB = b[currentSortField];

      // Comparar numéricos o fechas
      if (currentSortField === "amount") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (currentSortField === "date") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (currentSortField === "id") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = valA?.toString().toLowerCase() || "";
        valB = valB?.toString().toLowerCase() || "";
      }

      if (valA < valB) return currentSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return currentSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  tableBody.innerHTML = "";
  let total = 0;

  transactions.forEach((tx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.id}</td>
      <td>${tx.date}</td>
      <td style="color: ${tx.amount < 0 ? "red" : "green"}">${formatCurrency(
      tx.amount
    )}</td>
      <td>${tx.account}</td>
      <td>${tx.type}</td>
      <td>${tx.method}</td>
      <td>${tx.category}</td>
      <td>${tx.subcategory}</td>
      <td>${tx.concept}</td>
      <td>${tx.notes}</td>
    `;
    tableBody.appendChild(row);
    total += tx.amount;
  });

  balance.textContent = formatCurrency(total);
}

function formatCurrency(amount) {
  return typeof amount !== "number" || isNaN(amount)
    ? "—"
    : amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// === Insertar nueva fila editable ===
export async function insertEditableRow(userId) {
 
  const existingRow = document.getElementById("editable-row");
  if (existingRow) {
    const cancelBtn = document.getElementById("cancel-row-btn");
    if (cancelBtn) cancelBtn.click();
    return;
  }
  const accounts = await getAccounts(userId);
  const { ingresos, gastos } = await getCategories(userId);
  const row = document.createElement("tr");
  row.id = "editable-row";
  row.style.backgroundColor = "yellow";

  row.innerHTML = `
    <td>—</td>
    <td><input type="date" id="edit-date" /></td>
    <td>
      <div class="input-euro-wrapper">
        <input type="number" id="edit-amount" />
        <span>€</span>
      </div>
    </td>
    <td>
      <select id="edit-account">
        ${accounts && accounts.length
        ? accounts.map(acc => `<option value="${acc.name}">${acc.name}</option>`).join("")
        : '<option value="">-- Sin cuentas --</option>'}
      </select>
    </td>
    <td>
      <select id="edit-type">
        <option value="Ingreso">Ingreso</option>
        <option value="Gasto">Gasto</option>
      </select>
    </td>
    <td><input type="text" id="edit-method" /></td>
    <td><select id="edit-category"><option value="">-- Selecciona --</option></select></td>
    <td><select id="edit-subcategory"><option value="">-- Selecciona --</option></select></td>
    <td><input type="text" id="edit-concept" /></td>
    <td><input type="text" id="edit-notes" /></td>
  `;

  const actionRow = document.createElement("tr");
  actionRow.id = "editable-row-action";
  actionRow.innerHTML = `
    <td colspan="10" style="text-align: right; background-color: #3a3a1e;">
      <button id="save-row-btn" style="margin-right: 10px;">✔ Guardar</button>
      <button id="cancel-row-btn">❌ Cancelar</button>
    </td>
  `;

  tableBody.insertBefore(actionRow, tableBody.firstChild);
  tableBody.insertBefore(row, actionRow);

  const typeSelect = document.getElementById("edit-type");
  const categorySelect = document.getElementById("edit-category");
  const subcategorySelect = document.getElementById("edit-subcategory");
  const amountInput = document.getElementById("edit-amount");

  typeSelect.addEventListener("change", async () => {
    await fillCategoryOptions(typeSelect.value, userId);
    adjustAmountSign();
  });

  categorySelect.addEventListener("change", async () => {
    await fillSubcategories(typeSelect.value, categorySelect.value, userId);
  });

  amountInput.addEventListener("input", adjustAmountSign);

  await fillCategoryOptions(typeSelect.value, userId); // Carga inicial

  function adjustAmountSign() {
    let value = parseFloat(amountInput.value);
    if (isNaN(value)) return;

    if (typeSelect.value === "Gasto" && value > 0) {
      amountInput.value = -value;
    } else if (typeSelect.value === "Ingreso" && value < 0) {
      amountInput.value = Math.abs(value);
    }
  }

  async function fillCategoryOptions(type, userId) {
    const categories = await getCategories(userId);
    const ingresos = categories.ingresos || [];
    const gastos = categories.gastos || [];
    const list = type === "Ingreso" ? ingresos : gastos;

    categorySelect.innerHTML = '<option value="">-- Selecciona --</option>';
    list.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });

    subcategorySelect.innerHTML = '<option value="">-- Selecciona categoría primero --</option>';
  }

  async function fillSubcategories(type, selectedCategoryName, userId) {
    const categories = await getCategories(userId);
    const ingresos = categories.ingresos || [];
    const gastos = categories.gastos || [];
    const list = type === "Ingreso" ? ingresos : gastos;
    const selected = list.find((c) => c.name === selectedCategoryName);

    subcategorySelect.innerHTML = '<option value="">-- Selecciona --</option>';
    if (selected && Array.isArray(selected.sub)) {
      selected.sub.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subcategorySelect.appendChild(opt);
      });
    }
  }

  document.getElementById("save-row-btn").addEventListener("click", async () => {
    const transaction = {
      //id: crypto.randomUUID(),
      date: new Date(document.getElementById("edit-date").value)
        .toISOString()
        .split("T")[0],
      amount: parseFloat(amountInput.value),
      account: document.getElementById("edit-account").value.trim(),
      type: typeSelect.value,
      method: document.getElementById("edit-method").value.trim(),
      category: categorySelect.value.trim(),
      subcategory: subcategorySelect.value.trim(),
      concept: document.getElementById("edit-concept").value.trim(),
      notes: document.getElementById("edit-notes").value.trim(),
    };

    if (
      !transaction.date ||
      isNaN(transaction.amount) ||
      !transaction.account ||
      !transaction.concept
    ) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    if (transaction.type === "Gasto" && transaction.amount >= 0) {
      alert("En los gastos el importe debe ser negativo.");
      return;
    }

    if (transaction.type === "Ingreso" && transaction.amount <= 0) {
      alert("En los ingresos el importe debe ser positivo.");
      return;
    }

    await addTransaction(transaction, userId);
    await renderTransactions(userId);
    const addBtn = document.getElementById("add-row-btn");
    if (addBtn) addBtn.textContent = "➕ ";
  });

  document.getElementById("cancel-row-btn").addEventListener("click", () => {
    const row = document.getElementById("editable-row");
    const actionRow = document.getElementById("editable-row-action");
    if (row) row.remove();
    if (actionRow) actionRow.remove();

    const addBtn = document.getElementById("add-row-btn");
    if (addBtn) addBtn.textContent = "➕ ";
  });
}



// === Tabla editable ===
export async function renderEditableTable(userId) {
  let transactions = await getTransactions(userId);
  transactions = transactions.slice();
  // ORDENAR TABLA
  if (currentSortField) {
    transactions.sort((a, b) => {
      let valA = a[currentSortField];
      let valB = b[currentSortField];

      // Comparar numéricos o fechas
      if (currentSortField === "amount") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (currentSortField === "date") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (currentSortField === "id") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = valA?.toString().toLowerCase() || "";
        valB = valB?.toString().toLowerCase() || "";
      }

      if (valA < valB) return currentSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return currentSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Obtén las cuentas
  let accounts = await getAccounts(userId);
  if (!Array.isArray(accounts)) accounts = [];

  tableBody.innerHTML = "";

  transactions.forEach((tx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.id}</td>
      <td><input type="date" value="${tx.date}" data-id="${tx.id}" data-field="date" /></td>
      <td><input type="number" value="${tx.amount}" data-id="${tx.id}" data-field="amount" /></td>
      <td>
        <select data-id="${tx.id}" data-field="account">
          ${accounts.map(acc => `
            <option value="${acc.name}" ${acc.name === tx.account ? "selected" : ""}>
              ${acc.name}
            </option>
          `).join("")}
        </select>
      </td>
      <td>
        <select data-id="${tx.id}" data-field="type">
          <option value="Ingreso" ${tx.type === "Ingreso" ? "selected" : ""}>Ingreso</option>
          <option value="Gasto" ${tx.type === "Gasto" ? "selected" : ""}>Gasto</option>
        </select>
      </td>
      <td><input type="text" value="${tx.method || ""}" data-id="${tx.id}" data-field="method" /></td>
      <td>
        <select data-id="${tx.id}" data-field="category" data-type="${tx.type}" class="category-select"></select>
      </td>
      <td>
        <select data-id="${tx.id}" data-field="subcategory" class="subcategory-select"></select>
      </td>
      <td><input type="text" value="${tx.concept || ""}" data-id="${tx.id}" data-field="concept" /></td>
      <td><input type="text" value="${tx.notes || ""}" data-id="${tx.id}" data-field="notes" /></td>
      <td>
        <button class="delete-btn" data-id="${tx.id}" title="Eliminar">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);

    // Rellena los combos al cargar la fila
    setupCategoryAndSubcategorySelect(tx, userId);

    // Listeners para actualizar en Firebase y combos
    row.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', async (event) => {
        const id = Number(event.target.dataset.id);
        const field = event.target.dataset.field;
        const value = event.target.value;

        // Busca la transacción y actualiza el campo editado
        const txEdit = await getTransactions(userId).find(t => t.id === id);
        if (!txEdit) return;

        if (field === "amount") {
          txEdit.amount = value !== "" ? Number(value) : 0;
          event.target.value = txEdit.amount; // Actualiza el input instantáneamente
        } else {
          txEdit[field] = value;
        }

        // Si se cambia el tipo, ajusta el signo y actualiza los combos
        if (field === "type") {
          txEdit.amount = txEdit.type === "Gasto" ? -Math.abs(txEdit.amount) : Math.abs(txEdit.amount);
          txEdit.category = "";      // Limpia la categoría
          txEdit.subcategory = "";   // Limpia la subcategoría
          await setupCategoryAndSubcategorySelect(txEdit, userId); // Actualiza combos según el nuevo tipo
        }

        // Si se cambia la categoría, actualiza subcategorías
        if (field === "category") {
          txEdit.subcategory = ""; // Opcional: resetea subcategoría
          await setupCategoryAndSubcategorySelect(txEdit, userId);
        }

        // Guarda el cambio en Firebase
        await updateTransaction(txEdit, userId);
      });
    });

    // Listener para subcategoría por si usas select dinámico (opcional, si no lo gestionas arriba)
    const subcatSelect = row.querySelector('select[data-field="subcategory"]');
    if (subcatSelect) {
      subcatSelect.addEventListener('change', async (event) => {
        const id = Number(event.target.dataset.id);
        const value = event.target.value;
        const txEdit = await getTransactions(userId).find(t => t.id === id);
        if (!txEdit) return;
        txEdit.subcategory = value;
        await updateTransaction(txEdit, userId);
      });
    }

    // Listener para borrar
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const seguro = window.confirm('¿Seguro que quieres borrar esta transacción? Esta acción no se puede deshacer.');
        if (!seguro) return;
        await removeTransaction(tx.id, userId); // <-- Usa el método del sync, no el de storage.js
        await renderTransactions(userId); // <-- Refresca la tabla

        const transactions = await getTransactions(userId);
        const idx = transactions.findIndex(t => t.id === tx.id);  
        
      });
    }

  });
}

// --- Función para rellenar combos correctamente ---
// IMPORTANTE: debe ser async si llamas a getCategories(userId) que es async
async function setupCategoryAndSubcategorySelect(tx, userId) {
  const categoriesData = await getCategories(userId);
  let source = tx.type === "Ingreso" ? categoriesData.ingresos : categoriesData.gastos;
  if (!Array.isArray(source)) source = [];

  const categorySelect = document.querySelector(`select[data-id="${tx.id}"][data-field="category"]`);
  const subcategorySelect = document.querySelector(`select[data-id="${tx.id}"][data-field="subcategory"]`);

  // Rellena categorías
  categorySelect.innerHTML = '<option value="">--</option>';
  source.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.name;
    option.textContent = cat.name;
    if (cat.name === tx.category) option.selected = true;
    categorySelect.appendChild(option);
  });

  // Rellena subcategorías según la categoría seleccionada
  let selectedCategory = source.find(cat => cat.name === tx.category);
  let subcategories = selectedCategory?.sub ?? []; // usa .sub de tu modelo
  if (!Array.isArray(subcategories)) subcategories = [];

  subcategorySelect.innerHTML = '<option value="">--</option>';
  subcategories.forEach((subcat) => {
    const option = document.createElement("option");
    option.value = subcat;
    option.textContent = subcat;
    if (subcat === tx.subcategory) option.selected = true;
    subcategorySelect.appendChild(option);
  });
}

function attachAutoSaveListeners() {
  const inputs = tableBody.querySelectorAll("input, select");

  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      const id = Number(input.dataset.id);
      const field = input.dataset.field;
      let value;
      if (field === "amount") {
        value = parseFloat(input.value);
      } else if (field === "date") {
        value = new Date(input.value).toISOString().split("T")[0];
      } else {
        value = input.value;
      }

      autoSave(id, field, value);
    });
  });
}

function autoSave(id, field, value) {
  const transactions = getTransactions(userId);
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) return;

  if (field === "type") {
    const currentAmount = transactions[index].amount;
    if (value === "Ingreso" && currentAmount < 0) {
      transactions[index].amount = Math.abs(currentAmount);
    } else if (value === "Gasto" && currentAmount > 0) {
      transactions[index].amount = -Math.abs(currentAmount);
    }
  }

  transactions[index][field] = value;
  saveTransaction(transactions);
  console.log(
    `✅ Guardado automático: id ${id}, campo ${field}, valor ${value}`
  );
}

// Ordenación tabla registros
let currentSortField = "id";
let currentSortDirection = "desc";
const headerLabels = {
  id: "ID",
  date: "Fecha",
  amount: "Importe",
  account: "Cuenta",
  type: "Tipo",
  method: "Método",
  category: "Categoría",
  subcategory: "Subcategoría",
  concept: "Concepto",
  notes: "Notas",
};

document
  .querySelectorAll("#transactions-table thead th[data-sort]")
  .forEach((th) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (currentSortField === field) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortField = field;
        currentSortDirection = "asc";
      }

      renderTransactions(userId); // Vuelve a renderizar ordenado
    });
  });

// Selección de cabeceras con atributo data-field
const headers = document.querySelectorAll("#transactions-table thead th");

headers.forEach((header) => {
  header.addEventListener("click", () => {
    const field = header.dataset.field;

    if (!field) return;

    if (currentSortField === field) {
      // Alternar dirección
      currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
    } else {
      currentSortField = field;
      currentSortDirection = "asc";
    }

    renderTransactions(currentUserId);
    updateSortIndicators();
  });
});

export function updateSortIndicators() {
  headers.forEach((header) => {
    const field = header.dataset.field;
    if (!field) return;

    const label = headerLabels[field] || field;

    if (field === currentSortField) {
      const arrow = currentSortDirection === "asc" ? "↑" : "↓";
      header.textContent = `${label} ${arrow}`;
    } else {
      header.textContent = label;
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return new Date(+year, +month - 1, +day);
}



