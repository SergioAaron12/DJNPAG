const formContacto = document.getElementById("formContacto");
const contactoEstado = document.getElementById("contactoEstado");

formContacto.addEventListener("submit", (event) => {
  event.preventDefault();
  const datos = new FormData(formContacto);
  const nombre = datos.get("nombre").trim();
  const correo = datos.get("correo").trim();
  const telefono = datos.get("telefono").trim();
  const mensaje = datos.get("mensaje").trim();

  if (mensaje.length < 10 || mensaje.length > 500) {
    contactoEstado.textContent =
      "El mensaje debe tener entre 10 y 300 caracteres.";
    return;
  }

  fetch("/api/contacto", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombre, correo, telefono, mensaje }),
  })
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("Error enviando mensaje");
      }
      return respuesta.json();
    })
    .then(() => {
      contactoEstado.textContent = "Mensaje enviado correctamente.";
      formContacto.reset();
    })
    .catch(() => {
      contactoEstado.textContent =
        "No se pudo enviar el mensaje. Intenta de nuevo.";
    });
});
