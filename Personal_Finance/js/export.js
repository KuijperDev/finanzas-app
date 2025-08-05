import { getTransactions } from './transactions.js';

export function exportToCSV() {
  const transactions = getTransactions();
  if (!transactions.length) return alert('No hay datos para exportar.');

  const headers = ['ID', 'Fecha', 'Importe', 'Cuenta', 'Tipo', 'Modo', 'Categoría', 'Subcategoría', 'Concepto', 'Movimiento'];

  const rows = transactions.map(tx => [
    tx.id,
    formatDate(tx.date),
    formatAmount(tx.amount),
    tx.account || '',
    tx.type || '',
    tx.method || '',
    tx.category || '',
    tx.subcategory || '',
    tx.concept || '',
    tx.notes || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';')) // ← usa ; como separador
    .join('\n');

  // Añadir BOM para que Excel reconozca UTF-8 (acentos correctos)
  const bom = '\uFEFF'; 
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'mis_finanzas.csv';
  link.click();

  URL.revokeObjectURL(url);
}

// Función auxiliar para formato de fecha dd/mm/yyyy
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Formato de número europeo: como decimal, sin miles
function formatAmount(amount) {
  return Number(amount).toFixed(2).replace('.', ',');
}
