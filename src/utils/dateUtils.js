/**
 * Funciones de utilidad para manejo de fechas
 */

/**
 * Obtiene la fecha hace un período determinado en zona horaria de Perú
 * @param {string} periodo - 'dia', 'semana', 'mes', 'trimestre', 'año'
 * @returns {Date} Fecha correspondiente al inicio del período indicado
 */
export function getDateFromPeriod(periodo) {
  // Obtener la fecha actual en Perú
  const now = getCurrentDatePeru();
  const result = new Date(now);
  
  switch(periodo) {
    case 'hoy':
      // Establecer a las 00:00:00 de hoy
      result.setHours(0, 0, 0, 0);
      break;
    case 'ayer':
      // Establecer a las 00:00:00 de ayer
      result.setDate(result.getDate() - 1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'semana':
      // Una semana atrás
      result.setDate(result.getDate() - 7);
      break;
    case 'mes':
      // Un mes atrás
      result.setMonth(result.getMonth() - 1);
      break;
    case 'trimestre':
      // Tres meses atrás
      result.setMonth(result.getMonth() - 3);
      break;
    case 'año':
      // Un año atrás
      result.setFullYear(result.getFullYear() - 1);
      break;
    default:
      // Por defecto, devolver la fecha actual
      break;
  }
  
  return result;
}

/**
 * Formatea una fecha en zona horaria de Perú (UTC-5)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada en formato local peruano (24 horas)
 */
export function formatDatePeru(date) {
  if (!date) return '-';
  
  try {
    // Convertir la fecha a objeto Date si es string
    const dateObj = new Date(date);
    
    // Obtener fecha/hora en zona horaria de Perú
    const options = { 
      timeZone: 'America/Lima' 
    };
    const fechaHoraPeru = new Date(dateObj.toLocaleString('en-US', options));
    
    // Formatear manualmente para tener control total sobre el formato
    const dia = fechaHoraPeru.getDate().toString().padStart(2, '0');
    const mes = (fechaHoraPeru.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses empiezan en 0
    const anio = fechaHoraPeru.getFullYear();
    const hora = fechaHoraPeru.getHours().toString().padStart(2, '0');
    const minutos = fechaHoraPeru.getMinutes().toString().padStart(2, '0');
    const segundos = fechaHoraPeru.getSeconds().toString().padStart(2, '0');
    
    // Formato dd/mm/yyyy HH:MM:SS
    return `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return String(date);
  }
}

/**
 * Obtiene la fecha actual en zona horaria de Perú (UTC-5)
 * @returns {Date} Fecha actual en zona horaria peruana
 */
export function getCurrentDatePeru() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
}
