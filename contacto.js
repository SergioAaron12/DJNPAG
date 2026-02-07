const formContacto = document.getElementById("formContacto");
const contactoEstado = document.getElementById("contactoEstado");

formContacto.addEventListener("submit", (event) => {
  event.preventDefault();
  const datos = new FormData(formContacto);
  const nombre = datos.get("nombre").trim();
  const correo = datos.get("correo").trim();
  const mensaje = datos.get("mensaje").trim();

  if (mensaje.length < 10 || mensaje.length > 300) {
    contactoEstado.textContent =
      "El mensaje debe tener entre 10 y 300 caracteres.";
    return;
  }

  const asunto = encodeURIComponent("Contacto DJN");
  const cuerpo = encodeURIComponent(
    `Nombre: ${nombre}\nCorreo: ${correo}\nMensaje: ${mensaje}`
  );

  window.location.href = `mailto:elsakitodewea@gmail.com?subject=${asunto}&body=${cuerpo}`;
  contactoEstado.textContent = "Abriendo tu correo para enviar el mensaje.";
});
