import { saveTransactions, loadTransactions } from './storage.js';

let transactions = loadTransactions();

export function addTransaction(transaction) {
  transactions.push(transaction);
  saveTransactions(transactions);
}

export function getTransactions() {
  return transactions;
}

export function getNextId() {
  const transactions = getTransactions();
  const maxId = transactions.reduce((max, tx) => Math.max(max, tx.id || 0), 0);
  return maxId + 1;
}