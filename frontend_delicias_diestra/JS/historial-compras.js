// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', function() {
    const clientSession = sessionStorage.getItem('clientSession');
    if (!clientSession) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const sessionData = JSON.parse(clientSession);
        if (!sessionData.isClient) {
            window.location.href = 'login.html';
            return;
        }

        // Obtener ID del cliente
        let clienteId = sessionData.id;
        
        // Si no hay ID, intentar obtenerlo desde el email
        if (!clienteId && sessionData.email) {
            obtenerClienteIdPorEmail(sessionData.email);
        } else if (clienteId) {
            cargarPedidos(clienteId);
        } else {
            mostrarError('No se pudo identificar el cliente');
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = 'login.html';
    }
});

// Función para obtener ID del cliente por email
async function obtenerClienteIdPorEmail(email) {
    try {
        const response = await fetch(`http://localhost:3000/api/clientes/perfil/${encodeURIComponent(email)}`);
        if (!response.ok) {
            throw new Error('Error al obtener datos del cliente');
        }
        const cliente = await response.json();
        cargarPedidos(cliente.id_cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        mostrarError('Error al cargar los datos del cliente');
    }
}

// Función para cargar pedidos - J Rodriguez ADSO
async function cargarPedidos(clienteId) {
    try {
        const response = await fetch(`http://localhost:3000/api/pedidos/cliente/${clienteId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }

        const pedidos = await response.json();
        
        document.getElementById('loading').style.display = 'none';

        if (pedidos.length === 0) {
            document.getElementById('empty-state').style.display = 'block';
        } else {
            document.getElementById('pedidos-container').style.display = 'block';
            mostrarPedidos(pedidos);
        }

    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        document.getElementById('loading').style.display = 'none';
        mostrarError('Error al cargar el historial de pedidos');
    }
}

// Función para mostrar pedidos
function mostrarPedidos(pedidos) {
    const pedidosList = document.getElementById('pedidos-list');
    pedidosList.innerHTML = '';

    pedidos.forEach(pedido => {
        const pedidoItem = document.createElement('div');
        pedidoItem.className = 'pedido-item';

        const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const estadoClass = `estado-${pedido.estado.toLowerCase()}`;
        const estadoTexto = pedido.estado;

        let productosHTML = '';
        if (pedido.detalle && pedido.detalle.length > 0) {
            productosHTML = pedido.detalle.map(detalle => `
                <div class="producto-item">
                    <div>
                        <div class="producto-nombre">${detalle.nombre_producto || 'Producto'}</div>
                        <div class="producto-cantidad">Cantidad: ${detalle.cantidad} ${detalle.unidad || 'unidad'}</div>
                    </div>
                    <div class="producto-precio">$${parseFloat(detalle.subtotal).toLocaleString('es-CO')}</div>
                </div>
            `).join('');
        } else {
            productosHTML = '<p style="color: var(--color-gray-500);">No hay detalles disponibles</p>';
        }

        pedidoItem.innerHTML = `
            <div class="pedido-header">
                <div class="pedido-info">
                    <div class="pedido-id">Pedido #${pedido.id_pedido}</div>
                    <div class="pedido-fecha">
                        <i class="fas fa-calendar"></i> ${fecha}
                    </div>
                    ${pedido.metodo_pago ? `
                        <div class="pedido-metodo">
                            <i class="fas fa-credit-card"></i> Método de pago: ${pedido.metodo_pago}
                        </div>
                    ` : ''}
                </div>
                <div class="pedido-estado ${estadoClass}">${estadoTexto}</div>
            </div>
            <div class="pedido-detalles">
                <div class="pedido-productos">
                    ${productosHTML}
                </div>
                <div class="pedido-total">
                    <span class="pedido-total-label">Total:</span>
                    <span class="pedido-total-valor">$${parseFloat(pedido.total).toLocaleString('es-CO')}</span>
                </div>
            </div>
        `;

        pedidosList.appendChild(pedidoItem);
    });
}

function mostrarError(mensaje) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `
        <div style="color: var(--color-error);">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${mensaje}</p>
            <a href="catalogo.html" class="btn-volver" style="margin-top: 20px;">
                <i class="fas fa-arrow-left"></i>
                Volver al Catálogo
            </a>
        </div>
    `;
}

