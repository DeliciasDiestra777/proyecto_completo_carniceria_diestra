// Manejo de fechas zona horaria Colombia
function getCurrentDateColombia() {
    const now = new Date();
    const offsetColombia = -5 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const colombiaTime = new Date(utc + (offsetColombia * 60000));
    return colombiaTime;
}
function getCurrentDateISO() {
    const date = getCurrentDateColombia();
    return date.toISOString().split('T')[0];
}

function getCurrentDateTimeMySQL() {
    const date = getCurrentDateColombia();
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getCurrentDateTimeISO() {
    return getCurrentDateColombia().toISOString();
}

function getCurrentDateTimeLocal() {
    const date = getCurrentDateColombia();
    return date.toISOString().slice(0, 16);
}

function toColombiaTime(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const offsetColombia = -5 * 60;
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    return new Date(utc + (offsetColombia * 60000));
}

function formatDateColombia(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Bogota'
    });
}
if (typeof window !== 'undefined') {
    window.getCurrentDateColombia = getCurrentDateColombia;
    window.getCurrentDateISO = getCurrentDateISO;
    window.getCurrentDateTimeMySQL = getCurrentDateTimeMySQL;
    window.getCurrentDateTimeISO = getCurrentDateTimeISO;
    window.getCurrentDateTimeLocal = getCurrentDateTimeLocal;
    window.toColombiaTime = toColombiaTime;
    window.formatDateColombia = formatDateColombia;
}

