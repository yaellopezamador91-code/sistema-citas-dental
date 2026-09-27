const API_URL = "https://script.google.com/macros/s/AKfycbzC74zuqd7kRzpYYELq0o4WItVgtBInha5bK-2yaU7ILg3AQv_G0t7wT4dC3vzLyUVU-g/exec";

document.addEventListener("DOMContentLoaded", () => {
  const formCita = document.getElementById("form-cita");
  const inputFecha = document.getElementById('fecha');

  // Validaciones al cambiar la fecha
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

      const fechaInput = document.getElementById("fecha").value;
      const horaInput = document.getElementById("hora").value;

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Verificando disponibilidad...";

        // 🛑 VALIDACIÓN DE HORARIO OCUPADO
        const resExistentes = await fetch(API_URL);
        const dataExistentes = await resExistentes.json();

        if (dataExistentes.status === "success" && dataExistentes.data) {
          const yaExiste = dataExistentes.data.some(cita => {
            // Ignorar citas canceladas
            if (cita.estado === "Cancelada") return false;

            // Limpiar fecha por si viene en ISO
            let fCita = String(cita.fecha || '').split('T')[0];
            let hCita = String(cita.hora || '').trim();

            return fCita === fechaInput && hCita === horaInput;
          });

          if (yaExiste) {
            alert(`⚠️ El horario de las ${horaInput} para el día ${fechaInput} ya se encuentra ocupado por otro paciente. Por favor elige otra hora u otra fecha.`);
            btnSubmit.disabled = false;
            btnSubmit.innerText = textoOriginal;
            return; // Detiene el envío
          }
        }

        // Si el horario está libre, procedemos a agendar
        btnSubmit.innerText = "Agendando cita...";

        const datosCita = {
          nombre: document.getElementById("nombre").value,
          telefono: document.getElementById("telefono").value,
          tratamiento: document.getElementById("tratamiento").value,
          fecha: fechaInput,
          hora: horaInput,
          notas: document.getElementById("notas") ? document.getElementById("notas").value : ""
        };

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