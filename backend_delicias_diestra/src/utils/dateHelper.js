/**
 * Helper para manejar fechas y horas con la zona horaria correcta de Colombia
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Colombia (America/Bogota)
 * @returns {Date} Fecha actual en zona horaria de Colombia
 */
function getCurrentDateColombia() {
  const now = new Date();
  // Colombia está en UTC-5
  const offsetColombia = -5 * 60; // -5 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const colombiaTime = new Date(utc + (offsetColombia * 60000));
  return colombiaTime;
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD) en zona horaria de Colombia
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function getCurrentDateISO() {
  const date = getCurrentDateColombia();
  return date.toISOString().split('T')[0];
}

/**
 * Obtiene la fecha y hora actual en formato MySQL (YYYY-MM-DD HH:mm:ss) en zona horaria de Colombia
 * @returns {string} Fecha y hora en formato MySQL
 */
function getCurrentDateTimeMySQL() {
  const date = getCurrentDateColombia();
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Obtiene la fecha y hora actual en formato ISO completo en zona horaria de Colombia
 * @returns {string} Fecha y hora en formato ISO
 */
function getCurrentDateTimeISO() {
  return getCurrentDateColombia().toISOString();
}

/**
 * Convierte una fecha a la zona horaria de Colombia
 * @param {Date|string} date - Fecha a convertir
 * @returns {Date} Fecha en zona horaria de Colombia
 */
function toColombiaTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const offsetColombia = -5 * 60; // -5 horas en minutos
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utc + (offsetColombia * 60000));
}

module.exports = {
  getCurrentDateColombia,
  getCurrentDateISO,
  getCurrentDateTimeMySQL,
  getCurrentDateTimeISO,
  toColombiaTime
};

