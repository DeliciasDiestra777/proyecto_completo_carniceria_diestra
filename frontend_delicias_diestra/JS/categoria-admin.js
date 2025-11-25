/**
 * Sistema de Gestión de Categorías - Frontend
 * Maneja la creación, edición y gestión de categorías conectándose al backend
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM - Modal
    const categoriaForm = document.getElementById('categoria-form');
    const saveButton = document.getElementById('save-categoria');
    const cancelButton = document.getElementById('cancel-categoria');
    const deleteButton = document.getElementById('delete-categoria');
    const loadingOverlay = document.getElementById('categoria-loading');
    const modalTitle = document.getElementById('categoria-modal-title');
    
    // Elementos del DOM - Listado
    const categoriaListingSection = document.getElementById('categoria-listing-section');
    const categoriaModal = document.getElementById('categoria-modal');
    const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
    const btnCrearPrimeraCategoria = document.getElementById('btn-crear-primera-categoria');
    const categoriaSearch = document.getElementById('categoria-search');
    const categoriaTableBody = document.getElementById('categoria-table-body');
    const categoriaEmptyState = document.getElementById('categoria-empty-state');
    
    // Elementos de estadísticas
    const totalCategorias = document.getElementById('total-categorias');
    const categoriasActivas = document.getElementById('categorias-activas');
    const categoriasInactivas = document.getElementById('categorias-inactivas');
    const categoriasDuplicadas = document.getElementById('categorias-duplicadas');
    const categoriasDuplicadasContainer = document.getElementById('categorias-duplicadas-container');
    
    // Campos del formulario
    const nombreInput = document.getElementById('categoria-name');
    const descripcionInput = document.getElementById('categoria-description');
    const estadoSelect = document.getElementById('categoria-status');
    const mostrarCatalogoCheckbox = document.getElementById('categoria-mostrar-catalogo');
    
    // Elementos de vista previa
    const previewName = document.getElementById('preview-name');
    const previewDescription = document.getElementById('preview-description');
    const previewStatus = document.getElementById('preview-status');
    const previewCatalogoValue = document.getElementById('preview-catalogo-value');
    
    // Variables de estado
    let currentCategoriaId = null;
    let isEditing = false;
    let allCategorias = [];
    let filteredCategorias = [];
    
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
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `categoria-notification categoria-notification-${type}`;
        notification.innerHTML = `
            <div class="categoria-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
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
    
    // Validar formulario
    function validateForm() {
        const nombre = nombreInput.value.trim();
        const estado = estadoSelect.value;
        
        if (!nombre) {
            showNotification('El nombre de la categoría es obligatorio', 'error');
            nombreInput.focus();
            return false;
        }
        
        if (nombre.length < 2) {
            showNotification('El nombre debe tener al menos 2 caracteres', 'error');
            nombreInput.focus();
            return false;
        }
        
        if (!estado) {
            showNotification('Debe seleccionar un estado para la categoría', 'error');
            estadoSelect.focus();
            return false;
        }
        
        return true;
    }
    
    // Limpiar formulario
    function clearForm() {
        categoriaForm.reset();
        // Asegurar que el checkbox "Mostrar en catálogo" esté activo por defecto
        if (mostrarCatalogoCheckbox) {
            mostrarCatalogoCheckbox.checked = true;
        }
        currentCategoriaId = null;
        isEditing = false;
        modalTitle.textContent = 'Nueva Categoría';
        deleteButton.style.display = 'none';
        updatePreview();
    }
    
    // Actualizar vista previa
    function updatePreview() {
        const nombre = nombreInput.value.trim() || 'Nombre de la Categoría';
        const descripcion = descripcionInput.value.trim() || 'Descripción de la categoría';
        const estado = estadoSelect.value;
        const mostrarEnCatalogo = mostrarCatalogoCheckbox.checked;
        
        previewName.textContent = nombre;
        previewDescription.textContent = descripcion;
        previewStatus.textContent = `Estado: ${estado === 'activo' ? 'Activa' : 'Inactiva'}`;
        previewCatalogoValue.textContent = mostrarEnCatalogo ? 'Sí' : 'No';
        
        // Cambiar color según el estado
        const previewCatalogo = document.getElementById('preview-catalogo');
        if (previewCatalogo) {
            if (mostrarEnCatalogo) {
                previewCatalogo.style.color = 'var(--color-success)';
            } else {
                previewCatalogo.style.color = 'var(--color-warning)';
            }
        }
    }
    
    // ========================================
    // FUNCIONES DE API
    // ========================================
    
    // Crear nueva categoría
    async function crearCategoria(datos) {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.mensaje || 'Error al crear la categoría');
            }
            
            return result;
        } catch (error) {
            console.error('Error al crear categoría:', error);
            throw error;
        }
    }
    
    // Actualizar categoría existente
    async function actualizarCategoria(id, datos) {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.mensaje || 'Error al actualizar la categoría');
            }
            
            return result;
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            throw error;
        }
    }
    
    // Eliminar categoría
    async function eliminarCategoria(id) {
        try {
            console.log('Eliminando categoría con ID:', id);
            console.log('URL:', `${API_BASE_URL}/categorias/${id}`);
            
            const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Respuesta status:', response.status);
            console.log('Respuesta headers:', response.headers);
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error('Error del servidor:', result);
                
                // Detectar error de clave foránea (restricción de integridad referencial)
                const errorMessage = result.error || result.mensaje || result.sqlMessage || '';
                const errorCode = result.code || result.errno || '';
                const sqlMessage = result.sqlMessage || '';
                
                // Verificar múltiples formas en que puede venir el error de clave foránea
                const isForeignKeyError = 
                    errorCode === 'ER_ROW_IS_REFERENCED_2' ||
                    errorCode === 1451 ||
                    errorMessage.toLowerCase().includes('foreign key constraint') ||
                    errorMessage.toLowerCase().includes('cannot delete or update a parent row') ||
                    errorMessage.toLowerCase().includes('referenced') ||
                    sqlMessage.toLowerCase().includes('foreign key constraint') ||
                    sqlMessage.toLowerCase().includes('cannot delete or update a parent row') ||
                    sqlMessage.toLowerCase().includes('referenced');
                
                if (response.status === 500 && isForeignKeyError) {
                    throw new Error('No se puede eliminar esta categoría porque tiene productos asociados. Por favor, primero elimina o cambia la categoría de los productos que la utilizan, o cambia el estado de la categoría a "inactivo" en lugar de eliminarla.');
                }
                
                throw new Error(result.mensaje || result.error || 'Error al eliminar la categoría');
            }
            
            console.log('Categoría eliminada exitosamente:', result);
            return result;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            throw error;
        }
    }
    
    // Verificar si existe una categoría con el mismo nombre
    async function verificarNombreExistente(nombre, excludeId = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            const categorias = await response.json();
            
            return categorias.some(cat => 
                (cat.nombre_categoria || cat.nombre || '').toLowerCase() === nombre.toLowerCase() && 
                cat.id_categoria !== excludeId
            );
        } catch (error) {
            console.error('Error al verificar nombre:', error);
            return false;
        }
    }
    
    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Guardar categoría
    saveButton.addEventListener('click', async function() {
        if (!validateForm()) {
            return;
        }
        
        const datos = {
            nombre_categoria: nombreInput.value.trim(),
            descripcion: descripcionInput.value.trim() || null,
            estado: estadoSelect.value,
            mostrar_en_catalogo: mostrarCatalogoCheckbox ? mostrarCatalogoCheckbox.checked : true
        };
        
        // Verificar si el nombre ya existe
        const nombreExiste = await verificarNombreExistente(datos.nombre_categoria, currentCategoriaId);
        if (nombreExiste) {
            showNotification('Ya existe una categoría con ese nombre', 'error');
            nombreInput.focus();
            return;
        }
        
        showLoading(true);
        
        try {
            let result;
            
            if (isEditing && currentCategoriaId) {
                // Actualizar categoría existente
                result = await actualizarCategoria(currentCategoriaId, datos);
                showNotification('Categoría actualizada correctamente');
            } else {
                // Crear nueva categoría
                result = await crearCategoria(datos);
                showNotification('Categoría creada correctamente');
            }
            
            // Limpiar formulario y cerrar modal
            clearForm();
            
            // Recargar categorías en localStorage para sincronizar
            await cargarCategoriasDesdeAPI();
            
            // Emitir evento personalizado para notificar a otros componentes
            const evento = new CustomEvent(isEditing ? 'categoriaActualizada' : 'categoriaCreada', {
                detail: {
                    categoria: result,
                    esNueva: !isEditing
                }
            });
            document.dispatchEvent(evento);
            
            // Recargar lista y mostrar listado
            await cargarTodasLasCategorias();
            renderizarTablaCategorias(filteredCategorias);
            actualizarEstadisticas(filteredCategorias);
            
            // Ocultar modal y mostrar listado
            setTimeout(() => {
                ocultarModalYMostrarListado();
            }, 1000);
            
        } catch (error) {
            showNotification(error.message || 'Error al guardar la categoría', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Cancelar
    cancelButton.addEventListener('click', function() {
        clearForm();
        ocultarModalYMostrarListado();
    });
    
    // Eliminar categoría
    deleteButton.addEventListener('click', async function() {
        if (!currentCategoriaId) {
            showNotification('No hay categoría para eliminar', 'error');
            return;
        }
        
        if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
            return;
        }
        
        showLoading(true);
        
        try {
            await eliminarCategoria(currentCategoriaId);
            showNotification('Categoría eliminada correctamente');
            
            clearForm();
            
            // Recargar lista y mostrar listado
            await cargarTodasLasCategorias();
            renderizarTablaCategorias(filteredCategorias);
            actualizarEstadisticas(filteredCategorias);
            
            // Ocultar modal y mostrar listado
            setTimeout(() => {
                ocultarModalYMostrarListado();
            }, 1000);
            
        } catch (error) {
            showNotification(error.message || 'Error al eliminar la categoría', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Actualizar vista previa en tiempo real
    nombreInput.addEventListener('input', updatePreview);
    descripcionInput.addEventListener('input', updatePreview);
    estadoSelect.addEventListener('change', updatePreview);
    if (mostrarCatalogoCheckbox) {
        mostrarCatalogoCheckbox.addEventListener('change', updatePreview);
    }
    
    // Event listeners para el listado
    btnNuevaCategoria.addEventListener('click', mostrarModalNuevaCategoria);
    btnCrearPrimeraCategoria.addEventListener('click', mostrarModalNuevaCategoria);
    
    // Búsqueda en tiempo real
    categoriaSearch.addEventListener('input', function() {
        filtrarCategorias(this.value);
    });
    
    // Cerrar modal con botón X
    const closeModalBtn = document.getElementById('close-categoria-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            console.log('Botón de cerrar modal clickeado');
            ocultarModalYMostrarListado();
        });
    } else {
        console.error('Botón close-categoria-modal no encontrado');
    }
    
    // Delegación de eventos para el botón de cerrar (respaldo)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'close-categoria-modal') {
            console.log('Botón de cerrar modal clickeado (delegación)');
            ocultarModalYMostrarListado();
        }
    });
    
    // ========================================
    // FUNCIONES DE LISTADO DE CATEGORÍAS
    // ========================================
    
    // Cargar todas las categorías
    async function cargarTodasLasCategorias() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            const categorias = await response.json();
            
            if (response.ok) {
                allCategorias = categorias;
                filteredCategorias = [...categorias];
                return categorias;
            } else {
                throw new Error('Error al cargar categorías');
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            showNotification('Error al cargar las categorías', 'error');
            return [];
        }
    }
    
    // Detectar categorías duplicadas
    function detectarDuplicados(categorias) {
        const nombres = categorias.map(cat => (cat.nombre_categoria || cat.nombre || '').toLowerCase());
        const duplicados = nombres.filter((nombre, index) => nombres.indexOf(nombre) !== index);
        return [...new Set(duplicados)];
    }
    
    // Actualizar estadísticas
    function actualizarEstadisticas(categorias) {
        const total = categorias.length;
        const activas = categorias.filter(cat => cat.estado === 'activo').length;
        const inactivas = categorias.filter(cat => cat.estado === 'inactivo').length;
        const duplicados = detectarDuplicados(categorias).length;
        
        totalCategorias.textContent = total;
        categoriasActivas.textContent = activas;
        categoriasInactivas.textContent = inactivas;
        categoriasDuplicadas.textContent = duplicados;
        
        if (duplicados > 0) {
            categoriasDuplicadasContainer.style.display = 'block';
        } else {
            categoriasDuplicadasContainer.style.display = 'none';
        }
    }
    
    // Renderizar tabla de categorías
    function renderizarTablaCategorias(categorias) {
        if (categorias.length === 0) {
            categoriaTableBody.innerHTML = '';
            categoriaEmptyState.style.display = 'block';
            return;
        }
        
        categoriaEmptyState.style.display = 'none';
        
        const duplicados = detectarDuplicados(allCategorias);
        
        const html = categorias.map(categoria => {
            const nombreCategoria = categoria.nombre_categoria || categoria.nombre || 'Sin nombre';
            const esDuplicado = duplicados.includes(nombreCategoria.toLowerCase());
            const fechaFormateada = new Date(categoria.fecha_creacion).toLocaleDateString('es-ES');
            
            return `
                <tr class="${esDuplicado ? 'categoria-duplicada' : ''}">
                    <td>
                        <div class="categoria-nombre">
                            ${nombreCategoria}
                            ${esDuplicado ? '<span class="categoria-duplicado-badge">DUPLICADO</span>' : ''}
                        </div>
                    </td>
                    <td>
                        <div class="categoria-descripcion" title="${categoria.descripcion || 'Sin descripción'}">
                            ${categoria.descripcion || 'Sin descripción'}
                        </div>
                    </td>
                    <td>
                        <span class="categoria-estado ${categoria.estado}">
                            <i class="fas fa-circle"></i>
                            ${categoria.estado}
                        </span>
                    </td>
                    <td>
                        <span class="categoria-fecha">${fechaFormateada}</span>
                    </td>
                    <td>
                        <div class="categoria-acciones">
                            <button class="categoria-btn-action categoria-btn-edit" onclick="editarCategoria(${categoria.id_categoria})">
                                <i class="fas fa-edit"></i>
                                Editar
                            </button>
                            <button class="categoria-btn-action categoria-btn-delete" onclick="eliminarCategoriaDesdeLista(${categoria.id_categoria})">
                                <i class="fas fa-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        categoriaTableBody.innerHTML = html;
    }
    
    // Filtrar categorías por búsqueda
    function filtrarCategorias(termino) {
        if (!termino.trim()) {
            filteredCategorias = [...allCategorias];
        } else {
            filteredCategorias = allCategorias.filter(categoria => {
                const nombreCategoria = categoria.nombre_categoria || categoria.nombre || '';
                return nombreCategoria.toLowerCase().includes(termino.toLowerCase()) ||
                    (categoria.descripcion && categoria.descripcion.toLowerCase().includes(termino.toLowerCase()));
            });
        }
        
        renderizarTablaCategorias(filteredCategorias);
        actualizarEstadisticas(filteredCategorias);
    }
    
    // Editar categoría desde la lista
    window.editarCategoria = function(id) {
        const categoria = allCategorias.find(cat => cat.id_categoria === id);
        if (!categoria) return;
        
        // Llenar formulario con datos de la categoría
        nombreInput.value = categoria.nombre_categoria || categoria.nombre || '';
        descripcionInput.value = categoria.descripcion || '';
        estadoSelect.value = categoria.estado || categoria.estado_categoria || 'activo';
        
        // Si la categoría no tiene mostrar_en_catalogo definido, establecerlo como true por defecto
        // (para categorías existentes que no tienen este campo)
        if (mostrarCatalogoCheckbox) {
            if (categoria.mostrar_en_catalogo !== undefined) {
                mostrarCatalogoCheckbox.checked = categoria.mostrar_en_catalogo === true || categoria.mostrar_en_catalogo === 1 || categoria.mostrar_en_catalogo === 'true';
            } else {
                // Para categorías existentes sin este campo, establecer como true por defecto
                // EXCEPTO para "Aliños" que debe estar desactivada
                const nombreCategoria = (categoria.nombre_categoria || categoria.nombre || '').toLowerCase().trim();
                        if (nombreCategoria === 'aliños' || nombreCategoria === 'aliño') {
                    mostrarCatalogoCheckbox.checked = false;
                } else {
                    mostrarCatalogoCheckbox.checked = true;
                }
            }
        }
        
        // Actualizar estado de edición
        currentCategoriaId = categoria.id_categoria;
        isEditing = true;
        modalTitle.textContent = 'Editar Categoría';
        deleteButton.style.display = 'inline-block';
        
        updatePreview();
        
        // Mostrar modal
        categoriaModal.style.display = 'flex';
        categoriaListingSection.style.display = 'none';
    };
    
    // Verificar si hay productos asociados a una categoría
    async function verificarProductosAsociados(idCategoria) {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (!response.ok) return false;
            
            const productos = await response.json();
            return productos.some(producto => 
                producto.id_categoria == idCategoria || 
                producto.id_categoria === idCategoria
            );
        } catch (error) {
            console.error('Error al verificar productos asociados:', error);
            return false; // En caso de error, permitir intentar eliminar
        }
    }
    
    // Eliminar categoría desde la lista
    window.eliminarCategoriaDesdeLista = async function(id) {
        const categoria = allCategorias.find(cat => cat.id_categoria === id);
        if (!categoria) return;
        
        const nombreCategoria = categoria.nombre_categoria || categoria.nombre || 'Sin nombre';
        
        // Verificar si hay productos asociados
        showLoading(true);
        const tieneProductos = await verificarProductosAsociados(id);
        showLoading(false);
        
        if (tieneProductos) {
            const mensaje = `⚠️ No se puede eliminar la categoría "${nombreCategoria}" porque tiene productos asociados.\n\n` +
                          `Opciones:\n` +
                          `1. Cambia la categoría de los productos que la utilizan\n` +
                          `2. Elimina primero los productos asociados\n` +
                          `3. Cambia el estado de la categoría a "inactivo" en lugar de eliminarla\n\n` +
                          `¿Deseas continuar de todas formas? (Se mostrará un error si intentas eliminarla)`;
            
            if (!confirm(mensaje)) {
                return;
            }
        } else {
            if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${nombreCategoria}"?`)) {
                return;
            }
        }
        
        showLoading(true);
        
        try {
            await eliminarCategoria(id);
            showNotification('Categoría eliminada correctamente', 'success');
            
            // Recargar lista
            await cargarTodasLasCategorias();
            renderizarTablaCategorias(filteredCategorias);
            actualizarEstadisticas(filteredCategorias);
            
        } catch (error) {
            console.error('Error al eliminar categoría desde lista:', error);
            showNotification(`Error al eliminar categoría: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    };
    
    // Mostrar modal para nueva categoría
    function mostrarModalNuevaCategoria() {
        clearForm();
        categoriaModal.style.display = 'flex';
        categoriaListingSection.style.display = 'none';
    }
    
    // Ocultar modal y mostrar listado
    function ocultarModalYMostrarListado() {
        categoriaModal.style.display = 'none';
        categoriaListingSection.style.display = 'block';
    }
    
    // ========================================
    // FUNCIONES DE CARGA DE DATOS
    // ========================================
    
    // Cargar categorías desde la API y sincronizar con localStorage
    async function cargarCategoriasDesdeAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            const categorias = await response.json();
            
            // Guardar en localStorage para compatibilidad con el sistema existente
            localStorage.setItem('categorias', JSON.stringify(categorias));
            
            return categorias;
        } catch (error) {
            console.error('Error al cargar categorías desde API:', error);
            // Si falla la API, usar las categorías de localStorage
            return JSON.parse(localStorage.getItem('categorias')) || [];
        }
    }
    
    // Verificar si estamos editando una categoría (desde URL params)
    function verificarModoEdicion() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaId = urlParams.get('id');
        
        if (categoriaId) {
            // Cargar datos de la categoría para editar
            cargarCategoriaParaEditar(categoriaId);
        }
    }
    
    // Cargar categoría para editar
    async function cargarCategoriaParaEditar(id) {
        showLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${id}`);
            const categoria = await response.json();
            
            if (response.ok) {
                // Llenar formulario con datos de la categoría
                nombreInput.value = categoria.nombre_categoria || categoria.nombre || '';
                descripcionInput.value = categoria.descripcion_categoria || categoria.descripcion || '';
                estadoSelect.value = categoria.estado_categoria || categoria.estado || 'activo';
                
                // Si la categoría no tiene mostrar_en_catalogo definido, establecerlo como true por defecto
                // (para categorías existentes que no tienen este campo)
                if (mostrarCatalogoCheckbox) {
                    if (categoria.mostrar_en_catalogo !== undefined) {
                        mostrarCatalogoCheckbox.checked = categoria.mostrar_en_catalogo === true || categoria.mostrar_en_catalogo === 1 || categoria.mostrar_en_catalogo === 'true';
                    } else {
                        // Para categorías existentes sin este campo, establecer como true por defecto
                        // EXCEPTO para "Aliños" que debe estar desactivada
                        const nombreCategoria = (categoria.nombre_categoria || categoria.nombre || '').toLowerCase().trim();
                        if (nombreCategoria === 'aliños' || nombreCategoria === 'aliño') {
                            mostrarCatalogoCheckbox.checked = false;
                        } else {
                            mostrarCatalogoCheckbox.checked = true;
                        }
                    }
                }
                
                // Actualizar estado de edición
                currentCategoriaId = categoria.id_categoria;
                isEditing = true;
                modalTitle.textContent = 'Editar Categoría';
                deleteButton.style.display = 'inline-block';
                
                updatePreview();
            } else {
                showNotification('Categoría no encontrada', 'error');
                setTimeout(() => {
                    window.location.href = 'panel-admin.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Error al cargar categoría:', error);
            showNotification('Error al cargar la categoría', 'error');
            setTimeout(() => {
                window.location.href = 'panel-admin.html';
            }, 2000);
        } finally {
            showLoading(false);
        }
    }
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    // Inicializar la página
    async function init() {
        // Cargar categorías desde la API
        await cargarCategoriasDesdeAPI();
        
        // Cargar todas las categorías para el listado
        await cargarTodasLasCategorias();
        
        // Renderizar tabla inicial
        renderizarTablaCategorias(filteredCategorias);
        actualizarEstadisticas(filteredCategorias);
        
        // Verificar si estamos en modo edición (desde URL params)
        verificarModoEdicion();
        
        // Actualizar vista previa inicial
        updatePreview();
        
        // Mostrar listado por defecto
        categoriaListingSection.style.display = 'block';
        categoriaModal.style.display = 'none';
    }
    
    // Inicializar cuando se carga la página
    init();
});

// ========================================
// ESTILOS CSS DINÁMICOS PARA NOTIFICACIONES
// ========================================

// Agregar estilos CSS para las notificaciones
const style = document.createElement('style');
style.textContent = `
    .categoria-notification {
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
    
    .categoria-notification.show {
        transform: translateX(0);
    }
    
    .categoria-notification-error {
        border-left-color: #ef4444;
    }
    
    .categoria-notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .categoria-notification-content i {
        font-size: 18px;
        color: #10b981;
    }
    
    .categoria-notification-error .categoria-notification-content i {
        color: #ef4444;
    }
    
    .categoria-notification-content span {
        font-weight: 500;
        color: #374151;
    }
    
    .categoria-loading-overlay.show {
        display: flex;
    }
`;
document.head.appendChild(style);
