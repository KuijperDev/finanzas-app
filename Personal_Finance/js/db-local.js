// db-local.js
const db = new Dexie('miApp');
db.version(2).stores({
  categorias: '++id,type,name,sub,syncStatus,userId',
  cuentas: '++id,name,initialBalance,syncStatus,userId',
  transacciones: '++id,fecha,monto,tipo,cuenta,categoria,subcategoria,concepto,notes,syncStatus,userId'
});
export default db;

