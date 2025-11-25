// Carrito de compras - JR ADSO
(function() {
    if (typeof window.API_BASE_URL === 'undefined') {
        window.API_BASE_URL = 'http://localhost:3000/api';
    }
})();

function getAPIBaseURL() {
    return window.API_BASE_URL || 'http://localhost:3000/api';
}

// Métodos de pago
const CONFIG_PAGOS = {
    nequi: {
        numero: '3001234567', // Cambiar por el número real de Nequi
        nombre: 'Nequi',
        whatsapp: '573211234567' // Número de WhatsApp para enviar comprobante (sin +)
    },
    daviplata: {
        numero: '3001234567', // Cambiar por el número real de Daviplata
        nombre: 'Daviplata',
        whatsapp: '573211234567' // Número de WhatsApp para enviar comprobante (sin +)
    },
    bancolombia: {
        numero: '1234567890', // Cambiar por el número real de cuenta
        tipo: 'Ahorros',
        nombre: 'Bancolombia',
        whatsapp: '573001234567' // Número de WhatsApp para enviar comprobante (sin +)
    }
};

function formatearPrecio(precio) {
    return precio.toLocaleString('es-CO');
}

// Variable global para almacenar los productos del carrito
let carrito = [];

// Función para obtener la clave del carrito según el cliente logueado
function obtenerClaveCarrito() {
    const clientSession = sessionStorage.getItem('clientSession');
    if (clientSession) {
        try {
            const sessionData = JSON.parse(clientSession);
            if (sessionData.isClient && sessionData.id) {
                return `carrito_${sessionData.id}`;
            }
        } catch (error) {
            console.error('Error al parsear clientSession:', error);
        }
    }
    // Si no hay sesión de cliente, usar una clave temporal que se limpiará
    return 'carrito_temp';
}

// Función para inicializar el carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión de cliente
    const clientSession = sessionStorage.getItem('clientSession');
    
    if (clientSession) {
        try {
            const sessionData = JSON.parse(clientSession);
            if (sessionData.isClient && sessionData.id) {
                // Cliente logueado - cargar su carrito
                const claveCarrito = `carrito_${sessionData.id}`;
                carrito = JSON.parse(localStorage.getItem(claveCarrito)) || [];
                console.log('Carrito del cliente cargado:', carrito);
                
                // Si hay un carrito temporal, transferirlo al carrito del cliente
                const carritoTemp = JSON.parse(localStorage.getItem('carrito_temp')) || [];
                if (carritoTemp.length > 0) {
                    console.log('Carrito temporal encontrado, transfiriendo al carrito del cliente...');
                    // Combinar productos del carrito temporal con el del cliente
                    carritoTemp.forEach(itemTemp => {
                        const itemExistente = carrito.find(item => item.id === itemTemp.id);
                        if (itemExistente) {
                            // Si ya existe, sumar las cantidades
                            itemExistente.cantidad += itemTemp.cantidad;
                        } else {
                            // Si no existe, agregarlo
                            carrito.push(itemTemp);
                        }
                    });
                    // Guardar el carrito combinado
                    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
                    // Limpiar el carrito temporal
                    localStorage.removeItem('carrito_temp');
                    console.log('Carrito temporal transferido y limpiado');
                }
            } else {
                // No es cliente válido - usar carrito temporal
                carrito = JSON.parse(localStorage.getItem('carrito_temp')) || [];
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            carrito = JSON.parse(localStorage.getItem('carrito_temp')) || [];
        }
    } else {
        // No hay sesión - usar carrito temporal
        carrito = JSON.parse(localStorage.getItem('carrito_temp')) || [];
    }
    
    // Actualizar el badge del carrito
    actualizarBadgeCarrito();
    
    // Cargar productos del carrito en la página del carrito
    if (window.location.pathname.includes('carrito.html')) {
        cargarProductosCarrito();
    }
});

// Función para agregar producto al carrito
function agregarAlCarrito(productoId, cantidad = 1) {
    // Permitir agregar productos sin sesión (se guardará en carrito temporal)
    // La validación de sesión se hará al proceder al pago
    
    // Buscar el producto en los productos cargados desde la API
    let producto = null;
    
    // Intentar obtener desde productos globales si están disponibles
    if (window.productos && Array.isArray(window.productos)) {
        producto = window.productos.find(p => p.id === productoId.toString());
    }
    
    // Si no se encuentra, intentar obtener desde localStorage
    if (!producto) {
        const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
        producto = productosGuardados.find(p => p.id === productoId.toString());
    }
    
    // Si aún no se encuentra, usar datos por defecto
    if (!producto) {
        producto = {
            id: productoId,
            nombre: `Producto ${productoId}`,
            precio: 0,
            imagen: 'fas fa-box'
        };
    }
    
    // Buscar si el producto ya existe en el carrito
    const productoExistente = carrito.find(item => item.id === productoId);
    
    if (productoExistente) {
        // Si existe, aumentar la cantidad
        productoExistente.cantidad += cantidad;
    } else {
        // Si no existe, agregar nuevo producto
        const nuevoProducto = {
            id: productoId,
            nombre: producto.nombre_producto || producto.nombre,
            precio: producto.precio || producto.precio_producto || 0, // Compatibilidad con ambos campos
            cantidad: cantidad,
            imagen: producto.imagen,
            unidad_medida: producto.unidad_medida || 'lb', // Incluir unidad de medida
            categoriaId: producto.id_categoria || producto.categoriaId // Guardar categoría para validaciones
        };
        carrito.push(nuevoProducto);
    }
    
    // Guardar en localStorage con clave específica del cliente
    const claveCarrito = obtenerClaveCarrito();
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    
    // Actualizar badge del carrito
    actualizarBadgeCarrito();
    
    // Notificar al sistema de sesión si está disponible
    if (window.clientSession) {
        window.clientSession.updateCartBadgeFromCarrito();
    }
    
    // Mostrar notificación de éxito
    const nombreProducto = producto.nombre_producto || producto.nombre || 'Producto';
    mostrarNotificacion(`${nombreProducto} agregado al carrito`, 'success');
    
    console.log('Producto agregado:', productoId, 'Cantidad:', cantidad);
    console.log('Carrito actual:', carrito);
}

// Función para cambiar cantidad de un producto
function cambiarCantidad(productoId, cambio) {
    const producto = carrito.find(item => item.id === productoId);
    
    if (producto) {
        producto.cantidad += cambio;
        
        // Si la cantidad llega a 0, eliminar el producto
        if (producto.cantidad <= 0) {
            eliminarDelCarrito(productoId);
            return;
        }
        
        // Guardar en localStorage con clave específica del cliente
        const claveCarrito = obtenerClaveCarrito();
        localStorage.setItem(claveCarrito, JSON.stringify(carrito));
        
        // Actualizar badge del carrito
        actualizarBadgeCarrito();
        
        // Notificar al sistema de sesión si está disponible
        if (window.clientSession) {
            window.clientSession.updateCartBadgeFromCarrito();
        }
        
        // Actualizar la vista del carrito si estamos en esa página
        if (window.location.pathname.includes('carrito.html')) {
            cargarProductosCarrito();
        }
        
        console.log('Cantidad cambiada:', productoId, 'Nueva cantidad:', producto.cantidad);
    }
}

// Función para eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    
    // Guardar en localStorage con clave específica del cliente
    const claveCarrito = obtenerClaveCarrito();
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    
    // Actualizar badge del carrito
    actualizarBadgeCarrito();
    
    // Notificar al sistema de sesión si está disponible
    if (window.clientSession) {
        window.clientSession.updateCartBadgeFromCarrito();
    }
    
    // Actualizar la vista del carrito si estamos en esa página
    if (window.location.pathname.includes('carrito.html')) {
        cargarProductosCarrito();
    }
    
    // Mostrar notificación
    mostrarNotificacion(`Producto eliminado del carrito`, 'info');
    
    console.log('Producto eliminado:', productoId);
}

