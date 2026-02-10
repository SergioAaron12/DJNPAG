const PRECIO_UNITARIO = 380000;
const PRODUCTO_NOMBRE = "Sistema Avicola Integral DJN - Modelo Pro A 120";
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
    producto: PRODUCTO_NOMBRE,
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

const sliderSlides = Array.from(document.querySelectorAll(".slider__slide"));
let sliderIndex = 0;

const iniciarSlider = () => {
  if (sliderSlides.length <= 1) return;

  setInterval(() => {
    sliderSlides[sliderIndex].classList.remove("is-active");
    sliderIndex = (sliderIndex + 1) % sliderSlides.length;
    sliderSlides[sliderIndex].classList.add("is-active");
  }, 4500);
};

iniciarSlider();

const setupModal = (triggerId, modalId) => {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  const closeButton = modal?.querySelector(".modal__close");

  const open = () => {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  if (trigger) {
    trigger.addEventListener("click", open);
  }

  if (closeButton) {
    closeButton.addEventListener("click", close);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });
  }

  return { modal, close };
};

const modals = [
  setupModal("bebederoTrigger", "bebederoModal"),
  setupModal("comederoTrigger", "comederoModal"),
  setupModal("jaulasTrigger", "jaulasModal"),
  setupModal("estanqueTrigger", "estanqueModal"),
];

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  modals.forEach(({ modal, close }) => {
    if (modal && !modal.hidden) {
      close();
    }
  });
});
