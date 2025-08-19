import { addTransaction } from './transactions-sync.js';
import { renderTransactions } from './ui.js';

export function setupForm() {
  const form = document.getElementById('transaction-form');

  if (!form) return; // Protección extra por si no existe

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const transaction = {
      date: document.getElementById('date').value,
      description: document.getElementById('description').value.trim(),
      amount: parseFloat(document.getElementById('amount').value),
      category: document.getElementById('category').value,
      type: document.getElementById('type').value,
    };

    if (
      !transaction.date ||
      isNaN(transaction.amount) ||
      !transaction.category ||
      !transaction.description ||
      !transaction.type
    ) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    await addTransaction(transaction);
    await renderTransactions(); // si es async
    form.reset();
  });
}
