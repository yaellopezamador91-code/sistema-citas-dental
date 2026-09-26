// Remplaza este valor con la URL que copiaste de Google Apps Script (debe terminar en /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbzC74zuqd7kRzpYYELq0o4WItVgtBInha5bK-2yaU7ILg3AQv_G0t7wT4dC3vzLyUVU-g/exec";

document.addEventListener("DOMContentLoaded", () => {
  const formCita = document.getElementById("form-cita");

  if (formCita) {
    formCita.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSubmit = formCita.querySelector("button[type='submit']");
      const textoOriginal = btnSubmit.innerText;

      // Obtener datos del formulario
      const datosCita = {
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        tratamiento: document.getElementById("tratamiento").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        notas: document.getElementById("notas").value || ""
      };

      try {
        // Deshabilitar botón mientras se envía
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Agendando cita...";

        // Enviar datos mediante POST a Google Apps Script
        const respuesta = await fetch(API_URL, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(datosCita)
        });

        const resultado = await respuesta.json();

        if (resultado.status === "success") {
          alert("¡Cita agendada con éxito! Tu folio es: " + resultado.idCita);
          formCita.reset();
        } else {
          alert("Ocurrió un error al agendar: " + resultado.message);
        }

      } catch (error) {
        console.error("Error al conectar con la API:", error);
        alert("Ocurrió un error de red o de conexión con la hoja de cálculo.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
      }
    });
  }
});