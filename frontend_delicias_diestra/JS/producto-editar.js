/**
 * Sistema de Edición de Productos - Frontend
 * Maneja la selección de productos para editar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productosLista = document.getElementById('productos-lista-editar');
    const buscarInput = document.getElementById('buscar-producto-editar');
    const categoriaSelect = document.getElementById('filtro-categoria-editar');
    const actualizarBtn = document.getElementById('actualizar-lista-editar');
    const loadingOverlay = document.getElementById('gestion-loading');
    const paginacionContainer = document.getElementById('productos-paginacion-editar');
    
    // Variables de estado
    let productos = [];
    let productosFiltrados = [];
    let paginaActual = 1;
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
    
    // ========================================
    // FUNCIONES DE API
    // ========================================
    
    // Cargar productos desde la API
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            const result = await response.json();
            
            productos = result.productos || result;
            productosFiltrados = [...productos];
            
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
    
    // ========================================
    // FUNCIONES DE FILTRADO Y BÚSQUEDA
    // ========================================
    
    // Aplicar filtros
    function aplicarFiltros() {
        const busqueda = buscarInput.value.toLowerCase().trim();
        const categoria = categoriaSelect.value;
        
        productosFiltrados = productos.filter(producto => {
            // Filtro por búsqueda
            const nombreProducto = (producto.nombre_producto || producto.nombre || '').toLowerCase();
            if (busqueda && !nombreProducto.includes(busqueda)) {
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
        console.log('🔄 Mostrando productos:', productosFiltrados.length);
        productosFiltrados.forEach(producto => {
            console.log('📋 Producto:', producto);
        });
        
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPagina = productosFiltrados.slice(inicio, fin);
        
        productosLista.innerHTML = '';
        
        if (productosPagina.length === 0) {
            productosLista.innerHTML = `
                <div class="no-productos">
                    <i class="fas fa-box-open"></i>
                    <p>No se encontraron productos para editar</p>
                </div>
            `;
            return;
        }
        
        for (const producto of productosPagina) {
            const categoriaNombre = await obtenerNombreCategoria(producto.id_categoria);
            const estadoClass = producto.estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
            const stockActual = producto.stock_actual || producto.cantidad_producto || producto.stock || 0;
            const stockMinimo = producto.stock_minimo || 0;
            const stockClass = stockActual === 0 ? 'stock-sin' : 
                              stockActual <= stockMinimo ? 'stock-bajo' : 'stock-normal';
            
            const productoCard = document.createElement('div');
            productoCard.className = 'producto-card-editar';
            productoCard.innerHTML = `
                <div class="producto-card-header">
                    <div class="producto-imagen">
                        ${producto.imagen ? 
                            `<img src="http://localhost:3000/uploads/productos/${producto.imagen}" alt="${producto.nombre_producto || producto.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <i class="fas fa-box" style="display:none;"></i>` : 
                            `<i class="fas fa-box"></i>`
                        }
                    </div>
                    <div class="producto-estado-badge">
                        <span class="estado-badge ${estadoClass}">
                            ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                
                <div class="producto-card-body">
                    <h4 class="producto-nombre">${producto.nombre_producto || producto.nombre || 'Sin nombre'}</h4>
                    <p class="producto-categoria">
                        <i class="fas fa-tag"></i> ${categoriaNombre}
                    </p>
                    ${producto.descripcion ? `<p class="producto-descripcion">${producto.descripcion.substring(0, 80)}...</p>` : ''}
                    
                    <div class="producto-info">
                        <div class="info-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${formatearPrecio(producto.precio_producto || producto.precio || 0)}</span>
                        </div>
                        <div class="info-item ${stockClass}">
                            <i class="fas fa-boxes"></i>
                            <span>${stockActual} ${producto.unidad_medida || 'lb'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="producto-card-footer">
                    <button class="btn-editar-producto" onclick="editarProducto(${producto.id_producto})">
                        <i class="fas fa-edit"></i>
                        Editar Producto
                    </button>
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
    
    // Editar producto
    window.editarProducto = function(id) {
        window.location.href = `producto-admin.html?id=${id}`;
    };
    
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
    
    .productos-lista-editar {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .producto-card-editar {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
        border: 1px solid #e5e7eb;
    }
    
    .producto-card-editar:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        border-color: #ef4444;
    }
    
    .producto-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 10px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .producto-imagen {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    
    .producto-imagen img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.3s ease;
    }
    
    .producto-imagen img:hover {
        transform: scale(1.05);
    }
    
    .producto-imagen i {
        font-size: 24px;
        color: #fff;
        opacity: 0.8;
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
    
    .btn-editar-producto {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
    }
    
    .btn-editar-producto:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
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
