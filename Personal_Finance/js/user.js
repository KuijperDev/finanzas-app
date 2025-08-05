const USUARIOS_KEY = 'usuarios_finanzas';
const USUARIO_ACTUAL_KEY = 'usuarioActual';

export function getUsers() {
  return JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
}

export function setUsuarios(usuarios) {
  localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

export function getActiveUser() {
  const user = localStorage.getItem(USUARIO_ACTUAL_KEY);
  if (!user || user === 'null') return null;
  return user;
}

export function setActiveUser(nombre) {
  if (nombre === null || nombre === undefined) {
    localStorage.removeItem(USUARIO_ACTUAL_KEY);
  } else {
    localStorage.setItem(USUARIO_ACTUAL_KEY, nombre);
  }
}

export function initUsuarioSelect() {
  const select = document.getElementById('usuario-select');
  const inputNuevo = document.getElementById('nuevo-usuario');
  const btnAgregar = document.getElementById('btn-agregar-usuario');
  const btnEliminar = document.getElementById('btn-eliminar-usuario');

  if (!select || !inputNuevo || !btnAgregar || !btnEliminar) return;

  function renderSelect() {
    const usuarios = getUsers();
    const actual = getActiveUser();
    select.innerHTML = '';

    usuarios.forEach(nombre => {
      const option = document.createElement('option');
      option.value = nombre;
      option.textContent = nombre;
      if (nombre === actual) option.selected = true;
      select.appendChild(option);
    });
  }

  renderSelect();

  // Cambiar usuario
  select.addEventListener('change', () => {
    setActiveUser(select.value);
    location.reload();
  });

  // Agregar nuevo usuario
  btnAgregar.addEventListener('click', () => {
    const nuevoNombre = inputNuevo.value.trim();
    if (!nuevoNombre) return alert("Introduce un nombre válido.");

    const usuarios = getUsers();
    if (usuarios.includes(nuevoNombre)) {
      alert("Ese usuario ya existe.");
      return;
    }

    usuarios.push(nuevoNombre);
    setUsuarios(usuarios);
    setActiveUser(nuevoNombre);
    inputNuevo.value = '';
    renderSelect();
    location.reload();
  });

  // Eliminar usuario
  btnEliminar.addEventListener('click', () => {
    const usuario = select.value;
    if (!confirm(`¿Eliminar usuario "${usuario}"? Se borrarán sus datos.`)) return;

    let usuarios = getUsers().filter(u => u !== usuario);
    localStorage.removeItem(`finanzas-transactions_${usuario}`);
    localStorage.removeItem(`finanzas-accounts_${usuario}`);

    setUsuarios(usuarios);

    if (usuarios.length > 0) {
      setActiveUser(usuarios[0]);
    } else {
      localStorage.removeItem(USUARIO_ACTUAL_KEY);
    }

    renderSelect();
    location.reload();
  });
}

export function addUser(name) {
  const usuarios = getUsers();
  if (usuarios.includes(name)) return false;
  usuarios.push(name);
  setUsuarios(usuarios);
  setActiveUser(name);
  return true;
}

export function deleteUser(name) {
  const usuarios = getUsers().filter(u => u !== name);
  setUsuarios(usuarios);
  localStorage.removeItem(`finanzas-transactions_${name}`);
  localStorage.removeItem(`finanzas-accounts_${name}`);

  const current = getActiveUser();
  if (name === current) {
    if (usuarios.length > 0) {
      setActiveUser(usuarios[0]);
    } else {
      localStorage.removeItem(USUARIO_ACTUAL_KEY);
    }
  }
}
