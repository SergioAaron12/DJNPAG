const PRECIO_UNITARIO = 380000;
const PRODUCTO_NOMBRE = "Sistema Avicola Integral DJN - Modelo Pro A 120";
const formCompra = document.getElementById("formCompra");
const mensaje = document.getElementById("mensaje");
const btnComprar = document.getElementById("btnComprar");
const btnPagarWebpay = document.getElementById("btnPagarWebpay");
const metodoPago = document.getElementById("metodo");
const btnTransferencia = document.getElementById("btnTransferencia");
const transferenciaData = document.getElementById("transferenciaData");


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

const enviarCompraPorCorreo = async (formData) => {
  const respuesta = await fetch("/api/compra", {
    method: "POST",
    body: formData,
  });

  if (!respuesta.ok) {
    let detalle = "No se pudo enviar el correo";
    try {
      const data = await respuesta.json();
      if (data?.message) {
        detalle = data.message;
      }
    } catch (error) {
      // Ignore JSON parse errors and keep default message.
    }
    throw new Error(detalle);
  }
};


formCompra.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(formCompra);
  const datos = Object.fromEntries(formData.entries());
  const compra = prepararCompra(datos);
  const comprobante = formData.get("comprobante");

  if (!(comprobante instanceof File) || comprobante.size === 0) {
    mensaje.textContent = "Debes subir la captura del comprobante.";
    return;
  }

  const tiposPermitidos = ["image/jpeg", "image/png"];
  if (!tiposPermitidos.includes(comprobante.type)) {
    mensaje.textContent = "El comprobante debe ser una imagen JPG o PNG.";
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (comprobante.size > maxSize) {
    mensaje.textContent = "El comprobante supera el maximo de 5 MB.";
    return;
  }

  Object.entries(compra).forEach(([key, value]) => {
    formData.set(key, value);
  });

  enviarCompraPorCorreo(formData)
    .then(() => {
      mensaje.textContent = "Compra guardada y enviada por correo.";
      formCompra.reset();
      formCompra.cantidad.value = 1;
    })
    .catch((error) => {
      mensaje.textContent = error?.message
        ? error.message
        : "No se pudo enviar el correo. Revisa el servidor y vuelve a intentar.";
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

const actualizarTransferencia = () => {
  if (!metodoPago || !btnTransferencia || !transferenciaData) return;
  const esTransferencia = metodoPago.value === "Transferencia";

  btnTransferencia.hidden = !esTransferencia;
  if (!esTransferencia) {
    transferenciaData.hidden = true;
    btnTransferencia.textContent = "Mostrar datos de transferencia";
  }
};

if (btnTransferencia && transferenciaData) {
  btnTransferencia.addEventListener("click", () => {
    const mostrar = transferenciaData.hidden;
    transferenciaData.hidden = !mostrar;
    btnTransferencia.textContent = mostrar
      ? "Ocultar datos de transferencia"
      : "Mostrar datos de transferencia";
  });
}

if (metodoPago) {
  metodoPago.addEventListener("change", actualizarTransferencia);
  actualizarTransferencia();
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

const galleryModal = document.getElementById("galleryModal");
const galleryModalImage = document.getElementById("galleryModalImage");

const closeGallery = () => {
  if (!galleryModal) return;
  galleryModal.hidden = true;
  document.body.style.overflow = "";
};

const galleryArrowLeft = document.getElementById("galleryArrowLeft");
const galleryArrowRight = document.getElementById("galleryArrowRight");
const galleryImages = document.querySelectorAll(".vision-gallery__item img");
const galleryImagesArr = Array.from(galleryImages);
let galleryCurrentIndex = 0;

function showGalleryImage(index) {
  if (!galleryModalImage) return;
  galleryCurrentIndex = (index + galleryImagesArr.length) % galleryImagesArr.length;
  const img = galleryImagesArr[galleryCurrentIndex];
  galleryModalImage.src = img.src;
  galleryModalImage.alt = img.alt || "Imagen de galeria";
}

galleryImagesArr.forEach((img, idx) => {
  img.addEventListener("click", () => {
    showGalleryImage(idx);
    galleryModal.hidden = false;
    document.body.style.overflow = "hidden";
  });
});

if (galleryArrowLeft) {
  galleryArrowLeft.addEventListener("click", (e) => {
    e.stopPropagation();
    showGalleryImage(galleryCurrentIndex - 1);
  });
}
if (galleryArrowRight) {
  galleryArrowRight.addEventListener("click", (e) => {
    e.stopPropagation();
    showGalleryImage(galleryCurrentIndex + 1);
  });
}

if (galleryModal) {
  galleryModal.addEventListener("click", (event) => {
    if (event.target === galleryModal) {
      closeGallery();
    }
  });
}

if (galleryModalImage) {
  galleryModalImage.addEventListener("click", closeGallery);
}

const galleryImages = document.querySelectorAll(".vision-gallery__item img");
galleryImages.forEach((img) => {
  img.addEventListener("click", () => {
    openGallery(img.src, img.alt);
  });
});

const modals = [
  setupModal("bebederoTrigger", "bebederoModal"),
  setupModal("comederoTrigger", "comederoModal"),
  setupModal("jaulasTrigger", "jaulasModal"),
  setupModal("atrilesTrigger", "atrilesModal"),
  setupModal("estanqueTrigger", "estanqueModal"),
  setupModal("productoTrigger", "productoModal"),
  { modal: galleryModal, close: closeGallery },
];

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  modals.forEach(({ modal, close }) => {
    if (modal && !modal.hidden) {
      close();
    }
  });
});
