import { getTransactions } from './transactions-sync.js';
import { getAccounts } from './accounts-sync.js';

let chartIngresosGastos;

export async function renderResumen(userId, filtros = {}) {
  // Obtener todas las cuentas y llenar el select de filtro
  const cuentas = await getAccounts(userId);
  const selectCuenta = document.getElementById('resumen-filter-account');
  if (selectCuenta && cuentas.length && !selectCuenta.dataset.lleno) {
    selectCuenta.innerHTML = `<option value="">Todas</option>` +
      cuentas.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    selectCuenta.dataset.lleno = "1";
  }

  // Obtener transacciones del usuario
  let transacciones = await getTransactions(userId);

  // Filtrar por cuenta
  if (filtros.cuentaId) {
    transacciones = transacciones.filter(t => t.account === filtros.cuentaId);
  }

  // Filtrar por rango de meses
  if (filtros.from || filtros.to) {
    transacciones = transacciones.filter(t => {
      const fecha = new Date(t.date);
      // Mes en formato YYYY-MM para comparar
      const mes = fecha.getFullYear() + '-' + String(fecha.getMonth()+1).padStart(2, '0');
      let cumple = true;
      if (filtros.from) cumple = cumple && (mes >= filtros.from);
      if (filtros.to) cumple = cumple && (mes <= filtros.to);
      return cumple;
    });
  }

  // Agrupar por mes ingresos y gastos
  const resumenPorMes = {};
  for (let t of transacciones) {
    const fecha = new Date(t.date);
    const mes = fecha.toLocaleString('default', { month: 'short', year: 'numeric' });

    if (!resumenPorMes[mes]) {
      resumenPorMes[mes] = { ingresos: 0, gastos: 0 };
    }

    if (t.type === 'Ingreso') {
      resumenPorMes[mes].ingresos += t.amount;
    } else {
      resumenPorMes[mes].gastos += t.amount;
    }
  }

  const labels = Object.keys(resumenPorMes);
  const ingresos = labels.map(m => resumenPorMes[m].ingresos);
  const gastos = labels.map(m => resumenPorMes[m].gastos);

  // Destruir gráfica previa si existe
  if (chartIngresosGastos) chartIngresosGastos.destroy();

  const ctx = document.getElementById('chartIngresosGastos').getContext('2d');
  chartIngresosGastos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresos,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Gastos',
          data: gastos,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Ingresos vs Gastos' }
      }
    }
  });
}