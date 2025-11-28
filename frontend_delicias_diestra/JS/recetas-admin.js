/**
 * JavaScript para Gestión de Recetas
 * Este archivo contiene toda la funcionalidad JavaScript para el módulo de recetas
 * del panel de administración de la carnicería.
 */

document.addEventListener('DOMContentLoaded', function () {
    // URL base de la API
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
    
    // Elementos del DOM
    const modal = document.getElementById('recetas-modal');
    const btnCrear = document.getElementById('btn-crear-receta');
    const btnListar = document.getElementById('btn-listar-recetas');
    const btnCancelar = document.getElementById('cancel-recetas');
    const btnGuardar = document.getElementById('save-recetas');
    const btnEliminar = document.getElementById('eliminar-receta');
    const btnCerrar = document.getElementById('close-recetas-modal');

    // Secciones del formulario
    const actionsSection = document.querySelector('.recetas-actions-section');
    const crearSection = document.getElementById('recetas-crear-section');
    const listarSection = document.getElementById('recetas-listar-section');

    // Formularios
    const crearForm = document.getElementById('recetas-crear-form');

    // Loading overlay
    const loadingOverlay = document.getElementById('recetas-loading');

    // Contenedor de ingredientes
    const ingredientesContainer = document.getElementById('recetas-ingredientes-container');
    const btnAgregarIngrediente = document.getElementById('btn-agregar-ingrediente');
    
    // Elementos de listado
    const recetasTbody = document.getElementById('recetas-tbody');
    const searchRecetas = document.getElementById('search-recetas');
    const filterEstado = document.getElementById('filter-estado');
    const filterProducto = document.getElementById('filter-producto');

    let currentAction = '';
    let currentForm = null;
    let ingredienteCounter = 0;
    let allProductos = []; // Almacenar todos los productos del inventario
    let allRecetas = []; // Almacenar todas las recetas
    let filteredRecetas = []; // Recetas filtradas
    let recetaEditando = null; // ID de la receta que se está editando

    // Cargar categorías desde localStorage usando función global
    let categorias = getCategorias();

    // Cargar productos del inventario
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (response.ok) {
                const productosData = await response.json();
                allProductos = Array.isArray(productosData) ? productosData : (productosData.productos || productosData.data || []);
                console.log('✅ Productos cargados:', allProductos.length);
            } else {
                console.error('Error al cargar productos');
                allProductos = [];
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            allProductos = [];
        }
    }

    // Función para mostrar loading
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }

    // Función para mostrar sección
    function showSection(section, action = '') {
        // Ocultar todas las secciones
        if (actionsSection) actionsSection.style.display = 'none';
        if (crearSection) crearSection.style.display = 'none';
        if (listarSection) listarSection.style.display = 'none';

        // Mostrar la sección correspondiente
        if (section === 'crear') {
            if (crearSection) crearSection.style.display = 'block';
            currentForm = crearForm;
            btnGuardar.style.display = 'inline-flex';
            btnEliminar.style.display = 'none';
        } else if (section === 'listar') {
            if (listarSection) listarSection.style.display = 'block';
            btnGuardar.style.display = 'none';
            btnEliminar.style.display = 'none';
            currentForm = null;
            loadRecetas();
        } else if (section === 'actions' || section === '') {
            // Mostrar sección de acciones principales
            if (actionsSection) actionsSection.style.display = 'block';
            btnGuardar.style.display = 'none';
            btnEliminar.style.display = 'none';
            currentForm = null;
        }

        currentAction = action;
    }

    // Función para mostrar modal
    function showModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Función para ocultar modal
    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        // Volver a mostrar la sección de acciones principales
        showSection('actions', '');
        // Resetear modo edición
        recetaEditando = null;
        // Actualizar título del modal
        const modalTitle = document.getElementById('recetas-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Gestión de Recetas';
        }
    }

    // Función para agregar ingrediente a la receta
    function addIngredienteToRecipe() {
        ingredienteCounter++;
        const ingredienteHTML = `
            <div class="recetas-ingrediente-item" data-counter="${ingredienteCounter}">
                <div class="recetas-ingrediente-content">
                    <div class="recetas-form-row">
                        <div class="recetas-form-group">
                            <label class="recetas-form-label">Nombre del Ingrediente *</label>
                            <div class="recetas-autocomplete-container">
                                <input type="text" 
                                       class="recetas-form-input recetas-ingrediente-input" 
                                       name="nombre_ingrediente[]" 
                                       id="ingrediente-input-${ingredienteCounter}"
                                       data-counter="${ingredienteCounter}"
                                       required 
                                       placeholder="Ej: Sal, Pimienta, Carne... (escribe para buscar)">
                                <div class="recetas-autocomplete-dropdown" id="dropdown-ingrediente-${ingredienteCounter}" style="display: none;"></div>
                            </div>
                        </div>
                        <div class="recetas-form-group">
                            <label class="recetas-form-label">Cantidad *</label>
                            <input type="number" class="recetas-form-input" name="cantidad[]" step="0.01" min="0" required placeholder="0.00">
                        </div>
                        <div class="recetas-form-group">
                            <label class="recetas-form-label">Unidad de Medida *</label>
                            <select class="recetas-form-select ingrediente-unidad-select" name="unidad[]" required>
                                <option value="">Seleccionar unidad</option>
                                <option value="lb">Libra (lb)</option>
                                <option value="gr">Gramos (Gr)</option>
                                <option value="unidad">Unidad</option>
                            </select>
                            <small class="recetas-form-help">Cárnicos: lb | Especias: Gr | Embutidos: unidad</small>
                        </div>
                        <div class="recetas-form-group">
                            <label class="recetas-form-label">Orden</label>
                            <input type="number" class="recetas-form-input" name="orden[]" min="1" value="${ingredienteCounter}">
                        </div>
                    </div>
                </div>
                <div class="recetas-ingrediente-actions">
                    <button type="button" class="recetas-btn-icon recetas-btn-danger" onclick="removeIngrediente(${ingredienteCounter})" title="Eliminar ingrediente">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        ingredientesContainer.insertAdjacentHTML('beforeend', ingredienteHTML);
        
        // Inicializar autocomplete para el nuevo campo
        setTimeout(() => {
            inicializarAutocompleteIngrediente(ingredienteCounter);
        }, 100);
    }

    // Función para inicializar autocomplete de ingredientes
    function inicializarAutocompleteIngrediente(counter) {
        const input = document.getElementById(`ingrediente-input-${counter}`);
        const dropdown = document.getElementById(`dropdown-ingrediente-${counter}`);
        
        if (!input || !dropdown) return;

        input.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (searchTerm.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            // Filtrar productos
            const productosFiltrados = allProductos.filter(producto => {
                const nombre = (producto.nombre_producto || producto.nombre || '').toLowerCase();
                return nombre.includes(searchTerm);
            });

            if (productosFiltrados.length === 0) {
                dropdown.innerHTML = '<div class="recetas-autocomplete-empty">No se encontraron productos</div>';
                dropdown.style.display = 'block';
                return;
            }

            // Crear lista de sugerencias
            dropdown.innerHTML = productosFiltrados.slice(0, 10).map(producto => {
                const nombre = producto.nombre_producto || producto.nombre || 'Sin nombre';
                const unidad = producto.unidad_medida || producto.unidad || 'unidad';
                return `
                    <div class="recetas-autocomplete-item" data-nombre="${nombre}" data-unidad="${unidad}">
                        <span class="recetas-autocomplete-nombre">${nombre}</span>
                        <span class="recetas-autocomplete-unidad">${unidad}</span>
                    </div>
                `;
            }).join('');

            dropdown.style.display = 'block';

            // Agregar event listeners a los items
            dropdown.querySelectorAll('.recetas-autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    const nombre = this.getAttribute('data-nombre');
                    const unidad = this.getAttribute('data-unidad');
                    
                    input.value = nombre;
                    dropdown.style.display = 'none';
                    
                    // Auto-completar unidad si está vacía
                    const unidadSelect = input.closest('.recetas-ingrediente-item').querySelector('.ingrediente-unidad-select');
                    if (unidadSelect && !unidadSelect.value) {
                        // Mapear unidades comunes
                        const unidadLower = unidad.toLowerCase();
                        let unidadMapeada = 'lb'; // Por defecto libras
                        
                        if (unidadLower.includes('lb') || unidadLower.includes('libra')) {
                            unidadMapeada = 'lb';
                        } else if (unidadLower.includes('gr') || unidadLower.includes('gramo') || unidadLower.includes('g ')) {
                            unidadMapeada = 'gr';
                        } else if (unidadLower.includes('unidad')) {
                            unidadMapeada = 'unidad';
                        }
                        
                        unidadSelect.value = unidadMapeada;
                    }
                });
            });
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Validar si es "carne" y no es el primer ingrediente
        input.addEventListener('blur', function() {
            const valor = this.value.trim().toLowerCase();
            const esCarne = valor.includes('carne') || valor.includes('cárnico') || valor.includes('carnico');
            
            if (esCarne) {
                const todosLosIngredientes = document.querySelectorAll('.recetas-ingrediente-item');
                const indiceActual = Array.from(todosLosIngredientes).indexOf(input.closest('.recetas-ingrediente-item'));
                
                if (indiceActual > 0) {
                    mostrarNotificacionReceta('⚠️ La carne debe ser el primer ingrediente en la lista. Por favor, elimina este ingrediente y agrégalo primero.', 'warning');
                    // Opcional: resaltar el campo
                    input.style.borderColor = '#f59e0b';
                    setTimeout(() => {
                        input.style.borderColor = '';
                    }, 3000);
                }
            }
        });
    }

    // Función para mostrar notificaciones en recetas
    function mostrarNotificacionReceta(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `recetas-notification recetas-notification-${tipo}`;
        
        let iconClass = 'fa-info-circle';
        if (tipo === 'warning') {
            iconClass = 'fa-exclamation-triangle';
        } else if (tipo === 'error') {
            iconClass = 'fa-exclamation-circle';
        } else if (tipo === 'success') {
            iconClass = 'fa-check-circle';
        }
        
        notification.innerHTML = `
            <div class="recetas-notification-content">
                <i class="fas ${iconClass}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Función para eliminar ingrediente
    window.removeIngrediente = function (counter) {
        const ingredienteItem = document.querySelector(`[data-counter="${counter}"]`);
        if (ingredienteItem) {
            ingredienteItem.remove();
        }
    };


    // Event Listeners para botones de acción
    btnCrear.addEventListener('click', async function () {
        recetaEditando = null; // Resetear modo edición
        showModal();
        showSection('crear', 'crear');
        // Cargar productos si no están cargados
        if (allProductos.length === 0) {
            await cargarProductos();
        }
        // Limpiar formulario
        if (crearForm) {
            crearForm.reset();
        }
        // Limpiar ingredientes
        ingredientesContainer.innerHTML = '';
        ingredienteCounter = 0;
        // Agregar primer ingrediente
        addIngredienteToRecipe();
        // Actualizar título del modal
        const modalTitle = document.getElementById('recetas-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Crear Nueva Receta';
        }
    });

    btnListar.addEventListener('click', function () {
        showModal();
        showSection('listar', 'listar');
    });

    // Event listener para agregar ingrediente
    btnAgregarIngrediente.addEventListener('click', function () {
        addIngredienteToRecipe();
    });

    // Event listener para guardar
    btnGuardar.addEventListener('click', async function () {
        if (currentForm && currentForm.checkValidity()) {
            showLoading(true);

            const formData = new FormData(currentForm);
            
            // Preparar datos de la receta según la nueva estructura
            const recetaData = {
                nombre_receta: formData.get('nombre_receta') || formData.get('nombre'),
                descripcion: formData.get('descripcion') || null,
                rendimiento: parseFloat(formData.get('rendimiento')) || null,
                unidad: formData.get('unidad') || null,
                estado_receta: formData.get('estado_receta') || 'activa'
            };

            // Preparar ingredientes
            const nombresIngredientes = formData.getAll('nombre_ingrediente[]');
            const cantidades = formData.getAll('cantidad[]');
            const unidades = formData.getAll('unidad[]');
            
            // Constante de conversión: 1 libra = 453.592 gramos
            const GRAMOS_POR_LIBRA = 453.592;
            
            const ingredientes = [];
            for (let i = 0; i < nombresIngredientes.length; i++) {
                if (nombresIngredientes[i] && cantidades[i]) {
                    let cantidad = parseFloat(cantidades[i]);
                    let unidad = unidades[i] || 'lb';
                    let cantidadEnLibras = cantidad;
                    let unidadFinal = unidad;
                    
                    // Convertir gramos a libras si la unidad es 'gr'
                    if (unidad === 'gr' || unidad === 'gramos' || unidad === 'g') {
                        cantidadEnLibras = cantidad / GRAMOS_POR_LIBRA;
                        unidadFinal = 'lb'; // Convertir a libras para el backend
                        console.log(`✅ Convertido: ${cantidad} gr = ${cantidadEnLibras.toFixed(4)} lb`);
                    }
                    
                    ingredientes.push({
                        nombre_ingrediente: nombresIngredientes[i],
                        cantidad: cantidadEnLibras, // Cantidad en libras
                        unidad: unidadFinal, // Siempre 'lb' si era 'gr', o la unidad original
                        cantidad_original: cantidad, // Guardar cantidad original para referencia
                        unidad_original: unidad // Guardar unidad original para referencia
                    });
                }
            }

            try {
                let response;
                let url = `${API_BASE_URL}/recetas`;
                let method = 'POST';
                
                // Si estamos editando, usar PUT
                if (recetaEditando) {
                    url = `${API_BASE_URL}/recetas/${recetaEditando}`;
                    method = 'PUT';
                }
                
                // Guardar o actualizar receta
                response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...recetaData,
                        ingredientes: ingredientes
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || `Error al ${recetaEditando ? 'actualizar' : 'guardar'} receta`);
                }

                const resultado = await response.json();
                showLoading(false);
                mostrarNotificacionReceta(`Receta ${recetaEditando ? 'actualizada' : 'guardada'} exitosamente!`, 'success');
                console.log(`Receta ${recetaEditando ? 'actualizada' : 'guardada'}:`, resultado);
                
                // Limpiar formulario
                if (currentForm) {
                    currentForm.reset();
                }
                ingredientesContainer.innerHTML = '';
                ingredienteCounter = 0;
                recetaEditando = null; // Resetear modo edición
                
                // Recargar lista de recetas si está visible
                if (listarSection && listarSection.style.display === 'block') {
                    loadRecetas();
                }
                
                // Volver a mostrar la sección de acciones principales (sin ocultar el modal)
                showSection('actions', '');
                
                // Actualizar título del modal
                const modalTitle = document.getElementById('recetas-modal-title');
                if (modalTitle) {
                    modalTitle.textContent = 'Gestión de Recetas';
                }
            } catch (error) {
                showLoading(false);
                console.error(`Error al ${recetaEditando ? 'actualizar' : 'guardar'} receta:`, error);
                mostrarNotificacionReceta(`Error al ${recetaEditando ? 'actualizar' : 'guardar'} receta: ${error.message}`, 'error');
            }
        } else {
            alert('Por favor, completa todos los campos requeridos.');
        }
    });

    // Event listener para cancelar
    btnCancelar.addEventListener('click', function () {
        hideModal();
    });

    // Event listener para cerrar modal
    btnCerrar.addEventListener('click', function () {
        hideModal();
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            hideModal();
        }
    });

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            hideModal();
        }
    });

    // Función para cargar recetas desde la API
    async function loadRecetas() {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/recetas`);
            
            if (response.ok) {
                const recetasData = await response.json();
                allRecetas = Array.isArray(recetasData) ? recetasData : (recetasData.recetas || recetasData.data || []);
                console.log('✅ Recetas cargadas:', allRecetas.length);
                
                // Cargar ingredientes para cada receta
                for (let receta of allRecetas) {
                    try {
                        // Intentar obtener ingredientes de diferentes formas
                        if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
                            receta.ingredientes = receta.ingredientes;
                        } else {
                            // Intentar desde endpoint de ingredientes
                            const ingredientesResponse = await fetch(`${API_BASE_URL}/recetas/${receta.id_receta}/ingredientes`);
                            if (ingredientesResponse.ok) {
                                const ingredientesData = await ingredientesResponse.json();
                                receta.ingredientes = Array.isArray(ingredientesData) ? ingredientesData : 
                                                     (ingredientesData.ingredientes || ingredientesData.data || []);
                            } else {
                                // Intentar desde ingredientes-receta
                                const ingredientesRecetaResponse = await fetch(`${API_BASE_URL}/ingredientes-receta/receta/${receta.id_receta}`);
                                if (ingredientesRecetaResponse.ok) {
                                    const ingredientesData = await ingredientesRecetaResponse.json();
                                    receta.ingredientes = Array.isArray(ingredientesData) ? ingredientesData : 
                                                         (ingredientesData.ingredientes || ingredientesData.data || []);
                                } else {
                                    receta.ingredientes = [];
                                }
                            }
                        }
                    } catch (err) {
                        console.warn(`⚠️ Error al cargar ingredientes para receta ${receta.id_receta}:`, err);
                        receta.ingredientes = [];
                    }
                }
                
                filteredRecetas = [...allRecetas];
                renderizarRecetas(filteredRecetas);
            } else {
                throw new Error('Error al cargar recetas');
            }
        } catch (error) {
            console.error('❌ Error al cargar recetas:', error);
            mostrarNotificacionReceta('Error al cargar las recetas: ' + error.message, 'error');
            allRecetas = [];
            filteredRecetas = [];
            renderizarRecetas([]);
        } finally {
            showLoading(false);
        }
    }

    // Función para renderizar recetas en la tabla
    function renderizarRecetas(recetas) {
        if (!recetasTbody) return;
        
        if (recetas.length === 0) {
            recetasTbody.innerHTML = `
                <tr class="recetas-empty-state">
                    <td colspan="7">
                        <div class="recetas-empty-message">
                            <i class="fas fa-book-open"></i>
                            <p>No se encontraron recetas registradas</p>
                            <p class="recetas-empty-subtitle">Comienza creando una nueva receta</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        recetasTbody.innerHTML = recetas.map(receta => {
            const id = receta.id_receta || receta.id || 'N/A';
            const nombre = receta.nombre_receta || receta.nombre || 'Sin nombre';
            const estado = receta.estado_receta || receta.estado || 'activa';
            const fechaCreacion = receta.fecha_creacion ? new Date(receta.fecha_creacion).toLocaleDateString('es-ES') : 'N/A';
            const rendimiento = receta.rendimiento_esperado || receta.rendimiento || 'N/A';
            const unidad = receta.unidad || 'unidad';
            
            // Contar ingredientes - verificar múltiples formas
            let numIngredientes = 0;
            if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
                numIngredientes = receta.ingredientes.length;
            }
            
            console.log(`📋 Receta ${id} (${nombre}): ${numIngredientes} ingredientes`, receta.ingredientes);
            
            const ingredientesTexto = numIngredientes > 0 ? `${numIngredientes} ingrediente(s)` : 'Sin ingredientes';
            
            // Obtener nombre del producto final si existe
            let productoFinal = 'N/A';
            if (receta.id_producto_final) {
                const producto = allProductos.find(p => p.id_producto === receta.id_producto_final);
                productoFinal = producto ? (producto.nombre_producto || producto.nombre) : `ID: ${receta.id_producto_final}`;
            }

            return `
                <tr>
                    <td>${id}</td>
                    <td><strong>${nombre}</strong></td>
                    <td>${productoFinal}</td>
                    <td>${ingredientesTexto}</td>
                    <td>
                        <span class="recetas-estado-badge recetas-estado-${estado}">
                            ${estado === 'activa' ? 'Activa' : 'Inactiva'}
                        </span>
                    </td>
                    <td>${fechaCreacion}</td>
                    <td>
                        <div class="recetas-acciones">
                            <button class="recetas-btn-action recetas-btn-edit" onclick="editarReceta(${id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="recetas-btn-action recetas-btn-delete" onclick="eliminarReceta(${id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Función para filtrar recetas
    function filtrarRecetas() {
        const busqueda = searchRecetas ? searchRecetas.value.toLowerCase().trim() : '';
        const estadoFiltro = filterEstado ? filterEstado.value : '';
        
        filteredRecetas = allRecetas.filter(receta => {
            const nombre = (receta.nombre_receta || receta.nombre || '').toLowerCase();
            const estado = receta.estado_receta || receta.estado || '';
            
            const coincideBusqueda = !busqueda || nombre.includes(busqueda);
            const coincideEstado = !estadoFiltro || estado === estadoFiltro;
            
            return coincideBusqueda && coincideEstado;
        });
        
        renderizarRecetas(filteredRecetas);
    }

    // Event listeners para búsqueda y filtros
    if (searchRecetas) {
        searchRecetas.addEventListener('input', filtrarRecetas);
    }
    if (filterEstado) {
        filterEstado.addEventListener('change', filtrarRecetas);
    }
    if (filterProducto) {
        filterProducto.addEventListener('change', filtrarRecetas);
    }

    // Funciones globales para editar y eliminar
    window.editarReceta = async function(id) {
        try {
            showLoading(true);
            recetaEditando = id;
            
            // Cargar productos si no están cargados
            if (allProductos.length === 0) {
                await cargarProductos();
            }
            
            // Obtener datos de la receta desde la API
            const response = await fetch(`${API_BASE_URL}/recetas/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar la receta');
            }
            
            const receta = await response.json();
            console.log('Receta cargada para edición:', receta);
            
            // Mostrar modal y sección de crear (que usaremos para editar)
            showModal();
            showSection('crear', 'crear');
            
            // Actualizar título del modal
            const modalTitle = document.getElementById('recetas-modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Receta';
            }
            
            // Llenar campos del formulario
            const nombreInput = document.getElementById('receta-nombre');
            if (nombreInput) {
                nombreInput.value = receta.nombre_receta || '';
            }
            
            const descripcionTextarea = document.getElementById('receta-descripcion');
            if (descripcionTextarea) {
                descripcionTextarea.value = receta.descripcion || '';
            }
            
            const rendimientoInput = document.getElementById('receta-rendimiento');
            if (rendimientoInput) {
                rendimientoInput.value = receta.rendimiento || '';
            }
            
            const unidadSelect = document.getElementById('receta-unidad');
            if (unidadSelect) {
                unidadSelect.value = receta.unidad || '';
            }
            
            const estadoSelect = document.getElementById('receta-estado');
            if (estadoSelect) {
                estadoSelect.value = receta.estado_receta || 'activa';
            }
            
            // Limpiar contenedor de ingredientes
            ingredientesContainer.innerHTML = '';
            ingredienteCounter = 0;
            
            // Cargar ingredientes de la receta
            const ingredientes = receta.ingredientes || [];
            
            if (ingredientes.length > 0) {
                // Constante de conversión: 1 libra = 453.592 gramos
                const GRAMOS_POR_LIBRA = 453.592;
                
                ingredientes.forEach((ingrediente, index) => {
                    ingredienteCounter++;
                    
                    // Convertir libras a gramos si la unidad original era 'gr'
                    let cantidad = ingrediente.cantidad || 0;
                    let unidad = ingrediente.unidad || 'lb';
                    
                    // Si la unidad es 'lb' pero queremos mostrar en gramos si es pequeño
                    // Por ahora, mostramos la cantidad tal cual viene
                    // Si viene en libras y es un valor pequeño, podría ser que originalmente era gramos
                    // Pero por ahora mantenemos la lógica simple
                    
                    const ingredienteHTML = `
                        <div class="recetas-ingrediente-item" data-counter="${ingredienteCounter}">
                            <div class="recetas-ingrediente-content">
                                <div class="recetas-form-row">
                                    <div class="recetas-form-group">
                                        <label class="recetas-form-label">Nombre del Ingrediente *</label>
                                        <div class="recetas-autocomplete-container">
                                            <input type="text" 
                                                   class="recetas-form-input recetas-ingrediente-input" 
                                                   name="nombre_ingrediente[]" 
                                                   id="ingrediente-input-${ingredienteCounter}"
                                                   data-counter="${ingredienteCounter}"
                                                   required 
                                                   value="${ingrediente.nombre_ingrediente || ''}"
                                                   placeholder="Ej: Sal, Pimienta, Carne... (escribe para buscar)">
                                            <div class="recetas-autocomplete-dropdown" id="dropdown-ingrediente-${ingredienteCounter}" style="display: none;"></div>
                                        </div>
                                    </div>
                                    <div class="recetas-form-group">
                                        <label class="recetas-form-label">Cantidad *</label>
                                        <input type="number" class="recetas-form-input" name="cantidad[]" step="0.01" min="0" required value="${cantidad}" placeholder="0.00">
                                    </div>
                                    <div class="recetas-form-group">
                                        <label class="recetas-form-label">Unidad de Medida *</label>
                                        <select class="recetas-form-select ingrediente-unidad-select" name="unidad[]" required>
                                            <option value="">Seleccionar unidad</option>
                                            <option value="lb" ${unidad === 'lb' ? 'selected' : ''}>Libra (lb)</option>
                                            <option value="gr" ${unidad === 'gr' || unidad === 'g' || unidad === 'gramos' ? 'selected' : ''}>Gramos (Gr)</option>
                                            <option value="unidad" ${unidad === 'unidad' ? 'selected' : ''}>Unidad</option>
                                        </select>
                                        <small class="recetas-form-help">Cárnicos: lb | Especias: Gr | Embutidos: unidad</small>
                                    </div>
                                    <div class="recetas-form-group">
                                        <label class="recetas-form-label">Orden</label>
                                        <input type="number" class="recetas-form-input" name="orden[]" min="1" value="${ingredienteCounter}">
                                    </div>
                                </div>
                            </div>
                            <div class="recetas-ingrediente-actions">
                                <button type="button" class="recetas-btn-icon recetas-btn-danger" onclick="removeIngrediente(${ingredienteCounter})" title="Eliminar ingrediente">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    ingredientesContainer.insertAdjacentHTML('beforeend', ingredienteHTML);
                    
                    // Inicializar autocomplete para el nuevo campo
                    setTimeout(() => {
                        inicializarAutocompleteIngrediente(ingredienteCounter);
                    }, 100);
                });
            } else {
                // Si no hay ingredientes, agregar uno vacío
                addIngredienteToRecipe();
            }
            
            showLoading(false);
        } catch (error) {
            showLoading(false);
            console.error('Error al cargar receta para edición:', error);
            mostrarNotificacionReceta('Error al cargar la receta: ' + error.message, 'error');
            recetaEditando = null;
        }
    };

    window.eliminarReceta = function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
            eliminarRecetaAPI(id);
        }
    };

    // Función para eliminar receta desde la API
    async function eliminarRecetaAPI(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/recetas/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarNotificacionReceta('Receta eliminada correctamente', 'success');
                loadRecetas(); // Recargar lista
            } else {
                const error = await response.json();
                const errorMessage = error.error || 'Error al eliminar receta';
                
                // Mostrar mensaje de error más descriptivo
                if (errorMessage.includes('producción') || errorMessage.includes('utilizada')) {
                    mostrarNotificacionReceta(errorMessage, 'error');
                } else {
                    throw new Error(errorMessage);
                }
            }
        } catch (error) {
            console.error('Error al eliminar receta:', error);
            mostrarNotificacionReceta('Error al eliminar receta: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }


    // Cargar productos al iniciar
    cargarProductos();

    // Animación de entrada del modal
    setTimeout(() => {
        if (modal.classList.contains('show')) {
            modal.querySelector('.recetas-modal-content').style.transform = 'scale(1) translateY(0)';
        }
    }, 100);
});
