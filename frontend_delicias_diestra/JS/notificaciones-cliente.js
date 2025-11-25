/**
 * Sistema de Notificaciones para Clientes
 * Maneja la visualización y gestión de notificaciones del cliente
 */

// URL base de la API - Usar window para evitar conflictos de redeclaración
(function() {
    if (typeof window.API_BASE_URL === 'undefined') {
        window.API_BASE_URL = 'http://localhost:3000/api';
    }
})();
// Función helper para obtener la URL de la API
function getAPIBaseURL() {
    return window.API_BASE_URL || 'http://localhost:3000/api';
}

// Variables globales
let notificacionesCliente = [];
let intervaloNotificaciones = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de notificaciones para cliente...');
    
    // Esperar un poco para que client-session.js termine de cargar
    setTimeout(() => {
        // Verificar si hay un cliente logueado
        const clienteData = obtenerDatosCliente();
        console.log('Datos del cliente obtenidos:', clienteData);
        
        if (clienteData && (clienteData.telefono || clienteData.email)) {
            console.log('Cliente encontrado, iniciando sistema de notificaciones...');
            console.log('   - Teléfono:', clienteData.telefono);
            console.log('   - Email:', clienteData.email);
            
            // Cargar notificaciones iniciales primero
            cargarNotificacionesCliente().then(() => {
                // Después de cargar, mostrar/ocultar icono según haya notificaciones
                actualizarVisibilidadIconoNotificaciones();
            });
            
            // Verificar notificaciones cada 10 segundos (más frecuente para mejor respuesta)
            intervaloNotificaciones = setInterval(() => {
                cargarNotificacionesCliente().then(() => {
                    actualizarVisibilidadIconoNotificaciones();
                });
            }, 10000);
        } else {
            console.warn('No se encontraron datos del cliente (telefono o email)');
            console.log('   - clienteData:', clienteData);
        }
    }, 500); // Esperar 500ms para que otros scripts terminen de cargar
});

// Obtener datos del cliente desde sessionStorage
function obtenerDatosCliente() {
    // Intentar obtener desde clientSession
    const clientSession = sessionStorage.getItem('clientSession');
    if (clientSession) {
        try {
            const sessionData = JSON.parse(clientSession);
            if (sessionData.isClient) {
                return sessionData;
            }
        } catch (error) {
            console.error('Error al parsear clientSession:', error);
        }
    }
    
    // Si no hay clientSession, intentar obtener desde datosClienteFormulario
    const datosFormulario = sessionStorage.getItem('datosClienteFormulario');
    if (datosFormulario) {
        try {
            return JSON.parse(datosFormulario);
        } catch (error) {
            console.error('Error al parsear datosClienteFormulario:', error);
        }
    }
    
    return null;
}

// Mostrar icono de notificaciones
function mostrarIconoNotificaciones() {
    const notificacionesLi = document.getElementById('notificaciones-cliente-li');
    if (notificacionesLi) {
        notificacionesLi.style.display = 'flex';
    }
}

// Ocultar icono de notificaciones
function ocultarIconoNotificaciones() {
    const notificacionesLi = document.getElementById('notificaciones-cliente-li');
    if (notificacionesLi) {
        notificacionesLi.style.display = 'none';
    }
}

// Actualizar visibilidad del icono según haya notificaciones no leídas
function actualizarVisibilidadIconoNotificaciones() {
    const cantidadNoLeidas = notificacionesCliente.length;
    console.log('Actualizando visibilidad del icono de notificaciones...');
    console.log('   - Notificaciones encontradas:', cantidadNoLeidas);
    
    if (cantidadNoLeidas > 0) {
        console.log('   Mostrando icono de notificaciones');
        mostrarIconoNotificaciones();
        actualizarBadgeNotificaciones(cantidadNoLeidas);
    } else {
        console.log('   Ocultando icono de notificaciones');
        ocultarIconoNotificaciones();
    }
}

