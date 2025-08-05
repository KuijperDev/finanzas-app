// ✅ Todos los imports deben ir arriba
import { getTransactions, addTransaction, getNextId } from "./transactions.js";
import { getAccounts } from "./accounts.js";
import { getCategories } from "./categories.js";
import { saveTransactions } from "./storage.js";
import { getFilters } from "./filters.js";

const tableBody = document.querySelector("#transactions-table tbody");
const balance = document.getElementById("balance");

// === Mostrar todas las transacciones ===
export function renderTransactions() {
  let transactions = getTransactions().slice();

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
export function insertEditableRow() {
  const existingRow = document.getElementById("editable-row");
  if (existingRow) {
    // Simula hacer clic en el botón de cancelar
    const cancelBtn = document.getElementById("cancel-row-btn");
    if (cancelBtn) cancelBtn.click();
    return;
  }

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
        ${getAccounts()
          .map((acc) => `<option value="${acc.name}">${acc.name}</option>`)
          .join("")}
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

  typeSelect.addEventListener("change", () => {
    fillCategoryOptions(typeSelect.value);
    adjustAmountSign();
  });

  categorySelect.addEventListener("change", () => {
    fillSubcategories(typeSelect.value, categorySelect.value);
  });

  amountInput.addEventListener("input", adjustAmountSign);

  fillCategoryOptions(typeSelect.value); // Carga inicial

  function adjustAmountSign() {
    let value = parseFloat(amountInput.value);
    if (isNaN(value)) return;

    if (typeSelect.value === "Gasto" && value > 0) {
      amountInput.value = -value;
    } else if (typeSelect.value === "Ingreso" && value < 0) {
      amountInput.value = Math.abs(value);
    }
  }

  function fillCategoryOptions(type) {
    const { ingresos, gastos } = getCategories();
    const list = type === "Ingreso" ? ingresos : gastos;

    categorySelect.innerHTML = '<option value="">-- Selecciona --</option>';
    list.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });

    subcategorySelect.innerHTML =
      '<option value="">-- Selecciona categoría primero --</option>';
  }

  function fillSubcategories(type, selectedCategoryName) {
    const { ingresos, gastos } = getCategories();
    const list = type === "Ingreso" ? ingresos : gastos;
    const selected = list.find((c) => c.name === selectedCategoryName);

    subcategorySelect.innerHTML = '<option value="">-- Selecciona --</option>';
    if (selected) {
      selected.sub.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subcategorySelect.appendChild(opt);
      });
    }
  }

  document.getElementById("save-row-btn").addEventListener("click", () => {
    const transaction = {
      id: getNextId(),
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

    addTransaction(transaction);
    renderTransactions();
    // Restaurar texto del botón Añadir
    const addBtn = document.getElementById("add-row-btn");
    if (addBtn) addBtn.textContent = "➕ ";
  });

  document.getElementById("cancel-row-btn").addEventListener("click", () => {
    const row = document.getElementById("editable-row");
    const actionRow = document.getElementById("editable-row-action");
    if (row) row.remove();
    if (actionRow) actionRow.remove();

    // Restaurar texto del botón Añadir
    const addBtn = document.getElementById("add-row-btn");
    if (addBtn) addBtn.textContent = "➕ ";
  });
}

