/**
 * Sistema de Notificaciones - Panel Administrativo
 * Maneja la visualización y gestión de notificaciones de pedidos
 */

// URL base de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Variables globales
let notificaciones = [];
let notificacionesTodas = []; // Todas las notificaciones sin filtrar
let notificacionActual = null;
let filtroEstadoActual = ''; // Estado actual del filtro

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando módulo de notificaciones...');
    
    try {
        // Cargar notificaciones
        cargarNotificaciones().catch(error => {
            console.error('Error al cargar notificaciones iniciales:', error);
        });
        
        // Configurar event listeners
        const filtroEstado = document.getElementById('filtro-estado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                try {
                    filtrarNotificaciones();
                } catch (error) {
                    console.error('Error al filtrar notificaciones:', error);
                }
            });
        }
        
        const btnRefresh = document.getElementById('btn-refresh-notificaciones');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', (e) => {
                e.preventDefault();
                try {
                    cargarNotificaciones().catch(error => {
                        console.error('Error al refrescar notificaciones:', error);
                    });
                } catch (error) {
                    console.error('Error al refrescar notificaciones:', error);
                }
            });
        }
        
        // Event listener para el botón de confirmar cancelación
        const btnConfirmarCancelacion = document.getElementById('btn-confirmar-cancelacion');
        if (btnConfirmarCancelacion) {
            btnConfirmarCancelacion.addEventListener('click', () => {
                confirmarCancelacionConMotivo();
            });
        }
        
        // Event listener para Enter en el textarea (Shift+Enter para nueva línea)
        const textareaMotivo = document.getElementById('motivo-cancelacion-textarea');
        if (textareaMotivo) {
            textareaMotivo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    confirmarCancelacionConMotivo();
                }
            });
        }
        
        // Cerrar modal de motivo de cancelación al hacer clic fuera
        const modalMotivoCancelacion = document.getElementById('modal-motivo-cancelacion');
        if (modalMotivoCancelacion) {
            modalMotivoCancelacion.addEventListener('click', (e) => {
                if (e.target === modalMotivoCancelacion) {
                    cerrarModalMotivoCancelacion();
                }
            });
        }
        
        // Actualizar contador cada 30 segundos
        setInterval(() => {
            try {
                actualizarContadorPendientes().catch(error => {
                    console.error('Error al actualizar contador:', error);
                });
            } catch (error) {
                console.error('Error al actualizar contador:', error);
            }
        }, 30000);
    } catch (error) {
        console.error('Error al inicializar módulo de notificaciones:', error);
    }
});

// Manejar errores no capturados de promesas
window.addEventListener('unhandledrejection', function(event) {
    // Ignorar errores relacionados con extensiones del navegador
    if (event.reason && event.reason.message && 
        event.reason.message.includes('message channel closed')) {
        event.preventDefault();
        console.warn('⚠️ Error de extensión del navegador ignorado:', event.reason.message);
        return;
    }
    // Para otros errores, registrarlos pero no detener la ejecución
    console.error('Error no manejado en promesa:', event.reason);
});

// Manejar errores generales
window.addEventListener('error', function(event) {
    // Ignorar errores relacionados con extensiones del navegador
    if (event.message && event.message.includes('message channel closed')) {
        event.preventDefault();
        console.warn('⚠️ Error de extensión del navegador ignorado:', event.message);
        return;
    }
});

// Cargar notificaciones desde la API
async function cargarNotificaciones() {
    try {
        // Siempre cargar todas las notificaciones (sin filtro en el backend)
        const response = await fetch(`${API_BASE_URL}/notificaciones`);
        if (!response.ok) {
            throw new Error('Error al cargar notificaciones');
        }
        
        notificacionesTodas = await response.json();
        console.log('✅ Notificaciones cargadas:', notificacionesTodas.length);
        
        // Actualizar estadísticas
        actualizarEstadisticas(notificacionesTodas);
        actualizarContadorPendientes();
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarMensaje('Error al cargar notificaciones. Por favor, intenta de nuevo.', 'error');
    }
}

