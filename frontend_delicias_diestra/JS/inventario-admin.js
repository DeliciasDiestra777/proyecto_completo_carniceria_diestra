// inventario-admin.js - Gestión de inventario en el panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const form = document.getElementById('inventario-form');
    const saveBtn = document.getElementById('save-inventario');
    const cancelBtn = document.getElementById('cancel-inventario');
    const loadingOverlay = document.getElementById('inventario-loading');
    
    // Secciones
    const actionsSection = document.getElementById('inventario-actions-section');
    const formSection = document.getElementById('inventario-form-section');
    const listSection = document.getElementById('inventario-list-section');
    const listIndividualSection = document.getElementById('inventario-list-individual-section');
    
    // Variables para control
    let currentInventarioId = null;
    let currentAction = '';
    let allInventarios = []; // Almacenar todos los registros individuales
    
    // Botones de acción
    const btnInventarioInicial = document.getElementById('btn-inventario-inicial');
    const btnVerInventario = document.getElementById('btn-ver-inventario');
    const btnEditarInventario = document.getElementById('btn-editar-inventario');
    const btnEliminarInventario = document.getElementById('btn-eliminar-inventario');
    const btnRefreshInventario = document.getElementById('btn-refresh-inventario');
    const btnRefreshInventarioIndividual = document.getElementById('btn-refresh-inventario-individual');
    const searchInput = document.getElementById('search-inventario');
    const searchInputIndividual = document.getElementById('search-inventario-individual');
    const deleteBtn = document.getElementById('delete-inventario');
    const inventarioIdInput = document.getElementById('inventario-id');
    
    // Campos del formulario
    const inventarioInicial = document.getElementById('inventario-inicial');
    const inventarioEntrada = document.getElementById('inventario-entrada');
    const inventarioSalida = document.getElementById('inventario-salida');
    const inventarioFinal = document.getElementById('inventario-final');
    const fechaInventario = document.getElementById('inventario-fecha');
    const productoSelect = document.getElementById('inventario-producto');
    const unidadSelect = document.getElementById('inventario-unidad');
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Variable para almacenar inventario consolidado
    let inventarioConsolidado = [];
    let allRecetas = []; // Para obtener producto final de recetas en producciones
    
    // Variables para crear producto nuevo (definidas temprano para usar en event listeners)
    const sectionNuevoProducto = document.getElementById('section-nuevo-producto');
    let esProductoNuevo = false;

    // Establecer fecha actual por defecto (usando zona horaria de Colombia)
    if (fechaInventario) {
        fechaInventario.value = typeof getCurrentDateISO === 'function' ? getCurrentDateISO() : new Date().toISOString().split('T')[0];
    }

    // ========================================
    // EVENT LISTENERS PARA ACTUALIZACIÓN AUTOMÁTICA
    // ========================================
    
    // Escuchar eventos de compras y pedidos para recargar inventario automáticamente
    window.addEventListener('compraGuardada', function(event) {
        console.log('🔄 Compra guardada, recargando inventario consolidado...', event.detail);
        // Solo recargar si la sección de inventario consolidado está visible
        if (listSection && listSection.style.display !== 'none') {
            // Usar .then() en lugar de await para evitar problemas con event listeners
            cargarInventarioConsolidado().catch(error => {
                console.error('Error al recargar inventario después de compra:', error);
            });
        }
    });
    
    window.addEventListener('pedidoGuardado', function(event) {
        console.log('🔄 Pedido guardado, recargando inventario consolidado...', event.detail);
        // Solo recargar si la sección de inventario consolidado está visible
        if (listSection && listSection.style.display !== 'none') {
            // Usar .then() en lugar de await para evitar problemas con event listeners
            cargarInventarioConsolidado().catch(error => {
                console.error('Error al recargar inventario después de pedido:', error);
            });
        }
    });
    
    window.addEventListener('produccionGuardada', function(event) {
        console.log('🔄 Producción guardada, recargando inventario consolidado...', event.detail);
        // Solo recargar si la sección de inventario consolidado está visible
        if (listSection && listSection.style.display !== 'none') {
            // Usar .then() en lugar de await para evitar problemas con event listeners
            cargarInventarioConsolidado().catch(error => {
                console.error('Error al recargar inventario después de producción:', error);
            });
        }
    });
    
    // Escuchar eventos de actualización de inventario (cuando se marca pedido como Entregado)
    window.addEventListener('inventarioActualizado', function(event) {
        console.log('🔄 Evento de actualización de inventario recibido:', event.detail);
        // Solo recargar si la sección de inventario consolidado está visible
        if (listSection && listSection.style.display !== 'none') {
            cargarInventarioConsolidado().catch(error => {
                console.error('Error al recargar inventario consolidado:', error);
            });
        }
    });

    // ========================================
    // NAVEGACIÓN ENTRE SECCIONES
    // ========================================
    
    function showSection(section, action = '') {
        const modalBody = document.querySelector('.inventario-modal-body');
        
        // Ocultar todas las secciones
        if (actionsSection) actionsSection.style.display = 'none';
        if (formSection) formSection.style.display = 'none';
        if (listSection) listSection.style.display = 'none';
        if (listIndividualSection) listIndividualSection.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        // Remover clase de solo acciones
        if (modalBody) {
            modalBody.classList.remove('only-actions');
        }
        
        // Ocultar sección de editar producto por defecto
        const sectionEditarProducto = document.getElementById('section-editar-producto');
        if (sectionEditarProducto) {
            sectionEditarProducto.style.display = 'none';
            // Remover atributo required de los campos cuando se ocultan
            const editarProductoNombre = document.getElementById('editar-producto-nombre');
            const editarProductoCategoria = document.getElementById('editar-producto-categoria');
            if (editarProductoNombre) editarProductoNombre.removeAttribute('required');
            if (editarProductoCategoria) editarProductoCategoria.removeAttribute('required');
        }
        
        // Restaurar visibilidad del selector de producto
        const productoSelect = document.getElementById('inventario-producto');
        const btnCrearProducto = document.getElementById('btn-crear-producto-inventario');
        const helpProductoSelect = document.getElementById('help-producto-select');
        if (productoSelect) productoSelect.style.display = '';
        if (btnCrearProducto) btnCrearProducto.style.display = '';
        if (helpProductoSelect) helpProductoSelect.style.display = '';
        
        // Restaurar campo de inventario inicial a editable cuando no estamos en modo edición
        if (action !== 'edit') {
            const inventarioCantidad = document.getElementById('inventario-cantidad');
            if (inventarioCantidad) {
                inventarioCantidad.readOnly = false;
                inventarioCantidad.removeAttribute('title');
            }
        }
        
        currentAction = action;
        
        // Mostrar la sección solicitada
        if (section === 'actions') {
            if (actionsSection) {
                actionsSection.style.display = 'block';
                // Agregar clase para centrar y reducir espacio
                if (modalBody) {
                    modalBody.classList.add('only-actions');
                }
            }
        } else if (section === 'form') {
            if (formSection) formSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
            if (deleteBtn && action === 'edit') deleteBtn.style.display = 'inline-flex';
        } else if (section === 'list') {
            if (listSection) listSection.style.display = 'block';
        } else if (section === 'list-individual') {
            if (listIndividualSection) listIndividualSection.style.display = 'block';
        }
    }

    // Event listeners para botones de acción
    if (btnInventarioInicial) {
        btnInventarioInicial.addEventListener('click', function(e) {
            e.preventDefault();
            const titleElement = document.getElementById('inventario-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Inventario Inicial';
            }
            showSection('form');
            if (form) form.reset();
            if (fechaInventario) fechaInventario.value = new Date().toISOString().split('T')[0];
            calcularInventarioFinal();
            // Limpiar campos para inventario inicial
            if (inventarioEntrada) inventarioEntrada.value = 0;
            if (inventarioSalida) inventarioSalida.value = 0;
            // Asegurar que el campo de inventario inicial sea editable cuando se crea nuevo
            const inventarioCantidad = document.getElementById('inventario-cantidad');
            if (inventarioCantidad) {
                inventarioCantidad.readOnly = false;
                inventarioCantidad.removeAttribute('title');
            }
            
            // Cargar stock mínimo desde localStorage si existe
            const stockMinimoInput = document.getElementById('inventario-stock-minimo');
            if (stockMinimoInput) {
                const stockMinimoGuardado = localStorage.getItem('stock_minimo_sincronizado');
                if (stockMinimoGuardado !== null) {
                    stockMinimoInput.value = stockMinimoGuardado;
                }
                
                // Agregar event listener para sincronización (solo una vez)
                if (!stockMinimoInput.hasAttribute('data-sync-listener')) {
                    stockMinimoInput.setAttribute('data-sync-listener', 'true');
                    stockMinimoInput.addEventListener('input', function() {
                        const valor = this.value || '0';
                        localStorage.setItem('stock_minimo_sincronizado', valor);
                        
                        // Disparar evento personalizado para actualizar producto-admin si está abierto
                        window.dispatchEvent(new CustomEvent('stockMinimoCambiado', { 
                            detail: { valor: valor, origen: 'inventario' } 
                        }));
                        
                        // Actualizar campo en producto-admin si existe
                        const productStockMinInput = document.getElementById('product-stock-min');
                        if (productStockMinInput) {
                            productStockMinInput.value = valor;
                        }
                    });
                }
            }
            
            // Asegurar que la sección de nuevo producto esté oculta
            if (sectionNuevoProducto) {
                sectionNuevoProducto.style.display = 'none';
            }
            esProductoNuevo = false;
        });
    }

    if (btnVerInventario) {
        btnVerInventario.addEventListener('click', function(e) {
            e.preventDefault();
            const titleElement = document.getElementById('inventario-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Inventario Consolidado';
            }
            showSection('list');
            cargarInventarioConsolidado();
        });
    }

    if (btnEditarInventario) {
        btnEditarInventario.addEventListener('click', function(e) {
            e.preventDefault();
            const titleElement = document.getElementById('inventario-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Editar Inventario';
            }
            showSection('list-individual');
            cargarInventariosIndividuales();
        });
    }

    if (btnEliminarInventario) {
        btnEliminarInventario.addEventListener('click', function(e) {
            e.preventDefault();
            const titleElement = document.getElementById('inventario-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Eliminar Inventario';
            }
            showSection('list-individual', 'delete');
            cargarInventariosIndividuales();
        });
    }

    if (btnRefreshInventarioIndividual) {
        btnRefreshInventarioIndividual.addEventListener('click', function() {
            cargarInventariosIndividuales();
        });
    }

    if (searchInputIndividual) {
        searchInputIndividual.addEventListener('input', function() {
            filtrarInventariosIndividuales();
        });
    }

    if (btnRefreshInventario) {
        btnRefreshInventario.addEventListener('click', function() {
            cargarInventarioConsolidado();
        });
    }

    // Búsqueda en inventario
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filtrarInventario();
        });
    }

    // Botón cancelar - volver al menú
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            const currentSection = formSection?.style.display === 'block' ? 'form' : 
                                  listSection?.style.display === 'block' ? 'list' : 'actions';
            if (currentSection !== 'actions') {
                document.getElementById('inventario-modal-title').textContent = 'Gestión de Inventario';
                showSection('actions');
            } else {
                window.location.href = 'inventario-admin.html';
            }
        });
    }

    // Cargar productos disponibles
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (response.ok) {
                const productos = await response.json();
                const productosArray = productos.productos || productos;
                const selectProducto = document.getElementById('inventario-producto');
                if (selectProducto) {
                    selectProducto.innerHTML = '<option value="">Seleccionar producto</option>';
                    productosArray.forEach(producto => {
                        if (producto.estado === 'activo' || !producto.estado) {
                            const option = document.createElement('option');
                            option.value = producto.id_producto;
                            option.textContent = `${producto.nombre || producto.nombre_producto || 'Sin nombre'}`;
                            option.dataset.unidad = producto.unidad_medida || 'lb';
                            selectProducto.appendChild(option);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    }

    // Actualizar unidad cuando se selecciona un producto
    if (productoSelect && unidadSelect) {
        productoSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.unidad) {
                const unidad = selectedOption.dataset.unidad;
                unidadSelect.value = unidad;
                
                // Si la unidad no está en las opciones, agregarla
                if (!Array.from(unidadSelect.options).some(opt => opt.value === unidad)) {
                    const option = document.createElement('option');
                    option.value = unidad;
                    option.textContent = unidad === 'kg' ? 'Kilogramo (kg)' : 
                                       unidad === 'lb' ? 'Libra (lb)' : 
                                       unidad === 'gr' ? 'Gramo (gr)' : 
                                       'Unidad';
                    unidadSelect.appendChild(option);
                    unidadSelect.value = unidad;
                }
            }
        });
    }

    // Calcular inventario final automáticamente
    function calcularInventarioFinal() {
        if (inventarioInicial && inventarioEntrada && inventarioSalida && inventarioFinal) {
            // Obtener valores como strings y limpiarlos antes de parsear
            const inicialStr = (inventarioInicial.value || '').toString().replace(/,/g, '');
            const entradaStr = (inventarioEntrada.value || '').toString().replace(/,/g, '');
            const salidaStr = (inventarioSalida.value || '').toString().replace(/,/g, '');
            
            const inicial = parseFloat(inicialStr) || 0;
            const entrada = parseFloat(entradaStr) || 0;
            const salida = parseFloat(salidaStr) || 0;
            
            const final = inicial + entrada - salida;
            
            // Mostrar el resultado sin formato de miles, solo con decimales si es necesario
            // Si el número es entero, mostrar sin decimales; si tiene decimales, mostrar hasta 3
            // Formatear número sin decimales innecesarios
            const numeroFinal = parseFloat(final);
            if (numeroFinal % 1 === 0) {
                inventarioFinal.value = numeroFinal.toString();
            } else {
                // Si tiene decimales, eliminar ceros innecesarios al final
                inventarioFinal.value = numeroFinal.toString().replace(/\.?0+$/, '');
            }
        }
    }

    // Event listeners para cálculo automático
    if (inventarioInicial) inventarioInicial.addEventListener('input', calcularInventarioFinal);
    if (inventarioEntrada) inventarioEntrada.addEventListener('input', calcularInventarioFinal);
    if (inventarioSalida) inventarioSalida.addEventListener('input', calcularInventarioFinal);

    // Calcular inicial al cargar
    calcularInventarioFinal();
    
    // Listener global para sincronización de stock mínimo desde producto-admin
    window.addEventListener('stockMinimoCambiado', function(event) {
        if (event.detail && event.detail.origen === 'producto') {
            const stockMinimoInput = document.getElementById('inventario-stock-minimo');
            if (stockMinimoInput) {
                stockMinimoInput.value = event.detail.valor;
            }
        }
    });

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
        notification.className = `inventario-notification inventario-notification-${tipo}`;
        notification.innerHTML = `
            <div class="inventario-notification-content">
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

    // Sincronizar producto con inventario
    async function sincronizarProductoConInventario(idProducto, inventarioFinal, unidad) {
        try {
            // Obtener producto actual
            const productoResponse = await fetch(`${API_BASE_URL}/productos/${idProducto}`);
            if (!productoResponse.ok) {
                console.warn('No se pudo obtener el producto para sincronizar');
                return;
            }

            const producto = await productoResponse.json();
            const productoActual = producto.producto || producto;

            // Preparar datos de actualización
            const datosActualizacion = {
                id_categoria: productoActual.id_categoria,
                nombre: productoActual.nombre || productoActual.nombre_producto,
                descripcion: productoActual.descripcion || null,
                precio_producto: productoActual.precio_producto || productoActual.precio || 0,
                imagen: productoActual.imagen || null,
                cantidad_producto: inventarioFinal, // Actualizar cantidad_producto con inventario_final
                unidad_medida: unidad || productoActual.unidad_medida || 'lb',
                stock_minimo: productoActual.stock_minimo || 0,
                estado: inventarioFinal <= 0 ? 'inactivo' : 'activo' // Deshabilitar si inventario es 0
            };

            // Actualizar producto
            const updateResponse = await fetch(`${API_BASE_URL}/productos/${idProducto}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizacion)
            });

            if (updateResponse.ok) {
                console.log('Producto sincronizado con inventario');
                if (inventarioFinal <= 0) {
                    console.log('Producto deshabilitado porque inventario es 0');
                }
            } else {
                console.warn('No se pudo sincronizar el producto con el inventario');
            }
        } catch (error) {
            console.error('Error al sincronizar producto:', error);
        }
    }

    // Guardar inventario (con soporte para crear producto nuevo)
    async function guardarInventario() {
        try {
            // Validación manual para modo edición
            if (currentAction === 'edit') {
                const editarProductoNombre = document.getElementById('editar-producto-nombre');
                const editarProductoCategoria = document.getElementById('editar-producto-categoria');
                const inventarioCantidad = document.getElementById('inventario-cantidad');
                const unidadSelect = document.getElementById('inventario-unidad');
                
                if (editarProductoNombre && !editarProductoNombre.value.trim()) {
                    mostrarNotificacion('El nombre del producto es requerido', 'error');
                    editarProductoNombre.focus();
                    return;
                }
                if (editarProductoCategoria && !editarProductoCategoria.value) {
                    mostrarNotificacion('La categoría del producto es requerida', 'error');
                    editarProductoCategoria.focus();
                    return;
                }
                if (inventarioCantidad && (!inventarioCantidad.value || parseFloat(inventarioCantidad.value) < 0)) {
                    mostrarNotificacion('La cantidad debe ser mayor o igual a 0', 'error');
                    inventarioCantidad.focus();
                    return;
                }
                if (unidadSelect && !unidadSelect.value) {
                    mostrarNotificacion('La unidad de medida es requerida', 'error');
                    unidadSelect.focus();
                    return;
                }
            } else {
                // Validación normal del formulario para modo creación
                // Remover required de campos ocultos antes de validar
                const editarProductoNombre = document.getElementById('editar-producto-nombre');
                const editarProductoCategoria = document.getElementById('editar-producto-categoria');
                const sectionEditarProducto = document.getElementById('section-editar-producto');
                const isEditarProductoVisible = sectionEditarProducto && sectionEditarProducto.style.display !== 'none';
                
                if (!isEditarProductoVisible) {
                    if (editarProductoNombre) editarProductoNombre.removeAttribute('required');
                    if (editarProductoCategoria) editarProductoCategoria.removeAttribute('required');
                }
                
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
            }

            showLoading(true);
            const formData = new FormData(form);
            let idProducto = null;

            // Si es un producto nuevo, solo registrar nombre y categoría (no crear producto completo)
            if (esProductoNuevo) {
                // Validar campos de producto nuevo
                if (!nuevoProductoNombre?.value.trim()) {
                    mostrarNotificacion('El nombre del producto es requerido', 'error');
                    showLoading(false);
                    return;
                }
                if (!nuevoProductoCategoria?.value) {
                    mostrarNotificacion('La categoría del producto es requerida', 'error');
                    showLoading(false);
                    return;
                }

                const nombreProducto = nuevoProductoNombre.value.trim();
                const categoriaId = parseInt(nuevoProductoCategoria.value);

                // Verificar si el producto ya existe (evitar duplicados)
                const productosResponse = await fetch(`${API_BASE_URL}/productos`);
                if (productosResponse.ok) {
                    const productos = await productosResponse.json();
                    const productosArray = Array.isArray(productos) ? productos : (productos.productos || []);
                    const productoExistente = productosArray.find(p => 
                        (p.nombre_producto || p.nombre || '').toLowerCase() === nombreProducto.toLowerCase() && 
                        p.id_categoria === categoriaId
                    );
                    
                    if (productoExistente) {
                        mostrarNotificacion('Ya existe un producto con ese nombre en esta categoría. Se usará el producto existente.', 'info');
                        idProducto = productoExistente.id_producto;
                    } else {
                        // Obtener valores del formulario de inventario
                        const cantidadInicial = parseFloat(formData.get('inventario_inicial')) || 0;
                        const unidadMedida = formData.get('unidad') || 'lb';
                        const stockMinimo = parseFloat(formData.get('stock_minimo')) || 0;
                        
                        // Crear producto básico con los datos del formulario de inventario
                        const datosProducto = {
                            nombre_producto: nombreProducto,
                            id_categoria: categoriaId,
                            descripcion: null,
                            precio_producto: 0.01, // Valor mínimo requerido por el backend (se actualizará al crear el producto completo)
                            inventario_inicial: cantidadInicial, // Usar la cantidad del formulario
                            entrada_compras: 0,
                            salida_pedidos: 0,
                            unidad_medida: unidadMedida, // Usar la unidad del formulario
                            stock_minimo: stockMinimo, // Usar el stock mínimo del formulario
                            estado: 'activo', // Activo para que aparezca en el autocomplete
                            mostrar_en_catalogo: false, // NO se muestra en el catálogo público
                            imagen: null
                        };

                        console.log('Registrando producto básico desde inventario inicial:', datosProducto);

                        // Crear producto básico
                        const productoResponse = await fetch(`${API_BASE_URL}/productos`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(datosProducto)
                        });

                        const productoResult = await productoResponse.json();

                        if (!productoResponse.ok) {
                            if (productoResponse.status === 409) {
                                // Producto ya existe, buscarlo
                                const productosResponse2 = await fetch(`${API_BASE_URL}/productos`);
                                if (productosResponse2.ok) {
                                    const productos2 = await productosResponse2.json();
                                    const productosArray2 = Array.isArray(productos2) ? productos2 : (productos2.productos || []);
                                    const productoEncontrado = productosArray2.find(p => 
                                        (p.nombre_producto || p.nombre || '').toLowerCase() === nombreProducto.toLowerCase() && 
                                        p.id_categoria === categoriaId
                                    );
                                    
                                    if (productoEncontrado) {
                                        idProducto = productoEncontrado.id_producto;
                                        mostrarNotificacion('El producto ya existe. Se usará el producto existente.', 'info');
                                    } else {
                                        throw new Error('No se pudo encontrar el producto existente');
                                    }
                                } else {
                                    throw new Error(productoResult.error || 'Error al buscar el producto existente');
                                }
                            } else {
                                throw new Error(productoResult.error || productoResult.mensaje || 'Error al registrar producto');
                            }
                        } else {
                            // Producto básico registrado exitosamente
                            console.log('Producto básico registrado:', productoResult);
                            idProducto = productoResult.producto?.id_producto || productoResult.id_producto || productoResult.id || productoResult.insertId;
                            
                            if (!idProducto) {
                                // Buscar el producto recién creado
                                const productosResponse2 = await fetch(`${API_BASE_URL}/productos`);
                                if (productosResponse2.ok) {
                                    const productos2 = await productosResponse2.json();
                                    const productosArray2 = Array.isArray(productos2) ? productos2 : (productos2.productos || []);
                                    const productoEncontrado = productosArray2.find(p => 
                                        (p.nombre_producto || p.nombre || '').toLowerCase() === nombreProducto.toLowerCase() && 
                                        p.id_categoria === categoriaId
                                    );
                                    if (productoEncontrado) {
                                        idProducto = productoEncontrado.id_producto;
                                    }
                                }
                            }

                            if (!idProducto) {
                                throw new Error('No se pudo obtener el ID del producto registrado');
                            }

                            console.log('ID del producto registrado:', idProducto);
                            
                            // El producto ya se creó con los datos de inventario (inventario_inicial, unidad_medida, stock_minimo)
                            // No necesitamos actualizar nada más, solo notificar y limpiar
                            mostrarNotificacion('Producto e inventario inicial registrados exitosamente.', 'success');
                            
                            // Disparar evento para actualizar autocomplete
                            const evento = new CustomEvent('productoInventarioCreado', {
                                detail: { productoId: idProducto }
                            });
                            document.dispatchEvent(evento);
                            
                            // Recargar inventario consolidado para mostrar los nuevos datos
                            await cargarInventarioConsolidado();
                            
                            // No continuar con el guardado de inventario, ya está guardado
                            showLoading(false);
                            ocultarSeccionNuevoProducto();
                            esProductoNuevo = false;
                            form.reset();
                            if (fechaInventario) fechaInventario.value = typeof getCurrentDateISO === 'function' ? getCurrentDateISO() : new Date().toISOString().split('T')[0];
                            return;
                        }
                    }
                } else {
                    throw new Error('Error al verificar productos existentes');
                }
            } else {
                // Obtener id_producto desde el select o desde currentInventarioId (modo edición)
                if (currentAction === 'edit' && currentInventarioId) {
                    idProducto = currentInventarioId;
                } else {
                    idProducto = parseInt(formData.get('id_producto'));
                }
                
                if (!idProducto) {
                    mostrarNotificacion('Debe seleccionar un producto', 'error');
                    showLoading(false);
                    return;
                }
            }

            // NOTA: Ya no existe tabla inventario separada. El inventario está integrado en productos.
            // Actualizar directamente el producto con los campos de inventario.
            
            // Obtener producto actual primero
            const productoResponse = await fetch(`${API_BASE_URL}/productos/${idProducto}`);
            if (!productoResponse.ok) {
                throw new Error('Error al obtener el producto para actualizar');
            }
            const productoActual = await productoResponse.json();
            const producto = productoActual.producto || productoActual;
            
            // Preparar datos del producto actualizado (incluyendo campos de inventario)
            // Si estamos en modo edición, usar los valores del formulario de edición
            let nombreProducto = producto.nombre_producto || producto.nombre;
            let categoriaId = producto.id_categoria;
            
            // Si hay campos de edición de producto, usar esos valores
            const editarProductoNombre = document.getElementById('editar-producto-nombre');
            const editarProductoCategoria = document.getElementById('editar-producto-categoria');
            
            if (currentAction === 'edit' && editarProductoNombre && editarProductoNombre.value.trim()) {
                nombreProducto = editarProductoNombre.value.trim();
            }
            
            if (currentAction === 'edit' && editarProductoCategoria && editarProductoCategoria.value) {
                categoriaId = parseInt(editarProductoCategoria.value);
            }
            
            const datosProducto = {
                nombre_producto: nombreProducto,
                id_categoria: categoriaId,
                descripcion: producto.descripcion || null,
                precio_producto: producto.precio_producto || producto.precio || 0,
                inventario_inicial: parseFloat(formData.get('inventario_inicial')) || producto.inventario_inicial || 0,
                entrada_compras: producto.entrada_compras || 0, // Mantener compras existentes
                salida_pedidos: producto.salida_pedidos || 0, // Mantener pedidos existentes
                stock_minimo: parseFloat(formData.get('stock_minimo')) || producto.stock_minimo || 0,
                unidad_medida: formData.get('unidad') || producto.unidad_medida || 'lb',
                costo: producto.costo || 0, // Mantener costo existente, no se actualiza desde este formulario
                estado: producto.estado || 'activo',
                imagen: producto.imagen || null
            };

            // Si es edición desde el módulo de inventario, actualizar campos específicos
            if (currentInventarioId && currentAction === 'edit') {
                // Para edición, NO permitir modificar inventario_inicial (valor fijo del inicio)
                // Solo permitir actualizar entrada_compras y salida_pedidos
                // El inventario_inicial se mantiene con su valor original
                datosProducto.entrada_compras = parseFloat(formData.get('entrada_compras')) || datosProducto.entrada_compras;
                datosProducto.salida_pedidos = parseFloat(formData.get('salida_pedidos')) || datosProducto.salida_pedidos;
                // NO actualizar inventario_inicial - mantener el valor original del producto
            }

            console.log('Actualizando producto con datos de inventario:', datosProducto);

            // Calcular inventario final (se calcula automáticamente en BD, pero lo calculamos aquí para validación)
            const inventarioFinal = datosProducto.inventario_inicial + datosProducto.entrada_compras - datosProducto.salida_pedidos;

            // Actualizar producto directamente (el stock_actual se calcula automáticamente en BD)
            const response = await fetch(`${API_BASE_URL}/productos/${idProducto}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosProducto)
            });

            console.log('Respuesta del backend al actualizar producto:', response.status, response.statusText);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al actualizar inventario del producto');
            }

            const resultadoGuardado = await response.json();
            console.log('Producto actualizado exitosamente. Respuesta del backend:', resultadoGuardado);
            console.log('📊 Datos guardados - Inventario Inicial:', datosProducto.inventario_inicial, 
                       '| Compras:', datosProducto.entrada_compras, 
                       '| Pedidos:', datosProducto.salida_pedidos,
                       '| Stock Actual:', datosProducto.inventario_inicial + datosProducto.entrada_compras - datosProducto.salida_pedidos);

            mostrarNotificacion(
                currentAction === 'edit' 
                    ? 'Inventario actualizado correctamente' 
                    : esProductoNuevo 
                        ? 'Producto e inventario creados exitosamente' 
                        : 'Inventario guardado y producto sincronizado exitosamente', 
                'success'
            );
            
            // Disparar evento personalizado para actualizar autocomplete en módulo de productos
            if (esProductoNuevo) {
                const evento = new CustomEvent('productoInventarioCreado', {
                    detail: { productoId: idProducto }
                });
                document.dispatchEvent(evento);
            }
            
            // Esperar un momento antes de recargar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Recargar inventario consolidado para mostrar los datos actualizados
            await cargarInventarioConsolidado();
            
            // Si la vista consolidada está abierta, recargarla
            if (listSection && listSection.style.display !== 'none') {
                await cargarInventarioConsolidado();
            }
            
            // Resetear formulario
            setTimeout(() => {
                form.reset();
                if (inventarioIdInput) inventarioIdInput.value = '';
                fechaInventario.value = new Date().toISOString().split('T')[0];
                calcularInventarioFinal();
                currentInventarioId = null;
                currentAction = '';
                
                // Si era producto nuevo, ocultar sección y recargar productos
                if (esProductoNuevo) {
                    ocultarSeccionNuevoProducto();
                    esProductoNuevo = false;
                }
                
                cargarProductos(); // Recargar productos para ver cambios
                
                // Si la vista individual está abierta, recargarla
                if (listIndividualSection && listIndividualSection.style.display !== 'none') {
                    cargarInventariosIndividuales();
                }
                
                // Volver al menú si estaba editando
                if (currentAction === 'edit') {
                    showSection('actions');
                }
            }, 1500);
            showLoading(false);
        } catch (error) {
            console.error('Error al guardar inventario:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Event listener para guardar
    if (saveBtn) {
        saveBtn.addEventListener('click', guardarInventario);
    }

    // ========================================
    // FUNCIONES DE CONSOLIDACIÓN DE INVENTARIO
    // ========================================

    // Cargar inventario consolidado
    async function cargarInventarioConsolidado() {
        try {
            showLoading(true);
            const tbody = document.getElementById('inventario-tbody');
            if (!tbody) return;

            // Mostrar loading
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #9ca3af;"></i>
                        <p style="margin-top: 1rem; color: #9ca3af;">Cargando inventario...</p>
                    </td>
                </tr>
            `;

            // NOTA: Ya no existe /api/inventario. El inventario está integrado en productos.
            // Cargar datos desde productos (que incluye todos los campos de inventario)
            const [productosResponse, comprasResponse, pedidosResponse, produccionesResponse, recetasResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/productos`),
                fetch(`${API_BASE_URL}/compras`),
                fetch(`${API_BASE_URL}/pedidos`).catch(err => {
                    console.warn('⚠️ Error al cargar pedidos (continuando sin ellos):', err);
                    return { ok: false, status: 500 };
                }),
                fetch(`${API_BASE_URL}/producciones`).catch(err => {
                    console.warn('⚠️ Error al cargar producciones (continuando sin ellas):', err);
                    return { ok: false, status: 500 };
                }),
                fetch(`${API_BASE_URL}/recetas`).catch(err => {
                    console.warn('⚠️ Error al cargar recetas (continuando sin ellas):', err);
                    return { ok: false, status: 500 };
                })
            ]);

            let productos = [];
            if (productosResponse.ok) {
                const productosData = await productosResponse.json();
                productos = Array.isArray(productosData) ? productosData : (productosData.productos || productosData.data || []);
            }

            let compras = [];
            if (comprasResponse.ok) {
                const comprasData = await comprasResponse.json();
                const comprasArray = Array.isArray(comprasData) ? comprasData : (comprasData.compras || comprasData.data || []);
                
                // Cargar detalles de cada compra
                console.log('📦 Cargando detalles de compras...');
                for (const compra of comprasArray) {
                    try {
                        const detallesResponse = await fetch(`${API_BASE_URL}/detalle-compra/compra/${compra.id_compra}`);
                        if (detallesResponse.ok) {
                            const detalles = await detallesResponse.json();
                            compra.detalle = Array.isArray(detalles) ? detalles : (detalles.detalles || detalles.data || []);
                            console.log(`  ✅ Compra ${compra.id_compra}: ${compra.detalle.length} detalles cargados`);
                        } else {
                            console.warn(`  ⚠️ No se pudieron cargar detalles de compra ${compra.id_compra}`);
                            compra.detalle = [];
                        }
                    } catch (error) {
                        console.warn(`  ⚠️ Error al cargar detalles de compra ${compra.id_compra}:`, error);
                        compra.detalle = [];
                    }
                }
                
                compras = comprasArray;
            }

            let pedidos = [];
            if (pedidosResponse.ok) {
                try {
                    const pedidosData = await pedidosResponse.json();
                    pedidos = Array.isArray(pedidosData) ? pedidosData : (pedidosData.pedidos || pedidosData.data || []);
                } catch (error) {
                    console.warn('⚠️ Error al procesar respuesta de pedidos:', error);
                    pedidos = [];
                }
            } else {
                console.warn('⚠️ No se pudieron cargar pedidos (status:', pedidosResponse.status, '). Continuando sin ellos.');
                pedidos = [];
            }

            let producciones = [];
            if (produccionesResponse.ok) {
                try {
                    const produccionesData = await produccionesResponse.json();
                    producciones = Array.isArray(produccionesData) ? produccionesData : (produccionesData.producciones || produccionesData.data || []);
                    console.log('🏭 Producciones cargadas:', producciones.length);
                } catch (error) {
                    console.warn('⚠️ Error al procesar respuesta de producciones:', error);
                    producciones = [];
                }
            } else {
                console.warn('⚠️ No se pudieron cargar producciones (status:', produccionesResponse.status, '). Continuando sin ellas.');
                producciones = [];
            }

            // Cargar recetas para obtener producto final
            if (recetasResponse.ok) {
                try {
                    const recetasData = await recetasResponse.json();
                    allRecetas = Array.isArray(recetasData) ? recetasData : (recetasData.recetas || recetasData.data || []);
                    console.log('📋 Recetas cargadas:', allRecetas.length);
                } catch (error) {
                    console.warn('⚠️ Error al procesar respuesta de recetas:', error);
                    allRecetas = [];
                }
            } else {
                console.warn('⚠️ No se pudieron cargar recetas (status:', recetasResponse.status, '). Continuando sin ellas.');
                allRecetas = [];
            }

            // Procesar productos (el inventario está integrado en productos)
            const productosArray = Array.isArray(productos) ? productos : (productos.productos || []);
            
            // Consolidar datos por producto (los datos de inventario ya están en productos)
            const consolidado = {};
            
            // Inicializar con productos (que ya tienen todos los campos de inventario)
            // NOTA: Inicializamos compras y pedidos en 0 porque los sumaremos desde los detalles
            productosArray.forEach(producto => {
                // Los productos ya tienen: inventario_inicial, entrada_compras, salida_pedidos, stock_actual
                consolidado[producto.id_producto] = {
                    id_producto: producto.id_producto,
                    nombre: producto.nombre_producto || producto.nombre || 'Sin nombre',
                    inventario_inicial: parseFloat(producto.inventario_inicial || 0),
                    compras: 0, // Se sumará desde los detalles de compra
                    pedidos: 0, // Se sumará desde los detalles de pedido
                    produccion_salida: 0, // Se sumará desde los ingredientes usados en producciones
                    produccion_entrada: 0, // Se sumará desde los productos finales producidos
                    inventario_saldo: parseFloat(producto.stock_actual || 0), // stock_actual se calcula automáticamente en BD
                    stock_minimo: parseFloat(producto.stock_minimo || 0),
                    unidad: producto.unidad_medida || 'lb',
                    ids_detalle_compra: [],
                    ids_detalle_pedido: [],
                    ids_produccion: []
                };
            });
            
            console.log('Productos procesados:', productosArray.length);
            console.log('Inventario consolidado inicializado desde productos');

            // Procesar compras: Sumar cantidades desde los detalles de compra
            // Esto asegura que las compras se reflejen correctamente incluso si entrada_compras no está actualizado
            const comprasArray = Array.isArray(compras) ? compras : [];
            console.log('📦 Procesando compras:', comprasArray.length, 'compras encontradas');
            
            comprasArray.forEach(compra => {
                if (compra.detalle && Array.isArray(compra.detalle)) {
                    compra.detalle.forEach(detalle => {
                        const idProducto = detalle.id_producto;
                        const cantidad = parseFloat(detalle.cantidad || 0);
                        
                        if (idProducto && consolidado[idProducto] && cantidad > 0) {
                            // Sumar la cantidad al total de compras
                            consolidado[idProducto].compras = (consolidado[idProducto].compras || 0) + cantidad;
                            
                            // Agregar el ID si no está ya en la lista
                            if (detalle.id_detalle_compra && !consolidado[idProducto].ids_detalle_compra.includes(detalle.id_detalle_compra)) {
                                consolidado[idProducto].ids_detalle_compra.push(detalle.id_detalle_compra);
                            }
                            
                            console.log(`  ✅ Compra agregada: Producto ${idProducto} - ${cantidad} ${detalle.unidad || 'lb'}`);
                        }
                    });
                }
            });

            // Procesar pedidos: Sumar cantidades desde los detalles de pedido
            // Esto asegura que los pedidos se reflejen correctamente incluso si salida_pedidos no está actualizado
            const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
            console.log('📦 Procesando pedidos:', pedidosArray.length, 'pedidos encontrados');
            
            pedidosArray.forEach(pedido => {
                if (pedido.detalle && Array.isArray(pedido.detalle)) {
                    pedido.detalle.forEach(detalle => {
                        // detalle_pedido ahora usa id_producto directamente (no id_inventario)
                        const idProducto = detalle.id_producto;
                        const cantidad = parseFloat(detalle.cantidad || 0);
                        
                        if (idProducto && consolidado[idProducto] && cantidad > 0) {
                            // Sumar la cantidad al total de pedidos
                            consolidado[idProducto].pedidos = (consolidado[idProducto].pedidos || 0) + cantidad;
                            
                            // Agregar el ID si no está ya en la lista
                            if (detalle.id_detalle && !consolidado[idProducto].ids_detalle_pedido.includes(detalle.id_detalle)) {
                                consolidado[idProducto].ids_detalle_pedido.push(detalle.id_detalle);
                            }
                            
                            console.log(`  ✅ Pedido agregado: Producto ${idProducto} - ${cantidad} ${detalle.unidad || 'lb'}`);
                        }
                    });
                }
            });

            // Procesar producciones: Calcular producción salida (ingredientes) y entrada (productos finales)
            const produccionesArray = Array.isArray(producciones) ? producciones : [];
            console.log('🏭 Procesando producciones:', produccionesArray.length, 'producciones encontradas');
            
            // Cargar detalles de producción para cada producción si no vienen incluidos
            for (let produccion of produccionesArray) {
                const idProduccion = produccion.id_produccion || produccion.id;
                
                // Si no tiene ingredientes_usados, cargarlos desde detalle_produccion
                if (!produccion.ingredientes_usados || !Array.isArray(produccion.ingredientes_usados) || produccion.ingredientes_usados.length === 0) {
                    try {
                        const detallesResponse = await fetch(`${API_BASE_URL}/detalle-produccion/produccion/${idProduccion}`);
                        if (detallesResponse.ok) {
                            const detalles = await detallesResponse.json();
                            produccion.ingredientes_usados = Array.isArray(detalles) ? detalles : (detalles.detalles || detalles.data || []);
                            console.log(`  ✅ Detalles cargados para producción ${idProduccion}:`, produccion.ingredientes_usados.length);
                        }
                    } catch (err) {
                        console.warn(`  ⚠️ Error al cargar detalles de producción ${idProduccion}:`, err);
                        produccion.ingredientes_usados = [];
                    }
                }
                
                // Procesar ingredientes usados (producción salida)
                if (produccion.ingredientes_usados && Array.isArray(produccion.ingredientes_usados)) {
                    produccion.ingredientes_usados.forEach(ingrediente => {
                        const idProducto = ingrediente.id_producto_entrada || ingrediente.id_producto;
                        const cantidad = parseFloat(ingrediente.cantidad_usada || ingrediente.cantidad || 0);
                        
                        if (idProducto && consolidado[idProducto] && cantidad > 0) {
                            // Sumar la cantidad al total de producción salida
                            consolidado[idProducto].produccion_salida = (consolidado[idProducto].produccion_salida || 0) + cantidad;
                            
                            // Agregar el ID de producción si no está ya en la lista
                            if (idProduccion && !consolidado[idProducto].ids_produccion.includes(idProduccion)) {
                                consolidado[idProducto].ids_produccion.push(idProduccion);
                            }
                            
                            console.log(`  ✅ Producción salida agregada: Producto ${idProducto} - ${cantidad} ${ingrediente.unidad || 'lb'}`);
                        }
                    });
                }
                
                // Procesar producto final (producción entrada)
                // Primero intentar desde detalle_produccion (id_producto_salida)
                let idProductoFinal = null;
                if (produccion.ingredientes_usados && produccion.ingredientes_usados.length > 0) {
                    // Buscar en todos los detalles, no solo el primero
                    for (const detalle of produccion.ingredientes_usados) {
                        if (detalle.id_producto_salida) {
                            idProductoFinal = detalle.id_producto_salida;
                            console.log(`  🔍 Producto final encontrado desde detalle_produccion: ID ${idProductoFinal} (Producción ${idProduccion})`);
                            break;
                        }
                    }
                }
                
                // Si no hay id_producto_salida, buscar por nombre de la receta
                if (!idProductoFinal && produccion.id_receta) {
                    const receta = allRecetas?.find(r => r.id_receta === produccion.id_receta);
                    if (receta) {
                        // Intentar obtener desde receta.id_producto_final (si existe la columna)
                        if (receta.id_producto_final) {
                            idProductoFinal = receta.id_producto_final;
                            console.log(`  🔍 Producto final encontrado desde receta.id_producto_final: ID ${idProductoFinal}`);
                        } else if (receta.nombre_receta) {
                            // Buscar producto que coincida con el nombre de la receta
                            const nombreReceta = receta.nombre_receta.toLowerCase().trim();
                            const productoEncontrado = productosArray.find(p => {
                                const nombreProducto = (p.nombre_producto || p.nombre || '').toLowerCase().trim();
                                // Buscar coincidencia exacta o parcial
                                return nombreProducto === nombreReceta || 
                                       nombreProducto.includes(nombreReceta) || 
                                       nombreReceta.includes(nombreProducto);
                            });
                            if (productoEncontrado) {
                                idProductoFinal = productoEncontrado.id_producto;
                                console.log(`  🔍 Producto final encontrado por nombre: "${receta.nombre_receta}" → Producto ID ${idProductoFinal} (${productoEncontrado.nombre_producto || productoEncontrado.nombre})`);
                            } else {
                                console.warn(`  ⚠️ No se encontró producto final para la receta "${receta.nombre_receta}" (ID: ${produccion.id_receta})`);
                            }
                        }
                    } else {
                        console.warn(`  ⚠️ No se encontró la receta con ID ${produccion.id_receta}`);
                    }
                }
                
                if (idProductoFinal && produccion.cantidad_producida) {
                    const cantidadProducida = parseFloat(produccion.cantidad_producida || 0);
                    
                    if (consolidado[idProductoFinal] && cantidadProducida > 0) {
                        // Sumar la cantidad al total de producción entrada
                        consolidado[idProductoFinal].produccion_entrada = (consolidado[idProductoFinal].produccion_entrada || 0) + cantidadProducida;
                        
                        // Agregar el ID de producción si no está ya en la lista
                        if (idProduccion && !consolidado[idProductoFinal].ids_produccion.includes(idProduccion)) {
                            consolidado[idProductoFinal].ids_produccion.push(idProduccion);
                        }
                        
                        console.log(`  ✅ Producción entrada agregada: Producto ${idProductoFinal} - ${cantidadProducida} ${produccion.unidad || 'unidad'}`);
                    } else {
                        console.warn(`  ⚠️ No se pudo agregar producción entrada: Producto ${idProductoFinal} no encontrado en consolidado o cantidad es 0`);
                    }
                } else {
                    if (!idProductoFinal) {
                        console.warn(`  ⚠️ No se pudo identificar el producto final para la producción ${idProduccion}`);
                    }
                    if (!produccion.cantidad_producida) {
                        console.warn(`  ⚠️ La producción ${idProduccion} no tiene cantidad_producida`);
                    }
                }
            }

            // Recalcular inventario_saldo con los valores actualizados de compras, pedidos y producción
            Object.keys(consolidado).forEach(idProducto => {
                const item = consolidado[idProducto];
                const inicial = item.inventario_inicial || 0;
                const compras = item.compras || 0;
                const pedidos = item.pedidos || 0;
                const prodSalida = item.produccion_salida || 0;
                const prodEntrada = item.produccion_entrada || 0;
                
                // Recalcular el saldo: Inicial + Compras - Pedidos - Producción Salida + Producción Entrada
                item.inventario_saldo = inicial + compras - pedidos - prodSalida + prodEntrada;
                
                console.log(`Producto ${idProducto} (${item.nombre}): Inicial=${inicial}, Compras=${compras}, Pedidos=${pedidos}, Prod.Salida=${prodSalida}, Prod.Entrada=${prodEntrada}, Saldo=${item.inventario_saldo}`);
                
                // Verificar si el saldo calculado difiere del stock_actual de la BD
                const stockActualBD = parseFloat(productosArray.find(p => p.id_producto == idProducto)?.stock_actual || 0);
                if (Math.abs(item.inventario_saldo - stockActualBD) > 0.001) {
                    console.warn(`⚠️ Producto ${idProducto} (${item.nombre}): Saldo calculado (${item.inventario_saldo}) difiere del stock_actual en BD (${stockActualBD}). Usando valor calculado.`);
                }
            });
            
            console.log('Datos consolidados finales:', Object.values(consolidado).map(item => ({
                id: item.id_producto,
                nombre: item.nombre,
                inicial: item.inventario_inicial,
                compras: item.compras,
                pedidos: item.pedidos,
                prod_salida: item.produccion_salida,
                prod_entrada: item.produccion_entrada,
                saldo: item.inventario_saldo,
                unidad: item.unidad
            })));

            // Convertir a array y almacenar
            inventarioConsolidado = Object.values(consolidado);
            
            // Renderizar tabla
            renderizarInventarioConsolidado(inventarioConsolidado);
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar inventario consolidado:', error);
            mostrarNotificacion('Error al cargar inventario consolidado', 'error');
            showLoading(false);
        }
    }

    // Renderizar tabla de inventario consolidado
    function renderizarInventarioConsolidado(data) {
        const tbody = document.getElementById('inventario-tbody');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                        <p>No hay productos en inventario</p>
                        <small style="color: #9ca3af; margin-top: 0.5rem; display: block;">
                            Crea registros de inventario inicial para ver las cantidades aquí
                        </small>
                    </td>
                </tr>
            `;
            return;
        }

        // Mostrar todos los productos (incluso si tienen 0 en todo)
        console.log('Total de productos a mostrar:', data.length);
        
        if (data.length === 0) {
            console.warn('No hay productos para mostrar. Verifica que se estén cargando correctamente.');
        }
        
        tbody.innerHTML = data.map(item => {
            const inicial = formatearNumero(item.inventario_inicial);
            const compras = formatearNumero(item.compras);
            const pedidos = formatearNumero(item.pedidos);
            const prodSalida = formatearNumero(item.produccion_salida || 0);
            const prodEntrada = formatearNumero(item.produccion_entrada || 0);
            const saldo = formatearNumero(item.inventario_saldo);
            const idsCompra = (item.ids_detalle_compra || []).join(', ');
            const idsPedido = (item.ids_detalle_pedido || []).join(', ');
            const idsProduccion = (item.ids_produccion || []).join(', ');
            const idProducto = item.id_producto || item.id;
            
            return `
            <tr>
                <td><strong>${item.nombre}</strong></td>
                <td>${inicial}</td>
                <td>${compras}</td>
                <td>${pedidos}</td>
                <td style="color: ${prodSalida > 0 ? '#ef4444' : '#6b7280'}">${prodSalida}</td>
                <td style="color: ${prodEntrada > 0 ? '#10b981' : '#6b7280'}">${prodEntrada}</td>
                <td><strong style="color: ${item.inventario_saldo < 0 ? '#ef4444' : '#10b981'}">${saldo}</strong></td>
                <td>${formatearNumero(item.stock_minimo)}</td>
                <td>${item.unidad}</td>
                <td class="id-detalle" title="${idsCompra}">
                    ${idsCompra || '-'}
                </td>
                <td class="id-detalle" title="${idsPedido}">
                    ${idsPedido || '-'}
                </td>
                <td class="id-detalle" title="${idsProduccion}">
                    ${idsProduccion || '-'}
                </td>
                <td>
                    <button class="inventario-btn-icon inventario-btn-edit" onclick="editarInventarioPorProducto(${idProducto})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="inventario-btn-icon inventario-btn-danger-icon" onclick="eliminarInventarioPorProducto(${idProducto})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    // Filtrar inventario
    function filtrarInventario() {
        const termino = searchInput?.value.toLowerCase() || '';
        if (!termino) {
            renderizarInventarioConsolidado(inventarioConsolidado);
            return;
        }

        const filtrado = inventarioConsolidado.filter(item => 
            item.nombre.toLowerCase().includes(termino)
        );
        renderizarInventarioConsolidado(filtrado);
    }

    // Formatear número (solo muestra decimales si son necesarios)
    function formatearNumero(num) {
        const numero = parseFloat(num || 0);
        
        // Si el número es NaN o no es un número válido, devolver 0
        if (isNaN(numero)) {
            return '0';
        }
        
        // Si el número es entero, devolverlo sin decimales
        if (numero % 1 === 0) {
            return numero.toString();
        }
        
        // Si tiene decimales, convertir a string y eliminar ceros innecesarios al final
        // Usar toFixed(3) primero para asegurar precisión, luego eliminar ceros finales
        return numero.toFixed(3).replace(/\.?0+$/, '');
    }

    // ========================================
    // FUNCIONALIDAD CREAR PRODUCTO DESDE INVENTARIO (INTEGRADO)
    // ========================================

    const btnCrearProducto = document.getElementById('btn-crear-producto-inventario');
    const btnSeleccionarExistente = document.getElementById('btn-seleccionar-producto-existente');
    // sectionNuevoProducto y esProductoNuevo ya están definidos arriba (líneas 36-37)
    const nuevoProductoNombre = document.getElementById('nuevo-producto-nombre');
    const nuevoProductoCategoria = document.getElementById('nuevo-producto-categoria');

    // Mostrar sección de nuevo producto
    if (btnCrearProducto) {
        btnCrearProducto.addEventListener('click', function() {
            mostrarSeccionNuevoProducto();
        });
    }

    // Volver a seleccionar producto existente
    if (btnSeleccionarExistente) {
        btnSeleccionarExistente.addEventListener('click', function() {
            ocultarSeccionNuevoProducto();
        });
    }

    // Función para mostrar sección de nuevo producto
    function mostrarSeccionNuevoProducto() {
        if (sectionNuevoProducto) {
            sectionNuevoProducto.style.display = 'block';
            esProductoNuevo = true;
            
            // Ocultar select de productos y hacer opcional
            if (productoSelect) {
                productoSelect.style.display = 'none';
                productoSelect.removeAttribute('required');
            }
            
            // Mostrar botón "Seleccionar Existente"
            if (btnSeleccionarExistente) {
                btnSeleccionarExistente.style.display = 'inline-block';
            }
            
            // Ocultar botón "Nuevo"
            if (btnCrearProducto) {
                btnCrearProducto.style.display = 'none';
            }
            
            // Asegurar que el campo de inventario inicial sea editable cuando se crea nuevo producto
            const inventarioCantidad = document.getElementById('inventario-cantidad');
            if (inventarioCantidad) {
                inventarioCantidad.readOnly = false;
                inventarioCantidad.removeAttribute('title');
            }
            
            // Cargar categorías
            cargarCategoriasParaNuevoProducto();
            
            // Actualizar ayuda
            const helpText = document.getElementById('help-producto-select');
            if (helpText) {
                helpText.textContent = 'Completa los datos del nuevo producto y del inventario';
            }
        }
    }

    // Función para ocultar sección de nuevo producto
    function ocultarSeccionNuevoProducto() {
        if (sectionNuevoProducto) {
            sectionNuevoProducto.style.display = 'none';
            esProductoNuevo = false;
            
            // Mostrar select de productos y hacerlo requerido
            if (productoSelect) {
                productoSelect.style.display = 'block';
                productoSelect.setAttribute('required', 'required');
            }
            
            // Ocultar botón "Seleccionar Existente"
            if (btnSeleccionarExistente) {
                btnSeleccionarExistente.style.display = 'none';
            }
            
            // Mostrar botón "Nuevo"
            if (btnCrearProducto) {
                btnCrearProducto.style.display = 'inline-block';
            }
            
            // Limpiar campos de nuevo producto
            if (form) {
                const nuevoProductoInputs = sectionNuevoProducto.querySelectorAll('input, select, textarea');
                nuevoProductoInputs.forEach(input => {
                    if (input.type !== 'file') {
                        input.value = '';
                    } else {
                        input.value = '';
                    }
                });
            }
            
            // Actualizar ayuda
            const helpText = document.getElementById('help-producto-select');
            if (helpText) {
                helpText.textContent = 'Selecciona el producto o crea uno nuevo';
            }
        }
    }

    // Cargar categorías para nuevo producto
    async function cargarCategoriasParaNuevoProducto() {
        if (!nuevoProductoCategoria) return;
        
        try {
            if (typeof loadCategoriasInSelect === 'function') {
                await loadCategoriasInSelect(nuevoProductoCategoria, true, true);
            } else {
                const response = await fetch(`${API_BASE_URL}/categorias`);
                if (response.ok) {
                    const categorias = await response.json();
                    const categoriasArray = Array.isArray(categorias) ? categorias : (categorias.categorias || []);
                    nuevoProductoCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
                    
                    categoriasArray
                        .filter(cat => cat.estado_categoria === 'activo' || !cat.estado_categoria)
                        .sort((a, b) => (a.nombre || a.nombre_categoria || '').localeCompare(b.nombre || b.nombre_categoria || ''))
                        .forEach(categoria => {
                            const option = document.createElement('option');
                            option.value = categoria.id_categoria;
                            option.textContent = categoria.nombre || categoria.nombre_categoria || 'Sin nombre';
                            nuevoProductoCategoria.appendChild(option);
                        });
                }
            }
            
            // Actualizar unidad cuando cambie la categoría (solo una vez)
            if (nuevoProductoCategoria && !nuevoProductoCategoria.dataset.listenerAdded) {
                nuevoProductoCategoria.dataset.listenerAdded = 'true';
                nuevoProductoCategoria.addEventListener('change', async function() {
                    if (typeof obtenerUnidadPorCategoria === 'function' && typeof obtenerNombreCategoriaPorId === 'function') {
                        const categoriaId = parseInt(this.value);
                        if (categoriaId) {
                            const categoriaNombre = await obtenerNombreCategoriaPorId(categoriaId);
                            const unidadRequerida = obtenerUnidadPorCategoria(categoriaId, categoriaNombre) || 'lb';
                            
                            // Sincronizar unidad con inventario (si existe el select)
                            if (unidadSelect) {
                                unidadSelect.value = unidadRequerida;
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }


    // Cargar categorías para el modal de crear producto
    async function cargarCategoriasParaModal() {
        try {
            if (!productoCategoriaSelect) {
                console.error('Select de categorías no encontrado');
                return;
            }

            // Intentar usar la función de categorías si está disponible
            if (typeof loadCategoriasInSelect === 'function') {
                console.log('Cargando categorías usando loadCategoriasInSelect...');
                await loadCategoriasInSelect(productoCategoriaSelect, true, true);
                console.log('Categorías cargadas correctamente');
            } else {
                // Fallback: cargar directamente desde la API
                console.log('Cargando categorías desde API (fallback)...');
                const response = await fetch(`${API_BASE_URL}/categorias`);
                if (response.ok) {
                    const categorias = await response.json();
                    const categoriasArray = Array.isArray(categorias) ? categorias : (categorias.categorias || []);
                    
                    // Limpiar el select
                    productoCategoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
                    
                    // Filtrar solo categorías activas y ordenar
                    const categoriasActivas = categoriasArray
                        .filter(cat => cat.estado_categoria === 'activo' || !cat.estado_categoria)
                        .sort((a, b) => (a.nombre || a.nombre_categoria || '').localeCompare(b.nombre || b.nombre_categoria || ''));
                    
                    // Agregar opciones
                    categoriasActivas.forEach(categoria => {
                        const option = document.createElement('option');
                        option.value = categoria.id_categoria;
                        option.textContent = categoria.nombre || categoria.nombre_categoria || 'Sin nombre';
                        productoCategoriaSelect.appendChild(option);
                    });
                    
                    console.log(`${categoriasActivas.length} categorías cargadas en el modal`);
                } else {
                    console.error('Error al obtener categorías:', response.status, response.statusText);
                    mostrarNotificacion('Error al cargar categorías. Por favor, recarga la página.', 'error');
                }
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            mostrarNotificacion('Error al cargar categorías. Por favor, recarga la página.', 'error');
        }
    }


    // Abrir modal crear producto
    window.abrirModalCrearProducto = async function() {
        console.log('Abriendo modal de crear producto...');
        if (modalCrearProducto) {
            modalCrearProducto.style.display = 'flex';
            formCrearProducto.reset();
            
            // Verificar que el select existe
            if (!productoCategoriaSelect) {
                console.error('Select de categorías no encontrado en el DOM');
                mostrarNotificacion('Error: No se encontró el selector de categorías.', 'error');
                return;
            }
            
            // Cargar categorías
            console.log('Iniciando carga de categorías...');
            await cargarCategoriasParaModal();
            
            // Verificar que se cargaron las categorías
            const optionsCount = productoCategoriaSelect.options.length;
            console.log(`Modal abierto. Opciones de categorías: ${optionsCount}`);
            if (optionsCount <= 1) {
                console.warn('Solo hay 1 opción (la vacía). Las categorías no se cargaron correctamente.');
            }
        } else {
            console.error('Modal de crear producto no encontrado');
        }
    };

    // Cerrar modal crear producto
    window.cerrarModalCrearProducto = function() {
        if (modalCrearProducto) {
            modalCrearProducto.style.display = 'none';
            formCrearProducto.reset();
        }
    };

    // Guardar producto desde inventario
    window.guardarProductoDesdeInventario = async function() {
        try {
            if (!formCrearProducto.checkValidity()) {
                formCrearProducto.reportValidity();
                return;
            }

            showLoading(true);

            // Obtener unidad por defecto según la categoría
            let unidadPorDefecto = 'lb'; // Por defecto libras
            if (typeof obtenerUnidadPorCategoria === 'function' && typeof obtenerNombreCategoriaPorId === 'function') {
                const categoriaId = parseInt(productoCategoriaSelect.value);
                const categoriaNombre = await obtenerNombreCategoriaPorId(categoriaId);
                unidadPorDefecto = obtenerUnidadPorCategoria(categoriaId, categoriaNombre) || 'lb';
            }

            const datos = {
                id_categoria: parseInt(productoCategoriaSelect.value),
                nombre: productoNombreInput.value.trim(),
                descripcion: null,
                precio_producto: 0,
                cantidad_producto: 0,
                unidad_medida: unidadPorDefecto,
                stock_minimo: 0,
                estado: 'activo'
            };

            // Crear producto
            const response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear producto');
            }

            const result = await response.json();
            console.log('Respuesta del backend al crear producto:', result);
            
            // Intentar obtener el ID del producto de diferentes formas
            let idProductoCreado = result.producto?.id_producto || result.id_producto || result.id || result.insertId;
            
            // Si no se obtuvo el ID de la respuesta, intentar obtenerlo buscando el producto por nombre
            if (!idProductoCreado) {
                mostrarNotificacion('Producto creado exitosamente. Recargando lista...', 'success');
                
                // Recargar productos
                await cargarProductos();
                
                // Buscar el producto recién creado por nombre
                const productosResponse = await fetch(`${API_BASE_URL}/productos`);
                if (productosResponse.ok) {
                    const productos = await productosResponse.json();
                    const productosArray = Array.isArray(productos) ? productos : (productos.productos || []);
                    const productoEncontrado = productosArray.find(p => 
                        (p.nombre || p.nombre_producto) === datos.nombre && 
                        p.id_categoria === datos.id_categoria
                    );
                    
                    if (productoEncontrado) {
                        idProductoCreado = productoEncontrado.id_producto;
                    }
                }
            } else {
                mostrarNotificacion('Producto creado exitosamente', 'success');
            }
            
            // Cerrar modal
            cerrarModalCrearProducto();
            
            // Recargar productos para asegurar que estén actualizados
            await cargarProductos();
            
            // Si tenemos el ID, seleccionar el producto
            if (idProductoCreado && productoSelect) {
                productoSelect.value = idProductoCreado;
                
                // Actualizar unidad en el formulario de inventario según la categoría
                if (unidadSelect) {
                    unidadSelect.value = datos.unidad_medida;
                }
                
                // Mostrar mensaje informativo
                mostrarNotificacion('Producto creado. Completa el resto de la información desde el módulo de productos si lo deseas.', 'success');
            } else if (productoSelect) {
                // Si no tenemos el ID pero el producto se creó, al menos actualizar la unidad
                if (unidadSelect) {
                    unidadSelect.value = datos.unidad_medida;
                }
                
                // Mostrar mensaje informativo
                mostrarNotificacion('Producto creado. Puedes completar más información desde el módulo de productos.', 'success');
            }

            showLoading(false);
        } catch (error) {
            console.error('Error al crear producto:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    };

    // Cargar productos al iniciar
    cargarProductos();

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

    // ========================================
    // GESTIÓN DE INVENTARIOS INDIVIDUALES (EDITAR/ELIMINAR)
    // ========================================

    // Cargar inventarios individuales
    async function cargarInventariosIndividuales() {
        try {
            showLoading(true);
            const tbody = document.getElementById('inventario-tbody-individual');
            if (!tbody) return;

            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #9ca3af;"></i>
                        <p style="margin-top: 1rem; color: #9ca3af;">Cargando registros...</p>
                    </td>
                </tr>
            `;

            // NOTA: Ya no existe tabla inventario separada. El inventario está integrado en productos.
            // Mostrar mensaje informativo
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 2rem; color: #9ca3af; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #f59e0b;"></i>
                        <p style="font-weight: 600; margin-bottom: 0.5rem;">Sistema de Inventario Actualizado</p>
                        <p style="margin-bottom: 1rem;">El inventario ahora está integrado en la tabla de productos.</p>
                        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <strong>Para ver el inventario:</strong> Ve a "Ver Todo Mi Inventario" (Inventario Consolidado)
                        </p>
                        <p style="font-size: 0.9rem;">
                            <strong>Para editar inventario:</strong> Usa "Inventario Inicial" o edita desde la tabla consolidada
                        </p>
                    </td>
                </tr>
            `;
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar inventarios individuales:', error);
            mostrarNotificacion('Error al cargar registros de inventario', 'error');
            showLoading(false);
        }
    }

    // Renderizar inventarios individuales
    function renderizarInventariosIndividuales(inventarios, productosMap) {
        const tbody = document.getElementById('inventario-tbody-individual');
        if (!tbody) return;

        tbody.innerHTML = inventarios.map(inv => {
            const idInventario = inv.id_inventario || inv.id;
            const idProducto = inv.id_producto;
            const nombreProducto = productosMap[idProducto] || 'Producto desconocido';
            const fecha = inv.fecha_inventario || '-';
            const inicial = formatearNumero(inv.inventario_inicial || 0);
            const entrada = formatearNumero(inv.entrada_compras || 0);
            const salida = formatearNumero(inv.salida_pedidos || 0);
            const final = formatearNumero(inv.inventario_final || (parseFloat(inv.inventario_inicial || 0) + parseFloat(inv.entrada_compras || 0) - parseFloat(inv.salida_pedidos || 0)));
            const stockMinimo = formatearNumero(inv.stock_minimo || 0);
            const unidad = inv.unidad || '-';
            const costo = formatearNumero(inv.costo || 0);

            return `
                <tr>
                    <td>${idInventario}</td>
                    <td><strong>${nombreProducto}</strong></td>
                    <td>${fecha}</td>
                    <td>${inicial}</td>
                    <td>${entrada}</td>
                    <td>${salida}</td>
                    <td><strong style="color: ${final < 0 ? '#ef4444' : '#10b981'}">${final}</strong></td>
                    <td>${stockMinimo}</td>
                    <td>${unidad}</td>
                    <td>$${costo}</td>
                </tr>
            `;
        }).join('');
    }

    // Editar inventario (OBSOLETO - Ya no existe tabla inventario separada)
    // NOTA: Esta función se mantiene por compatibilidad pero ya no funciona.
    // El inventario ahora está integrado en productos. Usa editarInventarioPorProducto() en su lugar.
    window.editarInventario = async function(idInventario) {
        mostrarNotificacion('El sistema de inventario ha sido actualizado. El inventario ahora está integrado en productos. Usa "Editar" desde la tabla consolidada.', 'info');
        console.warn('⚠️ editarInventario() está obsoleto. El inventario ahora está integrado en productos.');
    };

    // Eliminar inventario (OBSOLETO - Ya no existe tabla inventario separada)
    // NOTA: Esta función se mantiene por compatibilidad pero ya no funciona.
    // El inventario ahora está integrado en productos. Usa eliminarInventarioPorProducto() en su lugar.
    window.eliminarInventario = async function(idInventario) {
        mostrarNotificacion('El sistema de inventario ha sido actualizado. El inventario ahora está integrado en productos. Usa "Eliminar" desde la tabla consolidada.', 'info');
        console.warn('⚠️ eliminarInventario() está obsoleto. El inventario ahora está integrado en productos.');
    };

    // Editar inventario por producto (desde tabla consolidada)
    // NOTA: Ya no existe tabla inventario separada. El inventario está integrado en productos.
    // Esta función carga los datos del producto y permite editarlos.
    window.editarInventarioPorProducto = async function(idProducto) {
        try {
            showLoading(true);
            
            // Obtener producto actual
            const productoResponse = await fetch(`${API_BASE_URL}/productos/${idProducto}`);
            if (!productoResponse.ok) {
                throw new Error('Error al obtener el producto');
            }
            
            const productoData = await productoResponse.json();
            const producto = productoData.producto || productoData;
            
            // Mostrar formulario de inventario inicial y pre-llenar con datos del producto
            showSection('form', 'edit');
            currentAction = 'edit';
            currentInventarioId = idProducto; // Guardar ID del producto para actualización
            
            // Mostrar sección de edición de producto
            const sectionEditarProducto = document.getElementById('section-editar-producto');
            if (sectionEditarProducto) {
                sectionEditarProducto.style.display = 'block';
                // Agregar atributo required a los campos cuando se muestran
                const editarProductoNombre = document.getElementById('editar-producto-nombre');
                const editarProductoCategoria = document.getElementById('editar-producto-categoria');
                if (editarProductoNombre) editarProductoNombre.setAttribute('required', 'required');
                if (editarProductoCategoria) editarProductoCategoria.setAttribute('required', 'required');
            }
            
            // Ocultar selector de producto y botones de nuevo producto en modo edición
            const productoSelect = document.getElementById('inventario-producto');
            const btnCrearProducto = document.getElementById('btn-crear-producto-inventario');
            const helpProductoSelect = document.getElementById('help-producto-select');
            if (productoSelect) {
                productoSelect.style.display = 'none';
                productoSelect.value = idProducto; // Pre-seleccionar el producto
            }
            if (btnCrearProducto) {
                btnCrearProducto.style.display = 'none';
            }
            if (helpProductoSelect) {
                helpProductoSelect.style.display = 'none';
            }
            
            // Pre-llenar campos de edición de producto
            const editarProductoNombre = document.getElementById('editar-producto-nombre');
            const editarProductoCategoria = document.getElementById('editar-producto-categoria');
            
            if (editarProductoNombre) {
                editarProductoNombre.value = producto.nombre_producto || producto.nombre || '';
            }
            
            // Cargar categorías en el select de edición
            if (editarProductoCategoria) {
                try {
                    const categoriasResponse = await fetch(`${API_BASE_URL}/categorias`);
                    if (categoriasResponse.ok) {
                        const categoriasData = await categoriasResponse.json();
                        const categorias = Array.isArray(categoriasData) ? categoriasData : (categoriasData.categorias || []);
                        editarProductoCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
                        categorias.forEach(categoria => {
                            const option = document.createElement('option');
                            option.value = categoria.id_categoria;
                            option.textContent = categoria.nombre_categoria || categoria.nombre || '';
                            if (categoria.id_categoria === producto.id_categoria) {
                                option.selected = true;
                            }
                            editarProductoCategoria.appendChild(option);
                        });
                    }
                } catch (err) {
                    console.error('Error al cargar categorías:', err);
                }
            }
            
            // Pre-llenar campos del formulario con datos del producto
            const inventarioCantidad = document.getElementById('inventario-cantidad');
            if (inventarioCantidad) {
                inventarioCantidad.value = producto.inventario_inicial || 0;
                // Hacer el campo de solo lectura cuando se edita (valor fijo del inventario inicial)
                inventarioCantidad.readOnly = true;
                inventarioCantidad.title = 'El inventario inicial no se puede modificar una vez creado';
            }
            
            if (unidadSelect) {
                unidadSelect.value = producto.unidad_medida || 'lb';
            }
            
            const stockMinimoInput = document.getElementById('inventario-stock-minimo');
            if (stockMinimoInput) {
                // Primero intentar cargar desde localStorage (si fue establecido en producto-admin)
                const stockMinimoGuardado = localStorage.getItem('stock_minimo_sincronizado');
                if (stockMinimoGuardado !== null) {
                    stockMinimoInput.value = stockMinimoGuardado;
                } else {
                    stockMinimoInput.value = producto.stock_minimo || 0;
                }
                
                // Guardar en localStorage para sincronización
                localStorage.setItem('stock_minimo_sincronizado', stockMinimoInput.value);
                
                // Agregar event listener para sincronización (solo una vez)
                if (!stockMinimoInput.hasAttribute('data-sync-listener')) {
                    stockMinimoInput.setAttribute('data-sync-listener', 'true');
                    stockMinimoInput.addEventListener('input', function() {
                        const valor = this.value || '0';
                        localStorage.setItem('stock_minimo_sincronizado', valor);
                        
                        // Disparar evento personalizado para actualizar producto-admin si está abierto
                        window.dispatchEvent(new CustomEvent('stockMinimoCambiado', { 
                            detail: { valor: valor, origen: 'inventario' } 
                        }));
                        
                        // Actualizar campo en producto-admin si existe
                        const productStockMinInput = document.getElementById('product-stock-min');
                        if (productStockMinInput) {
                            productStockMinInput.value = valor;
                        }
                    });
                }
            }
            
            
            // Establecer fecha actual
            if (fechaInventario) {
                fechaInventario.value = new Date().toISOString().split('T')[0];
            }
            
            // Actualizar título del modal
            const modalTitle = document.getElementById('inventario-modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Editar Inventario - ${producto.nombre_producto || producto.nombre || 'Producto'}`;
            }
            
            mostrarNotificacion('Producto cargado. Puedes editar el nombre, cantidad, unidad y demás campos.', 'info');
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar producto para editar:', error);
            mostrarNotificacion(error.message || 'Error al cargar el producto', 'error');
            showLoading(false);
        }
    };

    // Eliminar inventario por producto (desde tabla consolidada)
    // NOTA: Esta función ELIMINA COMPLETAMENTE el producto de la base de datos.
    // Se elimina físicamente del proyecto y de la base de datos.
    window.eliminarInventarioPorProducto = async function(idProducto) {
        try {
            // Obtener información del producto para mostrar su nombre
            const productoResponse = await fetch(`${API_BASE_URL}/productos/${idProducto}`);
            if (!productoResponse.ok) {
                throw new Error('Error al obtener el producto');
            }
            
            const productoData = await productoResponse.json();
            const producto = productoData.producto || productoData;
            const nombreProducto = producto.nombre_producto || producto.nombre || 'este producto';
            
            // Confirmación con advertencia clara
            const confirmacion = confirm(
                `⚠️ ADVERTENCIA: ELIMINACIÓN PERMANENTE\n\n` +
                `¿Estás seguro de que quieres ELIMINAR COMPLETAMENTE el producto "${nombreProducto}"?\n\n` +
                `Esta acción:\n` +
                `- Eliminará el producto de la base de datos\n` +
                `- Eliminará toda la información del inventario asociada\n` +
                `- Eliminará el producto del catálogo\n` +
                `- Eliminará el producto de todos los módulos del sistema\n\n` +
                `⚠️ Esta acción NO se puede deshacer.\n\n` +
                `¿Deseas continuar?`
            );
            
            if (!confirmacion) {
                mostrarNotificacion('Operación cancelada', 'info');
                return;
            }
            
            showLoading(true);
            
            // ELIMINACIÓN FÍSICA: Intentar eliminar físicamente el producto
            // Este botón SIEMPRE debe eliminar físicamente, no ocultar
            const response = await fetch(`${API_BASE_URL}/productos/${idProducto}?fisica=true`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                const errorMessage = error.error || error.mensaje || 'Error al eliminar el producto';
                const errorDetalles = error.detalles || '';
                const errorCodigo = error.codigo || '';
                
                // Verificar si es un error de restricción de clave foránea (409 o 500)
                if (response.status === 409 || 
                    errorCodigo === 'PRODUCTO_CON_REFERENCIAS' ||
                    errorMessage.includes('foreign key') || 
                    errorMessage.includes('Cannot delete') || 
                    errorMessage.includes('referenced') ||
                    errorMessage.includes('restricción') ||
                    errorMessage.includes('utilizado en otras partes')) {
                    throw new Error(
                        `No se puede eliminar el producto "${nombreProducto}" porque está siendo utilizado en otras partes del sistema:\n\n` +
                        `${errorDetalles || '- Puede tener compras asociadas\n- Puede tener pedidos asociados\n- Puede tener otros registros relacionados'}\n\n` +
                        `Por favor, elimina primero las referencias o contacta al administrador del sistema.`
                    );
                }
                
                // Si es otro tipo de error, mostrar mensaje claro
                throw new Error(
                    `Error al eliminar el producto físicamente: ${errorMessage}\n\n` +
                    `Si el problema persiste, verifica que el backend soporte eliminación física con el parámetro ?fisica=true`
                );
            }
            
            // Éxito: Producto eliminado físicamente
            const result = await response.json();
            console.log('✅ Producto eliminado físicamente:', result);
            mostrarNotificacion('✅ Producto eliminado completamente de la base de datos y del sistema', 'success');
            
            // Recargar inventario consolidado
            await cargarInventarioConsolidado();
            showLoading(false);
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            mostrarNotificacion(error.message || 'Error al eliminar el producto', 'error');
            showLoading(false);
        }
    };

    // Filtrar inventarios individuales
    function filtrarInventariosIndividuales() {
        const termino = searchInputIndividual?.value.toLowerCase() || '';
        if (!termino) {
            if (allInventarios.length > 0) {
                // Necesitamos productos para renderizar
                fetch(`${API_BASE_URL}/productos`)
                    .then(res => res.json())
                    .then(productosData => {
                        const productos = Array.isArray(productosData) ? productosData : (productosData.productos || productosData.data || []);
                        const productosMap = {};
                        productos.forEach(p => {
                            const id = p.id_producto || p.id;
                            productosMap[id] = p.nombre || p.nombre_producto || 'Producto desconocido';
                        });
                        renderizarInventariosIndividuales(allInventarios, productosMap);
                    });
            }
            return;
        }

        // Cargar productos para poder filtrar
        fetch(`${API_BASE_URL}/productos`)
            .then(res => res.json())
            .then(productosData => {
                const productos = Array.isArray(productosData) ? productosData : (productosData.productos || productosData.data || []);
                const productosMap = {};
                productos.forEach(p => {
                    const id = p.id_producto || p.id;
                    productosMap[id] = p.nombre || p.nombre_producto || 'Producto desconocido';
                });

                const filtradoFinal = allInventarios.filter(inv => {
                    const idProducto = inv.id_producto;
                    const nombreProducto = productosMap[idProducto] || '';
                    return nombreProducto.toLowerCase().includes(termino) ||
                           (inv.id_inventario || inv.id).toString().includes(termino) ||
                           (inv.fecha_inventario || '').includes(termino);
                });

                renderizarInventariosIndividuales(filtradoFinal, productosMap);
            });
    }
});

