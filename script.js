(function(){
  // Configuración
  const TELEFONO_WPP = "34123456789"; // formato internacional sin +, ej. 34123456789
  const primerMensaje = "Hola! Quisiera reservar un turno.";

  const diaInput = document.getElementById('dia');
  const horaSelect = document.getElementById('hora');
  const nombreInput = document.getElementById('nombre');
  const telefonoInput = document.getElementById('telefono');
  const servicioSel = document.getElementById('servicio');
  const btnWpp = document.getElementById('wa-fab');
  const form = document.getElementById('formReserva');
  const instrucciones = document.getElementById('instrucciones');

  // Días abiertos: martes (2) a domingo (0), lunes (1) cerrado
  const OPEN_DAYS = [2,3,4,5,6,0];
  const ABIERTO_HORA_MIN = 8;
  const ABIERTO_HORA_MAX = 20; // última hora de inicio

  // Fecha mínima
  function fechaMinima(){
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Genera horas: 08:00 a 19:30 en incrementos de 30 min
  function generarHoras(){
    const horas = [];
    for(let h = ABIERTO_HORA_MIN; h < ABIERTO_HORA_MAX; h++){
      const hh = String(h).padStart(2,'0');
      horas.push(`${hh}:00`);
      horas.push(`${hh}:30`);
    }
    horas.push("19:30");
    return horas;
  }

  // Validar si el día está dentro del rango abierto
  function diaAbierto(dateStr){
    const d = new Date(dateStr);
    const dia = d.getDay(); // 0 Domingo ... 6 Sábado
    return OPEN_DAYS.includes(dia);
  }

  // Actualiza horas disponibles según el día seleccionado
  function actualizarHoras(){
    const diaValue = diaInput.value;
    horaSelect.innerHTML = "";

    if(!diaValue){
      horaSelect.disabled = true;
      const opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "Selecciona día";
      horaSelect.appendChild(opt);
      return;
    }

    if(!diaAbierto(diaValue)){
      horaSelect.disabled = true;
      const opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "Cerrado (lunes)";
      horaSelect.appendChild(opt);
      return;
    }

    const horas = generarHoras();
    horas.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      horaSelect.appendChild(opt);
    });
    horaSelect.disabled = false;
  }

  // Comprobar reserva en el futuro
  function esReservaValida(dateStr, timeStr){
    if(!dateStr || !timeStr) return false;
    const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
    const dt = new Date(dateStr + 'T' + timeStr);
    const ahora = new Date();
    return dt >= new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), ahora.getHours(), ahora.getMinutes());
  }

  // Construir URL de WhatsApp con mensaje predefinido
  function construirWaUrl({dia, hora, servicio, nombre, telefono}) {
    let servicioTexto = '';
    switch(servicio){
      case 'corte': servicioTexto = 'Corte de pelo'; break;
      case 'afeitado': servicioTexto = 'Afeitado tradicional'; break;
      case 'barba': servicioTexto = 'Barba y bigote'; break;
      case 'contorno': servicioTexto = 'Contorno y retoque'; break;
      default: servicioTexto = servicio;
    }
    const mensaje = [
      "Hola! Quisiera reservar un turno.",
      `Día: ${dia}`,
      `Hora: ${hora}`,
      `Servicio: ${servicioTexto}`,
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`
    ].join('\n');
    return `https://wa.me/${TELEFONO_WPP}?text=${encodeURIComponent(mensaje)}`;
  }

  // Guardar reserva localmente (opcional)
  function guardarReserva(res){
    const existing = JSON.parse(localStorage.getItem('reservas') || '[]');
    existing.push(res);
    localStorage.setItem('reservas', JSON.stringify(existing));
  }

  // Inicialización
  document.addEventListener('DOMContentLoaded', () => {
    // Fecha mínima
    diaInput.min = fechaMinima();

    // Hora inicial
    actualizarHoras();
    diaInput.addEventListener('change', actualizarHoras);

    // Actualizar enlace de WhatsApp
    function actualizarEnlaceWpp(){
      const href = construirWaUrl({
        dia: diaInput.value,
        hora: horaSelect.value,
        servicio: servicioSel.value,
        nombre: nombreInput.value || '[Nombre]',
        telefono: telefonoInput.value || '[Teléfono]'
      });
      btnWpp.href = href;
      // También podemos mostrar el enlace en algún lugar si se quiere
    }

    [diaInput, horaSelect, nombreInput, telefonoInput, servicioSel].forEach(el => {
      el.addEventListener('input', actualizarEnlaceWpp);
      el.addEventListener('change', actualizarEnlaceWpp);
    });

    // Form submit
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const dia = diaInput.value;
      const hora = horaSelect.value;
      const servicio = servicioSel.value;
      const nombre = nombreInput.value.trim();
      const telefono = telefonoInput.value.trim();

      if(!dia || !hora){
        instrucciones.textContent = "Por favor selecciona día y hora válidos.";
        return;
      }
      if(!diaAbierto(dia)){
        instrucciones.textContent = "El día seleccionado está cerrado. Elige martes a domingo.";
        return;
      }
      if(!esReservaValida(dia, hora)){
        instrucciones.textContent = "La hora seleccionada ya pasó. Elige una hora futura.";
        return;
      }

      // Persistir localmente (opcional)
      guardarReserva({dia, hora, servicio, nombre, telefono});

      // Abrir WhatsApp con mensaje
      const waUrl = construirWaUrl({dia, hora, servicio, nombre, telefono});
      window.open(waUrl, '_blank');

      instrucciones.textContent = "Reserva registrada y se abrió WhatsApp para confirmar.";
      actualizarEnlaceWpp();
    });

  });
})();