// === Tabla editable ===
export function renderEditableTable() {
  let transactions = getTransactions().slice();

  // Aplicar filtros actuales (opcional si quieres que editen con filtros)
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

  // Ordenar igual que en renderTransactions
  if (currentSortField) {
    transactions.sort((a, b) => {
      let valA = a[currentSortField];
      let valB = b[currentSortField];

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

  transactions.forEach((tx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.id}</td>
      <td><input type="date" value="${tx.date}" data-id="${
      tx.id
    }" data-field="date" /></td>
      <td><input type="number" value="${tx.amount}" data-id="${
      tx.id
    }" data-field="amount" /></td>
      <td>
        <select data-id="${tx.id}" data-field="account">
          ${getAccounts()
            .map(
              (acc) => `
            <option value="${acc.name}" ${
                acc.name === tx.account ? "selected" : ""
              }>
              ${acc.name}
            </option>`
            )
            .join("")}
        </select>
      </td>
      <td>
        <select data-id="${tx.id}" data-field="type">
          <option value="Ingreso" ${
            tx.type === "Ingreso" ? "selected" : ""
          }>Ingreso</option>
          <option value="Gasto" ${
            tx.type === "Gasto" ? "selected" : ""
          }>Gasto</option>
        </select>
      </td>
      <td><input type="text" value="${tx.method}" data-id="${
      tx.id
    }" data-field="method" /></td>
      <td>
        <select data-id="${tx.id}" data-field="category" data-type="${
      tx.type
    }" class="category-select"></select>
      </td>
      <td>
        <select data-id="${
          tx.id
        }" data-field="subcategory" class="subcategory-select"></select>
      </td>
      <td><input type="text" value="${tx.concept}" data-id="${
      tx.id
    }" data-field="concept" /></td>
      <td><input type="text" value="${tx.notes}" data-id="${
      tx.id
    }" data-field="notes" /></td>
      <td>
        <button class="delete-btn" data-id="${
          tx.id
        }" title="Eliminar">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);

    setupCategoryAndSubcategorySelect(tx);

    // ✅ Actualizar categorías y subcategorías al cambiar el tipo
    tableBody
      .querySelectorAll('select[data-field="type"]')
      .forEach((typeSelect) => {
        typeSelect.addEventListener("change", () => {
          const id = Number(typeSelect.dataset.id);
          const newType = typeSelect.value;

          const tx = getTransactions().find((t) => t.id === id);
          if (!tx) return;

          tx.type = newType;

          // Forzar actualización del signo del importe
          const amountInput = tableBody.querySelector(
            `input[data-id="${id}"][data-field="amount"]`
          );
          if (amountInput) {
            let value = parseFloat(amountInput.value);
            if (!isNaN(value)) {
              if (newType === "Gasto" && value > 0)
                amountInput.value = -Math.abs(value);
              if (newType === "Ingreso" && value < 0)
                amountInput.value = Math.abs(value);
            }
          }

          // Volver a montar categorías y subcategorías
          const categorySelect = tableBody.querySelector(
            `select[data-id="${id}"][data-field="category"]`
          );
          const subcategorySelect = tableBody.querySelector(
            `select[data-id="${id}"][data-field="subcategory"]`
          );
          const { ingresos, gastos } = getCategories();
          const source = newType === "Ingreso" ? ingresos : gastos;

          // Rellenar categorías
          categorySelect.innerHTML = '<option value="">--</option>';
          source.forEach((cat) => {
            const option = document.createElement("option");
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
          });

          // Limpiar subcategorías
          subcategorySelect.innerHTML = '<option value="">--</option>';

          // Guardar cambios
          autoSave(id, "type", newType);
          autoSave(id, "category", "");
          autoSave(id, "subcategory", "");
        });
      });
  });

  // Escuchar clic en botones de eliminar
  tableBody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const confirmed = confirm(
        `¿Seguro que deseas eliminar el registro con ID ${id}?`
      );
      if (!confirmed) return;

      const txs = getTransactions().filter((tx) => tx.id !== id);
      saveTransactions(txs);
      renderEditableTable();
      renderTransactions();
    });
  });

  attachAutoSaveListeners();
}

function setupCategoryAndSubcategorySelect(tx) {
  const categorySelect = tableBody.querySelector(
    `select[data-id="${tx.id}"][data-field="category"]`
  );
  const subcategorySelect = tableBody.querySelector(
    `select[data-id="${tx.id}"][data-field="subcategory"]`
  );
  const { ingresos, gastos } = getCategories();
  const list = tx.type === "Ingreso" ? ingresos : gastos;

  // Categorías
  categorySelect.innerHTML = '<option value="">--</option>';
  list.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.name;
    option.textContent = cat.name;
    if (tx.category === cat.name) option.selected = true;
    categorySelect.appendChild(option);
  });

  // Subcategorías
  const selectedCat = list.find((cat) => cat.name === tx.category);
  subcategorySelect.innerHTML = '<option value="">--</option>';
  if (selectedCat) {
    selectedCat.sub.forEach((sub) => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      if (tx.subcategory === sub) option.selected = true;
      subcategorySelect.appendChild(option);
    });
  }

  // Cambio de categoría → actualizar subcategorías
  categorySelect.addEventListener("change", () => {
    const newCat = categorySelect.value;
    const selected = list.find((cat) => cat.name === newCat);

    subcategorySelect.innerHTML = '<option value="">--</option>';
    if (selected) {
      selected.sub.forEach((sub) => {
        const option = document.createElement("option");
        option.value = sub;
        option.textContent = sub;
        subcategorySelect.appendChild(option);
      });
    }

    autoSave(tx.id, "category", newCat);
    autoSave(tx.id, "subcategory", "");
  });

  subcategorySelect.addEventListener("change", () => {
    autoSave(tx.id, "subcategory", subcategorySelect.value);
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
  const transactions = getTransactions();
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
  saveTransactions(transactions);
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

      renderTransactions(); // Vuelve a renderizar ordenado
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

    renderTransactions();
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
