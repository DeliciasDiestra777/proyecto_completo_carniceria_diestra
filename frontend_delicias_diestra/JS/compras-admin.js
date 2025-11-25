// compras-admin.js - Gestión de compras en el panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnCrearCompra = document.getElementById('btn-crear-compra');
    const btnListarCompras = document.getElementById('btn-listar-compras');
    const comprasFormSection = document.getElementById('compras-form-section');
    const comprasListSection = document.getElementById('compras-list-section');
    const saveBtn = document.getElementById('save-compra');
    const deleteBtn = document.getElementById('delete-compra');
    const cancelBtn = document.getElementById('cancel-compras');
    const form = document.getElementById('compras-form');
    const modalTitle = document.getElementById('compras-modal-title');
    const loadingOverlay = document.getElementById('compras-loading');
    const btnAgregarProducto = document.getElementById('btn-agregar-producto');
    const modalProducto = document.getElementById('modal-producto');
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Variables
    let allCompras = [];
    let allProveedores = [];
    let allProductos = [];
    let allCategorias = []; // Array para almacenar categorías
    let detalleCompra = []; // Array para almacenar los detalles de compra
    let currentAction = '';
    let currentCompraId = null;
    let currentEditIndex = null; // Para editar un detalle específico

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    cargarProveedores();
    cargarProductos();
    cargarCategorias();

    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================

    // Botón Crear Compra
    if (btnCrearCompra) {
        btnCrearCompra.addEventListener('click', function() {
            modalTitle.textContent = 'Nueva Compra';
            showSection('form', 'create');
            form.reset();
            detalleCompra = [];
            currentCompraId = null;
            document.getElementById('compra-fecha').value = typeof getCurrentDateTimeLocal === 'function' ? getCurrentDateTimeLocal() : new Date().toISOString().slice(0, 16);
            actualizarTablaDetalle();
            actualizarTotal();
        });
    }

    // Botón Listar Compras
    if (btnListarCompras) {
        btnListarCompras.addEventListener('click', function() {
            modalTitle.textContent = 'Lista de Compras';
            showSection('list', 'list');
            cargarCompras();
        });
    }

    // Botón Agregar Producto
    if (btnAgregarProducto) {
        btnAgregarProducto.addEventListener('click', function() {
            abrirModalProducto();
        });
    }

    // Botón Guardar
    if (saveBtn) {
        saveBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('=== CLICK EN BOTÓN GUARDAR ===');
            console.log('Form válido:', form.checkValidity());
            console.log('detalleCompra.length:', detalleCompra.length);
            
            if (form.checkValidity() && detalleCompra.length > 0) {
                console.log('Condiciones cumplidas, llamando a guardarCompra()');
                await guardarCompra();
            } else {
                console.log('Condiciones NO cumplidas');
                if (detalleCompra.length === 0) {
                    mostrarNotificacion('Debe agregar al menos un producto', 'error');
                }
                form.reportValidity();
            }
        });
    } else {
        console.error('Botón guardar no encontrado');
    }

    // Botón Eliminar
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (currentCompraId && confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
                await eliminarCompra(currentCompraId);
            }
        });
    }

    // Botón Cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'panel-admin.html';
        });
    }

    // Búsqueda y filtros
    const searchInput = document.getElementById('search-compras');
    const filterFecha = document.getElementById('filter-fecha-compra');
    const filterProveedor = document.getElementById('filter-proveedor-compra');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filtrarCompras();
        });
    }
    
    if (filterFecha) {
        filterFecha.addEventListener('change', function() {
            filtrarCompras();
        });
    }

    if (filterProveedor) {
        filterProveedor.addEventListener('change', function() {
            filtrarCompras();
        });
    }

    // ========================================
    // FUNCIONES PRINCIPALES
    // ========================================

    // Mostrar sección
    function showSection(section, action = '') {
        if (comprasFormSection) comprasFormSection.style.display = 'none';
        if (comprasListSection) comprasListSection.style.display = 'none';

        if (section === 'form') {
            if (comprasFormSection) comprasFormSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
            if (deleteBtn) deleteBtn.style.display = action === 'edit' ? 'inline-flex' : 'none';
        } else if (section === 'list') {
            if (comprasListSection) comprasListSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }

        currentAction = action;
    }

    // Cargar proveedores
    async function cargarProveedores() {
        try {
            const response = await fetch(`${API_BASE_URL}/proveedores`);
            if (response.ok) {
                allProveedores = await response.json();
                const selectProveedor = document.getElementById('compra-id-proveedor');
                const filterProveedorSelect = document.getElementById('filter-proveedor-compra');
                
                if (selectProveedor) {
                    selectProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>';
                    allProveedores.forEach(proveedor => {
                        if (proveedor.estado === 'activo') {
                            const nombreProveedor = proveedor.nombre_proveedor || proveedor.nombre_comercial || 'Sin nombre';
                            selectProveedor.innerHTML += `<option value="${proveedor.id_proveedor}">${nombreProveedor}</option>`;
                        }
                    });
                }
                
                if (filterProveedorSelect) {
                    filterProveedorSelect.innerHTML = '<option value="">Todos los proveedores</option>';
                    allProveedores.forEach(proveedor => {
                        const nombreProveedor = proveedor.nombre_proveedor || proveedor.nombre_comercial || 'Sin nombre';
                        filterProveedorSelect.innerHTML += `<option value="${proveedor.id_proveedor}">${nombreProveedor}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        }
    }

    // Variables para autocomplete
    let currentDropdownIndex = -1;
    let selectedProducto = null;
    
    // Cargar categorías
    async function cargarCategorias() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            if (response.ok) {
                const result = await response.json();
                allCategorias = Array.isArray(result) ? result : [];
                // Guardar en localStorage como respaldo
                localStorage.setItem('categorias', JSON.stringify(allCategorias));
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            // Intentar cargar desde localStorage
            try {
                allCategorias = JSON.parse(localStorage.getItem('categorias')) || [];
            } catch (e) {
                allCategorias = [];
            }
        }
    }
    
    // Función auxiliar para obtener nombre de categoría
    function obtenerNombreCategoria(idCategoria) {
        if (!idCategoria) return 'Sin categoría';
        const categoria = allCategorias.find(cat => cat.id_categoria == idCategoria);
        return categoria ? (categoria.nombre_categoria || categoria.nombre || 'Sin categoría') : 'Sin categoría';
    }
    
    // Inicializar autocomplete para productos
    function inicializarAutocompleteProductos() {
        const productoSearch = document.getElementById('modal-producto-search');
        const productoIdInput = document.getElementById('modal-producto-id');
        const productoDropdown = document.getElementById('modal-producto-dropdown');
        
        if (!productoSearch || !productoIdInput || !productoDropdown) return;
        
        // Filtrar productos (incluyendo inactivos para poder comprarlos)
        function filtrarProductos(termino) {
            // Mostrar todos los productos (activos e inactivos) para poder comprar productos sin stock
            if (!termino || termino.trim() === '') {
                return allProductos; // Mostrar todos los productos
            }
            
            const terminoLower = termino.toLowerCase().trim();
            return allProductos.filter(producto => {
                // Incluir todos los productos, activos e inactivos
                const nombre = (producto.nombre || producto.nombre_producto || '').toLowerCase();
                return nombre.includes(terminoLower) || nombre.startsWith(terminoLower);
            });
        }
        
        // Renderizar resultados del dropdown
        function renderizarResultados(productos) {
            if (!productoDropdown) return;
            
            if (productos.length === 0) {
                productoDropdown.innerHTML = `
                    <div class="compras-autocomplete-empty">
                        <i class="fas fa-search"></i> No se encontraron productos
                    </div>
                `;
                productoDropdown.style.display = 'block';
                return;
            }
            
            // Limitar a 10 resultados
            const productosLimitados = productos.slice(0, 10);
            
            productoDropdown.innerHTML = productosLimitados.map((producto, index) => {
                const nombre = producto.nombre || producto.nombre_producto || 'Sin nombre';
                // Usar categoria_nombre del backend, o buscar por ID si no viene
                let categoriaNombre = producto.categoria_nombre || producto.nombre_categoria || producto.categoria;
                if (!categoriaNombre && producto.id_categoria) {
                    categoriaNombre = obtenerNombreCategoria(producto.id_categoria);
                }
                const categoria = categoriaNombre || 'Sin categoría';
                // Usar unidad_medida del producto
                const unidad = producto.unidad_medida || 'lb';
                const estado = producto.estado || 'activo';
                const stockActual = producto.stock_actual || 0;
                const esInactivo = estado === 'inactivo' || stockActual <= 0;
                
                return `
                    <div class="compras-autocomplete-item ${esInactivo ? 'compras-autocomplete-item-inactivo' : ''}" data-index="${index}" data-producto-id="${producto.id_producto}">
                        <span class="compras-autocomplete-item-name">${nombre}${esInactivo ? ' <span style="color: #dc2626; font-size: 0.85em;">(Sin stock)</span>' : ''}</span>
                        <span class="compras-autocomplete-item-category">${categoria}</span>
                        <span class="compras-autocomplete-item-unidad">${unidad}</span>
                    </div>
                `;
            }).join('');
            
            productoDropdown.style.display = 'block';
            currentDropdownIndex = -1;
            
            // Agregar event listeners a los items
            productoDropdown.querySelectorAll('.compras-autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    const productoId = parseInt(this.dataset.productoId);
                    seleccionarProducto(productoId);
                });
                
                item.addEventListener('mouseenter', function() {
                    productoDropdown.querySelectorAll('.compras-autocomplete-item').forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    currentDropdownIndex = parseInt(this.dataset.index);
                });
            });
        }
        
        // Seleccionar producto
        async function seleccionarProducto(productoId) {
            const producto = allProductos.find(p => p.id_producto === productoId);
            if (!producto) return;
            
            selectedProducto = producto;
            const nombre = producto.nombre || producto.nombre_producto || '';
            
            // Actualizar input de búsqueda
            if (productoSearch) {
                productoSearch.value = nombre;
            }
            
            // Actualizar input hidden con el ID
            if (productoIdInput) {
                productoIdInput.value = productoId;
            }
            
            // Ocultar dropdown
            if (productoDropdown) {
                productoDropdown.style.display = 'none';
            }
            
            currentDropdownIndex = -1;
            
            // Actualizar unidades cuando se selecciona un producto
            if (producto && producto.id_categoria) {
                const categoriaNombre = await obtenerNombreCategoriaPorId(producto.id_categoria);
                const unidadSelect = document.getElementById('modal-producto-unidad');
                const unidadActual = unidadSelect.value;
                actualizarSelectUnidad(unidadSelect, producto.id_categoria, categoriaNombre, unidadActual);
            }
            
            console.log('✅ Producto seleccionado:', nombre);
        }
        
        // Event listeners para el autocomplete
        let searchTimeout;
        productoSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const termino = e.target.value;
            
            // Si se borra el campo, limpiar selección
            if (termino.trim() === '') {
                selectedProducto = null;
                if (productoIdInput) productoIdInput.value = '';
                if (productoDropdown) productoDropdown.style.display = 'none';
                return;
            }
            
            // Debounce para mejorar rendimiento
            searchTimeout = setTimeout(() => {
                const resultados = filtrarProductos(termino);
                renderizarResultados(resultados);
            }, 150);
        });
        
        // Manejar teclado
        productoSearch.addEventListener('keydown', function(e) {
            const items = productoDropdown.querySelectorAll('.compras-autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentDropdownIndex = Math.min(currentDropdownIndex + 1, items.length - 1);
                items.forEach((item, index) => {
                    item.classList.toggle('active', index === currentDropdownIndex);
                });
                if (items[currentDropdownIndex]) {
                    items[currentDropdownIndex].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentDropdownIndex = Math.max(currentDropdownIndex - 1, -1);
                items.forEach((item, index) => {
                    item.classList.toggle('active', index === currentDropdownIndex);
                });
                if (items[currentDropdownIndex]) {
                    items[currentDropdownIndex].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentDropdownIndex >= 0 && items[currentDropdownIndex]) {
                    const productoId = parseInt(items[currentDropdownIndex].dataset.productoId);
                    seleccionarProducto(productoId);
                }
            } else if (e.key === 'Escape') {
                if (productoDropdown) {
                    productoDropdown.style.display = 'none';
                }
                currentDropdownIndex = -1;
            }
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!productoSearch.contains(e.target) && !productoDropdown.contains(e.target)) {
                productoDropdown.style.display = 'none';
            }
        });
    }
    
    // Cargar productos
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (response.ok) {
                const result = await response.json();
                // Manejar respuesta que puede ser array directo o objeto con propiedad productos
                allProductos = Array.isArray(result) ? result : (result.productos || []);
                
                // Asegurar que allProductos sea un array
                if (!Array.isArray(allProductos)) {
                    console.error('La respuesta de productos no es un array:', allProductos);
                    allProductos = [];
                }
                
                // Asegurar que las categorías estén cargadas antes de inicializar autocomplete
                if (allCategorias.length === 0) {
                    await cargarCategorias();
                }
                
                // Inicializar autocomplete para productos
                inicializarAutocompleteProductos();
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    }

    // Cargar compras desde la API
    async function cargarCompras() {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/compras`);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const compras = await response.json();
            allCompras = compras;
            renderizarListaCompras(compras);
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar compras:', error);
            mostrarNotificacion(`Error al cargar compras: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Renderizar lista de compras
    function renderizarListaCompras(compras) {
        if (!comprasListSection) return;
        
        const tbody = document.getElementById('compras-tbody');
        if (!tbody) return;
        
        if (!compras || compras.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-shopping-bag" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                        <p>No hay compras registradas</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = compras.map(compra => {
            const proveedor = allProveedores.find(p => p.id_proveedor === compra.id_proveedor);
            const fecha = new Date(compra.fecha_compra).toLocaleDateString('es-ES');
            const nombreProveedor = proveedor?.nombre_proveedor || proveedor?.nombre_comercial || 'N/A';
            return `
                <tr>
                    <td>${compra.id_compra}</td>
                    <td>${nombreProveedor}</td>
                    <td>${fecha}</td>
                    <td>$${formatearPrecio(compra.total_compra || 0)}</td>
                    <td>
                        <button class="compras-btn compras-btn-sm compras-btn-info" onclick="verDetalleCompra(${compra.id_compra})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                    <td>
                        <div class="compras-actions">
                            ${currentAction === 'edit' ? `
                                <button class="compras-btn compras-btn-sm compras-btn-warning" onclick="editarCompra(${compra.id_compra})">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                            ${currentAction === 'delete' ? `
                                <button class="compras-btn compras-btn-sm compras-btn-danger" onclick="eliminarCompraConfirm(${compra.id_compra})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            ${currentAction === 'list' ? `
                                <button class="compras-btn compras-btn-sm compras-btn-warning" onclick="editarCompra(${compra.id_compra})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="compras-btn compras-btn-sm compras-btn-danger" onclick="eliminarCompraConfirm(${compra.id_compra})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filtrar compras
    function filtrarCompras() {
        const termino = searchInput?.value.toLowerCase() || '';
        const fecha = filterFecha?.value || '';
        const proveedor = filterProveedor?.value || '';
        
        let comprasFiltradas = allCompras.filter(compra => {
            const proveedorObj = allProveedores.find(p => p.id_proveedor === compra.id_proveedor);
            const nombreProveedor = proveedorObj?.nombre_proveedor || proveedorObj?.nombre_comercial || '';
            const matchTermino = !termino || 
                compra.id_compra.toString().includes(termino) ||
                nombreProveedor.toLowerCase().includes(termino);
            
            const matchFecha = !fecha || new Date(compra.fecha_compra).toISOString().split('T')[0] === fecha;
            const matchProveedor = !proveedor || compra.id_proveedor.toString() === proveedor;
            
            return matchTermino && matchFecha && matchProveedor;
        });
        
        renderizarListaCompras(comprasFiltradas);
    }

    // Abrir modal de producto
    function abrirModalProducto() {
        currentEditIndex = null;
        const productoSearch = document.getElementById('modal-producto-search');
        const productoIdInput = document.getElementById('modal-producto-id');
        if (productoSearch) productoSearch.value = '';
        if (productoIdInput) productoIdInput.value = '';
        document.getElementById('modal-producto-cantidad').value = '';
        document.getElementById('modal-producto-unidad').value = '';
        document.getElementById('modal-producto-precio').value = '';
        modalProducto.style.display = 'flex';
        
        // Ocultar dropdown
        const productoDropdown = document.getElementById('modal-producto-dropdown');
        if (productoDropdown) productoDropdown.style.display = 'none';
        
        // Restaurar select de unidades
        const unidadSelect = document.getElementById('modal-producto-unidad');
        unidadSelect.innerHTML = `
            <option value="">Seleccionar unidad</option>
            <option value="lb">Libra (lb)</option>
            <option value="unidad">Unidad</option>
        `;
        unidadSelect.style.backgroundColor = '';
        const helpText = document.getElementById('modal-unidad-help');
        if (helpText) {
            helpText.style.display = 'none';
        }
        
        selectedProducto = null;
        currentDropdownIndex = -1;
    }

    // Cerrar modal de producto
    window.cerrarModalProducto = function() {
        modalProducto.style.display = 'none';
    };

    // Agregar producto al detalle
    window.agregarProductoDetalle = async function() {
        const productoIdInput = document.getElementById('modal-producto-id');
        const productoId = productoIdInput ? productoIdInput.value : '';
        const cantidad = parseFloat(document.getElementById('modal-producto-cantidad').value);
        const unidad = document.getElementById('modal-producto-unidad').value;
        const precio = parseFloat(document.getElementById('modal-producto-precio').value);

        if (!productoId || !cantidad || !precio || !unidad) {
            mostrarNotificacion('Complete todos los campos', 'error');
            return;
        }

        const producto = allProductos.find(p => p.id_producto == productoId);
        
        // Validar que la unidad sea válida para la categoría del producto
        if (producto && producto.id_categoria) {
            const categoriaNombre = await obtenerNombreCategoriaPorId(producto.id_categoria);
            if (!validarUnidadParaCategoria(unidad, producto.id_categoria, categoriaNombre)) {
                const unidadRequerida = obtenerUnidadPorCategoria(producto.id_categoria, categoriaNombre);
                mostrarNotificacion(`La unidad debe ser "${unidadRequerida}" para este producto`, 'error');
                return;
            }
        }
        
        const subtotal = cantidad * precio;

        const detalle = {
            id_producto: parseInt(productoId),
            nombre_producto: producto?.nombre || producto?.nombre_producto || 'Producto',
            cantidad: cantidad,
            unidad: unidad,
            precio_compra: precio,
            subtotal: subtotal
        };

        if (currentEditIndex !== null) {
            detalleCompra[currentEditIndex] = detalle;
        } else {
            detalleCompra.push(detalle);
        }

        actualizarTablaDetalle();
        actualizarTotal();
        cerrarModalProducto();
    };

    // Actualizar tabla de detalle
    function actualizarTablaDetalle() {
        const tbody = document.getElementById('compras-detail-tbody');
        if (!tbody) return;

        if (detalleCompra.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 1rem; color: #9ca3af;">
                        No hay productos agregados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = detalleCompra.map((detalle, index) => `
            <tr>
                <td>${detalle.nombre_producto}</td>
                <td>${detalle.cantidad}</td>
                <td>${detalle.unidad}</td>
                <td>$${formatearPrecio(detalle.precio_compra)}</td>
                <td>$${formatearPrecio(detalle.subtotal)}</td>
                <td>
                    <button class="compras-btn compras-btn-sm compras-btn-warning" onclick="editarDetalle(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="compras-btn compras-btn-sm compras-btn-danger" onclick="eliminarDetalle(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Editar detalle
    window.editarDetalle = function(index) {
        const detalle = detalleCompra[index];
        currentEditIndex = index;
        const productoIdInput = document.getElementById('modal-producto-id');
        const productoSearch = document.getElementById('modal-producto-search');
        if (productoIdInput) productoIdInput.value = detalle.id_producto;
        
        // Buscar el nombre del producto y mostrarlo en el input de búsqueda
        if (productoSearch && detalle.id_producto) {
            const producto = allProductos.find(p => p.id_producto == detalle.id_producto);
            if (producto) {
                productoSearch.value = producto.nombre || producto.nombre_producto || detalle.nombre_producto || '';
            } else {
                productoSearch.value = detalle.nombre_producto || '';
            }
        }
        
        document.getElementById('modal-producto-cantidad').value = detalle.cantidad;
        document.getElementById('modal-producto-unidad').value = detalle.unidad;
        document.getElementById('modal-producto-precio').value = detalle.precio_compra;
        modalProducto.style.display = 'flex';
        
        // Ocultar dropdown
        const productoDropdown = document.getElementById('modal-producto-dropdown');
        if (productoDropdown) productoDropdown.style.display = 'none';
    };

    // Eliminar detalle
    window.eliminarDetalle = function(index) {
        if (confirm('¿Estás seguro de eliminar este producto del detalle?')) {
            detalleCompra.splice(index, 1);
            actualizarTablaDetalle();
            actualizarTotal();
        }
    };

    // Actualizar total
    function actualizarTotal() {
        const total = detalleCompra.reduce((sum, detalle) => sum + detalle.subtotal, 0);
        document.getElementById('compra-total').textContent = `$${formatearPrecio(total)}`;
        document.getElementById('compra-total-hidden').value = total;
    }

    // Formatear precio
    function formatearPrecio(precio) {
        return parseFloat(precio).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // NOTA: Las siguientes funciones ya no son necesarias porque los triggers de la BD
    // actualizan automáticamente el inventario cuando se crea un detalle_compra.
    // 
    // El trigger trg_after_insert_detalle_compra actualiza automáticamente:
    // - productos.entrada_compras = entrada_compras + cantidad
    // - productos.stock_actual se recalcula automáticamente (inventario_inicial + entrada_compras - salida_pedidos)
    //
    // Si el backend necesita actualizar campos adicionales como 'costo', debe hacerlo en el controlador.
    //
    // FUNCIONES OBSOLETAS (comentadas para referencia):
    // - crearInventarioDesdeCompra() - Ya no es necesaria
    // - sincronizarProductoConInventario() - Ya no es necesaria

    // Guardar compra
    async function guardarCompra() {
        console.log('=== INICIANDO guardarCompra ===');
        console.log('currentAction:', currentAction);
        console.log('detalleCompra:', detalleCompra);
        console.log('detalleCompra.length:', detalleCompra.length);
        
        try {
            showLoading(true);
            const formData = new FormData(form);
            console.log('FormData obtenido');
            const datos = {
                id_proveedor: parseInt(formData.get('id_proveedor')),
                fecha_compra: formData.get('fecha_compra'),
                total_compra: parseFloat(document.getElementById('compra-total-hidden').value),
                detalle: detalleCompra.map(d => ({
                    id_producto: d.id_producto,
                    cantidad: d.cantidad,
                    unidad: d.unidad,
                    precio_compra: d.precio_compra
                }))
            };

            const url = currentAction === 'create' 
                ? `${API_BASE_URL}/compras`
                : `${API_BASE_URL}/compras/${currentCompraId}`;
            
            const method = currentAction === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar compra');
            }

            const result = await response.json();
            console.log('Resultado de guardar compra:', result);
            
            // Si es una compra nueva, crear registros de inventario automáticamente
            if (currentAction === 'create') {
                let idCompra = result.id_compra || result.id || result.compra?.id_compra || result.insertId;
                console.log('ID de compra obtenido de la respuesta:', idCompra);
                
                // Si no se obtuvo el ID de la respuesta, intentar obtenerlo consultando la última compra
                if (!idCompra) {
                    console.log('ID no encontrado en respuesta, consultando última compra...');
                    try {
                        const comprasResponse = await fetch(`${API_BASE_URL}/compras`);
                        if (comprasResponse.ok) {
                            const compras = await comprasResponse.json();
                            const comprasArray = Array.isArray(compras) ? compras : (compras.compras || compras.data || []);
                            if (comprasArray.length > 0) {
                                // Ordenar por fecha descendente y tomar la primera
                                comprasArray.sort((a, b) => {
                                    const fechaA = new Date(a.fecha_compra);
                                    const fechaB = new Date(b.fecha_compra);
                                    return fechaB - fechaA;
                                });
                                idCompra = comprasArray[0].id_compra;
                                console.log('ID de compra obtenido consultando últimas compras:', idCompra);
                            }
                        }
                    } catch (error) {
                        console.error('Error al consultar últimas compras:', error);
                    }
                }
                
                console.log('ID de compra final:', idCompra);
                console.log('Detalles de compra a procesar:', detalleCompra);
                
                // NOTA: Los triggers de la BD actualizan automáticamente entrada_compras en productos
                // cuando se crea un detalle_compra. No es necesario crear inventario manualmente.
                // El trigger trg_after_insert_detalle_compra actualiza automáticamente:
                // productos.entrada_compras = entrada_compras + cantidad
                // productos.stock_actual se recalcula automáticamente
            }

            mostrarNotificacion(
                currentAction === 'create' ? 'Compra creada exitosamente. El inventario se actualizó automáticamente.' : 'Compra actualizada exitosamente',
                'success'
            );
            
            // Disparar evento para recargar inventario consolidado si está abierto
            window.dispatchEvent(new CustomEvent('compraGuardada', {
                detail: { 
                    id_compra: result.id_compra || result.id || result.compra?.id_compra,
                    action: currentAction
                }
            }));
            
            showSection('list', 'list');
            await cargarCompras();
            showLoading(false);
        } catch (error) {
            console.error('Error al guardar compra:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Eliminar compra
    async function eliminarCompra(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar compra');
            }

            mostrarNotificacion('Compra eliminada exitosamente', 'success');
            
            // Disparar evento para recargar inventario consolidado si está abierto
            window.dispatchEvent(new CustomEvent('compraGuardada', {
                detail: { 
                    id_compra: id,
                    action: 'delete'
                }
            }));
            
            await cargarCompras();
            showLoading(false);
        } catch (error) {
            console.error('Error al eliminar compra:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Mostrar loading
    function showLoading(show) {
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('show');
            } else {
                loadingOverlay.classList.remove('show');
            }
        }
    }

    // Mostrar notificación
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `compras-notification compras-notification-${tipo}`;
        notification.innerHTML = `
            <div class="compras-notification-content">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background-color: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ========================================
    // FUNCIONES GLOBALES
    // ========================================

    // Editar compra
    window.editarCompra = async function(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/compras/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar compra');
            }
            
            const compra = await response.json();
            currentCompraId = id;
            currentAction = 'edit';
            
            // Llenar formulario
            document.getElementById('compra-id-proveedor').value = compra.id_proveedor;
            document.getElementById('compra-fecha').value = new Date(compra.fecha_compra).toISOString().slice(0, 16);
            
            // Cargar detalles
            if (compra.detalle) {
                detalleCompra = compra.detalle;
                actualizarTablaDetalle();
                actualizarTotal();
            }
            
            modalTitle.textContent = 'Editar Compra';
            showSection('form', 'edit');
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar compra:', error);
            mostrarNotificacion('Error al cargar compra', 'error');
            showLoading(false);
        }
    };

    // Confirmar eliminación
    window.eliminarCompraConfirm = function(id) {
        const compra = allCompras.find(c => c.id_compra === id);
        if (compra && confirm(`¿Estás seguro de que quieres eliminar la compra #${compra.id_compra}?`)) {
            eliminarCompra(id);
        }
    };

    // Ver detalle de compra
    window.verDetalleCompra = async function(id) {
        try {
            showLoading(true);
            
            // Obtener información de la compra
            const compraResponse = await fetch(`${API_BASE_URL}/compras/${id}`);
            if (!compraResponse.ok) {
                throw new Error('Error al cargar la compra');
            }
            
            const compra = await compraResponse.json();
            console.log('📦 Compra obtenida:', compra);
            
            // Intentar obtener detalles de múltiples fuentes
            let detalles = [];
            
            // Primero intentar desde compra.detalle (si viene en la respuesta)
            if (compra.detalle && Array.isArray(compra.detalle) && compra.detalle.length > 0) {
                detalles = compra.detalle;
                console.log('✅ Detalles obtenidos desde compra.detalle:', detalles.length);
            } else {
                // Si no, obtener desde el endpoint de detalles
                const detallesResponse = await fetch(`${API_BASE_URL}/detalle-compra/compra/${id}`);
                if (detallesResponse.ok) {
                    const detallesData = await detallesResponse.json();
                    console.log('📋 Respuesta de detalles:', detallesData);
                    
                    // Intentar diferentes formatos de respuesta
                    if (Array.isArray(detallesData)) {
                        detalles = detallesData;
                    } else if (detallesData.detalles && Array.isArray(detallesData.detalles)) {
                        detalles = detallesData.detalles;
                    } else if (detallesData.data && Array.isArray(detallesData.data)) {
                        detalles = detallesData.data;
                    } else if (detallesData.detalle && Array.isArray(detallesData.detalle)) {
                        detalles = detallesData.detalle;
                    }
                    console.log('✅ Detalles obtenidos desde endpoint:', detalles.length);
                } else {
                    console.warn('⚠️ No se pudieron obtener detalles desde el endpoint');
                }
            }
            
            // Si aún no hay detalles, intentar obtener nombres de productos
            if (detalles.length > 0) {
                // Obtener nombres de productos si no vienen en los detalles
                for (let detalle of detalles) {
                    if (!detalle.nombre_producto && detalle.id_producto) {
                        const producto = allProductos.find(p => p.id_producto === detalle.id_producto);
                        if (producto) {
                            detalle.nombre_producto = producto.nombre_producto || producto.nombre;
                        }
                    }
                    // Asegurar que tenga unidad
                    if (!detalle.unidad && detalle.id_producto) {
                        const producto = allProductos.find(p => p.id_producto === detalle.id_producto);
                        if (producto) {
                            detalle.unidad = producto.unidad_medida || 'unidad';
                        }
                    }
                }
            }
            
            console.log('📊 Detalles finales a mostrar:', detalles);
            
            // Obtener nombre del proveedor
            let nombreProveedor = 'N/A';
            if (compra.id_proveedor) {
                const proveedor = allProveedores.find(p => p.id_proveedor === compra.id_proveedor);
                nombreProveedor = proveedor ? proveedor.nombre_proveedor : 'Proveedor no encontrado';
            }
            
            // Llenar el modal con la información
            document.getElementById('detalle-compra-id').textContent = id;
            document.getElementById('detalle-compra-proveedor').textContent = nombreProveedor;
            
            // Formatear fecha
            const fecha = compra.fecha_compra ? new Date(compra.fecha_compra) : new Date();
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('detalle-compra-fecha').textContent = fechaFormateada;
            
            // Mostrar total
            const total = compra.total_compra || 0;
            document.getElementById('detalle-compra-total').textContent = `$${formatearPrecio(total)}`;
            
            // Llenar tabla de detalles
            const tbody = document.getElementById('detalle-compra-tbody');
            tbody.innerHTML = '';
            
            if (detalles.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-gray-500);">
                            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                            No hay productos en esta compra
                        </td>
                    </tr>
                `;
            } else {
                detalles.forEach((detalle, index) => {
                    const row = document.createElement('tr');
                    const nombreProducto = detalle.nombre_producto || detalle.nombre || 'Producto sin nombre';
                    const cantidad = parseFloat(detalle.cantidad || 0).toFixed(3);
                    const unidad = detalle.unidad || detalle.unidad_medida || '-';
                    const precioUnitario = detalle.precio_unitario || detalle.precio_compra || 0;
                    const subtotal = detalle.subtotal || (detalle.cantidad * precioUnitario) || 0;
                    
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td><strong>${nombreProducto}</strong></td>
                        <td>${cantidad}</td>
                        <td><span class="compras-badge-unidad">${unidad}</span></td>
                        <td>$${formatearPrecio(precioUnitario)}</td>
                        <td><strong>$${formatearPrecio(subtotal)}</strong></td>
                    `;
                    tbody.appendChild(row);
                });
            }
            
            // Mostrar el modal
            const modal = document.getElementById('modal-detalle-compra');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            showLoading(false);
        } catch (error) {
            console.error('❌ Error al cargar detalle:', error);
            mostrarNotificacion('Error al cargar los detalles de la compra', 'error');
            showLoading(false);
        }
    };

    // Cerrar modal de detalle de compra
    window.cerrarModalDetalleCompra = function() {
        const modal = document.getElementById('modal-detalle-compra');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Cerrar modal al hacer clic fuera de él
    const modalDetalle = document.getElementById('modal-detalle-compra');
    if (modalDetalle) {
        modalDetalle.addEventListener('click', function(e) {
            if (e.target === modalDetalle) {
                cerrarModalDetalleCompra();
            }
        });
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
});

