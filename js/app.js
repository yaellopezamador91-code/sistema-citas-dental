const API_URL = "https://script.google.com/macros/s/AKfycbzC74zuqd7kRzpYYELq0o4WItVgtBInha5bK-2yaU7ILg3AQv_G0t7wT4dC3vzLyUVU-g/exec";

document.addEventListener("DOMContentLoaded", () => {
  const formCita = document.getElementById("form-cita");
  const inputFecha = document.getElementById('fecha');

  // Validaciones del campo de fecha
  if (inputFecha) {
    inputFecha.addEventListener('change', (e) => {
      const fechaElegida = e.target.value;
      if (!fechaElegida) return;

      // 1. Validar Fin de Semana
      const fechaSeleccionada = new Date(fechaElegida + 'T00:00:00');
      const diaSemana = fechaSeleccionada.getDay(); // 0 = Domingo, 6 = Sábado

      if (diaSemana === 0 || diaSemana === 6) {
        alert('Atención: No hay consulta los fines de semana (Sábado y Domingo). Selecciona un día de Lunes a Viernes.');
        e.target.value = '';
        return;
      }

      // 2. Validar Días Bloqueados por el Dentista
      const diasBloqueados = JSON.parse(localStorage.getItem('diasBloqueados')) || [];
      if (diasBloqueados.includes(fechaElegida)) {
        alert('Lo sentimos, este día no habrá servicio por descanso o vacaciones.');
        e.target.value = '';
      }
    });
  }

  // Envío del Formulario
  if (formCita) {
    formCita.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSubmit = formCita.querySelector("button[type='submit']");
      const textoOriginal = btnSubmit.innerText;

      const datosCita = {
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        tratamiento: document.getElementById("tratamiento").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        notas: document.getElementById("notas") ? document.getElementById("notas").value : ""
      };

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Agendando cita...";

        const respuesta = await fetch(API_URL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
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
        alert("Ocurrió un error de red o de conexión.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
      }
    });
  }
});