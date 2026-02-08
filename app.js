const PRECIO_UNITARIO = 125;
const formCompra = document.getElementById("formCompra");
const mensaje = document.getElementById("mensaje");
const btnComprar = document.getElementById("btnComprar");
const btnPagarWebpay = document.getElementById("btnPagarWebpay");


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


formCompra.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(formCompra);
  const datos = Object.fromEntries(formData.entries());
  const compra = prepararCompra(datos);

  enviarCompraPorCorreo(compra)
    .then(() => {
      mensaje.textContent = "Compra guardada y enviada por correo.";
      formCompra.reset();
      formCompra.cantidad.value = 1;
    })
    .catch(() => {
      mensaje.textContent =
        "No se pudo enviar el correo. Revisa el servidor y vuelve a intentar.";
    });
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