// Función para actualizar el badge del carrito
function actualizarBadgeCarrito() {
    const badge = document.getElementById('carrito-badge');
    if (badge) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        badge.textContent = totalItems;
        
        // Mostrar/ocultar badge según si hay productos
        if (totalItems > 0) {
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Función para cargar productos del carrito en la página del carrito
function cargarProductosCarrito() {
    console.log('Función cargarProductosCarrito llamada');
    console.log('Carrito en cargarProductosCarrito:', carrito);
    
    const container = document.getElementById('carrito-container');
    console.log('Container encontrado:', container);
    
    if (!container) return;
    
    if (carrito.length === 0) {
        console.log('Carrito vacío, mostrando mensaje de carrito vacío');
        container.innerHTML = `
            <div class="carrito-vacio">
                <div class="carrito-vacio-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para comenzar tu compra</p>
                <a href="catalogo.html" class="btn btn-primary">
                    <i class="fas fa-shopping-bag"></i>
                    <b>Ir al Catálogo</b>
                </a>
            </div>
        `;
        actualizarResumenPedido();
        // Cargar productos recomendados incluso si el carrito está vacío
        cargarProductosRecomendados();
        return;
    }
    
    // Generar HTML para cada producto en el carrito
    const productosHTML = carrito.map(item => `
        <div class="carrito-item-page" data-producto-id="${item.id}">
            <div class="carrito-item-imagen">
                ${item.imagen.startsWith('http') ? 
                    `<img src="${item.imagen}" alt="${item.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : 
                    `<i class="${item.imagen}"></i>`
                }
                ${item.imagen.startsWith('http') ? 
                    `<i class="fas fa-box" style="display:none;"></i>` : 
                    ''
                }
            </div>
            <div class="carrito-item-info">
                <h3 class="carrito-item-nombre">${item.nombre}</h3>
                <p class="carrito-item-precio">$${formatearPrecio(item.precio)}/${item.unidad_medida || 'lb'}</p>
                <div class="carrito-item-cantidad">
                    <button class="cantidad-btn" type="button" onclick="cambiarCantidad('${item.id}', -1)">-</button>
                    <input type="number" class="cantidad-input" value="${item.cantidad}" min="1" data-producto-id="${item.id}" onchange="actualizarCantidadDirecta('${item.id}', this.value)" onblur="actualizarCantidadDirecta('${item.id}', this.value)">
                    <button class="cantidad-btn" type="button" onclick="cambiarCantidad('${item.id}', 1)">+</button>
                </div>
            </div>
            <div class="carrito-item-acciones">
                <div class="carrito-item-subtotal">$${formatearPrecio(item.precio * item.cantidad)}</div>
                <button class="btn btn-secondary btn-sm" type="button" title="Eliminar del carrito" onclick="eliminarDelCarrito('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="carrito-items-page">
            ${productosHTML}
        </div>
    `;
    
    // Actualizar resumen del pedido
    actualizarResumenPedido();
    
    // Cargar productos recomendados (más vendidos)
    cargarProductosRecomendados();
}

// Función para actualizar el resumen del pedido
function actualizarResumenPedido() {
    console.log('Función actualizarResumenPedido llamada');
    console.log('Carrito en actualizarResumenPedido:', carrito);
    
    const resumenItems = document.getElementById('resumen-items');
    const resumenTotal = document.getElementById('resumen-total');
    
    console.log('Resumen items:', resumenItems);
    console.log('Resumen total:', resumenTotal);
    
    if (!resumenItems || !resumenTotal) return;
    
    const totalProductos = carrito.reduce((total, item) => total + item.cantidad, 0);
    const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    const envio = 0; // Envío gratis
    const total = subtotal + envio;
    
    console.log('Total productos:', totalProductos);
    console.log('Subtotal:', subtotal);
    console.log('Total:', total);
    
    resumenItems.innerHTML = `
        <div class="resumen-item">
            <span>Productos (${totalProductos}):</span>
            <span>$${formatearPrecio(subtotal)}</span>
        </div>
        <div class="resumen-item">
            <span>Envío:</span>
            <span>Gratis</span>
        </div>
    `;
    
    resumenTotal.innerHTML = `
        <div class="resumen-total-item">
            <span>Total:</span>
            <span>$${formatearPrecio(total)}</span>
        </div>
    `;
}

// Función para abrir el modal de confirmación para limpiar carrito
function abrirModalLimpiarCarrito(event) {
    // Verificar que NO se esté haciendo clic en un payment-option
    if (event && event.target) {
        const isPaymentOption = event.target.closest('.payment-option');
        if (isPaymentOption) {
            console.log('Intento de abrir modal limpiar carrito bloqueado - clic en payment-option');
            return; // No abrir el modal si el clic fue en un payment-option
        }
    }
    
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito ya está vacío', 'info');
        return;
    }
    
    const modal = document.getElementById('modal-limpiar-carrito');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Función para cerrar el modal de confirmación
function cerrarModalLimpiarCarrito() {
    const modal = document.getElementById('modal-limpiar-carrito');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Función para confirmar la limpieza del carrito
function confirmarLimpiarCarrito() {
    console.log('Función confirmarLimpiarCarrito llamada');
    console.log('Carrito antes de limpiar:', carrito);
    
    carrito = [];
    // Limpiar carrito en localStorage con clave específica del cliente
    const claveCarrito = obtenerClaveCarrito();
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    
    console.log('Carrito después de limpiar:', carrito);
    console.log('localStorage carrito:', localStorage.getItem('carrito'));
    
    actualizarBadgeCarrito();
    cargarProductosCarrito();
    cerrarModalLimpiarCarrito();
    mostrarNotificacion('Carrito limpiado completamente', 'success');
    
    console.log('Proceso de limpieza completado');
}

// Función para limpiar todo el carrito (mantener compatibilidad)
function limpiarCarrito() {
    abrirModalLimpiarCarrito();
}

// Función para limpiar el carrito directamente (sin modal de confirmación)
function limpiarCarritoDirectamente() {
    // Limpiar el array del carrito
    carrito = [];
    
    // Limpiar localStorage con clave específica del cliente
    const claveCarrito = obtenerClaveCarrito();
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    
    // Actualizar badge del carrito
    actualizarBadgeCarrito();
    
    // Notificar al sistema de sesión si está disponible
    if (window.clientSession) {
        window.clientSession.updateCartBadgeFromCarrito();
    }
    
    console.log('Carrito limpiado completamente');
}

// Función para obtener el nombre del producto por ID
function obtenerNombreProducto(productoId) {
    const productos = {
        'arrachera': 'Arrachera',
        'carne-molida': 'Carne Molida de Res',
        'chorizo': 'Chorizo Artesanal',
        'chuletas': 'Chuletas de Cerdo',
        'costillas': 'Costillas de Cerdo',
        'filete': 'Filete de Res',
        'ribeye': 'Ribeye Premium',
        'salchichas': 'Salchichas Premium',
        'pollo-entero': 'Pollo Entero',
        'pechuga-pollo': 'Pechuga de Pollo',
        'muslo-pollo': 'Muslo de Pollo',
        'tocino': 'Tocino Premium'
    };
    return productos[productoId] || 'Producto';
}

// Función para obtener el precio del producto por ID
function obtenerPrecioProducto(productoId) {
    const precios = {
        'arrachera': 45000,
        'carne-molida': 22000,
        'chorizo': 18000,
        'chuletas': 25000,
        'costillas': 28000,
        'filete': 38000,
        'ribeye': 42000,
        'salchichas': 15000,
        'pollo-entero': 12000,
        'pechuga-pollo': 16000,
        'muslo-pollo': 13000,
        'tocino': 20000
    };
    return precios[productoId] || 0;
}

// Función para obtener la imagen del producto por ID
function obtenerImagenProducto(productoId) {
    const imagenes = {
        'arrachera': 'fas fa-drumstick-bite',
        'carne-molida': 'fas fa-hamburger',
        'chorizo': 'fas fa-bacon',
        'chuletas': 'fas fa-drumstick-bite',
        'costillas': 'fas fa-bacon',
        'filete': 'fas fa-drumstick-bite',
        'ribeye': 'fas fa-drumstick-bite',
        'salchichas': 'fas fa-bacon',
        'pollo-entero': 'fas fa-drumstick-bite',
        'pechuga-pollo': 'fas fa-drumstick-bite',
        'muslo-pollo': 'fas fa-drumstick-bite',
        'tocino': 'fas fa-bacon'
    };
    return imagenes[productoId] || 'fas fa-drumstick-bite';
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-content">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensaje}</span>
        </div>
    `;
    
    // Agregar estilos si no existen
    if (!document.getElementById('notificacion-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notificacion-styles';
        styles.textContent = `
            .notificacion {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
            }
            .notificacion.show {
                transform: translateX(0);
            }
            .notificacion-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notificacion-success {
                border-left: 4px solid #10b981;
            }
            .notificacion-success i {
                color: #10b981;
            }
            .notificacion-error {
                border-left: 4px solid #ef4444;
            }
            .notificacion-error i {
                color: #ef4444;
            }
            .notificacion-info {
                border-left: 4px solid #3b82f6;
            }
            .notificacion-info i {
                color: #3b82f6;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Agregar al DOM
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('show');
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

// Función para obtener el carrito completo (para uso externo)
function obtenerCarrito() {
    return carrito;
}

// Función para obtener el total del carrito
function obtenerTotalCarrito() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

// Función para obtener la cantidad total de productos
function obtenerCantidadTotalCarrito() {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// ========================================
// INICIALIZACIÓN DE EVENT LISTENERS
// ========================================

// Event listener para el botón de limpiar carrito
document.addEventListener('DOMContentLoaded', function() {
    const btnLimpiarCarrito = document.getElementById('btn-limpiar-carrito');
    if (btnLimpiarCarrito) {
        btnLimpiarCarrito.addEventListener('click', function(e) {
            // Verificar que el clic sea específicamente en este botón o sus hijos directos
            if (e.target === btnLimpiarCarrito || e.target.closest('#btn-limpiar-carrito') === btnLimpiarCarrito) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botón limpiar carrito clickeado');
                abrirModalLimpiarCarrito(e);
            }
        });
    }
    
    // Event listener para cerrar modal con clic fuera (solo en el overlay, no en su contenido)
    document.addEventListener('click', function(event) {
        // Solo cerrar si se hace clic directamente en el overlay, no en su contenido
        if (event.target.classList.contains('modal-overlay') && event.target === event.currentTarget) {
            const modal = event.target;
            if (modal.id === 'modal-limpiar-carrito') {
                cerrarModalLimpiarCarrito();
            }
        }
    });
    
    // Prevenir que los clics dentro del modal-content cierren el modal
    // PERO permitir que los botones funcionen normalmente
    document.addEventListener('click', function(event) {
        // Si el clic es en un payment-option dentro del modal de método de pago, NO hacer nada
        // (dejamos que los listeners específicos del modal manejen esto)
        const paymentOption = event.target.closest('.payment-option');
        if (paymentOption) {
            const modalMetodoPago = document.getElementById('modal-metodo-pago');
            if (modalMetodoPago && modalMetodoPago.contains(paymentOption)) {
                // No hacer nada, dejar que los listeners específicos del modal manejen esto
                return;
            }
        }
        
        const modalContent = event.target.closest('.modal-content');
        const isButton = event.target.tagName === 'BUTTON' || event.target.closest('button');
        const isInput = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT';
        const isLabel = event.target.tagName === 'LABEL' || event.target.closest('label');
        const isLink = event.target.tagName === 'A' || event.target.closest('a');
        
        // Si el clic es dentro del modal-content PERO NO es un botón, input, label o link, prevenir propagación
        if (modalContent && !isButton && !isInput && !isLabel && !isLink) {
            // Solo prevenir propagación si no es un elemento interactivo
            const isInteractive = event.target.closest('button, input, textarea, select, label, a, [onclick]');
            if (!isInteractive) {
                event.stopPropagation();
            }
        }
    }, true); // Usar capture phase para interceptar antes
    
    // Event listener para cerrar modal con tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modalLimpiar = document.getElementById('modal-limpiar-carrito');
            if (modalLimpiar && modalLimpiar.style.display === 'flex') {
                cerrarModalLimpiarCarrito();
            }
        }
    });
});

// ========================================
// ESTILOS CSS DINÁMICOS PARA IMÁGENES DEL CARRITO
// ========================================

const carritoStyle = document.createElement('style');
carritoStyle.textContent = `
    .carrito-item-imagen img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
    }
    
    .carrito-item-imagen i {
        font-size: 32px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: #f3f4f6;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
    }
    
    /* Animaciones para modales */
    .modal-overlay {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .modal-overlay.modal-show {
        opacity: 1;
    }
    
    .modal-content {
        transform: scale(0.9) translateY(-20px);
        transition: transform 0.3s ease;
    }
    
    .modal-overlay.modal-show .modal-content {
        transform: scale(1) translateY(0);
    }
`;
document.head.appendChild(carritoStyle);

// ========================================
// FUNCIONES DE VERIFICACIÓN DE SESIÓN Y PAGO
// ========================================

// Función para verificar si el cliente está logueado
function verificarSesionCliente() {
    console.log('Verificando sesión de cliente...');
    const clientSession = sessionStorage.getItem('clientSession');
    console.log('clientSession:', clientSession);
    
    if (!clientSession) {
        console.log('No hay clientSession en sessionStorage');
        return false;
    }
    
    try {
        const sessionData = JSON.parse(clientSession);
        console.log('sessionData:', sessionData);
        const esCliente = sessionData.isClient === true;
        console.log('isClient:', esCliente);
        return esCliente;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        sessionStorage.removeItem('clientSession');
        return false;
    }
}

// Función para obtener datos del cliente logueado
function obtenerDatosCliente() {
    const clientSession = sessionStorage.getItem('clientSession');
    
    if (!clientSession) {
        return null;
    }
    
    try {
        const sessionData = JSON.parse(clientSession);
        return sessionData.isClient ? sessionData : null;
    } catch (error) {
        console.error('Error al obtener datos del cliente:', error);
        return null;
    }
}

// Función para proceder al pago (verificar sesión primero)
function procederAlPago() {
    console.log('Función procederAlPago llamada');
    
    // Verificar si hay productos en el carrito
    const carritoActual = obtenerCarrito();
    console.log('Carrito actual:', carritoActual);
    
    if (!carritoActual || carritoActual.length === 0) {
        console.log('Carrito vacío, mostrando mensaje');
        // Mostrar notificación con mensaje amigable
        mostrarNotificacion('No tienes productos agregados al carrito. Ve al catálogo y selecciona algunos productos para continuar.', 'warning');
        
        // Opcional: Redirigir al catálogo después de un breve delay
        setTimeout(() => {
            window.location.href = 'catalogo.html';
        }, 3000);
        
        return;
    }
    
    // Verificar si el cliente está logueado
    const estaLogueado = verificarSesionCliente();
    console.log('¿Está logueado?', estaLogueado);
    
    if (!estaLogueado) {
        console.log('Usuario no logueado, redirigiendo al login');
        // Mostrar notificación
        mostrarNotificacion('Debes iniciar sesión para proceder al pago', 'warning');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
        return;
    }
    
    console.log('Usuario logueado, abriendo modal');
    // Si está logueado, abrir modal de validación de datos
    abrirModalValidarDatos();
}

// Exportar inmediatamente al scope global para que esté disponible en onclick
window.procederAlPago = procederAlPago;

// Función para abrir modal de validación de datos
async function abrirModalValidarDatos() {
    console.log('Función abrirModalValidarDatos llamada');
    const modal = document.getElementById('modal-validar-datos');
    console.log('Modal encontrado:', modal);
    
    if (!modal) {
        console.error('Modal de validación de datos no encontrado');
        return;
    }
    
    // Obtener datos del cliente desde sessionStorage
    const clienteData = obtenerDatosCliente();
    console.log('Datos del cliente desde sessionStorage:', clienteData);
    
    if (!clienteData || !clienteData.email) {
        console.error('No se encontraron datos del cliente o email');
        mostrarNotificacion('Error: No se encontraron datos del usuario', 'error');
        return;
    }
    
    // Actualizar el total en el modal (actualizar TODOS los elementos con clase total-amount)
    const total = obtenerTotalCarrito();
    const totalElements = modal.querySelectorAll('.total-amount');
    totalElements.forEach(element => {
        element.textContent = `$ ${formatearPrecio(total)}`;
    });
    console.log('Total actualizado en modal de validar datos:', total);
    
    // Mostrar modal primero
    console.log('Mostrando modal...');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Agregar clase para animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Agregar listener directo al botón de continuar al pago como respaldo
    setTimeout(() => {
        const btnContinuar = modal.querySelector('button[onclick*="continuarAlPago"]');
        if (btnContinuar) {
            // Remover listener anterior si existe
            if (btnContinuar._continuarListener) {
                btnContinuar.removeEventListener('click', btnContinuar._continuarListener);
            }
            
            // Agregar listener directo
            btnContinuar._continuarListener = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botón continuar al pago clickeado (listener directo)');
                continuarAlPago();
            };
            btnContinuar.addEventListener('click', btnContinuar._continuarListener);
        }
    }, 100);
    
    // Mostrar loading mientras se cargan los datos
    mostrarLoadingEnModal(true);
    
    try {
        // Obtener datos completos del usuario desde la API
        console.log('Obteniendo datos del usuario desde API...');
        console.log('Email del cliente:', clienteData.email);
        console.log('URL completa:', `${getAPIBaseURL()}/usuarios/perfil/${encodeURIComponent(clienteData.email)}`);
        
        const response = await fetch(`${getAPIBaseURL()}/clientes/perfil/${encodeURIComponent(clienteData.email)}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const usuarioData = await response.json();
        console.log('Datos del usuario desde API:', usuarioData);
        
        // Llenar campos con datos reales de la base de datos
        llenarCamposConDatosReales(usuarioData);
        
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        
        // Si falla la API, usar datos básicos de sessionStorage
        console.log('Usando datos básicos de sessionStorage como fallback');
        llenarCamposConDatosBasicos(clienteData);
        
        mostrarNotificacion('Advertencia: No se pudieron cargar todos los datos. Algunos campos pueden estar vacíos.', 'warning');
    } finally {
        // Ocultar loading
        mostrarLoadingEnModal(false);
    }
}

// Función para llenar campos con datos reales de la base de datos
function llenarCamposConDatosReales(usuarioData) {
    console.log('Llenando campos con datos reales:', usuarioData);
    
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const referenciasInput = document.getElementById('referencias');
    
    // Mapear campos de la base de datos (nombre_cliente, apellido_cliente) a los campos del formulario
    if (nombreInput) nombreInput.value = usuarioData.nombre_cliente || usuarioData.nombre || '';
    if (apellidoInput) apellidoInput.value = usuarioData.apellido_cliente || usuarioData.apellido || '';
    if (telefonoInput) telefonoInput.value = usuarioData.telefono || '';
    if (direccionInput) direccionInput.value = usuarioData.direccion || '';
    if (referenciasInput) referenciasInput.value = ''; // Campo de referencias (no está en BD)
    
    // Asegurar que nombre y apellido estén siempre bloqueados
    if (nombreInput) {
        nombreInput.readOnly = true;
        nombreInput.style.backgroundColor = '#f9fafb';
        nombreInput.style.cursor = 'not-allowed';
    }
    if (apellidoInput) {
        apellidoInput.readOnly = true;
        apellidoInput.style.backgroundColor = '#f9fafb';
        apellidoInput.style.cursor = 'not-allowed';
    }
    
    console.log('Campos llenados exitosamente');
}

// Función para llenar campos con datos básicos de sessionStorage (fallback)
function llenarCamposConDatosBasicos(clienteData) {
    console.log('Llenando campos con datos básicos:', clienteData);
    
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const referenciasInput = document.getElementById('referencias');
    
    // Llenar campos con datos básicos disponibles de sessionStorage
    // Los datos pueden venir como nombre_cliente/apellido_cliente o name
    if (nombreInput) nombreInput.value = clienteData.nombre_cliente || clienteData.name || '';
    if (apellidoInput) apellidoInput.value = clienteData.apellido_cliente || clienteData.apellido || '';
    if (telefonoInput) telefonoInput.value = clienteData.telefono || '';
    if (direccionInput) direccionInput.value = clienteData.direccion || '';
    if (referenciasInput) referenciasInput.value = ''; // Campo de referencias
    
    // Asegurar que nombre y apellido estén siempre bloqueados
    if (nombreInput) {
        nombreInput.readOnly = true;
        nombreInput.style.backgroundColor = '#f9fafb';
        nombreInput.style.cursor = 'not-allowed';
    }
    if (apellidoInput) {
        apellidoInput.readOnly = true;
        apellidoInput.style.backgroundColor = '#f9fafb';
        apellidoInput.style.cursor = 'not-allowed';
    }
}

// Función para mostrar/ocultar loading en el modal
function mostrarLoadingEnModal(mostrar) {
    const modal = document.getElementById('modal-validar-datos');
    if (!modal) return;
    
    let loadingElement = document.getElementById('modal-loading');
    
    if (mostrar) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'modal-loading';
            loadingElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
                    <span>Cargando datos del usuario...</span>
                </div>
            `;
            loadingElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            modal.appendChild(loadingElement);
        }
        loadingElement.style.display = 'flex';
    } else {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// Función para cerrar modal de validación de datos
function cerrarModalValidarDatos() {
    const modal = document.getElementById('modal-validar-datos');
    if (!modal) return;
    
    // Remover clase de animación
    modal.classList.remove('show');
    
    // Ocultar modal después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }, 300);
}

// Función para validar datos del cliente
function validarDatosCliente() {
    try {
        const nombreInput = document.getElementById('nombre');
        const apellidoInput = document.getElementById('apellido');
        const telefonoInput = document.getElementById('telefono');
        const direccionInput = document.getElementById('direccion');
        
        // Verificar que los elementos existan
        if (!nombreInput || !apellidoInput || !telefonoInput || !direccionInput) {
            console.error('Error: No se encontraron los campos del formulario');
            mostrarNotificacion('Error: No se encontraron los campos del formulario', 'error');
            return false;
        }
        
        const nombre = nombreInput.value.trim();
        const apellido = apellidoInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const direccion = direccionInput.value.trim();
    
    // Validaciones básicas - solo campos obligatorios
    if (!nombre) {
        mostrarNotificacion('El nombre es obligatorio', 'error');
            nombreInput.focus();
        return false;
    }
    
    if (!apellido) {
        mostrarNotificacion('El apellido es obligatorio', 'error');
            apellidoInput.focus();
        return false;
    }
    
    if (!telefono) {
        mostrarNotificacion('El teléfono es obligatorio', 'error');
            telefonoInput.focus();
        return false;
    }
    
    if (!direccion) {
        mostrarNotificacion('La dirección es obligatoria', 'error');
            direccionInput.focus();
        return false;
    }
    
    // Validar formato de teléfono (opcional)
    if (telefono && !/^[\+]?[0-9\s\-\(\)]{7,15}$/.test(telefono)) {
        mostrarNotificacion('El formato del teléfono no es válido', 'error');
            telefonoInput.focus();
        return false;
    }
    
    // Las referencias son opcionales, no necesitan validación
    
    return true;
    } catch (error) {
        console.error('Error en validarDatosCliente:', error);
        mostrarNotificacion('Error al validar los datos: ' + error.message, 'error');
        return false;
    }
}

// Función para alternar modo de edición en el modal de validación
function toggleEditMode() {
    const editBtn = document.getElementById('edit-btn');
    
    // Campos que SÍ se pueden editar
    const camposEditables = [
        document.getElementById('telefono'),
        document.getElementById('direccion'),
        document.getElementById('referencias')
    ];
    
    // Campos que NUNCA se pueden editar (siempre bloqueados)
    const camposBloqueados = [
        document.getElementById('nombre'),
        document.getElementById('apellido')
    ];
    
    if (!editBtn || !camposEditables.length) {
        console.error('Elementos del modal de edición no encontrados');
        return;
    }
    
    const isEditing = editBtn.textContent.includes('Guardar');
    
    if (isEditing) {
        // Cambiar a modo de solo lectura
        camposEditables.forEach(input => {
            if (input) {
                input.readOnly = true;
                input.style.backgroundColor = '#f9fafb';
                input.style.cursor = 'not-allowed';
            }
        });
        
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
        editBtn.classList.remove('btn-success');
        editBtn.classList.add('btn-secondary');
        
        mostrarNotificacion('Modo de solo lectura activado', 'info');
    } else {
        // Cambiar a modo de edición (solo campos editables)
        camposEditables.forEach(input => {
            if (input) {
                input.readOnly = false;
                input.style.backgroundColor = '#ffffff';
                input.style.cursor = 'text';
            }
        });
        
        editBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-success');
        
        mostrarNotificacion('Modo de edición activado - Solo puedes editar teléfono, dirección y referencias', 'success');
    }
    
    // Asegurar que los campos bloqueados siempre estén bloqueados
    camposBloqueados.forEach(input => {
        if (input) {
            input.readOnly = true;
            input.style.backgroundColor = '#f9fafb';
            input.style.cursor = 'not-allowed';
        }
    });
}

// Función para continuar al pago (desde modal de validar datos)
function continuarAlPago() {
    console.log('Función continuarAlPago llamada');
    
    try {
        // Validar datos del cliente antes de continuar
    if (!validarDatosCliente()) {
            console.log('Validación de datos fallida');
            return false;
        }
        
        // Guardar datos del cliente en sessionStorage para uso posterior
        const nombreInput = document.getElementById('nombre');
        const apellidoInput = document.getElementById('apellido');
        const telefonoInput = document.getElementById('telefono');
        const direccionInput = document.getElementById('direccion');
        const emailInput = document.getElementById('email');
        
        if (nombreInput && apellidoInput && telefonoInput && direccionInput) {
            const datosClienteFormulario = {
                nombre: nombreInput.value.trim(),
                apellido: apellidoInput.value.trim(),
                telefono: telefonoInput.value.trim(),
                direccion: direccionInput.value.trim(),
                email: emailInput ? emailInput.value.trim() : null
            };
            
            // Guardar en sessionStorage
            sessionStorage.setItem('datosClienteFormulario', JSON.stringify(datosClienteFormulario));
            console.log('Datos del cliente guardados en sessionStorage:', datosClienteFormulario);
        }
        
        console.log('Datos validados correctamente, cerrando modal de validación y abriendo modal de pago');
        
        // Cerrar modal de validar datos
        cerrarModalValidarDatos();
        
        // Abrir modal de método de pago después de un breve delay para la animación
        setTimeout(() => {
            abrirModalMetodoPago();
        }, 300);
        
        return true;
    } catch (error) {
        console.error('Error en continuarAlPago:', error);
        mostrarNotificacion('Error al continuar al pago: ' + error.message, 'error');
        return false;
    }
}

function abrirModalMetodoPago() {
    console.log('Abriendo modal de método de pago');
    const modal = document.getElementById('modal-metodo-pago');
    
    if (!modal) {
        console.error('Modal de método de pago no encontrado');
        mostrarNotificacion('Error: No se pudo abrir el modal de pago', 'error');
        return;
    }
    
    // Actualizar el total en el modal (actualizar TODOS los elementos con clase total-amount)
    const total = obtenerTotalCarrito();
    const totalElements = modal.querySelectorAll('.total-amount');
    totalElements.forEach(element => {
        element.textContent = `$ ${formatearPrecio(total)}`;
    });
    console.log('Total actualizado en modal de método de pago:', total);
    
    // Desmarcar cualquier método de pago seleccionado
    const radios = modal.querySelectorAll('input[name="metodo-pago"]');
    radios.forEach(radio => radio.checked = false);
    
    // Agregar listeners específicos a los labels y radios para prevenir propagación
    const paymentOptions = modal.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        // Remover listeners anteriores si existen
        if (option._clickListener) {
            option.removeEventListener('click', option._clickListener);
        }
        
        // Agregar listener que previene propagación y evita que se active cualquier otra función
        option._clickListener = function(e) {
            // Detener la propagación inmediatamente para evitar que otros listeners se activen
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Asegurar que el radio se seleccione
            const radio = option.querySelector('input[type="radio"]');
            if (radio) {
                // No usar preventDefault para permitir que el radio funcione normalmente
                // Solo seleccionar el radio si no está ya seleccionado
                if (!radio.checked) {
                    radio.checked = true;
                    // Disparar evento change para notificar el cambio
                    radio.dispatchEvent(new Event('change', { bubbles: false }));
                }
            }
        };
        // Usar capture phase con alta prioridad para interceptar antes que otros listeners
        option.addEventListener('click', option._clickListener, { capture: true, passive: false });
        
        // También agregar listener al radio directamente
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            if (radio._clickListener) {
                radio.removeEventListener('click', radio._clickListener);
            }
            radio._clickListener = function(e) {
                // Detener propagación para evitar que se active cualquier otra función
                e.stopPropagation();
                e.stopImmediatePropagation();
            };
            // Usar capture phase con alta prioridad
            radio.addEventListener('click', radio._clickListener, { capture: true, passive: false });
        }
        
        // También agregar listener al contenido del label (el div payment-option-content)
        const optionContent = option.querySelector('.payment-option-content');
        if (optionContent) {
            if (optionContent._clickListener) {
                optionContent.removeEventListener('click', optionContent._clickListener);
            }
            optionContent._clickListener = function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                // Seleccionar el radio asociado
                const radio = option.querySelector('input[type="radio"]');
                if (radio && !radio.checked) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: false }));
                }
            };
            optionContent.addEventListener('click', optionContent._clickListener, { capture: true, passive: false });
        }
    });
    
    // Agregar listener al modal-content para prevenir que se cierre al hacer clic dentro
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // Remover listener anterior si existe
        if (modalContent._clickListener) {
            modalContent.removeEventListener('click', modalContent._clickListener);
        }
        
        // Agregar listener que previene propagación
        modalContent._clickListener = function(e) {
            // No prevenir propagación si es un botón o elemento interactivo que necesita funcionar
            const isButton = e.target.tagName === 'BUTTON' || e.target.closest('button');
            if (!isButton) {
                e.stopPropagation();
            }
        };
        modalContent.addEventListener('click', modalContent._clickListener);
    }
    
    // Agregar listener al overlay para cerrar solo si se hace clic directamente en él (no en su contenido)
    if (modal._overlayClickListener) {
        modal.removeEventListener('click', modal._overlayClickListener);
    }
    
    modal._overlayClickListener = function(e) {
        // Solo cerrar si se hace clic directamente en el overlay, no en su contenido
        if (e.target === modal) {
            cerrarModal('modal-metodo-pago');
        }
    };
    modal.addEventListener('click', modal._overlayClickListener);
    
    // Mostrar modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Agregar clase para animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    console.log('Modal de método de pago abierto');
}

// Función para cerrar modal genérico
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.error(`Modal ${modalId} no encontrado`);
        return;
    }
    
    // Remover clase de animación
    modal.classList.remove('show');
    
    // Ocultar modal después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }, 300);
}

// Función para obtener el método de pago seleccionado
function obtenerMetodoPagoSeleccionado() {
    const radios = document.querySelectorAll('input[name="metodo-pago"]');
    for (const radio of radios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return null;
}

// Función para procesar el pago
function procesarPago() {
    // Obtener método de pago seleccionado
    const metodoPago = obtenerMetodoPagoSeleccionado();
    
    if (!metodoPago) {
        mostrarNotificacion('Por favor selecciona un método de pago', 'error');
        return;
    }
    
        // Restaurar botón
    const btnProcesar = document.getElementById('btn-procesar-pago');
    if (btnProcesar) {
        btnProcesar.disabled = false;
    }
    
    // Cerrar modal de método de pago
    cerrarModal('modal-metodo-pago');
    
    // Procesar según el método seleccionado
    switch(metodoPago) {
        case 'nequi':
        case 'daviplata':
            mostrarInstruccionesTransferencia(metodoPago);
            break;
        case 'bancolombia':
            mostrarInstruccionesBancolombia();
            break;
        case 'efectivo':
            abrirModalEfectivo();
            break;
        default:
            mostrarNotificacion('Método de pago no reconocido', 'error');
    }
}

// Función para mostrar instrucciones de transferencia (Nequi/Daviplata)
function mostrarInstruccionesTransferencia(metodo) {
    const config = CONFIG_PAGOS[metodo];
    const total = obtenerTotalCarrito();
    
    // Abrir modal de instrucciones de transferencia
    abrirModalInstruccionesTransferencia(metodo, config, total);
}

// Función para abrir modal de instrucciones de transferencia
function abrirModalInstruccionesTransferencia(metodo, config, total) {
    const modal = document.getElementById('modal-instrucciones-transferencia');
    if (!modal) {
        console.error('Modal de instrucciones de transferencia no encontrado');
        return;
    }
    
    // Cerrar modal de método de pago
    cerrarModal('modal-metodo-pago');
    
    // Actualizar título
    const titulo = document.getElementById('transferencia-titulo');
    if (titulo) {
        titulo.textContent = `Transferencia ${config.nombre}`;
    }
    
    // Actualizar número de WhatsApp
    const whatsappElement = document.getElementById('transferencia-whatsapp');
    if (whatsappElement && config.whatsapp) {
        // Formatear número para mostrar (321 123 4567)
        const numeroFormateado = config.whatsapp.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        whatsappElement.textContent = numeroFormateado;
    }
    
    // Actualizar total
    const totalElement = document.getElementById('transferencia-total');
    if (totalElement) {
        totalElement.textContent = `$ ${formatearPrecio(total)}`;
    }
    
    // Actualizar enlace de WhatsApp
    const linkWhatsApp = document.getElementById('link-whatsapp-transferencia');
    if (linkWhatsApp && config.whatsapp) {
        // Remover listener anterior si existe
        linkWhatsApp.onclick = null;
        
        // Agregar listener para crear pedido y notificación antes de abrir WhatsApp
        linkWhatsApp.onclick = async function(e) {
            e.preventDefault();
            
            try {
                // Mostrar mensaje de carga
                mostrarNotificacion('Creando pedido y notificación...', 'info');
                
                // Siempre crear el pedido y la notificación
                const pedidoData = await confirmarPedido('transferencia');
                
                if (!pedidoData || !pedidoData.id_pedido) {
                    throw new Error('No se pudo crear el pedido');
                }
                
                // Crear mensaje para WhatsApp
                const nombreCliente = pedidoData.nombre_cliente || 'Cliente';
                const totalPedido = pedidoData.total || total;
                const mensaje = encodeURIComponent(`Hola, quiero enviar el comprobante de transferencia de mi pedido por ${config.nombre} por un valor de $${formatearPrecio(totalPedido)}.`);
                const urlWhatsApp = `https://wa.me/${config.whatsapp}?text=${mensaje}`;
                
                // Abrir WhatsApp
                window.open(urlWhatsApp, '_blank');
                
                mostrarNotificacion('¡Pedido y notificación creados! Puedes enviar el comprobante por WhatsApp.', 'success');
                
                // Cerrar todos los modales abiertos
                cerrarModal('modal-instrucciones-transferencia');
                cerrarModal('modal-metodo-pago');
                cerrarModal('modal-validar-datos');
                
                // Limpiar carrito directamente (sin modal)
                limpiarCarritoDirectamente();
                
                // Limpiar datos del pedido de sessionStorage
                sessionStorage.removeItem('pedidoCreado');
                sessionStorage.removeItem('datosClienteFormulario');
                
                // Redirigir al catálogo después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'catalogo.html';
                }, 2000);
            } catch (error) {
                console.error('Error al procesar pedido:', error);
                mostrarNotificacion('Error al crear el pedido: ' + error.message, 'error');
            }
        };
        
        // Mantener href por si acaso
        const mensaje = encodeURIComponent(`Hola, quiero enviar el comprobante de transferencia de mi pedido por ${config.nombre} por un valor de $${formatearPrecio(total)}.`);
        linkWhatsApp.href = `https://wa.me/${config.whatsapp}?text=${mensaje}`;
    }
    
    // Prevenir cierre al hacer clic dentro del modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // Remover listener anterior si existe
        if (modalContent._clickListener) {
            modalContent.removeEventListener('click', modalContent._clickListener);
        }
        modalContent._clickListener = function(e) {
            e.stopPropagation();
        };
        modalContent.addEventListener('click', modalContent._clickListener);
    }
    
    // Agregar listener al overlay para cerrar solo si se hace clic directamente en él
    if (modal._overlayClickListener) {
        modal.removeEventListener('click', modal._overlayClickListener);
    }
    modal._overlayClickListener = function(e) {
        // Solo cerrar si se hace clic directamente en el overlay, no en su contenido
        if (e.target === modal) {
            cerrarModal('modal-instrucciones-transferencia');
        }
    };
    modal.addEventListener('click', modal._overlayClickListener);
    
    // Mostrar modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Agregar clase para animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Función para mostrar instrucciones de Bancolombia
