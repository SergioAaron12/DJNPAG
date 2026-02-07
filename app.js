const PRECIO_UNITARIO = 125;
const STORAGE_KEY = "djn_compras";

const formCompra = document.getElementById("formCompra");
const tablaCompras = document.getElementById("tablaCompras");
const mensaje = document.getElementById("mensaje");
const btnExportar = document.getElementById("btnExportar");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnComprar = document.getElementById("btnComprar");
const btnPagarWebpay = document.getElementById("btnPagarWebpay");

const cargarCompras = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const guardarCompras = (compras) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compras));
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

const renderizarTabla = () => {
  const compras = cargarCompras();
  tablaCompras.innerHTML = "";

  if (compras.length === 0) {
    tablaCompras.innerHTML =
      "<tr><td colspan='7'>Aún no hay compras registradas.</td></tr>";
    return;
  }

  compras.forEach((compra) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(compra.fecha)}</td>
      <td>${compra.nombre}</td>
      <td>${compra.correo}</td>
      <td>${compra.telefono}</td>
      <td>${compra.cantidad}</td>
      <td>${formatearMoneda(compra.total)}</td>
      <td>${compra.metodo}</td>
    `;
    tablaCompras.appendChild(fila);
  });
};

const prepararCompra = (data) => {
  const cantidad = Number(data.cantidad);
  return {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    nombre: data.nombre.trim(),
    correo: data.correo.trim(),
    telefono: data.telefono.trim(),
    cantidad,
    direccion: data.direccion.trim(),
    metodo: data.metodo,
    producto: "Jaula de gallina ponedora",
    precioUnitario: PRECIO_UNITARIO,
    total: cantidad * PRECIO_UNITARIO,
  };
};

const enviarCompraPorCorreo = async (compra) => {
  const respuesta = await fetch("/api/compra", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(compra),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo enviar el correo");
  }
};

const exportarExcel = () => {
  const compras = cargarCompras();
  if (compras.length === 0) {
    mensaje.textContent = "No hay compras para exportar.";
    return;
  }

  const datos = compras.map((compra) => ({
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
  mensaje.textContent = "Excel generado correctamente.";
};

formCompra.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(formCompra);
  const datos = Object.fromEntries(formData.entries());
  const compra = prepararCompra(datos);

  enviarCompraPorCorreo(compra)
    .then(() => {
      const compras = cargarCompras();
      compras.unshift(compra);
      guardarCompras(compras);

      mensaje.textContent = "Compra guardada y enviada por correo.";
      formCompra.reset();
      formCompra.cantidad.value = 1;
      renderizarTabla();
    })
    .catch(() => {
      mensaje.textContent =
        "No se pudo enviar el correo. Revisa el servidor y vuelve a intentar.";
    });
});

btnExportar.addEventListener("click", exportarExcel);
btnLimpiar.addEventListener("click", () => {
  if (!confirm("¿Deseas borrar el historial de compras?")) return;
  guardarCompras([]);
  renderizarTabla();
  mensaje.textContent = "Historial borrado.";
});

btnComprar.addEventListener("click", () => {
  document.getElementById("formCompra").scrollIntoView({
    behavior: "smooth",
  });
});

const obtenerCantidadPago = () => {
  const inputCantidad = document.getElementById("cantidad");
  const valor = Number(inputCantidad?.value || 1);
  return Number.isNaN(valor) || valor <= 0 ? 1 : valor;
};

const iniciarPagoWebpay = async () => {
  try {
    const cantidad = obtenerCantidadPago();
    const monto = cantidad * PRECIO_UNITARIO;

    const respuesta = await fetch("/api/webpay/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: monto }),
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo iniciar el pago");
    }

    const { url, token } = await respuesta.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "token_ws";
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    mensaje.textContent =
      "No se pudo iniciar el pago con Webpay. Intenta más tarde.";
  }
};

if (btnPagarWebpay) {
  btnPagarWebpay.addEventListener("click", iniciarPagoWebpay);
}

renderizarTabla();