// Mostrar notificaciones en el contenedor (solo para el modal filtrado)
function mostrarNotificaciones(notificacionesArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (notificacionesArray.length === 0) {
        container.innerHTML = `
            <div class="empty-message" style="text-align: center; padding: 3rem;">
                <i class="fas fa-bell-slash" style="font-size: 3rem; color: var(--color-gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--color-gray-700); margin-bottom: 0.5rem;">No hay notificaciones</h3>
                <p style="color: var(--color-gray-500);">No se encontraron notificaciones con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }
    
    const html = notificacionesArray.map(notif => crearCardNotificacion(notif)).join('');
    container.innerHTML = html;
    
    // Agregar event listeners a las cards
    notificacionesArray.forEach(notif => {
        const card = container.querySelector(`[data-notificacion-id="${notif.id_notificacion}"]`);
        if (card) {
            card.addEventListener('click', () => {
                if (containerId === 'notificaciones-container-filtradas') {
                    cerrarModalNotificacionesFiltradas();
                }
                abrirModalDetalle(notif);
            });
        }
    });
}

// Crear card de notificación
function crearCardNotificacion(notif) {
    const fecha = new Date(notif.fecha_creacion).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const productos = Array.isArray(notif.productos) ? notif.productos : [];
    const productosLista = productos.slice(0, 3).map(p => 
        `<div class="notificacion-producto-item">
            <span class="notificacion-producto-nombre">${p.nombre || 'Producto'}</span>
            <span class="notificacion-producto-cantidad">${p.cantidad || 0} ${p.unidad || 'lb'}</span>
        </div>`
    ).join('');
    
    const productosRestantes = productos.length > 3 ? `<div class="notificacion-producto-item"><small>+${productos.length - 3} productos más</small></div>` : '';
    
    return `
        <div class="notificacion-card" data-notificacion-id="${notif.id_notificacion}">
            <div class="notificacion-header">
                <div class="notificacion-info">
                    <div class="notificacion-id-pedido">
                        <i class="fas fa-hashtag"></i>
                        Pedido #${notif.id_pedido || notif.id_notificacion}
                    </div>
                    <div class="notificacion-cliente">${notif.nombre_cliente || 'Cliente'}</div>
                    <div class="notificacion-fecha">
                        <i class="fas fa-calendar-alt"></i>
                        ${fecha}
                    </div>
                </div>
                <span class="notificacion-estado estado-${notif.estado || 'pendiente'}">
                    ${obtenerTextoEstado(notif.estado)}
                </span>
            </div>
            <div class="notificacion-productos">
                ${productosLista}
                ${productosRestantes}
            </div>
            <div class="notificacion-total">
                <span class="notificacion-total-label">Total:</span>
                <span class="notificacion-total-valor">$${formatearPrecio(notif.total_pedido || 0)}</span>
            </div>
        </div>
    `;
}

// Obtener texto del estado
function obtenerTextoEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'en_proceso': 'En Proceso',
        'enviado': 'Enviado',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
}

// Actualizar estadísticas
function actualizarEstadisticas(notificacionesArray) {
    const total = notificacionesArray.length;
    const pendientes = notificacionesArray.filter(n => n.estado === 'pendiente').length;
    const enProceso = notificacionesArray.filter(n => n.estado === 'en_proceso').length;
    const enviados = notificacionesArray.filter(n => n.estado === 'enviado').length;
    const entregados = notificacionesArray.filter(n => n.estado === 'entregado').length;
    const cancelados = notificacionesArray.filter(n => n.estado === 'cancelado').length;
    
    document.getElementById('total-notificaciones').textContent = total;
    document.getElementById('pendientes').textContent = pendientes;
    document.getElementById('en-proceso').textContent = enProceso;
    document.getElementById('enviados').textContent = enviados;
    document.getElementById('entregados').textContent = entregados;
    document.getElementById('cancelados').textContent = cancelados;
    
    // Agregar event listeners a los elementos de estadísticas
    configurarEventListenersEstadisticas();
}

// Configurar event listeners para los elementos de estadísticas
function configurarEventListenersEstadisticas() {
    // Total
    const totalItem = document.querySelector('.estadistica-item:first-child');
    if (totalItem) {
        totalItem.style.cursor = 'pointer';
        totalItem.onclick = () => abrirModalNotificacionesFiltradas('', 'Todas las Notificaciones');
    }
    
    // Pendientes
    const pendientesItem = document.querySelector('.estadistica-pendiente');
    if (pendientesItem) {
        pendientesItem.style.cursor = 'pointer';
        pendientesItem.onclick = () => abrirModalNotificacionesFiltradas('pendiente', 'Notificaciones Pendientes');
    }
    
    // En Proceso
    const enProcesoItem = document.querySelector('.estadistica-proceso');
    if (enProcesoItem) {
        enProcesoItem.style.cursor = 'pointer';
        enProcesoItem.onclick = () => abrirModalNotificacionesFiltradas('en_proceso', 'Notificaciones en Proceso');
    }
    
    // Enviados
    const enviadosItem = document.querySelector('.estadistica-enviado');
    if (enviadosItem) {
        enviadosItem.style.cursor = 'pointer';
        enviadosItem.onclick = () => abrirModalNotificacionesFiltradas('enviado', 'Notificaciones Enviadas');
    }
    
    // Entregados
    const entregadosItem = document.querySelector('.estadistica-entregado');
    if (entregadosItem) {
        entregadosItem.style.cursor = 'pointer';
        entregadosItem.onclick = () => abrirModalNotificacionesFiltradas('entregado', 'Notificaciones Entregadas');
    }
    
    // Cancelados
    const canceladosItem = document.querySelector('.estadistica-cancelado');
    if (canceladosItem) {
        canceladosItem.style.cursor = 'pointer';
        canceladosItem.onclick = () => abrirModalNotificacionesFiltradas('cancelado', 'Notificaciones Canceladas');
    }
}

// Abrir modal de notificaciones filtradas
function abrirModalNotificacionesFiltradas(estado, titulo) {
    const modal = document.getElementById('modal-notificaciones-filtradas');
    const modalTitle = document.getElementById('modal-filtradas-title');
    const container = document.getElementById('notificaciones-container-filtradas');
    
    if (!modal || !modalTitle || !container) return;
    
    // Filtrar notificaciones según el estado
    let notificacionesFiltradas = [];
    if (estado === '') {
        notificacionesFiltradas = [...notificacionesTodas];
    } else {
        notificacionesFiltradas = notificacionesTodas.filter(n => n.estado === estado);
    }
    
    // Actualizar título
    modalTitle.textContent = titulo + ` (${notificacionesFiltradas.length})`;
    
    // Mostrar notificaciones usando la función reutilizable
    mostrarNotificaciones(notificacionesFiltradas, 'notificaciones-container-filtradas');
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Cerrar modal de notificaciones filtradas
function cerrarModalNotificacionesFiltradas() {
    const modal = document.getElementById('modal-notificaciones-filtradas');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(event) {
    try {
        const modal = document.getElementById('modal-notificaciones-filtradas');
        if (modal && event.target === modal) {
            cerrarModalNotificacionesFiltradas();
        }
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
});

// Filtrar notificaciones desde el select
function filtrarNotificaciones() {
    const estadoFiltro = document.getElementById('filtro-estado')?.value || '';
    if (estadoFiltro) {
        // Abrir modal filtrado con el estado seleccionado
        const estadosTexto = {
            'pendiente': 'Notificaciones Pendientes',
            'en_proceso': 'Notificaciones en Proceso',
            'enviado': 'Notificaciones Enviadas',
            'entregado': 'Notificaciones Entregadas',
            'cancelado': 'Notificaciones Canceladas'
        };
        abrirModalNotificacionesFiltradas(estadoFiltro, estadosTexto[estadoFiltro] || 'Notificaciones');
    } else {
        // Si no hay filtro, mostrar todas
        abrirModalNotificacionesFiltradas('', 'Todas las Notificaciones');
    }
}


// Actualizar contador de pendientes (para el badge en el sidebar)
async function actualizarContadorPendientes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/pendientes`);
        if (response.ok) {
            const data = await response.json();
            const total = data.total || 0;
            
            // Actualizar badge en el sidebar (si existe)
            const badge = document.getElementById('notificacion-badge');
            if (badge) {
                if (total > 0) {
                    badge.textContent = total;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error al actualizar contador:', error);
    }
}

// Abrir modal de detalle
function abrirModalDetalle(notif) {
    notificacionActual = notif;
    const modal = document.getElementById('modal-detalle-notificacion');
    const modalBody = document.getElementById('modal-detalle-body');
    const modalFooter = document.getElementById('modal-detalle-footer');
    
    if (!modal || !modalBody || !modalFooter) return;
    
    // Construir contenido del modal
    const fecha = new Date(notif.fecha_creacion).toLocaleString('es-CO');
    const fechaVerificacion = notif.fecha_verificacion 
        ? new Date(notif.fecha_verificacion).toLocaleString('es-CO')
        : 'No verificado';
    
    const productos = Array.isArray(notif.productos) ? notif.productos : [];
    
    modalBody.innerHTML = `
        <div class="notificacion-detalle-section">
            <h3>Información del Cliente</h3>
            <div class="detalle-info-grid">
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Nombre</span>
                    <span class="detalle-info-value">${notif.nombre_cliente || 'N/A'}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Teléfono</span>
                    <span class="detalle-info-value">${notif.telefono_cliente || 'N/A'}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Email</span>
                    <span class="detalle-info-value">${notif.email_cliente || 'N/A'}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Dirección</span>
                    <span class="detalle-info-value">${notif.direccion_cliente || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="notificacion-detalle-section">
            <h3>Información del Pedido</h3>
            <div class="detalle-info-grid">
                <div class="detalle-info-item">
                    <span class="detalle-info-label">ID Pedido</span>
                    <span class="detalle-info-value">#${notif.id_pedido}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Método de Pago</span>
                    <span class="detalle-info-value">${notif.metodo_pago || 'N/A'}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Estado</span>
                    <span class="detalle-info-value">
                        <span class="notificacion-estado estado-${notif.estado}">
                            ${obtenerTextoEstado(notif.estado)}
                        </span>
                    </span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Comprobante Verificado</span>
                    <span class="detalle-info-value">
                        ${notif.comprobante_verificado ? '<span style="color: #10b981;">✓ Verificado</span>' : '<span style="color: #ef4444;">✗ No verificado</span>'}
                    </span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Fecha Creación</span>
                    <span class="detalle-info-value">${fecha}</span>
                </div>
                <div class="detalle-info-item">
                    <span class="detalle-info-label">Fecha Verificación</span>
                    <span class="detalle-info-value">${fechaVerificacion}</span>
                </div>
            </div>
        </div>
        
        <div class="notificacion-detalle-section">
            <h3>Productos del Pedido</h3>
            <table class="productos-detalle-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                        <tr>
                            <td>${p.nombre || 'Producto'}</td>
                            <td>${p.cantidad || 0} ${p.unidad || 'lb'}</td>
                            <td>$${formatearPrecio(p.precio_unitario || 0)}</td>
                            <td class="text-right text-bold">$${formatearPrecio((p.precio_unitario || 0) * (p.cantidad || 0))}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="3" class="text-right text-bold">Total:</td>
                        <td class="text-right text-bold" style="color: #10b981; font-size: 1.1em;">$${formatearPrecio(notif.total_pedido || 0)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${notif.observaciones ? `
        <div class="notificacion-detalle-section ${notif.estado === 'cancelado' ? 'observaciones-cancelado' : ''}">
            <h3>${notif.estado === 'cancelado' ? '<i class="fas fa-exclamation-triangle" style="color: var(--color-error); margin-right: 8px;"></i> Motivo de Cancelación' : 'Observaciones'}</h3>
            <p style="color: ${notif.estado === 'cancelado' ? 'var(--color-error)' : 'var(--color-gray-700)'}; ${notif.estado === 'cancelado' ? 'font-weight: 500; padding: var(--spacing-3); background: rgba(239, 68, 68, 0.1); border-radius: var(--border-radius-md); border-left: 4px solid var(--color-error);' : ''}">${notif.observaciones}</p>
        </div>
        ` : ''}
    `;
    
    // Construir botones del footer según el estado
    let botonesHTML = '';
    
    if (notif.estado === 'pendiente') {
        // Verificar si el comprobante está verificado
        const comprobanteVerificado = notif.comprobante_verificado === true || 
                                      notif.comprobante_verificado === 1 || 
                                      notif.comprobante_verificado === 'true' ||
                                      notif.comprobante_verificado === '1';
        
        botonesHTML = `
            <button class="btn btn-info" onclick="verificarComprobante(${notif.id_notificacion})" ${comprobanteVerificado ? 'style="display:none;"' : ''}>
                <i class="fas fa-check-circle"></i> Verificar Comprobante
            </button>
            <button class="btn btn-success" onclick="aceptarPedido(${notif.id_notificacion})" 
                    ${!comprobanteVerificado ? 'disabled title="Debe verificar el comprobante primero"' : ''}
                    ${!comprobanteVerificado ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <i class="fas fa-play-circle"></i> Aceptar Pedido / En Proceso
            </button>
        `;
    } else if (notif.estado === 'en_proceso') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="cambiarEstado(${notif.id_notificacion}, 'enviado')">
                <i class="fas fa-truck"></i> Marcar como Enviado
            </button>
        `;
    } else if (notif.estado === 'enviado') {
        botonesHTML = `
            <button class="btn btn-success" onclick="cambiarEstado(${notif.id_notificacion}, 'entregado')">
                <i class="fas fa-box-open"></i> Marcar como Entregado
            </button>
        `;
    }
    
    // Botón de cancelar siempre disponible (excepto si ya está entregado o cancelado)
    if (notif.estado !== 'entregado' && notif.estado !== 'cancelado') {
        botonesHTML += `
            <button class="btn btn-danger" onclick="cancelarPedido(${notif.id_notificacion})">
                <i class="fas fa-times-circle"></i> Cancelar Pedido
            </button>
        `;
    }
    
    botonesHTML += `
        <button class="btn btn-secondary" onclick="cerrarModalDetalle()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
    
    modalFooter.innerHTML = botonesHTML;
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }, 10);
}

