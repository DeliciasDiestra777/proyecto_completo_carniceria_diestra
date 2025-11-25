// client-session.js - JR ADSO
document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.getElementById('login-link');
    const registroLink = document.getElementById('registro-link');
    const navUserArea = document.getElementById('nav-user-area');
    const carritoBadge = document.getElementById('carrito-badge');

    checkClientSession();
    initUserDropdown();

    function checkClientSession() {
        const clientSession = sessionStorage.getItem('clientSession');
        
        if (clientSession) {
            try {
                const sessionData = JSON.parse(clientSession);
                
                if (sessionData.isClient) {
                    // Cliente logueado - mostrar nombre y botón de cerrar sesión
                    displayClientInfo(sessionData.name);
                    loadCartFromStorage();
                } else {
                    // Sesión inválida
                    sessionStorage.removeItem('clientSession');
                    showGuestInterface();
                }
            } catch (error) {
                console.error('Error al verificar sesión de cliente:', error);
                sessionStorage.removeItem('clientSession');
                showGuestInterface();
            }
        } else {
            // No hay sesión - mostrar interfaz de invitado
            showGuestInterface();
        }
    }

    function displayClientInfo(clientName) {
        if (navUserArea) {
            navUserArea.style.display = 'none';
        }
        const navUserAreaMobile = document.getElementById('nav-user-area-mobile');
        if (navUserAreaMobile) {
            navUserAreaMobile.style.display = 'none';
        }
        
        // Mostrar área de usuario logueado
        const navUserLogged = document.getElementById('nav-user-logged');
        const navUserLoggedMobile = document.getElementById('nav-user-logged-mobile');
        
        if (navUserLogged) {
            navUserLogged.style.display = 'flex';
        }
        if (navUserLoggedMobile) {
            navUserLoggedMobile.style.display = 'block';
        }
        
        // Actualizar nombre del usuario en el botón
        const userNameSpan = document.getElementById('user-name');
        const userNameSpanMobile = document.getElementById('user-name-mobile');
        
        if (userNameSpan) {
            userNameSpan.textContent = clientName;
        }
        if (userNameSpanMobile) {
            userNameSpanMobile.textContent = clientName;
        }
        
        // Reinicializar el menú desplegable después de mostrar el usuario
        setTimeout(() => {
            initUserDropdown();
            setupUserMenuEvents();
        }, 100);
    }

    // Función para mostrar interfaz de invitado
    function showGuestInterface() {
        // Mostrar área de usuario no logueado
        if (navUserArea) {
            navUserArea.style.display = 'flex';
        }
        
        // Ocultar área de usuario logueado
        const navUserLogged = document.getElementById('nav-user-logged');
        const navUserLoggedMobile = document.getElementById('nav-user-logged-mobile');
        
        if (navUserLogged) {
            navUserLogged.style.display = 'none';
        }
        if (navUserLoggedMobile) {
            navUserLoggedMobile.style.display = 'none';
        }
    }
    
    // Función para configurar eventos del menú de usuario
    function setupUserMenuEvents() {
        // Event listener para "Mi Perfil"
        const userProfile = document.getElementById('user-profile');
        const userProfileMobile = document.getElementById('user-profile-mobile');
        
        if (userProfile) {
            userProfile.addEventListener('click', function(e) {
                e.preventDefault();
                // Redirigir a página de perfil del cliente
                window.location.href = 'perfil-cliente.html';
            });
        }
        
        if (userProfileMobile) {
            userProfileMobile.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'perfil-cliente.html';
            });
        }
        
        // Event listener para "Mis Pedidos" / "Historial de Compras"
        const userOrders = document.getElementById('user-orders');
        const userOrdersMobile = document.getElementById('user-orders-mobile');
        
        if (userOrders) {
            userOrders.addEventListener('click', function(e) {
                e.preventDefault();
                // Redirigir a página de historial de compras
                window.location.href = 'historial-compras.html';
            });
        }
        
        if (userOrdersMobile) {
            userOrdersMobile.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'historial-compras.html';
            });
        }
        
        // Event listener para "Cerrar Sesión"
        const userLogout = document.getElementById('user-logout');
        const userLogoutMobile = document.getElementById('user-logout-mobile');
        
        if (userLogout) {
            userLogout.addEventListener('click', function(e) {
                e.preventDefault();
                logoutClient();
            });
        }
        
        if (userLogoutMobile) {
            userLogoutMobile.addEventListener('click', function(e) {
                e.preventDefault();
                logoutClient();
            });
        }
    }

    // Función para cerrar sesión del cliente
    function logoutClient() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Obtener ID del cliente antes de limpiar la sesión
            const clientSession = sessionStorage.getItem('clientSession');
            let clienteId = null;
            if (clientSession) {
                try {
                    const sessionData = JSON.parse(clientSession);
                    clienteId = sessionData.id;
                } catch (error) {
                    console.error('Error al obtener ID del cliente:', error);
                }
            }
            
            // Guardar carrito antes de cerrar sesión (ya se guarda automáticamente)
            saveCartToStorage();
            
            // Limpiar sesión
            sessionStorage.removeItem('clientSession');
            
            // Limpiar el carrito del cliente (pero mantener el carrito temporal vacío)
            if (clienteId) {
                const claveCarrito = `carrito_${clienteId}`;
                localStorage.setItem(claveCarrito, JSON.stringify([]));
            }
            
            // Mostrar interfaz de invitado
            showGuestInterface();
            
            // Limpiar el carrito global
            if (typeof limpiarCarritoDirectamente === 'function') {
                limpiarCarritoDirectamente();
            } else {
                // Fallback: limpiar directamente desde localStorage
                if (typeof carrito !== 'undefined') {
                    carrito = [];
                }
                // Asegurar que el carrito temporal esté vacío
                localStorage.setItem('carrito_temp', JSON.stringify([]));
            }
            
            // Mostrar mensaje de despedida
            showNotification('Sesión cerrada exitosamente', 'success');
            
            // Restaurar interfaz de invitado
            setTimeout(() => {
                showGuestInterface();
                // Recargar página para asegurar que todo se actualice correctamente
                window.location.reload();
            }, 1500);
        }
    }

    // Función para cargar carrito desde localStorage
    function loadCartFromStorage() {
        // El carrito ya se maneja en carrito.js con la clave específica del cliente
        // Solo necesitamos actualizar el badge
        updateCartBadgeFromCarrito();
    }

    // Función para guardar carrito en localStorage
    function saveCartToStorage() {
        // El carrito ya se guarda automáticamente en carrito.js con la clave específica del cliente
        // Solo necesitamos asegurar que esté sincronizado
        const clientSession = sessionStorage.getItem('clientSession');
        let claveCarrito = 'carrito_temp';
        
        if (clientSession) {
            try {
                const sessionData = JSON.parse(clientSession);
                if (sessionData.isClient && sessionData.id) {
                    claveCarrito = `carrito_${sessionData.id}`;
                }
            } catch (error) {
                console.error('Error al parsear clientSession:', error);
            }
        }
        
        const carrito = JSON.parse(localStorage.getItem(claveCarrito)) || [];
        localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    }

    // Función para actualizar el badge del carrito desde el sistema existente
    function updateCartBadgeFromCarrito() {
        // Obtener la clave del carrito según el cliente logueado
        const clientSession = sessionStorage.getItem('clientSession');
        let claveCarrito = 'carrito_temp';
        
        if (clientSession) {
            try {
                const sessionData = JSON.parse(clientSession);
                if (sessionData.isClient && sessionData.id) {
                    claveCarrito = `carrito_${sessionData.id}`;
                }
            } catch (error) {
                console.error('Error al parsear clientSession:', error);
            }
        }
        
        const carrito = JSON.parse(localStorage.getItem(claveCarrito)) || [];
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        updateCartBadge(totalItems);
    }

    // Función para actualizar el badge del carrito
    function updateCartBadge(count) {
        if (carritoBadge) {
            carritoBadge.textContent = count;
            carritoBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    // Función para obtener items del carrito
    function getCartItems() {
        // Obtener la clave del carrito según el cliente logueado
        const clientSession = sessionStorage.getItem('clientSession');
        let claveCarrito = 'carrito_temp';
        
        if (clientSession) {
            try {
                const sessionData = JSON.parse(clientSession);
                if (sessionData.isClient && sessionData.id) {
                    claveCarrito = `carrito_${sessionData.id}`;
                }
            } catch (error) {
                console.error('Error al parsear clientSession:', error);
            }
        }
        
        return JSON.parse(localStorage.getItem(claveCarrito)) || [];
    }

    // Función para obtener total de items del carrito
    function getCartTotalItems() {
        // Obtener la clave del carrito según el cliente logueado
        const clientSession = sessionStorage.getItem('clientSession');
        let claveCarrito = 'carrito_temp';
        
        if (clientSession) {
            try {
                const sessionData = JSON.parse(clientSession);
                if (sessionData.isClient && sessionData.id) {
                    claveCarrito = `carrito_${sessionData.id}`;
                }
            } catch (error) {
                console.error('Error al parsear clientSession:', error);
            }
        }
        
        const carrito = JSON.parse(localStorage.getItem(claveCarrito)) || [];
        return carrito.reduce((total, item) => total + item.cantidad, 0);
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
    window.clientSession = {
        checkSession: checkClientSession,
        logout: logoutClient,
        saveCart: saveCartToStorage,
        loadCart: loadCartFromStorage,
        updateCartBadge: updateCartBadge,
        updateCartBadgeFromCarrito: updateCartBadgeFromCarrito,
        getCartItems: getCartItems,
        getCartTotalItems: getCartTotalItems
    };
});

// Función para inicializar el menú desplegable de usuario
function initUserDropdown() {
    // Buscar todos los botones de usuario (puede haber varios en desktop y mobile)
    const userButtons = document.querySelectorAll('.user-button');
    
    userButtons.forEach(userButton => {
        if (!userButton) return;
        
        // Obtener el contenedor dropdown padre
        const userDropdown = userButton.closest('.user-dropdown');
        if (!userDropdown) return;
        
        // Evitar agregar múltiples listeners
        if (userButton.hasAttribute('data-dropdown-initialized')) return;
        userButton.setAttribute('data-dropdown-initialized', 'true');
        
        // Agregar event listener al botón
        userButton.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Cerrar otros dropdowns abiertos
            document.querySelectorAll('.user-dropdown.active').forEach(dropdown => {
                if (dropdown !== userDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            // Toggle del dropdown actual
            userDropdown.classList.toggle('active');
        });
    });
    
    // Cerrar dropdown al hacer clic fuera (solo una vez)
    if (!window.userDropdownListenerAdded) {
        window.userDropdownListenerAdded = true;
        document.addEventListener('click', function(e) {
            // Si el clic no fue dentro de ningún dropdown, cerrar todos
            if (!e.target.closest('.user-dropdown')) {
                document.querySelectorAll('.user-dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }
    
    // Cerrar dropdown al hacer clic en un item del menú (opcional, para mejor UX)
    document.querySelectorAll('.user-menu-item').forEach(item => {
        // Evitar agregar múltiples listeners
        if (item.hasAttribute('data-menu-item-initialized')) return;
        item.setAttribute('data-menu-item-initialized', 'true');
        
        item.addEventListener('click', function() {
            const userDropdown = this.closest('.user-dropdown');
            if (userDropdown) {
                // Pequeño delay para que el usuario vea que se hizo clic
                setTimeout(() => {
                    userDropdown.classList.remove('active');
                }, 100);
            }
        });
    });
}