function mostrarInstruccionesBancolombia() {
    const config = CONFIG_PAGOS.bancolombia;
    const total = obtenerTotalCarrito();
    
    // Abrir modal de instrucciones de Bancolombia
    abrirModalInstruccionesBancolombia(config, total);
}

// Función para abrir modal de instrucciones de Bancolombia
function abrirModalInstruccionesBancolombia(config, total) {
    const modal = document.getElementById('modal-instrucciones-bancolombia');
    if (!modal) {
        console.error('Modal de instrucciones de Bancolombia no encontrado');
        return;
    }
    
    // Cerrar modal de método de pago
    cerrarModal('modal-metodo-pago');
    
    // Actualizar título
    const titulo = document.getElementById('bancolombia-titulo');
    if (titulo) {
        titulo.textContent = `Transferencia ${config.nombre} ${config.tipo}`;
    }
    
    // Actualizar número de cuenta
    const cuentaElement = document.getElementById('bancolombia-cuenta');
    if (cuentaElement) {
        cuentaElement.textContent = config.numero;
    }
    
    // Actualizar tipo de cuenta
    const tipoElement = document.getElementById('bancolombia-tipo');
    if (tipoElement) {
        tipoElement.textContent = config.tipo;
    }
    
    // Actualizar número de WhatsApp
    const whatsappElement = document.getElementById('bancolombia-whatsapp');
    if (whatsappElement && config.whatsapp) {
        // Formatear número para mostrar (321 123 4567)
        const numeroFormateado = config.whatsapp.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        whatsappElement.textContent = numeroFormateado;
    }
    
    // Actualizar total
    const totalElement = document.getElementById('bancolombia-total');
    if (totalElement) {
        totalElement.textContent = `$ ${formatearPrecio(total)}`;
    }
    
    // Actualizar enlace de WhatsApp
    const linkWhatsApp = document.getElementById('link-whatsapp-bancolombia');
    if (linkWhatsApp && config.whatsapp) {
        // Remover listener anterior si existe
        linkWhatsApp.onclick = null;
        
        // Agregar listener para crear pedido y notificación antes de abrir WhatsApp
        linkWhatsApp.onclick = async function(e) {
            e.preventDefault();
            
            try {
                // Mostrar mensaje de carga
                mostrarNotificacion('Creando pedido y notificación...', 'info');
                
                // Siempre crear el pedido y la notificación
                const pedidoData = await confirmarPedido('transferencia');
                
                if (!pedidoData || !pedidoData.id_pedido) {
                    throw new Error('No se pudo crear el pedido');
                }
                
                // Crear mensaje para WhatsApp
                const nombreCliente = pedidoData.nombre_cliente || 'Cliente';
                const totalPedido = pedidoData.total || total;
                const mensaje = encodeURIComponent(`Hola, quiero enviar el comprobante de transferencia de mi pedido por ${config.nombre} ${config.tipo} por un valor de $${formatearPrecio(totalPedido)}.`);
                const urlWhatsApp = `https://wa.me/${config.whatsapp}?text=${mensaje}`;
                
                // Abrir WhatsApp
                window.open(urlWhatsApp, '_blank');
                
                mostrarNotificacion('¡Pedido y notificación creados! Puedes enviar el comprobante por WhatsApp.', 'success');
                
                // Cerrar todos los modales abiertos
                cerrarModal('modal-instrucciones-bancolombia');
                cerrarModal('modal-metodo-pago');
                cerrarModal('modal-validar-datos');
                
                // Limpiar carrito directamente (sin modal)
                limpiarCarritoDirectamente();
                
                // Limpiar datos del pedido de sessionStorage
                sessionStorage.removeItem('pedidoCreado');
                sessionStorage.removeItem('datosClienteFormulario');
                
                // Redirigir al catálogo después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'catalogo.html';
                }, 2000);
            } catch (error) {
                console.error('Error al procesar pedido:', error);
                mostrarNotificacion('Error al crear el pedido: ' + error.message, 'error');
            }
        };
        
        // Mantener href por si acaso
        const mensaje = encodeURIComponent(`Hola, quiero enviar el comprobante de transferencia de mi pedido por ${config.nombre} ${config.tipo} por un valor de $${formatearPrecio(total)}.`);
        linkWhatsApp.href = `https://wa.me/${config.whatsapp}?text=${mensaje}`;
    }
    
    // Prevenir cierre al hacer clic dentro del modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // Remover listener anterior si existe
        if (modalContent._clickListener) {
            modalContent.removeEventListener('click', modalContent._clickListener);
        }
        modalContent._clickListener = function(e) {
            e.stopPropagation();
        };
        modalContent.addEventListener('click', modalContent._clickListener);
    }
    
    // Agregar listener al overlay para cerrar solo si se hace clic directamente en él
    if (modal._overlayClickListener) {
        modal.removeEventListener('click', modal._overlayClickListener);
    }
    modal._overlayClickListener = function(e) {
        // Solo cerrar si se hace clic directamente en el overlay, no en su contenido
        if (e.target === modal) {
            cerrarModal('modal-instrucciones-bancolombia');
        }
    };
    modal.addEventListener('click', modal._overlayClickListener);
    
    // Mostrar modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Agregar clase para animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Función para abrir modal de efectivo