// Cerrar modal de detalle
function cerrarModalDetalle() {
    const modal = document.getElementById('modal-detalle-notificacion');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    notificacionActual = null;
}

// Verificar comprobante
async function verificarComprobante(idNotificacion) {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${idNotificacion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comprobante_verificado: true
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al verificar comprobante');
        }
        
        mostrarMensaje('Comprobante verificado correctamente', 'success');
        
        // Recargar la notificación actualizada para habilitar el botón de aceptar
        const notificacionActualizada = await obtenerNotificacionPorId(idNotificacion);
        if (notificacionActualizada) {
            // Si el modal está abierto, actualizarlo con la nueva información
            if (notificacionActual && notificacionActual.id_notificacion === idNotificacion) {
                abrirModalDetalle(notificacionActualizada);
            }
        }
        
        // Recargar lista de notificaciones
        cargarNotificaciones();
    } catch (error) {
        console.error('Error al verificar comprobante:', error);
        mostrarMensaje('Error al verificar comprobante', 'error');
    }
}

// Obtener notificación por ID
async function obtenerNotificacionPorId(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${id}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error al obtener notificación:', error);
    }
    return null;
}

// Aceptar pedido y actualizar inventario
async function aceptarPedido(idNotificacion) {
    // Validar que el comprobante esté verificado
    if (notificacionActual) {
        const comprobanteVerificado = notificacionActual.comprobante_verificado === true || 
                                      notificacionActual.comprobante_verificado === 1 || 
                                      notificacionActual.comprobante_verificado === 'true' ||
                                      notificacionActual.comprobante_verificado === '1';
        
        if (!comprobanteVerificado) {
            mostrarMensaje('Debe verificar el comprobante antes de aceptar el pedido', 'warning');
            return;
        }
    }
    
    if (!confirm('¿Estás seguro de aceptar este pedido? Esto actualizará el inventario automáticamente.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${idNotificacion}/aceptar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                observaciones: notificacionActual?.observaciones || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al aceptar pedido');
        }
        
        mostrarMensaje('Pedido aceptado e inventario actualizado correctamente', 'success');
        cerrarModalDetalle();
        cargarNotificaciones();
        actualizarContadorPendientes();
        
        // Disparar evento para recargar inventario consolidado si está abierto
        window.dispatchEvent(new CustomEvent('inventarioActualizado', { 
            detail: { action: 'pedido_aceptado', id_notificacion: idNotificacion } 
        }));
    } catch (error) {
        console.error('Error al aceptar pedido:', error);
        mostrarMensaje('Error al aceptar pedido: ' + error.message, 'error');
    }
}

