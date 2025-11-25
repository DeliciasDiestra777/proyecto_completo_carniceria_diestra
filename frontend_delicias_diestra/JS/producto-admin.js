document.addEventListener('DOMContentLoaded', function() {
    const productoForm = document.getElementById('product-form');
    const saveButton = document.getElementById('save-product');
    const cancelButton = document.getElementById('cancel-product');
    const deleteButton = document.getElementById('delete-product');
    const loadingOverlay = document.getElementById('producto-loading');
    const modalTitle = document.getElementById('product-modal-title');
    
    const nombreInput = document.getElementById('product-name');
    const categoriaSelect = document.getElementById('product-category');
    const descripcionInput = document.getElementById('product-description');
    const precioInput = document.getElementById('product-price');
    const stockMinInput = document.getElementById('product-stock-min');
    const stockActualInput = document.getElementById('product-stock-actual');
    const imagenInput = document.getElementById('product-image');
    const estadoSelect = document.getElementById('product-active');
    
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    
    let currentProductoId = null;
    let isEditing = false;
    
    var API_BASE_URL = 'http://localhost:3000/api';
    
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }
    
    function showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.producto-notification');
        existingNotifications.forEach(notif => {
            notif.classList.remove('show');
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.parentNode.removeChild(notif);
                }
            }, 300);
        });
        
        const notification = document.createElement('div');
        notification.className = `producto-notification producto-notification-${type}`;
        notification.innerHTML = `
            <div class="producto-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        notification.offsetHeight;
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    function formatearNumeroParaInput(numero) {
        if (numero === null || numero === undefined || numero === '') {
            return '';
        }
        const num = parseFloat(numero);
        if (isNaN(num)) {
            return '';
        }
        if (num % 1 === 0) {
            return num.toString();
        }
        return num.toFixed(3).replace(/\.?0+$/, '');
    }
    
    async function validateForm() {
        const nombre = nombreInput.value.trim();
        const categoria = categoriaSelect.value;
        const precio = parseFloat(precioInput.value);
        
        if (!nombre) {
            showNotification('El nombre del producto es obligatorio', 'error');
            nombreInput.focus();
            return false;
        }
        
        if (!categoria) {
            showNotification('Debe seleccionar una categoría', 'error');
            categoriaSelect.focus();
            return false;
        }
        
        if (!precio || precio <= 0) {
            showNotification('El precio debe ser mayor a 0', 'error');
            precioInput.focus();
            return false;
        }
        
        return true;
    }
    
    function clearForm() {
        productoForm.reset();
        currentProductoId = null;
        isEditing = false;
        modalTitle.textContent = 'Nuevo Producto';
        deleteButton.style.display = 'none';
        hideImagePreview();
        
        if (nombreInput) {
            nombreInput.readOnly = false;
            nombreInput.value = '';
        }
        if (categoriaSelect) {
            categoriaSelect.disabled = false;
            categoriaSelect.value = '';
        }
        if (stockMinInput) {
            stockMinInput.readOnly = false;
            stockMinInput.value = '0';
        }
        if (stockActualInput) {
            stockActualInput.readOnly = true;
            stockActualInput.value = '0';
        }
        
        if (productBaseSearch) {
            productBaseSearch.value = '';
        }
        if (productBaseId) {
            productBaseId.value = '';
        }
        if (productBaseDropdown) {
            productBaseDropdown.style.display = 'none';
        }
        selectedProductoBase = null;
        currentDropdownIndex = -1;
    }
    
    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    
    function hideImagePreview() {
        imagePreview.style.display = 'none';
        previewImg.src = '';
        imagenInput.value = '';
    }
    
    const productBaseSearch = document.getElementById('product-base-search');
    const productBaseDropdown = document.getElementById('product-base-dropdown');
    const productBaseId = document.getElementById('product-base-id');
    let allProductosInventario = [];
    let selectedProductoBase = null;
    let currentDropdownIndex = -1;
    
    // Cargar productos del inventario
    async function cargarProductosInventario() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (!response.ok) {
                console.error('Error al cargar productos');
                return;
            }
            
            const data = await response.json();
            const productos = Array.isArray(data) ? data : (data.productos || data.data || []);
            
            // Ordenar alfabéticamente por nombre
            allProductosInventario = productos
                .filter(p => p.estado === 'activo' || !p.estado)
                .sort((a, b) => {
                    const nombreA = (a.nombre_producto || a.nombre || '').toLowerCase();
                    const nombreB = (b.nombre_producto || b.nombre || '').toLowerCase();
                    return nombreA.localeCompare(nombreB);
                });
            
            console.log(`${allProductosInventario.length} productos cargados para autocomplete`);
        } catch (error) {
            console.error('Error al cargar productos del inventario:', error);
        }
    }
    
    // Filtrar productos según búsqueda
    function filtrarProductos(termino) {
        if (!termino || termino.trim() === '') {
            return [];
        }
        
        const terminoLower = termino.toLowerCase().trim();
        return allProductosInventario.filter(producto => {
            const nombre = (producto.nombre_producto || producto.nombre || '').toLowerCase();
            return nombre.includes(terminoLower) || nombre.startsWith(terminoLower);
        });
    }
    
    // Renderizar resultados del dropdown
    function renderizarResultados(productos) {
        if (!productBaseDropdown) return;
        
        if (productos.length === 0) {
            productBaseDropdown.innerHTML = `
                <div class="producto-autocomplete-empty">
                    <i class="fas fa-search"></i> No se encontraron productos
                </div>
            `;
            productBaseDropdown.style.display = 'block';
            return;
        }
        
        // Limitar a 10 resultados para mejor rendimiento
        const productosLimitados = productos.slice(0, 10);
        
        productBaseDropdown.innerHTML = productosLimitados.map((producto, index) => {
            const nombre = producto.nombre_producto || producto.nombre || 'Sin nombre';
            const categoria = producto.nombre_categoria || producto.categoria || 'Sin categoría';
            const unidad = producto.unidad_medida || 'lb';
            
            return `
                <div class="producto-autocomplete-item" data-index="${index}" data-producto-id="${producto.id_producto}">
                    <span class="producto-autocomplete-item-name">${nombre}</span>
                    <span class="producto-autocomplete-item-category">${categoria}</span>
                    <span class="producto-autocomplete-item-unidad">${unidad}</span>
                </div>
            `;
        }).join('');
        
        productBaseDropdown.style.display = 'block';
        currentDropdownIndex = -1;
        
        // Agregar event listeners a los items
        productBaseDropdown.querySelectorAll('.producto-autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                const productoId = parseInt(this.dataset.productoId);
                seleccionarProductoBase(productoId);
            });
            
            item.addEventListener('mouseenter', function() {
                productBaseDropdown.querySelectorAll('.producto-autocomplete-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                currentDropdownIndex = parseInt(this.dataset.index);
            });
        });
    }
    
    // Seleccionar producto base
    async function seleccionarProductoBase(productoId) {
        const producto = allProductosInventario.find(p => p.id_producto === productoId);
        if (!producto) return;
        
        selectedProductoBase = producto;
        const nombre = producto.nombre_producto || producto.nombre || '';
        
        // Obtener datos completos del producto desde la API para tener stock actualizado
        try {
            const productoCompleto = await obtenerProductoPorId(productoId);
            const productoData = productoCompleto.producto || productoCompleto;
            
            // Auto-completar nombre del producto (solo lectura)
            if (nombreInput) {
                nombreInput.value = productoData.nombre_producto || nombre;
                nombreInput.readOnly = true;
            }
            
            // Auto-completar categoría (solo lectura)
            if (categoriaSelect && productoData.id_categoria) {
                categoriaSelect.value = productoData.id_categoria;
                categoriaSelect.disabled = true;
            }
            
            // Auto-completar stock mínimo (solo lectura)
            if (stockMinInput) {
                const stockMinimo = productoData.stock_minimo || 0;
                stockMinInput.value = formatearNumeroParaInput(stockMinimo);
                stockMinInput.readOnly = true;
            }
            
            // Auto-completar stock actual (solo lectura)
            if (stockActualInput) {
                const stockActual = productoData.stock_actual || 0;
                stockActualInput.value = formatearNumeroParaInput(stockActual);
                stockActualInput.readOnly = true;
            }
            
            // Guardar ID del producto base
            if (productBaseId) {
                productBaseId.value = productoId;
            }
            
            // Actualizar input de búsqueda
            if (productBaseSearch) {
                productBaseSearch.value = nombre;
            }
            
            // Ocultar dropdown
            if (productBaseDropdown) {
                productBaseDropdown.style.display = 'none';
            }
            
            currentDropdownIndex = -1;
            
            console.log('Producto base seleccionado:', nombre);
            console.log('Stock mínimo:', productoData.stock_minimo);
            console.log('Stock actual:', productoData.stock_actual);
        } catch (error) {
            console.error('Error al obtener datos completos del producto:', error);
            // Si falla, usar los datos básicos del producto en memoria
            if (nombreInput) {
                nombreInput.value = nombre;
                nombreInput.readOnly = true;
            }
            if (categoriaSelect && producto.id_categoria) {
                categoriaSelect.value = producto.id_categoria;
                categoriaSelect.disabled = true;
            }
            if (stockMinInput) {
                stockMinInput.value = formatearNumeroParaInput(producto.stock_minimo || 0);
                stockMinInput.readOnly = true;
            }
            if (stockActualInput) {
                stockActualInput.value = formatearNumeroParaInput(producto.stock_actual || 0);
                stockActualInput.readOnly = true;
            }
        }
    }
    
    // Event listeners para el autocomplete
    if (productBaseSearch) {
        // Búsqueda en tiempo real
        let searchTimeout;
        productBaseSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const termino = e.target.value;
            
            // Si se borra el campo, limpiar selección y restaurar campos
            if (termino.trim() === '') {
                selectedProductoBase = null;
                if (productBaseId) productBaseId.value = '';
                if (productBaseDropdown) productBaseDropdown.style.display = 'none';
                
                // Restaurar campos a estado editable
                if (nombreInput) {
                    nombreInput.value = '';
                    nombreInput.readOnly = false;
                }
                if (categoriaSelect) {
                    categoriaSelect.value = '';
                    categoriaSelect.disabled = false;
                }
                if (stockMinInput) {
                    stockMinInput.value = '0'; // Establecer en 0 cuando no hay producto base
                    stockMinInput.readOnly = false;
                }
                if (stockActualInput) {
                    stockActualInput.value = '0';
                    stockActualInput.readOnly = true; // Siempre de solo lectura
                }
                return;
            }
            
            // Debounce para mejorar rendimiento
            searchTimeout = setTimeout(() => {
                const resultados = filtrarProductos(termino);
                renderizarResultados(resultados);
            }, 150);
        });
        
        // Manejar teclado
        productBaseSearch.addEventListener('keydown', function(e) {
            const items = productBaseDropdown.querySelectorAll('.producto-autocomplete-item');
            
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
                    seleccionarProductoBase(productoId);
                }
            } else if (e.key === 'Escape') {
                if (productBaseDropdown) {
                    productBaseDropdown.style.display = 'none';
                }
                currentDropdownIndex = -1;
            }
        });
        
        // Ocultar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (productBaseSearch && productBaseDropdown) {
                if (!productBaseSearch.contains(e.target) && !productBaseDropdown.contains(e.target)) {
                    productBaseDropdown.style.display = 'none';
                    currentDropdownIndex = -1;
                }
            }
        });
    }
    
    // Cargar productos al iniciar
    cargarProductosInventario();
    
    // Recargar productos cuando se crea uno nuevo (evento personalizado)
    document.addEventListener('productoInventarioCreado', function() {
        cargarProductosInventario();
    });
    
    // ========================================
    // FUNCIONES DE API
    // ========================================
    
    // Crear nuevo producto
    async function crearProducto(datos) {
        try {
            console.log('Creando producto con datos:', datos);
            
            // Crear FormData para enviar archivos
            const formData = new FormData();
            
            // Agregar todos los campos del formulario (convertir a strings para FormData)
            formData.append('id_categoria', datos.id_categoria.toString());
            formData.append('nombre_producto', datos.nombre_producto);
            formData.append('descripcion', datos.descripcion || '');
            formData.append('precio_producto', datos.precio_producto.toString());
            formData.append('inventario_inicial', (datos.inventario_inicial || 0).toString());
            formData.append('entrada_compras', '0');
            formData.append('salida_pedidos', '0');
            formData.append('unidad_medida', datos.unidad_medida);
            formData.append('stock_minimo', datos.stock_minimo.toString());
            formData.append('estado', datos.estado);
            formData.append('mostrar_en_catalogo', datos.mostrar_en_catalogo ? 'true' : 'false');
            
            // Agregar imagen si existe
            if (imagenInput && imagenInput.files && imagenInput.files[0]) {
                formData.append('imagen', imagenInput.files[0]);
                console.log('Imagen adjuntada:', imagenInput.files[0].name, 'Tamaño:', imagenInput.files[0].size, 'bytes');
            } else {
                console.warn('No se seleccionó ninguna imagen para el producto');
            }
            
            // Log de los datos que se van a enviar
            console.log('📤 Enviando FormData:');
            for (let [key, value] of formData.entries()) {
                if (key === 'imagen') {
                    console.log(`  ${key}:`, value.name, `(${value.size} bytes)`);
                } else {
                    console.log(`  ${key}:`, value);
                }
            }
            
            const response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'POST',
                body: formData // No establecer Content-Type, el navegador lo hace automáticamente
            });
            
            console.log('Respuesta del servidor:', response.status);
            
            const result = await response.json();
            
            if (!response.ok) {
                if (response.status === 409) {
                    const mensajeError = result.mensaje || result.error || 'El producto ya existe en la base de datos';
                    throw new Error(`${mensajeError}. Por favor, verifica el nombre del producto o edita el producto existente.`);
                }
                throw new Error(result.mensaje || result.error || 'Error al crear el producto');
            }
            
            return result;
        } catch (error) {
            console.error('Error al crear producto:', error);
            throw error;
        }
    }
    
    async function actualizarProducto(id, datos) {
        try {
            // Crear FormData para enviar archivos
            const formData = new FormData();
            
            // Agregar todos los campos del formulario (convertir a strings para FormData)
            formData.append('id_categoria', datos.id_categoria.toString());
            formData.append('nombre_producto', datos.nombre_producto);
            formData.append('descripcion', datos.descripcion || '');
            formData.append('precio_producto', datos.precio_producto.toString());
            formData.append('inventario_inicial', (datos.inventario_inicial || 0).toString());
            formData.append('unidad_medida', datos.unidad_medida);
            formData.append('stock_minimo', datos.stock_minimo.toString());
            formData.append('estado', datos.estado);
            if (datos.mostrar_en_catalogo !== undefined) {
                formData.append('mostrar_en_catalogo', datos.mostrar_en_catalogo ? 'true' : 'false');
            }
            
            // Agregar imagen si existe nueva imagen
            if (imagenInput && imagenInput.files && imagenInput.files[0]) {
                formData.append('imagen', imagenInput.files[0]);
                console.log('Nueva imagen adjuntada para actualización:', imagenInput.files[0].name, 'Tamaño:', imagenInput.files[0].size, 'bytes');
            } else {
                const previewImg = document.getElementById('preview-img');
                if (previewImg && previewImg.src && previewImg.src !== '') {
                    const nombreImagen = previewImg.src.split('/').pop();
                    formData.append('imagen_actual', nombreImagen);
                    console.log('Manteniendo imagen actual:', nombreImagen);
                } else {
                    console.warn('No se seleccionó nueva imagen y no hay imagen actual para mantener');
                }
            }
            
            console.log('📤 Enviando datos de actualización:', {
                id: id,
                datos: datos,
                tieneNuevaImagen: !!(imagenInput && imagenInput.files && imagenInput.files[0]),
                imagenActual: document.getElementById('preview-img')?.src || 'N/A'
            });
            
            // Log del FormData
            console.log('📤 FormData completo:');
            for (let [key, value] of formData.entries()) {
                if (key === 'imagen') {
                    console.log(`  ${key}:`, value.name, `(${value.size} bytes)`);
                } else {
                    console.log(`  ${key}:`, value);
                }
            }
            
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'PUT',
                body: formData // No establecer Content-Type, el navegador lo hace automáticamente
            });
            
            console.log('Respuesta del servidor:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            const result = await response.json();
            console.log('Resultado del servidor:', result);
            
            if (!response.ok) {
                throw new Error(result.mensaje || result.error || 'Error al actualizar el producto');
            }
            
            return result;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            throw error;
        }
    }
    
    // Eliminar producto
    async function eliminarProducto(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.mensaje || 'Error al eliminar el producto');
            }
            
            return result;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            throw error;
        }
    }
    
    // Obtener producto por ID
    async function obtenerProductoPorId(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/productos/${id}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al obtener el producto');
            }
            
            return result;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            throw error;
        }
    }
    
    // NOTA: Ya no es necesario crear inventario inicial en una tabla separada.
    // El inventario ahora está integrado en la tabla productos con los campos:
    // - inventario_inicial (se envía al crear el producto)
    // - entrada_compras (se actualiza automáticamente por triggers)
    // - salida_pedidos (se actualiza automáticamente por triggers)
    // - stock_actual (calculado automáticamente)
    //
    // La función crearInventarioInicial() ya no es necesaria.
    
    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Guardar producto
    saveButton.addEventListener('click', async function() {
        if (!(await validateForm())) {
            return;
        }
        
        // Verificar si hay un producto base seleccionado (del inventario inicial)
        const productoBaseIdValue = productBaseId && productBaseId.value ? parseInt(productBaseId.value) : null;
        const tieneProductoBase = productoBaseIdValue && selectedProductoBase;
        
        // Si hay un producto base seleccionado, obtener sus datos actuales para preservar inventario
        let datosInventario = {};
        if (tieneProductoBase) {
            try {
                const respuesta = await obtenerProductoPorId(productoBaseIdValue);
                // El backend puede devolver { producto: {...} } o directamente el producto
                const productoActual = respuesta.producto || respuesta;
                datosInventario = {
                    inventario_inicial: productoActual.inventario_inicial || 0,
                    unidad_medida: productoActual.unidad_medida || 'lb',
                    entrada_compras: productoActual.entrada_compras || 0,
                    salida_pedidos: productoActual.salida_pedidos || 0
                };
                console.log('Datos del inventario preservados:', datosInventario);
            } catch (error) {
                console.warn('No se pudo obtener datos del producto base, usando valores por defecto:', error);
                datosInventario = {
                    inventario_inicial: 0,
                    unidad_medida: 'lb',
                    entrada_compras: 0,
                    salida_pedidos: 0
                };
            }
        }
        
        const datos = {
            id_categoria: parseInt(categoriaSelect.value),
            nombre_producto: nombreInput.value.trim(),
            descripcion: descripcionInput.value.trim() || null,
            precio_producto: parseFloat(precioInput.value),
            imagen: imagenInput.files[0] ? imagenInput.files[0].name : null,
            inventario_inicial: tieneProductoBase ? datosInventario.inventario_inicial : 0, // Preservar inventario si es producto base
            unidad_medida: tieneProductoBase ? datosInventario.unidad_medida : 'lb', // Preservar unidad si es producto base
            stock_minimo: parseFloat(stockMinInput.value) || 0,
            estado: estadoSelect.value || 'activo',
            mostrar_en_catalogo: true // SÍ se muestra en el catálogo público
        };
        
        showLoading(true);
        
        try {
            let result;
            
            if (isEditing && currentProductoId) {
                // Actualizar producto existente (modo edición normal)
                result = await actualizarProducto(currentProductoId, datos);
                showNotification('Producto actualizado correctamente');
            } else if (tieneProductoBase) {
                // Actualizar producto existente del inventario para agregarlo al catálogo
                console.log('Actualizando producto del inventario para agregarlo al catálogo:', productoBaseIdValue);
                result = await actualizarProducto(productoBaseIdValue, datos);
                showNotification('Producto agregado al catálogo correctamente');
            } else {
                // Crear nuevo producto
                // NOTA: El inventario_inicial se envía directamente al crear el producto
                // Los triggers de la BD actualizan automáticamente el stock_actual
                result = await crearProducto(datos);
                showNotification('Producto creado correctamente');
            }
            
            // Limpiar formulario y cerrar modal
            clearForm();
            
            // Recargar productos en localStorage para sincronizar
            await cargarProductosDesdeAPI();
            
            // Disparar evento personalizado para que el catálogo se actualice
            window.dispatchEvent(new CustomEvent('productoActualizado', {
                detail: { productoId: result.producto?.id_producto || productoBaseIdValue || currentProductoId }
            }));
            
            // Redirigir a gestión de productos después de un breve delay (dar tiempo para ver la notificación)
            setTimeout(() => {
                window.location.href = 'gestion-producto.html';
            }, 2500);
            
        } catch (error) {
            showNotification(error.message || 'Error al guardar el producto', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Cancelar
    cancelButton.addEventListener('click', function() {
        clearForm();
        window.location.href = 'gestion-producto.html';
    });
    
    // Eliminar producto
    deleteButton.addEventListener('click', async function() {
        if (!currentProductoId) {
            showNotification('No hay producto para eliminar', 'error');
            return;
        }
        
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }
        
        showLoading(true);
        
        try {
            await eliminarProducto(currentProductoId);
            showNotification('Producto eliminado correctamente');
            
            clearForm();
            
            // Recargar productos en localStorage
            await cargarProductosDesdeAPI();
            
            // Redirigir a gestión de productos
            setTimeout(() => {
                window.location.href = 'gestion-producto.html';
            }, 1500);
            
        } catch (error) {
            showNotification(error.message || 'Error al eliminar el producto', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Manejo de imagen
    imagenInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                showNotification('Solo se permiten archivos de imagen', 'error');
                imagenInput.value = '';
                return;
            }
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('La imagen no puede ser mayor a 5MB', 'error');
                imagenInput.value = '';
                return;
            }
            
            showImagePreview(file);
        }
    });
    
    // Eliminar imagen
    removeImageBtn.addEventListener('click', function() {
        hideImagePreview();
    });
    
    // Actualizar unidades según categoría seleccionada
    categoriaSelect.addEventListener('change', async function() {
        // La unidad de medida se gestiona desde el módulo de Inventario
        // No es necesario actualizar nada aquí
    });
    
    // ========================================
    // FUNCIONES DE CARGA DE DATOS
    // ========================================
    
    // Cargar productos desde la API y sincronizar con localStorage
    async function cargarProductosDesdeAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (!response.ok) {
                throw new Error('Error al cargar productos desde la API');
            }
            const productos = await response.json();
            
            // Guardar en localStorage como respaldo
            localStorage.setItem('productos', JSON.stringify(productos.productos || productos));
            
            return productos.productos || productos;
        } catch (error) {
            console.error('Error al cargar productos desde API:', error);
            // Si falla la API, usar localStorage
            return JSON.parse(localStorage.getItem('productos')) || [];
        }
    }
    
    // Verificar si estamos editando un producto (desde URL params)
    function verificarModoEdicion() {
        const urlParams = new URLSearchParams(window.location.search);
        const productoId = urlParams.get('id');
        
        if (productoId) {
            // Cargar datos del producto para editar
            cargarProductoParaEditar(productoId);
        }
    }
    
    // Cargar producto para editar
    async function cargarProductoParaEditar(id) {
        console.log(`Cargando producto para editar ID: ${id}`);
        showLoading(true);
        
        try {
            const response = await obtenerProductoPorId(id);
            console.log('Respuesta completa del servidor:', response);
            
            let producto;
            if (response.producto) {
                producto = response.producto;
                console.log('Producto extraído de response.producto:', producto);
            } else if (response.id_producto) {
                producto = response;
                console.log('Producto es la respuesta directa:', producto);
            } else {
                console.error('Estructura de respuesta no reconocida:', response);
                throw new Error('Estructura de respuesta no válida');
            }
            
            console.log('Llenando formulario con datos del producto...');
            
            // Información básica
            if (nombreInput) {
                const nombre = producto.nombre_producto || producto.nombre || '';
                nombreInput.value = nombre;
                nombreInput.readOnly = false; // Editable cuando se edita normalmente
                console.log('Nombre cargado:', nombre);
            }
            
            if (categoriaSelect) {
                const categoria = producto.id_categoria || '';
                categoriaSelect.value = categoria;
                categoriaSelect.disabled = false; // Editable cuando se edita normalmente
                console.log('Categoría cargada:', categoria);
            }
            
            if (descripcionInput) {
                const descripcion = producto.descripcion || '';
                descripcionInput.value = descripcion;
                console.log('Descripción cargada:', descripcion);
            }
            
            // Precios
            if (precioInput) {
                const precio = producto.precio_producto || producto.precio || '';
                precioInput.value = formatearNumeroParaInput(precio);
                console.log('Precio cargado:', precioInput.value);
            }
            
            // Inventario
            if (stockMinInput) {
                // Primero intentar cargar desde localStorage (si fue establecido en inventario-admin)
                const stockMinimoGuardado = localStorage.getItem('stock_minimo_sincronizado');
                if (stockMinimoGuardado !== null && !isEditing) {
                    // Solo usar localStorage si estamos creando un nuevo producto, no editando
                    stockMinInput.value = formatearNumeroParaInput(stockMinimoGuardado);
                } else {
                    const stockMinimo = producto.stock_minimo || 0;
                    stockMinInput.value = formatearNumeroParaInput(stockMinimo);
                }
                
                // Asegurar que el campo sea editable cuando se edita normalmente
                stockMinInput.readOnly = false;
                
                // Guardar en localStorage para sincronización
                localStorage.setItem('stock_minimo_sincronizado', stockMinInput.value);
                
                // Agregar event listener para sincronización (solo una vez)
                if (!stockMinInput.hasAttribute('data-sync-listener')) {
                    stockMinInput.setAttribute('data-sync-listener', 'true');
                    stockMinInput.addEventListener('input', function() {
                        const valor = this.value || '0';
                        localStorage.setItem('stock_minimo_sincronizado', valor);
                        
                        // Disparar evento personalizado para actualizar inventario-admin si está abierto
                        window.dispatchEvent(new CustomEvent('stockMinimoCambiado', { 
                            detail: { valor: valor, origen: 'producto' } 
                        }));
                        
                        // Actualizar campo en inventario-admin si existe
                        const inventarioStockMinInput = document.getElementById('inventario-stock-minimo');
                        if (inventarioStockMinInput) {
                            inventarioStockMinInput.value = valor;
                        }
                    });
                }
                
                console.log('Stock mínimo cargado:', stockMinInput.value);
            }
            
            // Cargar stock actual cuando se edita un producto
            if (stockActualInput) {
                const stockActual = producto.stock_actual || 0;
                stockActualInput.value = formatearNumeroParaInput(stockActual);
                stockActualInput.readOnly = true; // Siempre de solo lectura
                console.log('Stock actual cargado:', stockActualInput.value);
            }
            
            // La unidad de medida y el inventario inicial se gestionan desde el módulo de Inventario
            
            // Configuración
            if (estadoSelect) {
                const estado = producto.estado || 'activo';
                estadoSelect.value = estado;
                console.log('Estado cargado:', estado);
            }
            
            console.log('Formulario prellenado con datos del producto');
            
            // Actualizar estado de edición
            currentProductoId = producto.id_producto;
            isEditing = true;
            
            if (modalTitle) {
                modalTitle.textContent = 'Editar Producto';
            }
            
            if (deleteButton) {
                deleteButton.style.display = 'inline-block';
            }
            
            // Mostrar imagen si existe
            if (producto.imagen && previewImg && imagePreview) {
                previewImg.src = `http://localhost:3000/uploads/productos/${producto.imagen}`;
                imagePreview.style.display = 'block';
                console.log('Imagen cargada:', previewImg.src);
            }
            
            // Abrir el modal después de cargar los datos
            setTimeout(() => {
                const modal = document.getElementById('producto-modal');
                if (modal) {
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    console.log('Modal abierto para edición');
                }
            }, 100);
            
        } catch (error) {
            console.error('Error al cargar producto:', error);
            showNotification('Error al cargar el producto', 'error');
            setTimeout(() => {
                window.location.href = 'gestion-producto.html';
            }, 2000);
        } finally {
            showLoading(false);
        }
    }
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    // Listener global para sincronización de stock mínimo desde inventario-admin
    window.addEventListener('stockMinimoCambiado', function(event) {
        if (event.detail && event.detail.origen === 'inventario' && stockMinInput) {
            stockMinInput.value = formatearNumeroParaInput(event.detail.valor);
        }
    });
    
    // Inicializar la página
    async function init() {
        console.log('Inicializando página de productos...');
        
        // Inicializar stock mínimo en 0 cuando no hay producto base seleccionado
        if (stockMinInput) {
            // Verificar si hay un producto base seleccionado
            const tieneProductoBase = productBaseId && productBaseId.value && productBaseId.value.trim() !== '';
            
            if (!tieneProductoBase) {
                // Si no hay producto base, debe estar en 0 y ser editable
                stockMinInput.value = '0';
                stockMinInput.readOnly = false;
            } else {
                // Si hay producto base, se cargará cuando se seleccione
                // Por ahora, establecer en 0 hasta que se cargue el producto
                stockMinInput.value = '0';
                stockMinInput.readOnly = false; // Se hará readonly cuando se seleccione el producto
            }
        }
        
        // Inicializar stock actual
        if (stockActualInput) {
            stockActualInput.value = '0';
            stockActualInput.readOnly = true; // Siempre de solo lectura
        }
        
        // Cargar categorías en el select con actualización automática
        if (categoriaSelect) {
            console.log('Selector de categorías encontrado:', categoriaSelect.id);
            try {
                await loadCategoriasInSelectWithAutoUpdate(categoriaSelect, true, true);
                console.log('Categorías cargadas en el selector');
            } catch (error) {
                console.error('Error al cargar categorías:', error);
            }
        } else {
            console.error('Selector de categorías no encontrado');
        }
        
        // Cargar productos desde la API
        await cargarProductosDesdeAPI();
        
        // Verificar si estamos en modo edición
        verificarModoEdicion();
    }
    
    init();
    
    if (typeof setupAutoSelectZeroFields === 'function' && productoForm) {
        setupAutoSelectZeroFields(productoForm);
    }
});

// ========================================
// ESTILOS CSS DINÁMICOS PARA NOTIFICACIONES
// ========================================

// Agregar estilos CSS para las notificaciones
const style = document.createElement('style');
style.textContent = `
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
    
    .producto-loading-overlay.show {
        display: flex;
    }
`;
document.head.appendChild(style);
