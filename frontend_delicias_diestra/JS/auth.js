// auth.js - Funciones de autenticación básicas
// Autenticación

// Objeto global para autenticación
window.auth = {
    // Verificar si el usuario está autenticado
    estaAutenticado: function() {
        const adminSession = sessionStorage.getItem('adminSession');
        const clientSession = sessionStorage.getItem('clientSession');
        
        return !!(adminSession || clientSession);
    },
    
    // Obtener tipo de usuario (admin o client)
    obtenerTipoUsuario: function() {
        const adminSession = sessionStorage.getItem('adminSession');
        const clientSession = sessionStorage.getItem('clientSession');
        
        if (adminSession) {
            return 'admin';
        } else if (clientSession) {
            return 'client';
        }
        
        return null;
    },
    
    // Obtener información del usuario autenticado
    obtenerUsuario: function() {
        const adminSession = sessionStorage.getItem('adminSession');
        const clientSession = sessionStorage.getItem('clientSession');
        
        if (adminSession) {
            return JSON.parse(adminSession);
        } else if (clientSession) {
            return JSON.parse(clientSession);
        }
        
        return null;
    },
    
    // Verificar permisos de administrador
    esAdministrador: function() {
        return this.obtenerTipoUsuario() === 'admin';
    },
    
    // Verificar permisos de cliente
    esCliente: function() {
        return this.obtenerTipoUsuario() === 'client';
    },
    
    // Redirigir según el tipo de usuario
    redirigirSegunTipo: function() {
        const tipo = this.obtenerTipoUsuario();
        
        if (tipo === 'admin') {
            window.location.href = 'panel-admin.html';
        } else if (tipo === 'client') {
            window.location.href = 'catalogo.html';
        } else {
            window.location.href = 'login.html';
        }
    },
    
    // Cerrar sesión
    cerrarSesion: function() {
        sessionStorage.removeItem('adminSession');
        sessionStorage.removeItem('clientSession');
        localStorage.removeItem('adminSession');
        localStorage.removeItem('clientSession');
        
        // Redirigir al inicio
        window.location.href = 'index.html';
    },
    
    // Verificar sesión y mostrar/ocultar elementos
    verificarSesionUI: function() {
        const estaAutenticado = this.estaAutenticado();
        const usuario = this.obtenerUsuario();
        
        // Elementos de navegación
        const navUserArea = document.getElementById('nav-user-area');
        const navUserLogged = document.getElementById('nav-user-logged');
        const userName = document.getElementById('user-name');
        
        if (estaAutenticado && usuario) {
            // Mostrar área de usuario logueado
            if (navUserArea) navUserArea.style.display = 'none';
            if (navUserLogged) navUserLogged.style.display = 'flex';
            if (userName) userName.textContent = usuario.name || 'Usuario';
        } else {
            // Mostrar área de login/registro
            if (navUserArea) navUserArea.style.display = 'flex';
            if (navUserLogged) navUserLogged.style.display = 'none';
        }
    }
};

// Inicializar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth inicializado');
    
    // Verificar sesión y actualizar UI
    auth.verificarSesionUI();
    
    // Configurar eventos de logout
    const logoutBtn = document.getElementById('user-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            auth.cerrarSesion();
        });
    }
});
