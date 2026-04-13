const formAdmin = document.getElementById("formAdmin");
const adminEstado = document.getElementById("adminEstado");
const adminTabla = document.getElementById("adminTabla");
const btnExportarAdmin = document.getElementById("btnExportarAdmin");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const adminDatos = document.getElementById("adminDatos");

let comprasCargadas = [];

const restablecerPanel = () => {
  comprasCargadas = [];
  adminTabla.innerHTML = "";
  formAdmin.reset();
  adminEstado.textContent = "Sesión cerrada.";
  if (adminDatos) adminDatos.hidden = true;
  if (btnCerrarSesion) btnCerrarSesion.hidden = true;
};

const formatearMoneda = (valor) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(valor);

const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));

const renderTabla = (compras) => {
  adminTabla.innerHTML = "";
  comprasCargadas = compras;
  if (!compras.length) {
    adminTabla.innerHTML =
      "<tr><td colspan='10'>Aún no hay compras registradas.</td></tr>";
    return;
  }

  compras.forEach((compra) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(compra.fecha)}</td>
      <td>${compra.nombre}</td>
      <td>${compra.correo}</td>
      <td>${compra.telefono}</td>
      <td>${compra.direccion}</td>
      <td>${compra.producto}</td>
      <td>${compra.cantidad}</td>
      <td>${formatearMoneda(compra.precioUnitario)}</td>
      <td>${formatearMoneda(compra.total)}</td>
      <td>${compra.metodo}</td>
    `;
    adminTabla.appendChild(fila);
  });
};

const cargarCompras = async (token) => {
  const respuesta = await fetch("/api/admin/compras", {
    headers: {
      "X-Admin-Token": token,
    },
  });

  if (!respuesta.ok) {
    let message = "No autorizado";

    try {
      const errorData = await respuesta.json();
      message = errorData.message || message;
    } catch {
      // Si la respuesta no es JSON, se mantiene el mensaje genérico.
    }

    throw new Error(message);
  }

  const data = await respuesta.json();
  return data.compras || [];
};

const exportarExcel = () => {
  if (typeof XLSX === "undefined") {
    adminEstado.textContent =
      "No se pudo cargar el exportador de Excel. Recarga la página.";
    return;
  }

  if (!comprasCargadas.length) {
    adminEstado.textContent = "No hay compras para exportar.";
    return;
  }

  const datos = comprasCargadas.map((compra) => ({
    Fecha: formatearFecha(compra.fecha),
    Cliente: compra.nombre,
    Correo: compra.correo,
    Telefono: compra.telefono,
    Direccion: compra.direccion,
    Producto: compra.producto,
    Cantidad: compra.cantidad,
    "Precio unitario": compra.precioUnitario,
    Total: compra.total,
    Pago: compra.metodo,
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Compras");
  const fechaArchivo = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `compras_djn_${fechaArchivo}.xlsx`);
};

formAdmin.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = formAdmin.token.value.trim();

  if (!token) {
    adminEstado.textContent = "Ingresa la clave.";
    return;
  }

  try {
    const compras = await cargarCompras(token);
    renderTabla(compras);
    adminEstado.textContent = "Compras cargadas.";
    if (adminDatos) adminDatos.hidden = false;
    if (btnCerrarSesion) btnCerrarSesion.hidden = false;
    if (adminDatos) {
      adminDatos.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    adminEstado.textContent =
      error.message === "ADMIN_TOKEN no configurado"
        ? "El panel admin no está configurado en el servidor. Define ADMIN_TOKEN en .env."
        : "Clave incorrecta.";
    if (adminDatos) adminDatos.hidden = true;
    if (btnCerrarSesion) btnCerrarSesion.hidden = true;
  }
});

if (btnExportarAdmin) {
  btnExportarAdmin.addEventListener("click", exportarExcel);
}

if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", restablecerPanel);
}
