// admin-session.js - Manejo de sesión de administrador
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginLink = document.getElementById('login-link');
    const registroLink = document.getElementById('registro-link');
    const navUserArea = document.getElementById('nav-user-area');
    const navUserLogged = document.getElementById('nav-user-logged');
    const userName = document.getElementById('user-name');

    // Verificar sesión de administrador al cargar la página
    checkAdminSession();

    // Función para verificar sesión de administrador
    function checkAdminSession() {
        const adminSession = sessionStorage.getItem('adminSession');
        
        if (adminSession) {
            try {
                const sessionData = JSON.parse(adminSession);
                
                if (sessionData.isAdmin) {
                    // Administrador logueado - mostrar nombre y botón de cerrar sesión
                    displayAdminInfo(sessionData.name);
                } else {
                    // Sesión inválida
                    sessionStorage.removeItem('adminSession');
                    showGuestInterface();
                }
            } catch (error) {
                console.error('Error al verificar sesión de administrador:', error);
                sessionStorage.removeItem('adminSession');
                showGuestInterface();
            }
        } else {
            // No hay sesión - mostrar interfaz de invitado
            showGuestInterface();
        }
    }

    // Función para mostrar información del administrador logueado
    function displayAdminInfo(adminName) {
        // Ocultar área de usuario no logueado
        if (navUserArea) {
            navUserArea.style.display = 'none';
        }
        
        // Mostrar área de usuario logueado
        if (navUserLogged) {
            navUserLogged.style.display = 'flex';
        }
        
        // Actualizar nombre del usuario
        if (userName) {
            userName.textContent = adminName;
        }
        
        // Configurar eventos
        setupAdminEvents();
    }

    // Función para mostrar interfaz de invitado
    function showGuestInterface() {
        // Mostrar área de usuario no logueado
        if (navUserArea) {
            navUserArea.style.display = 'flex';
        }
        
        // Ocultar área de usuario logueado
        if (navUserLogged) {
            navUserLogged.style.display = 'none';
        }
    }

    // Función para configurar eventos del administrador
    function setupAdminEvents() {
        // Evento de cerrar sesión
        const logoutBtn = document.getElementById('user-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutAdmin();
            });
        }

        // Evento del perfil del usuario
        const profileBtn = document.getElementById('user-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Redirigir al panel de administración
                window.location.href = 'panel-admin.html';
            });
        }

        // Evento de pedidos del usuario
        const ordersBtn = document.getElementById('user-orders');
        if (ordersBtn) {
            ordersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Redirigir a gestión de pedidos en el panel admin
                window.location.href = 'panel-admin.html#pedidos';
            });
        }
    }

    // Función para cerrar sesión del administrador
    function logoutAdmin() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Limpiar sesión
            sessionStorage.removeItem('adminSession');
            
            // Mostrar mensaje de despedida
            showNotification('Sesión cerrada exitosamente', 'success');
            
            // Restaurar interfaz de invitado
            setTimeout(() => {
                showGuestInterface();
                // Redirigir al inicio
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos para el mensaje
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        // Colores según el tipo
        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Agregar estilos CSS para las animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Exponer funciones globalmente para uso desde otros scripts
    window.adminSession = {
        checkSession: checkAdminSession,
        logout: logoutAdmin,
        displayAdminInfo: displayAdminInfo,
        showGuestInterface: showGuestInterface
    };
});
