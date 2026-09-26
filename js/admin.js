// Variable global para guardar las citas cargadas
let listaCitasGlobal = [];

function cambiarVista(vista) {
  const vistaPaciente = document.getElementById('vista-paciente');
  const vistaAdmin = document.getElementById('vista-admin');
  const btnPaciente = document.getElementById('btn-paciente');
  const btnAdmin = document.getElementById('btn-admin');

  if (vista === 'paciente') {
    vistaPaciente.classList.remove('hidden');
    vistaAdmin.classList.add('hidden');
    btnPaciente.className = "px-4 py-2 text-sm rounded-lg bg-cyan-500 text-slate-950 font-bold transition";
    btnAdmin.className = "px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
  } else {
    const pass = prompt("Ingrese el PIN de acceso del dentista:");
    if (pass === "1234") { // Cambia "1234" por tu contraseña deseada
      vistaPaciente.classList.add('hidden');
      vistaAdmin.classList.remove('hidden');
      btnAdmin.className = "px-4 py-2 text-sm rounded-lg bg-cyan-500 text-slate-950 font-bold transition";
      btnPaciente.className = "px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
      cargarCitas();
    } else if (pass !== null) {
      alert("Contraseña o PIN incorrecto.");
    }
  }
}

// Cargar citas desde Google Sheets
async function cargarCitas() {
  const tbody = document.getElementById('tabla-citas-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="p-6 text-center text-slate-400">Cargando citas desde Google Sheets...</td>
    </tr>
  `;

  try {
    const respuesta = await fetch(API_URL);
    const resultado = await respuesta.json();

    if (resultado.status === "success" && resultado.data.length > 0) {
      listaCitasGlobal = resultado.data;
      renderizarTabla(listaCitasGlobal);
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-6 text-center text-slate-400">No hay citas agendadas aún.</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Error al cargar citas:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-6 text-center text-red-400">Error de conexión con la base de datos.</td>
      </tr>
    `;
  }
}

// Renderizar la tabla con soporte para nombres de columnas flexibles y formato de WhatsApp
function renderizarTabla(citas) {
  const tbody = document.getElementById('tabla-citas-body');
  tbody.innerHTML = "";

  if (citas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-6 text-center text-slate-400">No se encontraron citas para el criterio seleccionado.</td>
      </tr>
    `;
    return;
  }

  citas.forEach(cita => {
    const fila = document.createElement("tr");
    fila.className = "hover:bg-slate-800/40 border-b border-slate-800 transition text-sm";

    // 1. Obtener Nombre intentando con distintas variantes posibles
    const nombrePaciente = cita.nombre || cita["nombre completo"] || cita.paciente || "Paciente sin nombre";
    const fechaCita = cita.fecha || '';
    const horaCita = cita.hora || '';
    const tratamientoCita = cita.tratamiento || '';
    const notas = cita.notas || '';

    // 2. Limpieza y Formato del Teléfono para WhatsApp
    let telRaw = String(cita.telefono || cita.celular || '').replace(/\D/g, ''); // Quita espacios, guiones y símbolos
    
    // Si el número tiene 10 dígitos (caso típico en México), le agregamos la clave de país '52'
    if (telRaw.length === 10) {
      telRaw = '52' + telRaw;
    }

    // Construir enlace de WhatsApp
    const mensajeWA = encodeURIComponent(`Hola ${nombrePaciente}, te saludamos de Consultorio Dental para confirmar tu cita de ${tratamientoCita} el día ${fechaCita} a las ${horaCita}.`);
    
    // Si hay un teléfono válido generamos el link directo, si no, mostramos alerta
    const linkWA = telRaw ? `https://wa.me/${telRaw}?text=${mensajeWA}` : '#';

    // 3. Estilos según el Estado
    let BadgeEstado = "";
    if (cita.estado === "Confirmada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">🟢 Confirmada</span>`;
    } else if (cita.estado === "Cancelada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">🔴 Cancelada</span>`;
    } else if (cita.estado === "Completada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">✅ Completada</span>`;
    } else {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ Pendiente</span>`;
    }

    fila.innerHTML = `
      <td class="p-4 font-semibold text-cyan-400">${fechaCita} <br><span class="text-xs text-slate-400">${horaCita}</span></td>
      <td class="p-4 font-medium text-white">${nombrePaciente}</td>
      <td class="p-4">${tratamientoCita}</td>
      <td class="p-4">
        ${telRaw ? `
          <a href="${linkWA}" target="_blank" class="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg hover:bg-green-500/20 transition">
            💬 WhatsApp
          </a>
        ` : `<span class="text-xs text-slate-500">Sin Teléfono</span>`}
      </td>
      <td class="p-4">${BadgeEstado}</td>
      <td class="p-4">
        <div class="flex items-center gap-1">
          <button onclick="cambiarEstadoCita('${cita.id}', 'Confirmada')" title="Confirmar Cita" class="p-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition text-xs">✓</button>
          <button onclick="cambiarEstadoCita('${cita.id}', 'Completada')" title="Marcar Atendida" class="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs">✅</button>
          <button onclick="cambiarEstadoCita('${cita.id}', 'Cancelada')" title="Cancelar Cita" class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs">✕</button>
        </div>
        <td class="p-4">${notas}</td>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// Función para cambiar el estado de la cita en la hoja de cálculo
async function cambiarEstadoCita(idCita, nuevoEstado) {
  if (!confirm(`¿Estás seguro de cambiar el estado de la cita a "${nuevoEstado}"?`)) return;

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "updateStatus",
        idCita: idCita,
        nuevoEstado: nuevoEstado
      })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      alert(`La cita cambió a estado: ${nuevoEstado}`);
      cargarCitas(); // Recargar la tabla
    } else {
      alert("Error al actualizar: " + resultado.message);
    }
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    alert("Ocurrió un error al conectar con el servidor.");
  }
}

// Función para filtrar por fecha
function filtrarPorFecha() {
  const fechaFiltro = document.getElementById('filtro-fecha').value;
  if (!fechaFiltro) {
    renderizarTabla(listaCitasGlobal);
  } else {
    const filtradas = listaCitasGlobal.filter(c => c.fecha === fechaFiltro);
    renderizarTabla(filtradas);
  }
}

// Función para formatear fechas feas (2026-09-29T06:00:00.000Z -> 29/09/2026)
function formatearFechaBonita(fechaRaw) {
  if (!fechaRaw) return "Sin fecha";

  // Si la fecha contiene la 'T' de formato ISO (ej. 2026-09-29T06:00:00.000Z)
  if (typeof fechaRaw === 'string' && fechaRaw.includes('T')) {
    const partes = fechaRaw.split('T')[0].split('-'); // Extrae ['2026', '09', '29']
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`; // Formato limpio DD/MM/AAAA
    }
  }

  // Si la fecha viene como texto simple 'YYYY-MM-DD'
  if (typeof fechaRaw === 'string' && fechaRaw.includes('-')) {
    const partes = fechaRaw.split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
  }

  return fechaRaw; // En caso de que ya tenga formato correcto
}

