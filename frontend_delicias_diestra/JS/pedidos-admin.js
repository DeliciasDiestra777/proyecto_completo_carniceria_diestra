// pedidos-admin.js - Gestión de pedidos en el panel de administración
// Nota: Este archivo se complementa con el script inline en pedidos-admin.html
// Los detalles de pedido ahora usan id_producto directamente (inventario está integrado en productos)

const API_BASE_URL = 'http://localhost:3000/api';

// Función para cargar pedidos desde la API
async function cargarPedidosDesdeAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedidos`);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        return [];
    }
}

// Función para cargar productos disponibles con stock > 0 para usar en detalles de pedido
async function cargarInventarioDisponible() {
    try {
        const response = await fetch(`${API_BASE_URL}/productos`);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        const productos = await response.json();
        // Filtrar solo productos con stock disponible (stock_actual > 0) y estado activo
        return productos.filter(producto => 
            (producto.stock_actual || 0) > 0 && producto.estado === 'activo'
        );
    } catch (error) {
        console.error('Error al cargar productos disponibles:', error);
        return [];
    }
}

// Función para cargar clientes
async function cargarClientes() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        return [];
    }
}

// Función para actualizar pedido
async function actualizarPedido(id, datos) {
    try {
        const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar pedido');
        }

        const result = await response.json();
        
        // Disparar evento para recargar inventario consolidado si está abierto
        window.dispatchEvent(new CustomEvent('pedidoGuardado', {
            detail: { 
                id_pedido: id,
                action: 'update',
                estado: datos.estado
            }
        }));
        
        // Si el estado se cambió a "Entregado", también disparar evento de actualización de inventario
        if (datos.estado === 'Entregado') {
            window.dispatchEvent(new CustomEvent('inventarioActualizado', {
                detail: { 
                    action: 'pedido_entregado',
                    id_pedido: id
                }
            }));
        }
        
        return result;
    } catch (error) {
        console.error('Error al actualizar pedido:', error);
        throw error;
    }
}

// Función para crear detalle de pedido usando id_producto
async function crearDetallePedido(idPedido, detalle) {
    try {
        const response = await fetch(`${API_BASE_URL}/detalle-pedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_pedido: idPedido,
                id_producto: detalle.id_producto, // Usa id_producto directamente (inventario está en productos)
                cantidad: detalle.cantidad,
                unidad: detalle.unidad,
                precio_unitario: detalle.precio_unitario
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear detalle de pedido');
        }

        const result = await response.json();
        
        // Disparar evento para recargar inventario consolidado si está abierto
        // El trigger de la BD actualiza automáticamente salida_pedidos en productos
        window.dispatchEvent(new CustomEvent('pedidoGuardado', {
            detail: { 
                id_pedido: idPedido,
                id_detalle_pedido: result.id_detalle_pedido || result.id || result.insertId,
                action: 'create'
            }
        }));
        
        return result;
    } catch (error) {
        console.error('Error al crear detalle de pedido:', error);
        throw error;
    }
}

// Función helper para obtener información del producto (reemplaza obtenerInfoInventario)
async function obtenerInfoProducto(idProducto) {
    try {
        const response = await fetch(`${API_BASE_URL}/productos/${idProducto}`);
        if (!response.ok) {
            throw new Error('Error al obtener producto');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener información del producto:', error);
        return null;
    }
}

// Mantener compatibilidad con código existente (obtenerInfoInventario ahora usa productos)
async function obtenerInfoInventario(idProducto) {
    return await obtenerInfoProducto(idProducto);
}

// Exportar funciones para uso en el script inline
window.pedidosAPI = {
    cargarPedidosDesdeAPI,
    cargarInventarioDisponible,
    cargarClientes,
    actualizarPedido,
    crearDetallePedido,
    obtenerInfoInventario
};