// Cambiar estado de la notificación
async function cambiarEstado(idNotificacion, nuevoEstado) {
    const estadosTexto = {
        'en_proceso': 'En Proceso',
        'enviado': 'Enviado',
        'entregado': 'Entregado'
    };
    
    if (!confirm(`¿Cambiar el estado del pedido a "${estadosTexto[nuevoEstado]}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${idNotificacion}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al cambiar estado');
        }
        
        mostrarMensaje(`Estado cambiado a "${estadosTexto[nuevoEstado]}"`, 'success');
        cargarNotificaciones();
        cerrarModalDetalle();
        
        // Si se marca como "Entregado", recargar el inventario consolidado
        if (nuevoEstado === 'entregado') {
            window.dispatchEvent(new CustomEvent('inventarioActualizado', { 
                detail: { action: 'pedido_entregado', id_notificacion: idNotificacion } 
            }));
            console.log('🔄 Evento de actualización de inventario disparado por pedido entregado');
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarMensaje('Error al cambiar estado', 'error');
    }
}

// Variable para almacenar el ID de notificación que se está cancelando
let idNotificacionCancelar = null;

// Cancelar pedido - muestra modal para solicitar motivo
function cancelarPedido(idNotificacion) {
    idNotificacionCancelar = idNotificacion;
    abrirModalMotivoCancelacion();
}

// Abrir modal de motivo de cancelación
function abrirModalMotivoCancelacion() {
    const modal = document.getElementById('modal-motivo-cancelacion');
    const textarea = document.getElementById('motivo-cancelacion-textarea');
    
    if (modal && textarea) {
        textarea.value = '';
        modal.style.display = 'flex';
        
        // Enfocar el textarea
        setTimeout(() => {
            textarea.focus();
        }, 100);
    }
}

// Cerrar modal de motivo de cancelación
function cerrarModalMotivoCancelacion() {
    const modal = document.getElementById('modal-motivo-cancelacion');
    const textarea = document.getElementById('motivo-cancelacion-textarea');
    
    if (modal && textarea) {
        modal.style.display = 'none';
        textarea.value = '';
        idNotificacionCancelar = null;
    }
}

// Confirmar cancelación con motivo
async function confirmarCancelacionConMotivo() {
    const textarea = document.getElementById('motivo-cancelacion-textarea');
    const motivo = textarea?.value.trim();
    
    if (!motivo) {
        mostrarMensaje('Por favor, ingresa el motivo de cancelación', 'error');
        textarea?.focus();
        return;
    }
    
    if (!idNotificacionCancelar) {
        mostrarMensaje('Error: No se encontró el ID de la notificación', 'error');
        cerrarModalMotivoCancelacion();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones/${idNotificacionCancelar}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'cancelado',
                observaciones: `[CANCELADO] Motivo: ${motivo}`
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al cancelar pedido');
        }
        
        mostrarMensaje('Pedido cancelado correctamente', 'success');
        cerrarModalMotivoCancelacion();
        cargarNotificaciones();
        cerrarModalDetalle();
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        mostrarMensaje('Error al cancelar pedido', 'error');
    }
}

// Formatear precio
function formatearPrecio(precio) {
    return parseFloat(precio || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Mostrar mensaje
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `producto-notification producto-notification-${tipo}`;
    notification.innerHTML = `
        <div class="producto-notification-content">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensaje}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Exportar funciones globales
window.cerrarModalDetalle = cerrarModalDetalle;
window.cerrarModalNotificacionesFiltradas = cerrarModalNotificacionesFiltradas;
window.verificarComprobante = verificarComprobante;
window.aceptarPedido = aceptarPedido;
window.cambiarEstado = cambiarEstado;
window.cancelarPedido = cancelarPedido;
window.cerrarModalMotivoCancelacion = cerrarModalMotivoCancelacion;

