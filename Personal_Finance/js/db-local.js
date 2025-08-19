// db-local.js
const db = new Dexie('miApp');
db.version(1).stores({
  categorias: '++id,type,name,sub,syncStatus', // syncStatus: 'pending' | 'synced'
  cuentas: '++id,name,initialBalance,syncStatus',
  transacciones: '++id,fecha,monto,tipo,cuenta,categoria,subcategoria,concepto,notes,syncStatus'
});

export default db;