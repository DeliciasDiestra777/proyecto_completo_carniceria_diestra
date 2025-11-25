// sesion.js - Manejo básico de sesiones para index.html
// Sesiones
window.sesion = {
    // Verificar si hay una sesión activa
    verificarSesion: function() {
        const adminSession = sessionStorage.getItem('adminSession');
        const clientSession = sessionStorage.getItem('clientSession');
        
        if (adminSession) {
            return JSON.parse(adminSession);
        } else if (clientSession) {
            return JSON.parse(clientSession);
        }
    
        return null;
    },
    
    // Obtener información del usuario actual
    obtenerUsuarioActual: function() {
        const sesion = this.verificarSesion();
        return sesion ? sesion : null;
    },
    
    // Verificar si el usuario está logueado
    estaLogueado: function() {
        return this.verificarSesion() !== null;
    },
    
    // Cerrar sesión
    cerrarSesion: function() {
        sessionStorage.removeItem('adminSession');
        sessionStorage.removeItem('clientSession');
        localStorage.removeItem('adminSession');
        localStorage.removeItem('clientSession');
        
        // Redirigir al inicio
        window.location.href = 'index.html';
    }
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sesión inicializada correctamente');
});