function abrirModalEfectivo() {
    const modal = document.getElementById('modal-cambio-efectivo');
    const total = obtenerTotalCarrito();
    
    if (!modal) {
        console.error('Modal de efectivo no encontrado');
        mostrarNotificacion('Error: No se pudo abrir el modal de efectivo', 'error');
        return;
    }
    
    // Actualizar el total en el modal (actualizar TODOS los elementos con clase total-amount y pago-amount)
    const totalElements = modal.querySelectorAll('.total-amount, .pago-amount');
    totalElements.forEach(element => {
        element.textContent = `$ ${formatearPrecio(total)}`;
    });
    console.log('Total actualizado en modal de efectivo:', total);
    
    // Actualizar el mínimo del input
    const montoInput = document.getElementById('monto-recibido');
    if (montoInput) {
        montoInput.min = total;
        montoInput.value = '';
    }
    
    // Limpiar preview de cambio
    const cambioPreview = document.getElementById('cambio-preview');
    if (cambioPreview) {
        cambioPreview.style.display = 'none';
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Agregar clase para animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Agregar event listener para calcular cambio en tiempo real
    if (montoInput) {
        montoInput.addEventListener('input', calcularCambio);
    }
}

// Función para calcular el cambio
function calcularCambio() {
    const montoInput = document.getElementById('monto-recibido');
    const total = obtenerTotalCarrito();
    const cambioPreview = document.getElementById('cambio-preview');
    
    if (!montoInput || !cambioPreview) return;
    
    const montoRecibido = parseFloat(montoInput.value) || 0;
    
    if (montoRecibido >= total) {
        const cambio = montoRecibido - total;
        cambioPreview.style.display = 'flex';
        cambioPreview.querySelector('.cambio-amount').textContent = `$ ${formatearPrecio(cambio)}`;
    } else {
        cambioPreview.style.display = 'none';
    }
}

// Función para procesar pago en efectivo
function procesarPagoEfectivo() {
    const montoInput = document.getElementById('monto-recibido');
    const total = obtenerTotalCarrito();
    
    if (!montoInput) {
        mostrarNotificacion('Error: No se encontró el campo de monto', 'error');
        return;
    }
    
    const montoRecibido = parseFloat(montoInput.value) || 0;
    
    if (montoRecibido < total) {
        mostrarNotificacion(`El monto debe ser mayor o igual al total: $${formatearPrecio(total)}`, 'error');
        montoInput.focus();
        return;
    }
    
    const cambio = montoRecibido - total;
    
    // Cerrar modal de efectivo
    cerrarModal('modal-cambio-efectivo');
    
    // Mostrar confirmación
    const mensaje = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; color: #10b981; margin-bottom: 15px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="margin-bottom: 15px; color: #1f2937;">Pago en Efectivo Confirmado</h3>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0; color: #374151;"><strong>Total del pedido:</strong></p>
                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 10px 0;">
                    $${formatearPrecio(total)}
                </p>
                <p style="margin: 5px 0; color: #374151;"><strong>Monto recibido:</strong></p>
                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 10px 0;">
                    $${formatearPrecio(montoRecibido)}
                </p>
                <p style="margin: 5px 0; color: #374151;"><strong>Cambio:</strong></p>
                <p style="font-size: 20px; font-weight: bold; color: #10b981; margin: 10px 0;">
                    $${formatearPrecio(cambio)}
                </p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                El repartidor llevará el cambio exacto.
            </p>
        </div>
    `;
    
    mostrarNotificacionPersonalizada(mensaje, 'success', 8000);
    
    // Procesar el pedido
    setTimeout(() => {
        confirmarPedido('efectivo', { montoRecibido, cambio });
    }, 2000);
}

// Función para confirmar el pedido (llamada después de mostrar instrucciones)
// Variable global para almacenar el pedido creado
let pedidoCreado = null;

async function confirmarPedido(metodoPago, datosAdicionales = {}) {
    try {
        
        // Intentar obtener datos del cliente desde los inputs del modal (con diferentes IDs posibles)
        let nombreInput = document.getElementById('nombre-cliente') || document.getElementById('nombre');
        let apellidoInput = document.getElementById('apellido-cliente') || document.getElementById('apellido');
        let telefonoInput = document.getElementById('telefono-cliente') || document.getElementById('telefono');
        let direccionInput = document.getElementById('direccion-cliente') || document.getElementById('direccion');
        let emailInput = document.getElementById('email-cliente') || document.getElementById('email');
        
        let nombreCliente, apellidoCliente, telefonoCliente, direccionCliente, emailCliente;
        
        // Si los inputs están disponibles, obtener valores de ellos
        if (nombreInput && apellidoInput && telefonoInput && direccionInput) {
            nombreCliente = nombreInput.value.trim();
            apellidoCliente = apellidoInput.value.trim();
            telefonoCliente = telefonoInput.value.trim();
            direccionCliente = direccionInput.value.trim();
            emailCliente = emailInput ? emailInput.value.trim() : null;
        } else {
            // Si no están disponibles, intentar obtener desde sessionStorage
            // Primero intentar desde datosClienteFormulario (más reciente)
            let clienteData = null;
            const datosFormulario = sessionStorage.getItem('datosClienteFormulario');
            if (datosFormulario) {
                try {
                    clienteData = JSON.parse(datosFormulario);
                    console.log('Datos del cliente obtenidos desde datosClienteFormulario:', clienteData);
                } catch (e) {
                    console.error('Error al parsear datosClienteFormulario:', e);
                }
            }
            
            // Si no hay datos del formulario, intentar desde sessionStorage del cliente logueado
            if (!clienteData) {
                clienteData = obtenerDatosCliente();
            }
            
            if (!clienteData) {
                throw new Error('Faltan datos del cliente. Por favor, completa el formulario de datos primero.');
            }
            
            nombreCliente = clienteData.nombre || clienteData.nombre_cliente || '';
            apellidoCliente = clienteData.apellido || clienteData.apellido_cliente || '';
            telefonoCliente = clienteData.telefono || clienteData.telefono_cliente || '';
            direccionCliente = clienteData.direccion || clienteData.direccion_cliente || '';
            emailCliente = clienteData.email || clienteData.email_cliente || null;
        }
        
        // Validar que los datos mínimos estén presentes
        if (!nombreCliente || !apellidoCliente || !telefonoCliente || !direccionCliente) {
            throw new Error('Faltan datos del cliente. Por favor, completa el formulario de datos primero.');
        }
        
        // Obtener o crear cliente
        let idCliente = null;
        try {
            // Intentar obtener cliente por teléfono
            const clienteResponse = await fetch(`${getAPIBaseURL()}/clientes?telefono=${telefonoCliente}`);
            if (clienteResponse.ok) {
                const clientes = await clienteResponse.json();
                if (clientes && clientes.length > 0) {
                    idCliente = clientes[0].id_cliente;
                }
            }
            
            // Si no existe, crear cliente
            if (!idCliente) {
                const crearClienteResponse = await fetch(`${getAPIBaseURL()}/clientes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre_cliente: nombreCliente,
                        apellido_cliente: apellidoCliente,
                        tipo_documento: 'CC',
                        numero_documento: telefonoCliente,
                        telefono: telefonoCliente,
                        direccion: direccionCliente,
                        email: emailCliente,
                        clave: 'temp123' // Clave temporal
                    })
                });
                
                if (crearClienteResponse.ok) {
                    const nuevoCliente = await crearClienteResponse.json();
                    idCliente = nuevoCliente.id_cliente || nuevoCliente.cliente?.id_cliente;
                }
            }
        } catch (error) {
            console.error('Error al obtener/crear cliente:', error);
        }
        
        // Calcular total
        const total = obtenerTotalCarrito();
        
        // Preparar detalles del pedido
        const detalle = carrito.map(item => ({
            id_producto: parseInt(item.id),
            cantidad: parseFloat(item.cantidad),
            unidad: item.unidad_medida || 'lb',
            precio_unitario: parseFloat(item.precio)
        }));
        
        // Normalizar método de pago
        let metodoPagoNormalizado = metodoPago;
        if (metodoPagoNormalizado) {
            metodoPagoNormalizado = metodoPagoNormalizado.charAt(0).toUpperCase() + metodoPagoNormalizado.slice(1).toLowerCase();
        }
        
        // Crear pedido en el backend
        const pedidoResponse = await fetch(`${getAPIBaseURL()}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_cliente: idCliente || null,
                fecha_pedido: typeof getCurrentDateTimeMySQL === 'function' ? getCurrentDateTimeMySQL() : new Date().toISOString().slice(0, 19).replace('T', ' '),
                metodo_pago: metodoPagoNormalizado,
                total: total,
                estado: 'Pendiente'
            })
        });
        
        if (!pedidoResponse.ok) {
            const error = await pedidoResponse.json();
            throw new Error(error.error || 'Error al crear el pedido');
        }
        
        const pedidoResult = await pedidoResponse.json();
        const pedidoIdCreado = pedidoResult.id_pedido || pedidoResult.insertId;
        
        if (!pedidoIdCreado) {
            throw new Error('No se pudo obtener el ID del pedido creado');
        }
        
        console.log('Pedido creado:', pedidoIdCreado);
        
        // Preparar datos de productos para la notificación
        const productosNotificacion = carrito.map((item, index) => ({
            id_producto: parseInt(item.id),
            nombre: item.nombre,
            cantidad: parseFloat(item.cantidad),
            unidad: item.unidad_medida || 'lb',
            precio_unitario: parseFloat(item.precio),
            subtotal: parseFloat(item.precio * item.cantidad)
        }));
        
        // Crear notificación (OBLIGATORIO - no continuar si falla)
        const notificacionResponse = await fetch(`${getAPIBaseURL()}/notificaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_pedido: pedidoIdCreado,
                id_detalle_pedido: [], // Se llenará cuando se acepte el pedido
                nombre_cliente: `${nombreCliente} ${apellidoCliente}`,
                telefono_cliente: telefonoCliente,
                email_cliente: emailCliente,
                direccion_cliente: direccionCliente,
                productos: productosNotificacion,
                total_pedido: total,
                metodo_pago: metodoPagoNormalizado,
                observaciones: datosAdicionales.observaciones || null
            })
        });
        
        if (!notificacionResponse.ok) {
            const error = await notificacionResponse.json();
            console.error('Error al crear notificación:', error);
            throw new Error('Error al crear la notificación: ' + (error.error || 'Error desconocido'));
        }
        
        const notificacionResult = await notificacionResponse.json();
        console.log('Notificación creada correctamente:', notificacionResult.notificacion?.id_notificacion);
        
        // Guardar datos del pedido para usar en WhatsApp
        pedidoCreado = {
            id_pedido: pedidoIdCreado,
            id_notificacion: notificacionResult.notificacion?.id_notificacion || null,
            nombre_cliente: `${nombreCliente} ${apellidoCliente}`,
            telefono: telefonoCliente,
            total: total,
            metodo_pago: metodoPagoNormalizado
        };
        
        // Guardar en sessionStorage
        sessionStorage.setItem('pedidoCreado', JSON.stringify(pedidoCreado));
        
        console.log('Pedido y notificación creados exitosamente:', pedidoCreado);
        
        return pedidoCreado;
    } catch (error) {
        console.error('Error al confirmar pedido:', error);
        mostrarNotificacion('Error al crear el pedido: ' + error.message, 'error');
        throw error;
    }
}