// Renderizar la tabla del administrador
function renderizarTabla(citas) {
  const tbody = document.getElementById('tabla-citas-body');
  tbody.innerHTML = "";

  if (!citas || citas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-6 text-center text-slate-400">No se encontraron citas para el criterio seleccionado.</td>
      </tr>
    `;
    return;
  }

  citas.forEach(cita => {
    const fila = document.createElement("tr");
    fila.className = "hover:bg-slate-800/40 border-b border-slate-800 transition text-sm";

    // 1. Mapeo de datos con respaldos por si cambian cabeceras en Google Sheets
    const nombrePaciente = cita.nombre || cita["nombre completo"] || cita.paciente || "Paciente sin nombre";
    const fechaLimpia = formatearFechaBonita(cita.fecha);
    const horaCita = cita.hora || '';
    const tratamientoCita = cita.tratamiento || '';
    const notasCita = cita.notas || cita.comentarios || cita.observaciones || '<span class="text-slate-500 italic">Sin notas</span>';

    // 2. Limpieza y Formato del Teléfono para WhatsApp (+52 México)
    let telRaw = String(cita.telefono || cita.celular || '').replace(/\D/g, '');
    if (telRaw.length === 10) {
      telRaw = '52' + telRaw; // Clave LADA de México
    }

    const mensajeWA = encodeURIComponent(`Hola ${nombrePaciente}, te saludamos de Consultorio Dental para confirmar tu cita de ${tratamientoCita} el día ${fechaLimpia} a las ${horaCita}.`);
    const linkWA = telRaw ? `https://wa.me/${telRaw}?text=${mensajeWA}` : '#';

    // 3. Estilos de Badge para Estado
    let BadgeEstado = "";
    if (cita.estado === "Confirmada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">🟢 Confirmada</span>`;
    } else if (cita.estado === "Cancelada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">🔴 Cancelada</span>`;
    } else if (cita.estado === "Completada") {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">✅ Completada</span>`;
    } else {
      BadgeEstado = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ Pendiente</span>`;
    }

    fila.innerHTML = `
      <td class="p-4 font-semibold text-cyan-400">
        ${fechaLimpia} <br>
        <span class="text-xs text-slate-400">${horaCita}</span>
      </td>
      <td class="p-4 font-medium text-white">${nombrePaciente}</td>
      <td class="p-4 text-slate-300">${tratamientoCita}</td>
      <td class="p-4 text-xs text-slate-300 max-w-xs truncate" title="${notasCita}">${notasCita}</td>
      <td class="p-4">
        ${telRaw ? `
          <a href="${linkWA}" target="_blank" class="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg hover:bg-green-500/20 transition">
            💬 WhatsApp
          </a>
        ` : `<span class="text-xs text-slate-500">Sin Teléfono</span>`}
      </td>
      <td class="p-4">${BadgeEstado}</td>
      <td class="p-4">
        <div class="flex items-center gap-1">
          <button onclick="cambiarEstadoCita('${cita.id}', 'Confirmada')" title="Confirmar Cita" class="p-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition text-xs">✓</button>
          <button onclick="cambiarEstadoCita('${cita.id}', 'Completada')" title="Marcar Atendida" class="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs">✅</button>
          <button onclick="cambiarEstadoCita('${cita.id}', 'Cancelada')" title="Cancelar Cita" class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs">✕</button>
        </div>
      </td>
    `;
    tbody.appendChild(fila);
  });
}