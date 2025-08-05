const STORAGE_KEY = 'categories';

export function getCategories() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    ingresos: [],
    gastos: []
  };
}

export function saveCategories(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addCategory(type, name) {
  const data = getCategories();
  const exists = data[type].some(cat => cat.name === name);
  if (!exists) {
    const newCategory = { name, sub: [] };
    data[type].push(newCategory);
    saveCategories(data);
  }
}

export function addSubcategory(type, parentName, subName) {
  const data = getCategories();
  const parent = data[type].find(cat => cat.name === parentName);
  if (parent && !parent.sub.includes(subName)) {
    parent.sub.push(subName);
    saveCategories(data);
  }
}

export function deleteCategory(type, name) {
  const data = getCategories();
  data[type] = data[type].filter(cat => cat.name !== name);
  saveCategories(data);
}

export function deleteSubcategory(type, parentName, subName) {
  const data = getCategories();
  const parent = data[type].find(cat => cat.name === parentName);
  if (parent) {
    parent.sub = parent.sub.filter(sub => sub !== subName);
    saveCategories(data);
  }
}
