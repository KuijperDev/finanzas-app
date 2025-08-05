import { addTransaction } from './transactions.js';
import { renderTransactions } from './ui.js';

export function setupForm() {
  const form = document.getElementById('transaction-form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const transaction = {
      id: Date.now(),
      date: document.getElementById('edit-date').value,
      amount: parseFloat(document.getElementById('edit-amount').value),
      account: document.getElementById('edit-account').value.trim(),
      type: document.getElementById('edit-type').value,
      method: document.getElementById('edit-method').value.trim(),
      category: document.getElementById('edit-category').value.trim(),
      subcategory: document.getElementById('edit-subcategory').value.trim(), // <--- NUEVO
      concept: document.getElementById('edit-concept').value.trim(),
      notes: document.getElementById('edit-notes').value.trim(),
    };


    if (
      !transaction.date || isNaN(transaction.amount) ||
      !transaction.account || !transaction.type || !transaction.concept
    ) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    addTransaction(transaction);
    renderTransactions();
    form.reset();
  });
}