// Función para mostrar notificación personalizada con HTML
function mostrarNotificacionPersonalizada(htmlContent, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `producto-notification producto-notification-${type}`;
    notification.innerHTML = htmlContent;
    notification.style.maxWidth = '500px';
    notification.style.width = '90%';
    
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
    }, duration);
}

// Función para volver al modal de validar datos
function volverValidarDatos() {
    cerrarModal('modal-metodo-pago');
    setTimeout(() => {
        abrirModalValidarDatos();
    }, 300);
}

// Función para volver al modal de método de pago
function volverMetodoPago() {
    cerrarModal('modal-cambio-efectivo');
    setTimeout(() => {
        abrirModalMetodoPago();
    }, 300);
}

// Exportar funciones para uso global
console.log('Exportando funciones de carrito.js al scope global...');
window.agregarAlCarrito = agregarAlCarrito;
// Función para actualizar la cantidad directamente desde el input
function actualizarCantidadDirecta(productoId, nuevaCantidad) {
    const cantidad = parseInt(nuevaCantidad) || 1;
    
    // Validar que la cantidad sea mínimo 1
    if (cantidad < 1) {
        // Si es menor a 1, establecer a 1
        const input = document.querySelector(`.cantidad-input[data-producto-id="${productoId}"]`);
        if (input) {
            input.value = 1;
        }
        actualizarCantidadDirecta(productoId, 1);
        return;
    }
    
    const producto = carrito.find(item => item.id === productoId);
    
    if (producto) {
        // Establecer la cantidad directamente (no sumar)
        producto.cantidad = cantidad;
        
        // Guardar en localStorage con clave específica del cliente
        const claveCarrito = obtenerClaveCarrito();
        localStorage.setItem(claveCarrito, JSON.stringify(carrito));
        
        // Actualizar badge del carrito
        actualizarBadgeCarrito();
        
        // Notificar al sistema de sesión si está disponible
        if (window.clientSession) {
            window.clientSession.updateCartBadgeFromCarrito();
        }
        
        // Actualizar la vista del carrito si estamos en esa página
        if (window.location.pathname.includes('carrito.html')) {
            cargarProductosCarrito();
        }
        
        console.log('Cantidad actualizada directamente:', productoId, 'Nueva cantidad:', producto.cantidad);
    }
}

