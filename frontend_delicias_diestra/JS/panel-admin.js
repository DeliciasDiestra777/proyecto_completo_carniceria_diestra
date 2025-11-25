// Panel de Administrador - Gestión de Productos
// Funcionalidad para el modal de productos

document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión de administrador
    checkAdminSession();
    
    // Actualizar contador de notificaciones pendientes
    actualizarContadorNotificaciones();
    
    // Actualizar cada 30 segundos
    setInterval(actualizarContadorNotificaciones, 30000);
    
    // Función para actualizar contador de notificaciones
    async function actualizarContadorNotificaciones() {
        try {
            const response = await fetch('http://localhost:3000/api/notificaciones/pendientes');
            if (response.ok) {
                const data = await response.json();
                const total = data.total || 0;
                
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
            console.error('Error al actualizar contador de notificaciones:', error);
        }
    }
    
    // Variables globales
    let currentProductId = null;
    let isEditMode = false;
    
    // Elementos del DOM
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const productModalTitle = document.getElementById('product-modal-title');
    const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
    const btnSaveProduct = document.getElementById('save-product');
    const btnCancelProduct = document.getElementById('cancel-product');
    const btnDeleteProduct = document.getElementById('delete-product');
    const btnCloseModal = document.getElementById('close-product-modal');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const btnRemoveImage = document.getElementById('remove-image');

    // Event Listeners - Solo agregar si los elementos existen
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', openNewProductModal);
    }
    if (btnSaveProduct) {
        btnSaveProduct.addEventListener('click', saveProduct);
    }
    if (btnCancelProduct) {
        btnCancelProduct.addEventListener('click', closeProductModal);
    }
    if (btnDeleteProduct) {
        btnDeleteProduct.addEventListener('click', deleteProduct);
    }
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeProductModal);
    }
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', removeImagePreview);
    }

    // Cerrar modal al hacer clic fuera
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && productModal.classList.contains('show')) {
            closeProductModal();
        }
    });

    // Función para abrir modal de nuevo producto
    function openNewProductModal() {
        isEditMode = false;
        currentProductId = null;
        productModalTitle.textContent = 'Nuevo Producto';
        btnDeleteProduct.style.display = 'none';
        btnSaveProduct.textContent = 'Guardar Producto';
        
        // Limpiar formulario
        clearProductForm();
        
        // Mostrar modal
        showProductModal();
    }

    // Función para abrir modal de edición
    function openEditProductModal(productId) {
        isEditMode = true;
        currentProductId = productId;
        productModalTitle.textContent = 'Editar Producto';
        btnDeleteProduct.style.display = 'inline-flex';
        btnSaveProduct.textContent = 'Actualizar Producto';
        
        // Cargar datos del producto
        loadProductData(productId);
        
        // Mostrar modal
        showProductModal();
    }

    // Función para mostrar el modal
    function showProductModal() {
        productModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus en el primer campo
        setTimeout(() => {
            document.getElementById('product-name').focus();
        }, 100);
    }

    // Función para cerrar el modal
    function closeProductModal() {
        productModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Limpiar formulario después de un breve delay
        setTimeout(() => {
            if (!isEditMode) {
                clearProductForm();
            }
        }, 300);
    }

    // Función para limpiar el formulario
    function clearProductForm() {
        productForm.reset();
        hideImagePreview();
        clearValidationErrors();
        
        // Resetear checkboxes
        document.getElementById('product-active').checked = true;
        document.getElementById('product-featured').checked = false;
    }

    // Función para cargar datos del producto
    function loadProductData(productId) {
        // Simular carga de datos (aquí harías la petición al servidor)
        const mockProduct = {
            id_producto: productId,
            nombre_producto: 'Pechuga de Pollo Premium',
            categoria_id: '1',
            descripcion: 'Pechuga de pollo fresca, sin hormonas, ideal para asar o cocinar.',
            precio: 25000,
            precio_original: 28000,
            stock: 50,
            stock_minimo: 10,
            peso: 1.2,
            unidad_medida: 'kg',
            imagen: 'pechuga_pollo.jpg',
            activo: true,
            destacado: true
        };

        // Llenar formulario con los datos
        document.getElementById('product-name').value = mockProduct.nombre_producto;
        document.getElementById('product-category').value = mockProduct.categoria_id;
        document.getElementById('product-description').value = mockProduct.descripcion;
        document.getElementById('product-price').value = mockProduct.precio;
        document.getElementById('product-price-original').value = mockProduct.precio_original;
        document.getElementById('product-stock').value = mockProduct.stock;
        document.getElementById('product-stock-min').value = mockProduct.stock_minimo;
        document.getElementById('product-weight').value = mockProduct.peso;
        document.getElementById('product-unit').value = mockProduct.unidad_medida;
        document.getElementById('product-active').checked = mockProduct.activo;
        document.getElementById('product-featured').checked = mockProduct.destacado;

        // Mostrar imagen si existe
        if (mockProduct.imagen) {
            showImagePreview(mockProduct.imagen);
        }
    }

    // Función para guardar producto
    function saveProduct() {
        if (!validateProductForm()) {
            return;
        }

        // Mostrar loading
        showLoading();

        // Simular guardado (aquí harías la petición al servidor)
        setTimeout(() => {
            hideLoading();
            
            const productData = getProductFormData();
            
            if (isEditMode) {
                console.log('Actualizando producto:', productData);
                showNotification('Producto actualizado exitosamente', 'success');
            } else {
                console.log('Creando producto:', productData);
                showNotification('Producto creado exitosamente', 'success');
            }
            
            closeProductModal();
            
            // Actualizar tabla de productos
            refreshProductsTable();
            
        }, 1500);
    }

    // Función para eliminar producto
    function deleteProduct() {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }

        showLoading();

        // Simular eliminación
        setTimeout(() => {
            hideLoading();
            console.log('Eliminando producto:', currentProductId);
            showNotification('Producto eliminado exitosamente', 'success');
            closeProductModal();
            refreshProductsTable();
        }, 1000);
    }

    // Función para obtener datos del formulario
    function getProductFormData() {
        const formData = new FormData(productForm);
        const data = {};
        
        // Obtener datos de todos los campos
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Agregar campos adicionales
        data.activo = document.getElementById('product-active').checked;
        data.destacado = document.getElementById('product-featured').checked;
        
        if (isEditMode) {
            data.id_producto = currentProductId;
        }
        
        return data;
    }

    // Función para validar formulario
    function validateProductForm() {
        let isValid = true;
        clearValidationErrors();

        // Validar campos requeridos
        const requiredFields = [
            { id: 'product-name', name: 'nombre del producto' },
            { id: 'product-category', name: 'categoría' },
            { id: 'product-price', name: 'precio' },
            { id: 'product-stock', name: 'stock' },
            { id: 'product-unit', name: 'unidad de medida' }
        ];

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                showFieldError(element, `${field.name} es requerido`);
                isValid = false;
            }
        });

        // Validar precio
        const price = parseFloat(document.getElementById('product-price').value);
        if (price <= 0) {
            showFieldError(document.getElementById('product-price'), 'El precio debe ser mayor a 0');
            isValid = false;
        }

        // Validar stock
        const stock = parseInt(document.getElementById('product-stock').value);
        if (stock < 0) {
            showFieldError(document.getElementById('product-stock'), 'El stock no puede ser negativo');
            isValid = false;
        }

        // Validar peso si se proporciona
        const weight = parseFloat(document.getElementById('product-weight').value);
        if (weight < 0) {
            showFieldError(document.getElementById('product-weight'), 'El peso no puede ser negativo');
            isValid = false;
        }

        return isValid;
    }

    // Función para mostrar error en campo
    function showFieldError(element, message) {
        element.classList.add('error');
        
        // Crear elemento de error si no existe
        let errorElement = element.parentNode.querySelector('.admin-form-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'admin-form-error';
            element.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    // Función para limpiar errores de validación
    function clearValidationErrors() {
        const errorElements = document.querySelectorAll('.admin-form-error');
        errorElements.forEach(element => element.remove());
        
        const errorFields = document.querySelectorAll('.admin-form-input.error, .admin-form-select.error, .admin-form-textarea.error');
        errorFields.forEach(element => element.classList.remove('error'));
    }

    // Función para manejar vista previa de imagen
    function handleImagePreview(event) {
        const file = event.target.files[0];
        
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                showNotification('Por favor selecciona un archivo de imagen válido', 'error');
                return;
            }
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('La imagen no puede ser mayor a 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // Función para mostrar vista previa de imagen
    function showImagePreview(imageSrc) {
        previewImg.src = imageSrc;
        imagePreview.style.display = 'block';
    }

    // Función para ocultar vista previa de imagen
    function hideImagePreview() {
        imagePreview.style.display = 'none';
        previewImg.src = '';
    }

    // Función para eliminar imagen
    function removeImagePreview() {
        imageInput.value = '';
        hideImagePreview();
    }

    // Función para mostrar loading
    function showLoading() {
        const loadingOverlay = document.getElementById('admin-loading');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }

    // Función para ocultar loading
    function hideLoading() {
        const loadingOverlay = document.getElementById('admin-loading');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    // Función para mostrar notificación
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="admin-notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Agregar al body
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Función para actualizar tabla de productos
    function refreshProductsTable() {
        // Aquí harías la petición para obtener los productos actualizados
        console.log('Actualizando tabla de productos...');
    }

    // Función para manejar clics en la tabla de productos
    function handleProductTableClick(event) {
        const target = event.target;
        
        if (target.classList.contains('edit-product')) {
            const productId = target.getAttribute('data-product-id');
            openEditProductModal(productId);
        } else if (target.classList.contains('delete-product')) {
            const productId = target.getAttribute('data-product-id');
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                // Eliminar producto directamente
                console.log('Eliminando producto:', productId);
                showNotification('Producto eliminado exitosamente', 'success');
                refreshProductsTable();
            }
        }
    }

    // Agregar event listener a la tabla de productos
    const productosTable = document.getElementById('productos-table');
    if (productosTable) {
        productosTable.addEventListener('click', handleProductTableClick);
    }

    // Exponer funciones globalmente para uso desde otros scripts
    window.adminProductModal = {
        openNew: openNewProductModal,
        openEdit: openEditProductModal,
        close: closeProductModal
    };

    // Función para verificar sesión de administrador
    function checkAdminSession() {
        const adminSession = sessionStorage.getItem('adminSession');
        
        if (!adminSession) {
            // No hay sesión de administrador, redirigir al login
            showNotification('Debes iniciar sesión como administrador', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        try {
            const sessionData = JSON.parse(adminSession);
            
            if (!sessionData.isAdmin) {
                // No es administrador, redirigir al login
                sessionStorage.removeItem('adminSession');
                showNotification('Acceso denegado. Solo administradores pueden acceder.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }

            // Mostrar nombre del administrador
            // Intentar obtener el nombre de diferentes campos posibles
            console.log('=== DATOS DE SESIÓN ===');
            console.log('sessionData completo:', sessionData);
            console.log('sessionData.name:', sessionData.name);
            console.log('sessionData.nombre:', sessionData.nombre);
            console.log('sessionData.nombre_usuario:', sessionData.nombre_usuario);
            
            const nombreUsuario = sessionData.name || sessionData.nombre || sessionData.nombre_usuario || 'Usuario';
            console.log('Nombre del usuario a mostrar:', nombreUsuario);
            console.log('========================');
            
            displayAdminName(nombreUsuario);
            
            // Configurar botón de cerrar sesión
            setupLogoutButton();
            
            // Aplicar permisos según el rol
            if (window.PermisosAdmin && window.PermisosAdmin.aplicarPermisos) {
                window.PermisosAdmin.aplicarPermisos();
            }
            
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            sessionStorage.removeItem('adminSession');
            window.location.href = 'login.html';
        }
    }

    // Función para mostrar el nombre del administrador
    function displayAdminName(adminName) {
        const adminNameDisplay = document.getElementById('admin-name-display');
        const adminNameLink = document.getElementById('admin-name-link');
        
        // Si no se proporciona un nombre, intentar obtenerlo de la sesión
        if (!adminName || adminName === 'Usuario' || adminName === 'Cargando...') {
            const adminSession = sessionStorage.getItem('adminSession');
            if (adminSession) {
                try {
                    const sessionData = JSON.parse(adminSession);
                    adminName = sessionData.name || sessionData.nombre || sessionData.nombre_usuario || 'Usuario';
                } catch (error) {
                    console.error('Error al obtener nombre de la sesión:', error);
                    adminName = 'Usuario';
                }
            } else {
                adminName = 'Usuario';
            }
        }
        
        if (adminNameDisplay) {
            adminNameDisplay.textContent = `Hola ${adminName}`;
            console.log('Nombre del administrador actualizado:', adminName);
        } else {
            console.warn('Elemento admin-name-display no encontrado');
        }
        
        if (adminNameLink) {
            adminNameLink.title = `Panel de ${adminName}`;
        }
    }

    // Función para configurar el botón de cerrar sesión
    function setupLogoutButton() {
        const logoutButton = document.getElementById('admin-logout');
        
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    // Limpiar sesión
                    sessionStorage.removeItem('adminSession');
                    
                    // Mostrar mensaje de despedida
                    showNotification('Sesión cerrada exitosamente', 'success');
                    
                    // Redirigir al login
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
            });
        }
    }
});


