// limpiar-sesion.js - Función para limpiar sesiones
// Limpieza de sesiones

function limpiarSesiones() {
    // Limpiar todas las sesiones almacenadas
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('clientSession');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('clientSession');
    
    console.log('Sesiones limpiadas correctamente');
}

// Función para verificar si hay sesiones activas
function verificarSesionesActivas() {
    const adminSession = sessionStorage.getItem('adminSession') || localStorage.getItem('adminSession');
    const clientSession = sessionStorage.getItem('clientSession') || localStorage.getItem('clientSession');
    
    return {
        admin: adminSession ? JSON.parse(adminSession) : null,
        client: clientSession ? JSON.parse(clientSession) : null
    };
}

// Exportar funciones para uso global
window.limpiarSesiones = limpiarSesiones;
window.verificarSesionesActivas = verificarSesionesActivas;
