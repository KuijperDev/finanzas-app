import { importTransactionsToFirestore } from './firestore.js';

/**
 * Importa un archivo Excel/CSV y sube los datos a Firestore bajo el usuario dado.
 * @param {File} file - El archivo subido por el usuario.
 * @param {string} userId - El UID de Firebase Auth del usuario actual.
 */
export function handleFileImport(file, userId) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      alert('❌ El archivo está vacío o mal formado.');
      return;
    }

    const mapped = [];
    const errors = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2; // fila real (considerando encabezados)
      const rawId = row.ID;
      const rawDate = row.Fecha;
      const rawAmount = row.Importe;
      const rawAccount = row.Cuenta;
      const rawType = row.Tipo;
      const rawMethod = row.Modo;
      const rawCategory = row.Categoría;
      const rawSubcategory = row.Subcategoría;
      const rawConcept = row.Concepto;
      const rawNotes = row.Movimiento;

      const id = rawId || Date.now() + i;
      function excelDateToJSDate(serial) {
        const excelEpoch = new Date(1899, 11, 30);
        const days = Math.floor(serial);
        const msPerDay = 86400000;
        return new Date(excelEpoch.getTime() + days * msPerDay);
      }

      let date;
      if (typeof rawDate === 'number') {
        const jsDate = excelDateToJSDate(rawDate);
        date = jsDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
      } else {
        const parts = rawDate?.toString().trim().split('/');
        if (parts?.length === 3) {
          const [day, month, year] = parts;
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          date = rawDate?.toString().trim();
        }
      }


      const amount = parseFloat(rawAmount);
      const account = rawAccount?.toString().trim();
      const type = rawType?.toString().trim();
      const method = rawMethod?.toString().trim();
      const category = rawCategory?.toString().trim();
      const subcategory = rawSubcategory?.toString().trim();
      const concept = rawConcept?.toString().trim();
      const notes = rawNotes?.toString().trim();

      // Validaciones con detalle del valor leído
      if (!date) errors.push(`Fila ${rowNum}: Fecha vacía (valor leído: "${rawDate}")`);
      if (isNaN(amount)) errors.push(`Fila ${rowNum}: Importe no válido (valor leído: "${rawAmount}")`);
      if (!account) errors.push(`Fila ${rowNum}: Cuenta vacía (valor leído: "${rawAccount}")`);
      if (!concept) errors.push(`Fila ${rowNum}: Concepto vacío (valor leído: "${rawConcept}")`);
      if (!['Ingreso', 'Gasto'].includes(type)) {
        errors.push(`Fila ${rowNum}: Tipo debe ser "Ingreso" o "Gasto" (valor leído: "${rawType}")`);
      }

      if (errors.length === 0) {
        mapped.push({
          id,
          date,
          amount: type === 'Gasto' ? -Math.abs(amount) : Math.abs(amount),
          account,
          type,
          method,
          category,
          subcategory,
          concept,
          notes: notes || '',
        });
      }
    });

    if (errors.length > 0) {
      alert('❌ Errores al importar:\n\n' + errors.join('\n'));
      return;
    }

    importTransactionsToFirestore(mapped, userId) // <-- CORREGIDO
    .then(() => {
      alert('✅ Datos importados correctamente');
      location.reload(); // opcional, o renderTransactions() si es reactivo
    })
    .catch((error) => {
      console.error('Error al importar a Firestore:', error);
      alert('❌ Error al guardar los datos en la nube');
    });
  };

  reader.readAsArrayBuffer(file);
}