// Función para cargar productos recomendados (más vendidos)
async function cargarProductosRecomendados() {
    const recomendadosGrid = document.getElementById('recomendados-grid');
    if (!recomendadosGrid) return;
    
    try {
        // Mostrar estado de carga
        recomendadosGrid.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--color-gray-600);">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
                <p>Cargando productos recomendados...</p>
            </div>
        `;
        
        // Llamar al endpoint de productos más vendidos (limitar a 3)
        const response = await fetch(`${getAPIBaseURL()}/productos/mas-vendidos?limite=3`);
        
        if (!response.ok) {
            throw new Error('Error al cargar productos recomendados');
        }
        
        const data = await response.json();
        const productosRecomendados = data.productos || [];
        
        // Si no hay productos vendidos, mostrar mensaje o productos por defecto
        if (productosRecomendados.length === 0) {
            recomendadosGrid.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--color-gray-500);">
                    <p>No hay productos recomendados disponibles</p>
                </div>
            `;
            return;
        }
        
        // Generar HTML para los productos recomendados
        const productosHTML = productosRecomendados.map(producto => {
            // Manejar imagen: verificar si existe y no es null/vacío
            let imagenHTML = '';
            if (producto.imagen && producto.imagen.trim() !== '' && producto.imagen !== 'null' && producto.imagen !== null) {
                // Si ya es una URL completa, usarla directamente
                if (producto.imagen.startsWith('http://') || producto.imagen.startsWith('https://')) {
                    imagenHTML = `<img src="${producto.imagen}" alt="${producto.nombre_producto}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><i class="fas fa-box" style="display:none;"></i>`;
                } 
                // Si empieza con /uploads, agregar el dominio
                else if (producto.imagen.startsWith('/uploads/')) {
                    imagenHTML = `<img src="http://localhost:3000${producto.imagen}" alt="${producto.nombre_producto}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><i class="fas fa-box" style="display:none;"></i>`;
                }
                // Si es solo el nombre del archivo, construir la ruta completa
                else {
                    const nombreArchivo = producto.imagen.trim();
                    imagenHTML = `<img src="http://localhost:3000/uploads/productos/${nombreArchivo}" alt="${producto.nombre_producto}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><i class="fas fa-box" style="display:none;"></i>`;
                }
            } else {
                // Usar icono por defecto
                imagenHTML = `<i class="fas fa-box"></i>`;
            }
            
            const precioFormateado = formatearPrecio(producto.precio_producto || 0);
            const unidadMedida = producto.unidad_medida || 'lb';
            
            return `
                <div class="recomendado-item">
                    <div class="recomendado-imagen">
                        ${imagenHTML}
                    </div>
                    <div class="recomendado-info">
                        <h5>${producto.nombre_producto || 'Producto sin nombre'}</h5>
                        <p class="recomendado-precio">$${precioFormateado}/${unidadMedida}</p>
                        <button class="btn btn-primary btn-sm" type="button" onclick="agregarAlCarrito('${producto.id_producto}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        recomendadosGrid.innerHTML = productosHTML;
        
    } catch (error) {
        console.error('Error al cargar productos recomendados:', error);
        recomendadosGrid.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--color-error);">
                <p>Error al cargar productos recomendados</p>
            </div>
        `;
    }
}

