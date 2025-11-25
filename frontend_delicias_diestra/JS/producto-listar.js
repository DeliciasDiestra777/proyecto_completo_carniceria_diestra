/**
 * Sistema de Lista de Productos - Frontend
 * Maneja la visualización y gestión de la lista de productos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productosTbody = document.getElementById('productos-tbody');
    const buscarInput = document.getElementById('buscar-producto');
    const categoriaSelect = document.getElementById('filtro-categoria');
    const estadoSelect = document.getElementById('filtro-estado');
    const actualizarBtn = document.getElementById('actualizar-lista');
    const loadingOverlay = document.getElementById('gestion-loading');
    const paginacionContainer = document.getElementById('productos-paginacion');
    
    // Elementos de estadísticas
    const totalProductos = document.getElementById('total-productos');
    const productosActivos = document.getElementById('productos-activos');
    const stockBajo = document.getElementById('stock-bajo');
    const sinStock = document.getElementById('sin-stock');
    
    // Variables de estado
    let productos = [];
    let productosFiltrados = [];
    let paginaActual = 1;
    const productosPorPagina = 10;
    
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
    
    // Formatear número: muestra enteros sin decimales, decimales solo si existen
    function formatearNumero(numero) {
        const num = parseFloat(numero) || 0;
        // Si es un número entero, mostrar sin decimales
        if (num % 1 === 0) {
            return num.toString();
        }
        // Si tiene decimales, mostrar con los decimales necesarios (máximo 3)
        return num.toFixed(3).replace(/\.?0+$/, ''); // Eliminar ceros finales
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
    
    // ========================================
    // FUNCIONES DE API
    // ========================================
    
    // Cargar productos desde la API (solo productos del catálogo, incluyendo stock 0)
    async function cargarProductos() {
        try {
            // Usar endpoint de catálogo-admin para mostrar productos del catálogo incluyendo los con stock 0
            const response = await fetch(`${API_BASE_URL}/productos/catalogo-admin`);
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            const result = await response.json();
            
            productos = result.productos || result;
            productosFiltrados = [...productos];
            
            // Guardar en localStorage como respaldo
            localStorage.setItem('productos', JSON.stringify(productos));
            
            console.log(`Productos del catálogo cargados: ${productos.length}`);
            
            console.log('Unidades de medida de productos:', productos.map(p => ({
                nombre: p.nombre_producto,
                unidad: p.unidad_medida,
                stock: p.stock_actual
            })));
            
            // Actualizar estadísticas después de cargar productos
            calcularEstadisticasLocales();
            
            return productos;
        } catch (error) {
            console.error('Error al cargar productos:', error);
            // Si falla la API, usar localStorage
            productos = JSON.parse(localStorage.getItem('productos')) || [];
            productosFiltrados = [...productos];
            
            // Actualizar estadísticas después de cargar desde localStorage
            calcularEstadisticasLocales();
            
            return productos;
        }
    }
    
    // Obtener estadísticas de productos
    async function obtenerEstadisticas() {
        // Calcular estadísticas localmente ya que el endpoint no existe en el backend
        // Si en el futuro se implementa el endpoint, se puede descomentar el código de abajo
        calcularEstadisticasLocales();
        
        /* Código para usar cuando el endpoint esté disponible:
        try {
            const response = await fetch(`${API_BASE_URL}/productos/extras/estadisticas`, {
                method: 'GET',
                // Agregar headers si es necesario
            });
            
            if (!response.ok) {
                // Si el endpoint no existe (404), calcular localmente
                calcularEstadisticasLocales();
                return;
            }
            
            const estadisticas = await response.json();
            
            totalProductos.textContent = estadisticas.total_productos || 0;
            productosActivos.textContent = estadisticas.productos_activos || 0;
            stockBajo.textContent = estadisticas.productos_stock_bajo || 0;
            sinStock.textContent = estadisticas.productos_sin_stock || 0;
            
        } catch (error) {
            // Si hay cualquier error, calcular localmente
            calcularEstadisticasLocales();
        }
        */
    }
    
    // Calcular estadísticas localmente
    function calcularEstadisticasLocales() {
        const total = productos.length;
        // Usar estado_producto o estado según lo que venga del backend
        const activos = productos.filter(p => 
            (p.estado === 'activo' || p.estado_producto === 'activo' || !p.estado)
        ).length;
        // Buscar stock en diferentes campos posibles
        const stockBajoCount = productos.filter(p => {
            const stock = parseFloat(p.stock_actual || p.stock || p.cantidad_producto || 0);
            const stockMin = parseFloat(p.stock_minimo || 0);
            return stock <= stockMin && stock > 0;
        }).length;
        const sinStockCount = productos.filter(p => {
            const stock = parseFloat(p.stock_actual || p.stock || p.cantidad_producto || 0);
            // Contar productos con stock 0 o negativo, o null/undefined
            return stock <= 0 || isNaN(stock);
        }).length;
        
        totalProductos.textContent = total;
        productosActivos.textContent = activos;
        stockBajo.textContent = stockBajoCount;
        sinStock.textContent = sinStockCount;
        
        // Log para debugging
        console.log('Estadísticas calculadas:', {
            total,
            activos,
            stockBajo: stockBajoCount,
            sinStock: sinStockCount
        });
        
        // Log opcional para debugging (comentado para evitar ruido en consola)
        // console.log(`Estadísticas calculadas localmente:`, {
        //     total,
        //     activos,
        //     stockBajo: stockBajoCount,
        //     sinStock: sinStockCount
        // });
    }
    
    // ========================================
    // FUNCIONES DE FILTRADO Y BÚSQUEDA
    // ========================================
    
    // Aplicar filtros
    function aplicarFiltros() {
        const busqueda = buscarInput.value.toLowerCase().trim();
        const categoria = categoriaSelect.value;
        const estado = estadoSelect.value;
        
        productosFiltrados = productos.filter(producto => {
            // Filtro por búsqueda
            if (busqueda && !producto.nombre_producto.toLowerCase().includes(busqueda)) {
                return false;
            }
            
            // Filtro por categoría
            if (categoria && producto.id_categoria != categoria) {
                return false;
            }
            
            // Filtro por estado
            if (estado && producto.estado !== estado) {
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
    
    // Mostrar productos en la tabla
    async function mostrarProductos() {
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPagina = productosFiltrados.slice(inicio, fin);
        
        productosTbody.innerHTML = '';
        
        if (productosPagina.length === 0) {
            productosTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-productos">
                        <i class="fas fa-box-open"></i>
                        <p>No se encontraron productos</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        for (const producto of productosPagina) {
            const categoriaNombre = await obtenerNombreCategoria(producto.id_categoria);
            const estadoClass = producto.estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
            const stockActual = parseFloat(producto.stock_actual || producto.stock || producto.cantidad_producto || 0);
            const stockMinimo = parseFloat(producto.stock_minimo || 0);
            
            // Obtener unidad de medida del producto (asegurarse de que viene del backend)
            const unidadMedida = producto.unidad_medida || 'lb';
            
            // Debug: verificar unidad de medida
            if (producto.nombre_producto && producto.nombre_producto.toLowerCase().includes('albondiga')) {
                console.log('Debug Albondiga:', {
                    nombre: producto.nombre_producto,
                    unidad_medida: producto.unidad_medida,
                    stock_actual: stockActual
                });
            }
            
            // Determinar clase y color según el stock
            let stockClass, stockTexto, stockMensaje;
            if (stockActual === 0) {
                stockClass = 'stock-sin';
                stockTexto = 'Sin stock';
                stockMensaje = '';
            } else if (stockActual <= stockMinimo) {
                stockClass = 'stock-bajo';
                stockTexto = `${formatearNumero(stockActual)} ${unidadMedida}`;
                stockMensaje = '<br><small>Stock bajo</small>';
            } else {
                stockClass = 'stock-normal';
                stockTexto = `${formatearNumero(stockActual)} ${unidadMedida}`;
                stockMensaje = '';
            }
            
            // Construir URL de imagen
            let imagenHtml = '<i class="fas fa-box"></i>';
            if (producto.imagen && producto.imagen.trim() !== '' && producto.imagen !== 'null' && producto.imagen !== null) {
                let imagenUrl = producto.imagen;
                if (!imagenUrl.startsWith('http://') && !imagenUrl.startsWith('https://')) {
                    if (imagenUrl.startsWith('/uploads/')) {
                        imagenUrl = `http://localhost:3000${imagenUrl}`;
                    } else {
                        imagenUrl = `http://localhost:3000/uploads/productos/${imagenUrl}`;
                    }
                }
                imagenHtml = `<img src="${imagenUrl}" alt="${producto.nombre_producto || 'Producto'}" 
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                                  style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                             <i class="fas fa-box" style="display:none;"></i>`;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="producto-imagen" style="text-align: center;">
                    ${imagenHtml}
                </td>
                <td class="producto-nombre">
                    <strong>${producto.nombre_producto || producto.nombre || 'Sin nombre'}</strong>
                    ${producto.descripcion ? `<br><small>${producto.descripcion.substring(0, 50)}...</small>` : ''}
                </td>
                <td class="producto-categoria">${categoriaNombre}</td>
                <td class="producto-precio">$${formatearPrecio(producto.precio_producto || producto.precio || 0)}</td>
                <td class="producto-stock ${stockClass}">
                    ${stockTexto}${stockMensaje}
                </td>
                <td class="producto-stock-minimo">
                    ${formatearNumero(stockMinimo)} ${unidadMedida}
                </td>
                <td class="producto-estado">
                    <span class="estado-badge ${estadoClass}">
                        ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="producto-acciones">
                    <button class="btn-accion btn-editar" onclick="editarProducto(${producto.id_producto})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarProducto(${producto.id_producto})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-accion btn-ver" onclick="verProducto(${producto.id_producto})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            productosTbody.appendChild(row);
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
    
    // Editar producto
    window.editarProducto = function(id) {
        window.location.href = `producto-admin.html?id=${id}`;
    };
    
    // Eliminar producto
    window.eliminarProducto = async function(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.mensaje || 'Error al eliminar el producto');
            }
            
            showNotification('Producto eliminado correctamente');
            await cargarProductos();
            aplicarFiltros();
            calcularEstadisticasLocales();
            
        } catch (error) {
            showNotification(error.message || 'Error al eliminar el producto', 'error');
        } finally {
            showLoading(false);
        }
    };
    
    // Ver producto
    window.verProducto = function(id) {
        // Aquí podrías abrir un modal con los detalles del producto
        alert(`Ver detalles del producto ID: ${id}`);
    };
    
    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Event listeners para filtros
    buscarInput.addEventListener('input', aplicarFiltros);
    categoriaSelect.addEventListener('change', aplicarFiltros);
    estadoSelect.addEventListener('change', aplicarFiltros);
    
    // Actualizar lista
    actualizarBtn.addEventListener('click', async function() {
        showLoading(true);
        try {
            await cargarProductos();
            await cargarCategoriasEnSelect();
            aplicarFiltros();
            await obtenerEstadisticas();
            showNotification('Lista actualizada correctamente');
        } catch (error) {
            showNotification('Error al actualizar la lista', 'error');
        } finally {
            showLoading(false);
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
            await obtenerEstadisticas();
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
    
    .productos-estadisticas {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .estadistica-item {
        text-align: center;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .estadistica-item i {
        font-size: 24px;
        color: #ef4444;
        margin-bottom: 10px;
    }
    
    .estadistica-numero {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 5px;
    }
    
    .estadistica-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .productos-tabla-container {
        overflow-x: auto;
        margin-bottom: 20px;
    }
    
    .productos-tabla {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .productos-tabla th {
        background: #ef4444;
        color: #fff;
        padding: 15px;
        text-align: left;
        font-weight: 600;
    }
    
    .productos-tabla td {
        padding: 15px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .productos-tabla tr:hover {
        background: #f9fafb;
    }
    
    .producto-imagen {
        text-align: center;
        width: 70px;
    }
    
    .producto-imagen img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
    }
    
    .producto-imagen i {
        font-size: 24px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .producto-nombre strong {
        color: #1f2937;
    }
    
    .producto-nombre small {
        color: #6b7280;
    }
    
    .producto-categoria {
        color: #374151;
    }
    
    .producto-precio {
        font-weight: 600;
        color: #059669;
    }
    
    .producto-stock.stock-normal {
        color: #059669;
        font-weight: 600;
    }
    
    .producto-stock.stock-bajo {
        color: #d97706;
        font-weight: 600;
    }
    
    .producto-stock.stock-sin {
        color: #dc2626;
        font-weight: 600;
    }
    
    .producto-stock-minimo {
        color: #6b7280;
        font-size: 0.9em;
        font-weight: 500;
    }
    
    .estado-badge {
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
    
    .producto-acciones {
        display: flex;
        gap: 5px;
    }
    
    .btn-accion {
        padding: 6px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .btn-editar {
        background: #3b82f6;
        color: #fff;
    }
    
    .btn-editar:hover {
        background: #2563eb;
    }
    
    .btn-eliminar {
        background: #ef4444;
        color: #fff;
    }
    
    .btn-eliminar:hover {
        background: #dc2626;
    }
    
    .btn-ver {
        background: #6b7280;
        color: #fff;
    }
    
    .btn-ver:hover {
        background: #4b5563;
    }
    
    .no-productos {
        text-align: center;
        padding: 40px;
        color: #6b7280;
    }
    
    .no-productos i {
        font-size: 48px;
        margin-bottom: 10px;
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
        background: #ef4444;
        color: #fff;
        border-color: #ef4444;
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