// Cargar notificaciones del cliente
async function cargarNotificacionesCliente() {
    try {
        const clienteData = obtenerDatosCliente();
        if (!clienteData) {
            return Promise.resolve();
        }
        
        // Normalizar teléfono para la búsqueda (remover espacios, guiones, paréntesis, pero mantener el +)
        let telefonoBusqueda = clienteData.telefono;
        if (telefonoBusqueda) {
            // Remover espacios, guiones, paréntesis, pero mantener el signo +
            telefonoBusqueda = telefonoBusqueda.replace(/[\s\-\(\)]/g, '');
            // Si no tiene + al inicio y empieza con 57, agregarlo
            if (!telefonoBusqueda.startsWith('+') && telefonoBusqueda.startsWith('57')) {
                telefonoBusqueda = '+' + telefonoBusqueda;
            }
        }
        
        // Construir URL con parámetros de búsqueda
        let url = `${getAPIBaseURL()}/notificaciones-cliente/no-leidas?`;
        if (telefonoBusqueda) {
            url += `telefono=${encodeURIComponent(telefonoBusqueda)}`;
        } else if (clienteData.email) {
            url += `email=${encodeURIComponent(clienteData.email)}`;
        } else {
            console.warn('No se encontró teléfono ni email del cliente');
            return Promise.resolve();
        }
        
        console.log('Buscando notificaciones para:', { 
            telefono_original: clienteData.telefono, 
            telefono_normalizado: telefonoBusqueda, 
            email: clienteData.email 
        });
        console.log('URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error al cargar notificaciones:', response.status, errorText);
            throw new Error('Error al cargar notificaciones');
        }
        
        notificacionesCliente = await response.json();
        console.log('Notificaciones del cliente cargadas:', notificacionesCliente.length);
        if (notificacionesCliente.length > 0) {
            console.log('Notificaciones encontradas:', notificacionesCliente.map(n => ({ id: n.id_notificacion_cliente, titulo: n.titulo })));
        }
        
        // Actualizar badge
        actualizarBadgeNotificaciones(notificacionesCliente.length);
        
        // Actualizar visibilidad del icono
        actualizarVisibilidadIconoNotificaciones();
        
        // Mostrar notificaciones nuevas automáticamente
        mostrarNotificacionesNuevas(notificacionesCliente);
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error al cargar notificaciones del cliente:', error);
        return Promise.resolve();
    }
}

