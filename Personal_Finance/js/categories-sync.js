import db from './db-local.js';
import {
  getCategories as remoteGetCategories,
  saveCategories as remoteSaveCategories,
} from './categories.js';

/**
 * Obtiene todas las categorías (ingresos y gastos) en estructura { ingresos: [...], gastos: [...] }
 * Prioriza local (Dexie), sincroniza con Firebase si es posible.
 */
export async function getCategories(userId) {
  // Cargamos locales
  const ingresos = (await db.categorias.where('type').equals('ingreso').toArray()).map(cleanCategory);
  const gastos = (await db.categorias.where('type').equals('gasto').toArray()).map(cleanCategory);
  if (ingresos.length || gastos.length) return { ingresos, gastos };

  // Si no hay locales, intentamos remotos
  try {
    const remoteCats = await remoteGetCategories(userId);
    // Sincronizamos a local
    await db.categorias.clear();
    for (const cat of remoteCats.ingresos) {
      await db.categorias.put({ ...cat, type: 'ingreso', syncStatus: 'synced' });
    }
    for (const cat of remoteCats.gastos) {
      await db.categorias.put({ ...cat, type: 'gasto', syncStatus: 'synced' });
    }
    return remoteCats;
  } catch (e) {
    // Si error, devolvemos locales
    return { ingresos, gastos };
  }
}

/**
 * Añade una categoría (gasto o ingreso)
 */
export async function addCategory(type, name, userId) {
  // Evitar duplicados
  const exists = await db.categorias.where({ type, name }).count();
  if (!exists) {
    await db.categorias.add({ type, name, sub: [], syncStatus: 'pending' });
    try {
      await syncAllCategories(userId); // Sincroniza todo el objeto con Firestore
    } catch (e) {
      if (!e.message.includes('Quota exceeded')) throw e;
      // Si quota, se queda en pending
    }
  }
}

/**
 * Añade una subcategoría a una categoría específica
 */
export async function addSubcategory(type, parentName, subName, userId) {
  const cat = await db.categorias.where({ type, name: parentName }).first();
  if (cat) {
    if (!cat.sub.includes(subName)) {
      cat.sub.push(subName);
      cat.syncStatus = 'pending';
      await db.categorias.put(cat);
      try {
        await syncAllCategories(userId);
      } catch (e) {
        if (!e.message.includes('Quota exceeded')) throw e;
      }
    }
  }
}

/**
 * Elimina una categoría completa
 */
export async function deleteCategory(type, name, userId) {
  await db.categorias.where({ type, name }).delete();
  try {
    await syncAllCategories(userId);
  } catch (e) {
    if (!e.message.includes('Quota exceeded')) throw e;
  }
}

/**
 * Elimina una subcategoría específica
 */
export async function deleteSubcategory(type, parentName, subName, userId) {
  const cat = await db.categorias.where({ type, name: parentName }).first();
  if (cat) {
    cat.sub = cat.sub.filter(sub => sub !== subName);
    cat.syncStatus = 'pending';
    await db.categorias.put(cat);
    try {
      await syncAllCategories(userId);
    } catch (e) {
      if (!e.message.includes('Quota exceeded')) throw e;
    }
  }
}

/**
 * Sincroniza todas las categorías pendientes con Firestore
 * (guarda toda la estructura en el documento, como lo hace tu modelo actual)
 */
export async function syncPendingCategories(userId) {
  await syncAllCategories(userId);
}

/**
 * Sincroniza el estado actual local de categorías con Firestore
 * y marca todos como 'synced' si tiene éxito
 */
async function syncAllCategories(userId) {
  // Carga todas las categorías locales y las agrupa por tipo
  const allCats = await db.categorias.toArray();
  const ingresos = allCats.filter(c => c.type === 'ingreso').map(cleanCategory);
  const gastos = allCats.filter(c => c.type === 'gasto').map(cleanCategory);
  const data = { ingresos, gastos };
  await remoteSaveCategories(data, userId);
  // Marca todos como sincronizados si tuvo éxito
  for (const cat of allCats) {
    cat.syncStatus = 'synced';
    await db.categorias.put(cat);
  }
}

/**
 * Limpia el objeto categoría para que no tenga syncStatus ni type (solo para Firestore/UI)
 */
function cleanCategory(cat) {
  // Devuelve solo { name, sub }
  return { name: cat.name, sub: Array.isArray(cat.sub) ? cat.sub : [] };
}

// Guarda todas las categorías (ingresos y gastos) en Dexie/IndexedDB
export async function saveCategoriesLocal(data, userId) {
  // Limpia todas las categorías locales antes de importar
  await db.categorias.clear();

  // Guarda ingresos
  for (const cat of data.ingresos || []) {
    await db.categorias.put({ ...cat, type: 'ingreso', userId });
  }
  // Guarda gastos
  for (const cat of data.gastos || []) {
    await db.categorias.put({ ...cat, type: 'gasto', userId });
  }
}