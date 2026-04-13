const galleryModalClose = document.getElementById("galleryModalClose");
if (galleryModalClose) {
  galleryModalClose.addEventListener("click", closeGallery);
}
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
      headers: {
}
    // ...existing code...
}

if (galleryModalImage) {
  galleryModalImage.addEventListener("click", closeGallery);
}

const galleryImages = document.querySelectorAll(".vision-gallery__item img");
// Lógica de galería ya implementada arriba con showGalleryImage

const modals = [
  setupModal("bebederoTrigger", "bebederoModal"),
  setupModal("comederoTrigger", "comederoModal"),
  setupModal("jaulasTrigger", "jaulasModal"),
  setupModal("atrilesTrigger", "atrilesModal"),
  setupModal("estanqueTrigger", "estanqueModal"),
  setupModal("productoTrigger", "productoModal"),
  { modal: galleryModal, close: closeGallery },
];


// Asegurar que la galería se inicialice después de cargar el DOM
window.addEventListener("DOMContentLoaded", () => {
      // Soporte para swipe en móvil
      let touchStartX = 0;
      let touchEndX = 0;
      if (galleryModalImage) {
        galleryModalImage.addEventListener("touchstart", (e) => {
          touchStartX = e.touches[0].clientX;
        });
        galleryModalImage.addEventListener("touchmove", (e) => {
          touchEndX = e.touches[0].clientX;
        });
        galleryModalImage.addEventListener("touchend", () => {
          if (touchEndX === 0) return;
          const diff = touchEndX - touchStartX;
          if (Math.abs(diff) > 50) {
            if (diff < 0) {
              showGalleryImage(galleryCurrentIndex + 1); // Swipe izquierda
            } else {
              showGalleryImage(galleryCurrentIndex - 1); // Swipe derecha
            }
          }
          touchStartX = 0;
          touchEndX = 0;
        });
      }
    if (galleryModal) {
      galleryModal.addEventListener("click", (event) => {
        // Solo cerrar si se hace clic directamente en el overlay
        if (event.target === galleryModal) {
          closeGallery();
        }
      });
    }
  galleryImagesArr.forEach((img, idx) => {
    img.addEventListener("click", (e) => {
      e.preventDefault();
      showGalleryImage(idx);
    });
  });
  const galleryModalClose = document.getElementById("galleryModalClose");
  if (galleryModalClose) {
    galleryModalClose.addEventListener("click", closeGallery);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  modals.forEach(({ modal, close }) => {
    if (modal && !modal.hidden) {
      close();
    }
  });
});
