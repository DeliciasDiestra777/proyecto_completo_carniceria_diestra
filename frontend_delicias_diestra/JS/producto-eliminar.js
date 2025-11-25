/**
 * Sistema de Eliminación de Productos - Frontend
 * Maneja la selección y eliminación de productos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productosLista = document.getElementById('productos-lista-eliminar');
    const buscarInput = document.getElementById('buscar-producto-eliminar');
    const categoriaSelect = document.getElementById('filtro-categoria-eliminar');
    const actualizarBtn = document.getElementById('actualizar-lista-eliminar');
    const loadingOverlay = document.getElementById('gestion-loading');
    const paginacionContainer = document.getElementById('productos-paginacion-eliminar');
    
    // Modal de confirmación
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const productoInfoConfirmacion = document.getElementById('producto-info-confirmacion');
    const btnCancelar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
    
    // Variables de estado
    let productos = [];
    let productosFiltrados = [];
    let paginaActual = 1;
    let productoAEliminar = null;
    const productosPorPagina = 8;
    
    // URL base de la API
    var API_BASE_URL = 'http://localhost:3000/api';
    
    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================
    
    // Mostrar/ocultar loading
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }
    
    // Mostrar notificación
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `producto-notification producto-notification-${type}`;
        notification.innerHTML = `
            <div class="producto-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Formatear precio
    function formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    }
    
    // Obtener nombre de categoría por ID
    async function obtenerNombreCategoria(idCategoria) {
        try {
            const categorias = await loadCategoriasFromAPI();
            const categoria = categorias.find(cat => cat.id_categoria == idCategoria);
            return categoria ? (categoria.nombre_categoria || categoria.nombre) : 'Sin categoría';
        } catch (error) {
            return 'Sin categoría';
        }
    }
    
    // Mostrar modal de confirmación
    async function mostrarModalConfirmacion(producto) {
        productoAEliminar = producto;
        
        const nombreCategoria = await obtenerNombreCategoria(producto.id_categoria);
        
        // Obtener valores con fallback para compatibilidad
        const nombreProducto = producto.nombre_producto || producto.nombre || 'Sin nombre';
        const precioProducto = producto.precio_producto || producto.precio || 0;
        const cantidadProducto = producto.stock_actual || producto.cantidad_producto || producto.stock || 0;
        const unidadMedida = producto.unidad_medida || 'lb';
        
        productoInfoConfirmacion.innerHTML = `
            <div class="producto-confirmacion-card">
                <div class="producto-confirmacion-imagen">
                    <i class="fas fa-box"></i>
                </div>
                <div class="producto-confirmacion-info">
                    <h4>${nombreProducto}</h4>
                    <p><strong>Categoría:</strong> ${nombreCategoria}</p>
                    <p><strong>Precio:</strong> $${formatearPrecio(precioProducto)}</p>
                    <p><strong>Stock:</strong> ${cantidadProducto} ${unidadMedida}</p>
                    <p><strong>Estado:</strong> ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}</p>
                </div>
            </div>
        `;
        
        modalConfirmacion.style.display = 'flex';
    }
    
    // Ocultar modal de confirmación
    function ocultarModalConfirmacion() {
        modalConfirmacion.style.display = 'none';
        productoAEliminar = null;
    }
    
    // ========================================
    // FUNCIONES DE API
    // ========================================
    
    // Cargar productos desde la API
    async function cargarProductos() {
        try {
            console.log('🔄 Cargando productos desde la API...');
            
            // Limpiar cache antes de cargar
            localStorage.removeItem('productos');
            
            const response = await fetch(`${API_BASE_URL}/productos`);
            console.log(`📡 Respuesta de productos: ${response.status}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            
            const result = await response.json();
            console.log('📋 Productos recibidos:', result);
            
            productos = result.productos || result;
            productosFiltrados = [...productos];
            
            console.log(`✅ Productos cargados: ${productos.length} productos`);
            
            // Guardar en localStorage como respaldo
            localStorage.setItem('productos', JSON.stringify(productos));
            
            return productos;
        } catch (error) {
            console.error('Error al cargar productos:', error);
            // Si falla la API, usar localStorage
            productos = JSON.parse(localStorage.getItem('productos')) || [];
            productosFiltrados = [...productos];
            return productos;
        }
    }
    
    // Ocultar producto del catálogo (no se elimina físicamente)
    async function eliminarProducto(id) {
        try {
            console.log(`🗑️ Eliminando producto con ID: ${id}`);
            
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log(`📡 Respuesta del servidor: ${response.status}`);
            
            const result = await response.json();
            console.log('📋 Resultado:', result);
            
            if (!response.ok) {
                // Si es un error 500, probablemente es por restricciones de clave foránea
                if (response.status === 500) {
                    const errorMessage = result.error || result.mensaje || 'Error al eliminar el producto';
                    if (errorMessage.includes('foreign key') || errorMessage.includes('Cannot delete') || errorMessage.includes('referenced')) {
                        throw new Error('No se puede eliminar este producto porque está siendo utilizado en otras partes del sistema (inventario, compras, pedidos, etc.). En su lugar, puedes desactivarlo cambiando su estado a "inactivo".');
                    }
                }
                throw new Error(result.mensaje || result.error || 'Error al eliminar el producto');
            }
            
            console.log('✅ Producto oculto del catálogo exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error al eliminar producto:', error);
            throw error;
        }
    }
    
    // Activar producto en el catálogo (mostrar de nuevo)
    async function activarProductoEnCatalogo(id) {
        try {
            console.log(`👁️ Activando producto en catálogo con ID: ${id}`);
            
            // Usar el endpoint PUT para actualizar el producto
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mostrar_en_catalogo: true,
                    estado: 'activo'
                })
            });
            
            console.log(`📡 Respuesta del servidor: ${response.status}`);
            
            const result = await response.json();
            console.log('📋 Resultado:', result);
            
            if (!response.ok) {
                throw new Error(result.mensaje || result.error || 'Error al activar el producto en el catálogo');
            }
            
            console.log('✅ Producto activado en catálogo exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error al activar producto en catálogo:', error);
            throw error;
        }
    }
    
    // ========================================
    // FUNCIONES DE FILTRADO Y BÚSQUEDA
    // ========================================
    
    // Aplicar filtros
    function aplicarFiltros() {
        const busqueda = buscarInput.value.toLowerCase().trim();
        const categoria = categoriaSelect.value;
        
        productosFiltrados = productos.filter(producto => {
            // Filtro por búsqueda
            const nombreProducto = producto.nombre_producto || producto.nombre || '';
            if (busqueda && !nombreProducto.toLowerCase().includes(busqueda)) {
                return false;
            }
            
            // Filtro por categoría
            if (categoria && producto.id_categoria != categoria) {
                return false;
            }
            
            return true;
        });
        
        paginaActual = 1;
        mostrarProductos();
        mostrarPaginacion();
    }
    
    // ========================================
    // FUNCIONES DE VISUALIZACIÓN
    // ========================================
    
    // Mostrar productos en tarjetas
    async function mostrarProductos() {
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPagina = productosFiltrados.slice(inicio, fin);
        
        productosLista.innerHTML = '';
        
        if (productosPagina.length === 0) {
            productosLista.innerHTML = `
                <div class="no-productos">
                    <i class="fas fa-box-open"></i>
                    <p>No se encontraron productos para eliminar</p>
                </div>
            `;
            return;
        }
        
        for (const producto of productosPagina) {
            const categoriaNombre = await obtenerNombreCategoria(producto.id_categoria);
            const estadoClass = producto.estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
            
            // Obtener valores con fallback para compatibilidad
            const nombreProducto = producto.nombre_producto || producto.nombre || 'Sin nombre';
            const precioProducto = producto.precio_producto || producto.precio || 0;
            const cantidadProducto = producto.stock_actual || producto.cantidad_producto || producto.stock || 0;
            const stockMinimo = producto.stock_minimo || 0;
            const unidadMedida = producto.unidad_medida || 'lb';
            
            // Determinar si el producto está oculto del catálogo
            const estaOculto = producto.mostrar_en_catalogo === false || 
                              producto.mostrar_en_catalogo === 0 || 
                              producto.estado === 'inactivo';
            
            const stockClass = cantidadProducto === 0 ? 'stock-sin' : 
                              cantidadProducto <= stockMinimo ? 'stock-bajo' : 'stock-normal';
            
            // Determinar el botón y acción según el estado
            const botonHTML = estaOculto 
                ? `<button class="btn-mostrar-producto" onclick="confirmarActivacion(${producto.id_producto})">
                    <i class="fas fa-eye"></i>
                    Mostrar en Catálogo
                   </button>`
                : `<button class="btn-eliminar-producto" onclick="confirmarEliminacion(${producto.id_producto})">
                    <i class="fas fa-eye-slash"></i>
                    Ocultar del Catálogo
                   </button>`;
            
            const productoCard = document.createElement('div');
            productoCard.className = 'producto-card-eliminar';
            productoCard.innerHTML = `
                <div class="producto-card-header">
                    <div class="producto-imagen">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="producto-estado-badge">
                        <span class="estado-badge ${estadoClass}">
                            ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                
                <div class="producto-card-body">
                    <h4 class="producto-nombre">${nombreProducto}</h4>
                    <p class="producto-categoria">
                        <i class="fas fa-tag"></i> ${categoriaNombre}
                    </p>
                    ${producto.descripcion ? `<p class="producto-descripcion">${producto.descripcion.substring(0, 80)}...</p>` : ''}
                    
                    <div class="producto-info">
                        <div class="info-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${formatearPrecio(precioProducto)}</span>
                        </div>
                        <div class="info-item ${stockClass}">
                            <i class="fas fa-boxes"></i>
                            <span>${cantidadProducto} ${unidadMedida}</span>
                        </div>
                    </div>
                </div>
                
                <div class="producto-card-footer">
                    ${botonHTML}
                </div>
            `;
            
            productosLista.appendChild(productoCard);
        }
    }
    
    // Mostrar paginación
    function mostrarPaginacion() {
        const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
        
        if (totalPaginas <= 1) {
            paginacionContainer.innerHTML = '';
            return;
        }
        
        let paginacionHTML = '<div class="paginacion-controls">';
        
        // Botón anterior
        if (paginaActual > 1) {
            paginacionHTML += `<button class="btn-paginacion" onclick="cambiarPagina(${paginaActual - 1})">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>`;
        }
        
        // Números de página
        const inicio = Math.max(1, paginaActual - 2);
        const fin = Math.min(totalPaginas, paginaActual + 2);
        
        for (let i = inicio; i <= fin; i++) {
            const claseActiva = i === paginaActual ? 'activa' : '';
            paginacionHTML += `<button class="btn-paginacion ${claseActiva}" onclick="cambiarPagina(${i})">${i}</button>`;
        }
        
        // Botón siguiente
        if (paginaActual < totalPaginas) {
            paginacionHTML += `<button class="btn-paginacion" onclick="cambiarPagina(${paginaActual + 1})">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        paginacionHTML += '</div>';
        paginacionContainer.innerHTML = paginacionHTML;
    }
    
    // Cambiar página
    window.cambiarPagina = function(nuevaPagina) {
        paginaActual = nuevaPagina;
        mostrarProductos();
        mostrarPaginacion();
    };
    
    // Confirmar eliminación (ocultar del catálogo)
    window.confirmarEliminacion = async function(id) {
        const producto = productos.find(p => p.id_producto == id);
        if (producto) {
            await mostrarModalConfirmacion(producto);
        }
    };
    
    // Confirmar activación (mostrar en catálogo)
    window.confirmarActivacion = async function(id) {
        const producto = productos.find(p => p.id_producto == id);
        if (producto) {
            const nombreProducto = producto.nombre_producto || producto.nombre || 'Sin nombre';
            if (confirm(`¿Estás seguro de que quieres mostrar "${nombreProducto}" en el catálogo público?`)) {
                await activarProductoEnCatalogoDesdeLista(id);
            }
        }
    };
    
    // Activar producto en catálogo desde la lista
    async function activarProductoEnCatalogoDesdeLista(productoId) {
        showLoading(true);
        
        try {
            await activarProductoEnCatalogo(productoId);
            console.log('✅ Activación exitosa, recargando lista...');
            
            // Limpiar cache del navegador
            localStorage.removeItem('productos');
            
            // Recargar la lista
            await cargarProductos();
            aplicarFiltros();
            
            console.log('🔄 Lista recargada, productos actuales:', productos.length);
            
            showNotification('Producto activado en el catálogo correctamente');
            
        } catch (error) {
            console.error('❌ Error en el proceso de activación:', error);
            showNotification(error.message || 'Error al activar el producto en el catálogo', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Event listeners para filtros
    buscarInput.addEventListener('input', aplicarFiltros);
    categoriaSelect.addEventListener('change', aplicarFiltros);
    
    // Actualizar lista
    actualizarBtn.addEventListener('click', async function() {
        showLoading(true);
        try {
            await cargarProductos();
            await cargarCategoriasEnSelect();
            aplicarFiltros();
            showNotification('Lista actualizada correctamente');
        } catch (error) {
            showNotification('Error al actualizar la lista', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Cancelar eliminación
    btnCancelar.addEventListener('click', ocultarModalConfirmacion);
    
    // Confirmar eliminación
    btnConfirmar.addEventListener('click', async function() {
        if (!productoAEliminar) {
            showNotification('No hay producto seleccionado para ocultar', 'error');
            return;
        }
        
        // Guardar el ID antes de ocultar el modal
        const productoId = productoAEliminar.id_producto;
        console.log(`🔄 Ocultando producto del catálogo ID: ${productoId}`);
        
        showLoading(true);
        ocultarModalConfirmacion();
        
        try {
            await eliminarProducto(productoId);
            console.log('✅ Eliminación exitosa, recargando lista...');
            
            // Limpiar cache del navegador
            localStorage.removeItem('productos');
            
            // Recargar la lista
            await cargarProductos();
            aplicarFiltros();
            
            console.log('🔄 Lista recargada, productos actuales:', productos.length);
            
            const mensaje = result.nota 
                ? `Producto oculto del catálogo. ${result.nota}` 
                : 'Producto oculto del catálogo correctamente. La información del inventario se mantiene.';
            showNotification(mensaje);
            
        } catch (error) {
            console.error('❌ Error en el proceso de eliminación:', error);
            
            // Mostrar mensaje de error más descriptivo
            let mensajeError = error.message || 'Error al eliminar el producto';
            
            // Si el error menciona que el producto está siendo usado, ofrecer alternativa
            if (mensajeError.includes('está siendo utilizado') || mensajeError.includes('foreign key') || mensajeError.includes('referenced')) {
                showNotification(mensajeError + ' Puedes desactivarlo cambiando su estado a "inactivo" desde el módulo de edición.', 'error');
            } else {
                showNotification(mensajeError, 'error');
            }
        } finally {
            showLoading(false);
        }
    });
    
    // Cerrar modal al hacer clic fuera
    modalConfirmacion.addEventListener('click', function(e) {
        if (e.target === modalConfirmacion) {
            ocultarModalConfirmacion();
        }
    });
    
    // ========================================
    // FUNCIONES DE INICIALIZACIÓN
    // ========================================
    
    // Cargar categorías en el select
    async function cargarCategoriasEnSelect() {
        try {
            const categorias = await loadCategoriasFromAPI();
            categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria;
                option.textContent = categoria.nombre_categoria || categoria.nombre || 'Sin nombre';
                categoriaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }
    
    // Registrar selector para actualización automática
    function registrarSelectorCategorias() {
        if (categoriaSelect && window.categoriaEventManager) {
            window.categoriaEventManager.registrarSelector(categoriaSelect, true, true);
        }
    }
    
    // Inicializar la página
    async function init() {
        showLoading(true);
        
        try {
            await cargarProductos();
            await cargarCategoriasEnSelect();
            registrarSelectorCategorias(); // Registrar para actualización automática
            aplicarFiltros();
        } catch (error) {
            showNotification('Error al cargar los datos', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Inicializar cuando se carga la página
    init();
});

// ========================================
// ESTILOS CSS DINÁMICOS
// ========================================

const style = document.createElement('style');
style.textContent = `
    .eliminar-advertencia {
        background: #fef3cd;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .eliminar-advertencia i {
        font-size: 32px;
        color: #f59e0b;
        margin-bottom: 10px;
    }
    
    .eliminar-advertencia h4 {
        color: #92400e;
        margin-bottom: 10px;
    }
    
    .eliminar-advertencia p {
        color: #92400e;
        margin: 0;
    }
    
    .productos-filtros {
        margin-bottom: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .filtros-row {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .filtro-group {
        flex: 1;
        min-width: 200px;
    }
    
    .filtro-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #374151;
    }
    
    .filtro-group input,
    .filtro-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
    }
    
    .productos-lista-eliminar {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .producto-card-eliminar {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }
    
    .producto-card-eliminar:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }
    
    .producto-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 10px;
        background: linear-gradient(135deg, #dc2626, #991b1b);
    }
    
    .producto-imagen i {
        font-size: 32px;
        color: #fff;
    }
    
    .producto-estado-badge .estado-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .estado-badge.estado-activo {
        background: #dcfce7;
        color: #166534;
    }
    
    .estado-badge.estado-inactivo {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .producto-card-body {
        padding: 20px;
    }
    
    .producto-nombre {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
    }
    
    .producto-categoria {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 10px;
    }
    
    .producto-categoria i {
        margin-right: 5px;
    }
    
    .producto-descripcion {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 15px;
    }
    
    .producto-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
    }
    
    .info-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
        font-weight: 500;
    }
    
    .info-item.stock-normal {
        color: #059669;
    }
    
    .info-item.stock-bajo {
        color: #d97706;
    }
    
    .info-item.stock-sin {
        color: #dc2626;
    }
    
    .producto-card-footer {
        padding: 0 20px 20px;
    }
    
    .btn-eliminar-producto {
        width: 100%;
        padding: 12px;
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .btn-eliminar-producto:hover {
        background: #991b1b;
    }
    
    .btn-mostrar-producto {
        width: 100%;
        padding: 12px;
        background: #059669;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .btn-mostrar-producto:hover {
        background: #047857;
    }
    
    .no-productos {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
    }
    
    .no-productos i {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .no-productos p {
        font-size: 18px;
        font-weight: 500;
    }
    
    .productos-paginacion {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
    
    .paginacion-controls {
        display: flex;
        gap: 5px;
    }
    
    .btn-paginacion {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #374151;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-paginacion:hover {
        background: #f3f4f6;
    }
    
    .btn-paginacion.activa {
        background: #dc2626;
        color: #fff;
        border-color: #dc2626;
    }
    
    .modal-confirmacion {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .modal-confirmacion-content {
        background: #fff;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-confirmacion-header {
        padding: 20px;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-confirmacion-header i {
        font-size: 48px;
        color: #dc2626;
        margin-bottom: 10px;
    }
    
    .modal-confirmacion-header h3 {
        color: #1f2937;
        margin: 0;
    }
    
    .modal-confirmacion-body {
        padding: 20px;
    }
    
    .modal-confirmacion-body p {
        color: #374151;
        margin-bottom: 20px;
    }
    
    .producto-confirmacion-card {
        display: flex;
        gap: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 15px;
    }
    
    .producto-confirmacion-imagen {
        flex-shrink: 0;
    }
    
    .producto-confirmacion-imagen i {
        font-size: 32px;
        color: #6b7280;
    }
    
    .producto-confirmacion-info h4 {
        color: #1f2937;
        margin-bottom: 8px;
    }
    
    .producto-confirmacion-info p {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 4px;
    }
    
    .advertencia-texto {
        color: #dc2626 !important;
        font-weight: 500;
        text-align: center;
    }
    
    .modal-confirmacion-footer {
        padding: 20px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        border-top: 1px solid #e5e7eb;
    }
    
    .btn-cancelar {
        padding: 10px 20px;
        background: #6b7280;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .btn-cancelar:hover {
        background: #4b5563;
    }
    
    .btn-confirmar-eliminar {
        padding: 10px 20px;
        background: #dc2626;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .btn-confirmar-eliminar:hover {
        background: #991b1b;
    }
    
    .producto-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px 20px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
        border-left: 4px solid #10b981;
    }
    
    .producto-notification.show {
        transform: translateX(0);
    }
    
    .producto-notification-error {
        border-left-color: #ef4444;
    }
    
    .producto-notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .producto-notification-content i {
        font-size: 18px;
        color: #10b981;
    }
    
    .producto-notification-error .producto-notification-content i {
        color: #ef4444;
    }
    
    .producto-notification-content span {
        font-weight: 500;
        color: #374151;
    }
    
    .gestion-loading-overlay.show {
        display: flex;
    }
`;
document.head.appendChild(style);