window.cambiarCantidad = cambiarCantidad;
window.actualizarCantidadDirecta = actualizarCantidadDirecta;
window.eliminarDelCarrito = eliminarDelCarrito;
window.limpiarCarrito = limpiarCarrito;
window.abrirModalLimpiarCarrito = abrirModalLimpiarCarrito;
window.cerrarModalLimpiarCarrito = cerrarModalLimpiarCarrito;
window.confirmarLimpiarCarrito = confirmarLimpiarCarrito;
window.cargarProductosRecomendados = cargarProductosRecomendados;
window.obtenerCarrito = obtenerCarrito;
window.obtenerTotalCarrito = obtenerTotalCarrito;
window.obtenerCantidadTotalCarrito = obtenerCantidadTotalCarrito;
window.procederAlPago = procederAlPago;
console.log('Función procederAlPago exportada:', typeof window.procederAlPago);
window.abrirModalValidarDatos = abrirModalValidarDatos;
window.cerrarModalValidarDatos = cerrarModalValidarDatos;
window.continuarAlPago = continuarAlPago;
window.abrirModalMetodoPago = abrirModalMetodoPago;
window.cerrarModal = cerrarModal;
window.procesarPago = procesarPago;
window.procesarPagoEfectivo = procesarPagoEfectivo;
window.volverValidarDatos = volverValidarDatos;
window.volverMetodoPago = volverMetodoPago;
window.calcularCambio = calcularCambio;
window.toggleEditMode = toggleEditMode;