// Actualizar badge de notificaciones
function actualizarBadgeNotificaciones(cantidad) {
    const badge = document.getElementById('notificacion-badge-cliente');
    if (badge) {
        if (cantidad > 0) {
            badge.textContent = cantidad > 99 ? '99+' : cantidad;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mostrar notificaciones nuevas automáticamente
function mostrarNotificacionesNuevas(notificaciones) {
    // Obtener IDs de notificaciones ya mostradas
    const notificacionesMostradas = JSON.parse(sessionStorage.getItem('notificacionesMostradas') || '[]');
    
    // Filtrar solo las nuevas
    const nuevas = notificaciones.filter(notif => !notificacionesMostradas.includes(notif.id_notificacion_cliente));
    
    // Mostrar cada notificación nueva
    nuevas.forEach(notif => {
        mostrarNotificacionCliente(notif);
        
        // Guardar como mostrada
        notificacionesMostradas.push(notif.id_notificacion_cliente);
    });
    
    // Guardar en sessionStorage
    sessionStorage.setItem('notificacionesMostradas', JSON.stringify(notificacionesMostradas));
}

// Mostrar notificación del cliente
function mostrarNotificacionCliente(notificacion) {
    const tipo = notificacion.tipo || 'info';
    const iconos = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icono = iconos[tipo] || 'info-circle';
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `cliente-notification cliente-notification-${tipo}`;
    notification.dataset.notificacionId = notificacion.id_notificacion_cliente;
    notification.innerHTML = `
        <div class="cliente-notification-content">
            <div class="cliente-notification-icon">
                <i class="fas fa-${icono}"></i>
            </div>
            <div class="cliente-notification-text">
                <div class="cliente-notification-title">${notificacion.titulo || 'Notificación'}</div>
                <div class="cliente-notification-message">${notificacion.mensaje || ''}</div>
            </div>
            <button class="cliente-notification-close" onclick="cerrarNotificacionCliente(${notificacion.id_notificacion_cliente})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px 20px;
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid ${obtenerColorTipo(tipo)};
    `;
    
    document.body.appendChild(notification);
    
    // Auto-cerrar después de 8 segundos
    setTimeout(() => {
        cerrarNotificacionCliente(notificacion.id_notificacion_cliente);
    }, 8000);
}

// Obtener color según el tipo
function obtenerColorTipo(tipo) {
    const colores = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colores[tipo] || '#3b82f6';
}

// Cerrar notificación del cliente
async function cerrarNotificacionCliente(idNotificacion) {
    const notification = document.querySelector(`[data-notificacion-id="${idNotificacion}"]`);
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // Marcar como leída en el backend
    try {
        await fetch(`${getAPIBaseURL()}/notificaciones-cliente/${idNotificacion}/leida`, {
            method: 'PUT'
        });
        
        // Recargar notificaciones para actualizar el badge y visibilidad del icono
        cargarNotificacionesCliente().then(() => {
            actualizarVisibilidadIconoNotificaciones();
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

// Abrir modal de notificaciones
function abrirNotificacionesCliente() {
    // Crear modal si no existe
    let modal = document.getElementById('modal-notificaciones-cliente');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-notificaciones-cliente';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-medium">
                <div class="modal-header">
                    <h2 class="modal-title">Mis Notificaciones</h2>
                    <button class="modal-close" onclick="cerrarModalNotificacionesCliente()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="modal-notificaciones-cliente-body">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando notificaciones...</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="marcarTodasComoLeidas()">
                        <i class="fas fa-check-double"></i> Marcar todas como leídas
                    </button>
                    <button class="btn btn-primary" onclick="cerrarModalNotificacionesCliente()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }, 10);
    
    // Cargar todas las notificaciones
    cargarTodasLasNotificaciones();
}

// Cerrar modal de notificaciones
function cerrarModalNotificacionesCliente() {
    const modal = document.getElementById('modal-notificaciones-cliente');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Cargar todas las notificaciones (no solo las no leídas)
async function cargarTodasLasNotificaciones() {
    try {
        const clienteData = obtenerDatosCliente();
        if (!clienteData) {
            return;
        }
        
        const modalBody = document.getElementById('modal-notificaciones-cliente-body');
        if (!modalBody) return;
        
        // Construir URL
        let url = `${getAPIBaseURL()}/notificaciones-cliente?`;
        if (clienteData.telefono) {
            url += `telefono=${encodeURIComponent(clienteData.telefono)}`;
        } else if (clienteData.email) {
            url += `email=${encodeURIComponent(clienteData.email)}`;
        } else {
            return;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al cargar notificaciones');
        }
        
        const notificaciones = await response.json();
        
        if (notificaciones.length === 0) {
            modalBody.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No hay notificaciones</h3>
                    <p>No tienes notificaciones en este momento.</p>
                </div>
            `;
            return;
        }
        
        // Mostrar notificaciones
        modalBody.innerHTML = notificaciones.map(notif => crearCardNotificacionCliente(notif)).join('');
        
    } catch (error) {
        console.error('Error al cargar todas las notificaciones:', error);
        const modalBody = document.getElementById('modal-notificaciones-cliente-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>No se pudieron cargar las notificaciones.</p>
                </div>
            `;
        }
    }
}

// Crear card de notificación para el modal
function crearCardNotificacionCliente(notif) {
    const fecha = new Date(notif.fecha_creacion).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const tipo = notif.tipo || 'info';
    const iconos = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icono = iconos[tipo] || 'info-circle';
    const leidaClass = notif.leida ? 'notificacion-leida' : 'notificacion-no-leida';
    
    return `
        <div class="notificacion-cliente-card ${leidaClass}" data-notificacion-id="${notif.id_notificacion_cliente}">
            <div class="notificacion-cliente-icon notificacion-cliente-icon-${tipo}">
                <i class="fas fa-${icono}"></i>
            </div>
            <div class="notificacion-cliente-content">
                <div class="notificacion-cliente-header">
                    <h4 class="notificacion-cliente-title">${notif.titulo || 'Notificación'}</h4>
                    <span class="notificacion-cliente-fecha">${fecha}</span>
                </div>
                <p class="notificacion-cliente-message">${notif.mensaje || ''}</p>
            </div>
            ${!notif.leida ? `
                <button class="notificacion-cliente-marcar" onclick="marcarNotificacionComoLeida(${notif.id_notificacion_cliente})" title="Marcar como leída">
                    <i class="fas fa-check"></i>
                </button>
            ` : ''}
        </div>
    `;
}

// Marcar notificación como leída
async function marcarNotificacionComoLeida(idNotificacion) {
    try {
        const response = await fetch(`${getAPIBaseURL()}/notificaciones-cliente/${idNotificacion}/leida`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            // Recargar notificaciones
            cargarTodasLasNotificaciones();
            cargarNotificacionesCliente().then(() => {
                actualizarVisibilidadIconoNotificaciones();
            });
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

// Marcar todas como leídas
async function marcarTodasComoLeidas() {
    try {
        const clienteData = obtenerDatosCliente();
        if (!clienteData) {
            return;
        }
        
        const body = {};
        if (clienteData.telefono) {
            body.telefono = clienteData.telefono;
        } else if (clienteData.email) {
            body.email = clienteData.email;
        }
        
        const response = await fetch(`${getAPIBaseURL()}/notificaciones-cliente/marcar-todas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            // Recargar notificaciones
            cargarTodasLasNotificaciones();
            cargarNotificacionesCliente().then(() => {
                actualizarVisibilidadIconoNotificaciones();
            });
        }
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
    }
}

// Exportar funciones globales
window.abrirNotificacionesCliente = abrirNotificacionesCliente;
window.cerrarModalNotificacionesCliente = cerrarModalNotificacionesCliente;
window.cerrarNotificacionCliente = cerrarNotificacionCliente;
window.marcarNotificacionComoLeida = marcarNotificacionComoLeida;
window.marcarTodasComoLeidas = marcarTodasComoLeidas;

// Agregar estilos CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .cliente-notification {
        margin-bottom: 10px;
    }
    
    .cliente-notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    
    .cliente-notification-icon {
        font-size: 24px;
        flex-shrink: 0;
    }
    
    .cliente-notification-icon i {
        color: #3b82f6;
    }
    
    .cliente-notification-success .cliente-notification-icon i {
        color: #10b981;
    }
    
    .cliente-notification-error .cliente-notification-icon i {
        color: #ef4444;
    }
    
    .cliente-notification-warning .cliente-notification-icon i {
        color: #f59e0b;
    }
    
    .cliente-notification-text {
        flex: 1;
    }
    
    .cliente-notification-title {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
        color: #1f2937;
    }
    
    .cliente-notification-message {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
    }
    
    .cliente-notification-close {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
        flex-shrink: 0;
        transition: color 0.2s;
    }
    
    .cliente-notification-close:hover {
        color: #374151;
    }
    
    .notificacion-badge-cliente {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
    }
    
    #notificaciones-cliente-link {
        position: relative;
    }
    
    .notificacion-cliente-card {
        display: flex;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
    }
    
    .notificacion-cliente-card:hover {
        background-color: #f9fafb;
    }
    
    .notificacion-cliente-card.notificacion-no-leida {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
    }
    
    .notificacion-cliente-icon {
        font-size: 24px;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: #e5e7eb;
    }
    
    .notificacion-cliente-icon-success {
        background-color: #d1fae5;
        color: #10b981;
    }
    
    .notificacion-cliente-icon-error {
        background-color: #fee2e2;
        color: #ef4444;
    }
    
    .notificacion-cliente-icon-warning {
        background-color: #fef3c7;
        color: #f59e0b;
    }
    
    .notificacion-cliente-icon-info {
        background-color: #dbeafe;
        color: #3b82f6;
    }
    
    .notificacion-cliente-content {
        flex: 1;
    }
    
    .notificacion-cliente-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
    }
    
    .notificacion-cliente-title {
        font-weight: 600;
        font-size: 16px;
        color: #1f2937;
        margin: 0;
    }
    
    .notificacion-cliente-fecha {
        font-size: 12px;
        color: #9ca3af;
    }
    
    .notificacion-cliente-message {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
    }
    
    .notificacion-cliente-marcar {
        background: none;
        border: none;
        color: #3b82f6;
        cursor: pointer;
        padding: 8px;
        font-size: 16px;
        flex-shrink: 0;
        transition: color 0.2s;
    }
    
    .notificacion-cliente-marcar:hover {
        color: #2563eb;
    }
    
    .modal-medium {
        max-width: 600px;
    }
`;
document.head.appendChild(style);

