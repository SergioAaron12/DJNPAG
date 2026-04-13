const PRECIO_UNITARIO = 380000;
const PRODUCTO_NOMBRE = "Sistema Avicola Integral DJN - Modelo Pro A 120";
const formCompra = document.getElementById("formCompra");
const mensaje = document.getElementById("mensaje");
const btnComprar = document.getElementById("btnComprar");
const btnPagarWebpay = document.getElementById("btnPagarWebpay");


// Asegurar que todo se ejecute cuando el DOM esté listo



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
  const cantidad = obtenerCantidadPago();
  return cantidad;
};


function setupModal(triggerId, modalId) {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  if (!trigger || !modal) {
    console.warn('No se encontró trigger o modal:', triggerId, modalId);
    return { modal, close: () => {} };
  }

  // Función para mostrar el modal
  function openModal() {
    console.log('Abriendo modal:', modalId, 'trigger:', triggerId);
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden'; // Evita scroll de fondo
  }
  // Función para ocultar el modal
  function closeModal() {
    console.log('Cerrando modal:', modalId);
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openModal);
  // Cerrar al hacer click en el fondo oscuro
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  // Cerrar al hacer click en el botón de cerrar
  const closeBtn = modal.querySelector('.modal__close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Log para depuración
  console.log('Modal inicializado:', triggerId, modalId);
  return { modal, close: closeModal };
}


let modals = [];


// Asegurar que la galería se inicialice después de cargar el DOM
window.addEventListener("DOMContentLoaded", () => {
  modals = [
    setupModal("bebederoTrigger", "bebederoModal"),
    setupModal("comederoTrigger", "comederoModal"),
    setupModal("jaulasTrigger", "jaulasModal"),
    setupModal("atrilesTrigger", "atrilesModal"),
    setupModal("estanqueTrigger", "estanqueModal"),
    setupModal("productoTrigger", "productoModal"),
  ];
  [
    "bebederoTrigger",
    "comederoTrigger",
    "jaulasTrigger",
    "atrilesTrigger",
    "estanqueTrigger",
    "productoTrigger"
  ].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = "inline-block";
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  modals.forEach(({ modal, close }) => {
    if (modal && !modal.hidden) {
      close();
    }
  });
});
