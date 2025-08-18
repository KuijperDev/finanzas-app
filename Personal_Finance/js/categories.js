import { db } from './firebase-init.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DEFAULT_CATEGORIES = {
  ingresos: [],
  gastos: []
};

// === Obtener categorías del usuario desde Firestore ===
export async function getCategories(userId) {
  if (!userId) return { ...DEFAULT_CATEGORIES };

  const docRef = doc(db, 'users', userId, 'settings', 'categories');
  const snap = await getDoc(docRef);
  const data = snap.exists() ? snap.data() : {};
  // Asegura que siempre hay arrays
  return {
    ingresos: Array.isArray(data.ingresos) ? data.ingresos : [],
    gastos: Array.isArray(data.gastos) ? data.gastos : []
  };
}

// === Guardar categorías en Firestore ===
export async function saveCategories(data, userId) {
  if (!userId) return;

  const docRef = doc(db, 'users', userId, 'settings', 'categories');
  // Asegura que siempre hay arrays al guardar
  await setDoc(docRef, {
    ingresos: Array.isArray(data.ingresos) ? data.ingresos : [],
    gastos: Array.isArray(data.gastos) ? data.gastos : []
  });
}

// === Añadir categoría ===
export async function addCategory(type, name, userId) {
  console.log('addCategory called', type, name, userId);
  const data = await getCategories(userId);
  data[type] = Array.isArray(data[type]) ? data[type] : [];
  const exists = data[type].some(cat => cat.name === name);
  if (!exists) {
    data[type].push({ name, sub: [] });
    await saveCategories(data, userId);
  }
}

// === Añadir subcategoría ===
export async function addSubcategory(type, parentName, subName, userId) {
  const data = await getCategories(userId);
  data[type] = Array.isArray(data[type]) ? data[type] : [];
  const parent = data[type].find(cat => cat.name === parentName);
  if (parent) {
    parent.sub = Array.isArray(parent.sub) ? parent.sub : [];
    if (!parent.sub.includes(subName)) {
      parent.sub.push(subName);
      await saveCategories(data, userId);
    }
  }
}

// === Eliminar categoría ===
export async function deleteCategory(type, name, userId) {
  const data = await getCategories(userId);
  data[type] = Array.isArray(data[type]) ? data[type] : [];
  data[type] = data[type].filter(cat => cat.name !== name);
  await saveCategories(data, userId);
}

// === Eliminar subcategoría ===
export async function deleteSubcategory(type, parentName, subName, userId) {
  const data = await getCategories(userId);
  data[type] = Array.isArray(data[type]) ? data[type] : [];
  const parent = data[type].find(cat => cat.name === parentName);
  if (parent) {
    parent.sub = Array.isArray(parent.sub) ? parent.sub : [];
    parent.sub = parent.sub.filter(sub => sub !== subName);
    await saveCategories(data, userId);
  }
}