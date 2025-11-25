// produccion-admin.js - Gestión de producción en el panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnRegistrarProduccion = document.getElementById('btn-registrar-produccion');
    const btnHistorialProducciones = document.getElementById('btn-historial-producciones');
    const registroSection = document.getElementById('produccion-registro-section');
    const historialSection = document.getElementById('produccion-historial-section');
    const form = document.getElementById('produccion-registro-form');
    const saveBtn = document.getElementById('save-produccion');
    const cancelBtn = document.getElementById('cancel-produccion');
    const loadingOverlay = document.getElementById('produccion-loading');
    const recetaSelect = document.getElementById('produccion-receta');
    const unidadSelect = document.getElementById('produccion-unidad');
    const ingredientesContainer = document.getElementById('ingredientes-container');
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Variables
    let allRecetas = [];
    let allProducciones = [];
    let allProductos = [];
    let recetaSeleccionada = null;
    let cantidadAProducir = 0;
    let cantidadBaseReceta = 0; // Cantidad para la cual está diseñada la receta
    let ingredientesCalculados = [];
    let productosSeleccionados = []; // Para materia prima con selección múltiple
    let contadorProductosAdicionales = 0; // Contador para productos adicionales
    let produccionEditando = null; // ID de la producción que se está editando

    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================

    // Botón Registrar Producción
    if (btnRegistrarProduccion) {
        btnRegistrarProduccion.addEventListener('click', function() {
            produccionEditando = null; // Asegurar que no esté en modo edición
            showSection('registro');
            cargarRecetas();
            cargarProductos();
            limpiarFormulario();
            
            // Restaurar título del modal
            const modalTitle = document.getElementById('produccion-modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Gestión de Producción';
            }
        });
    }

    // Botón Historial Producciones
    if (btnHistorialProducciones) {
        btnHistorialProducciones.addEventListener('click', function() {
            showSection('historial');
            cargarProducciones();
        });
    }

    // Cambio de receta seleccionada
    if (recetaSelect) {
        recetaSelect.addEventListener('change', async function() {
            const recetaId = this.value;
            if (recetaId) {
                await cargarIngredientesReceta(recetaId);
            } else {
                ingredientesContainer.innerHTML = '<p class="produccion-info-text"><i class="fas fa-info-circle"></i> Selecciona una receta y cantidad para ver los ingredientes necesarios</p>';
            }
        });
    }

    // Cambio de cantidad a producir
    const cantidadInput = document.getElementById('produccion-cantidad');
    if (cantidadInput) {
        cantidadInput.addEventListener('input', function() {
            if (recetaSeleccionada && this.value) {
                cantidadAProducir = parseFloat(this.value) || 0;
                recalcularIngredientes();
            }
        });
    }

    // Botón Guardar
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            if (form.checkValidity()) {
                await guardarProduccion();
            } else {
                form.reportValidity();
            }
        });
    }

    // Botón Cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'panel-admin.html';
        });
    }

    // ========================================
    // FUNCIONES PRINCIPALES
    // ========================================

    // Mostrar sección
    function showSection(section) {
        if (registroSection) registroSection.style.display = 'none';
        if (historialSection) historialSection.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';

        if (section === 'registro') {
            if (registroSection) registroSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
        } else if (section === 'historial') {
            if (historialSection) historialSection.style.display = 'block';
        }
    }

    // Cargar recetas
    async function cargarRecetas() {
        try {
            const response = await fetch(`${API_BASE_URL}/recetas`);
            if (response.ok) {
                allRecetas = await response.json();
                if (recetaSelect) {
                    recetaSelect.innerHTML = '<option value="">Seleccionar receta</option>';
                    allRecetas.forEach(receta => {
                        if (receta.estado_receta === 'activa' || !receta.estado_receta) {
                            recetaSelect.innerHTML += `<option value="${receta.id_receta}">${receta.nombre_receta || receta.nombre || 'Sin nombre'}</option>`;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar recetas:', error);
        }
    }

    // Cargar productos disponibles
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (response.ok) {
                const data = await response.json();
                allProductos = Array.isArray(data) ? data : (data.productos || data.data || []);
                console.log('✅ Productos cargados:', allProductos.length);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    }

    // Limpiar formulario
    function limpiarFormulario() {
        productosSeleccionados = [];
        ingredientesCalculados = [];
        cantidadAProducir = 0;
        cantidadBaseReceta = 0;
        contadorProductosAdicionales = 0;
        if (ingredientesContainer) {
            ingredientesContainer.innerHTML = '<p class="produccion-info-text"><i class="fas fa-info-circle"></i> Selecciona una receta y cantidad para ver los ingredientes necesarios</p>';
        }
    }

    // Cargar ingredientes de una receta
    async function cargarIngredientesReceta(recetaId) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/recetas/${recetaId}`);
            if (response.ok) {
                recetaSeleccionada = await response.json();
                console.log('📋 Receta obtenida:', recetaSeleccionada);
                
                // Obtener cantidad base de la receta (rendimiento_esperado o cantidad por defecto)
                cantidadBaseReceta = parseFloat(recetaSeleccionada.rendimiento_esperado) || parseFloat(recetaSeleccionada.rendimiento) || 100;
                
                // Intentar obtener ingredientes de diferentes formas
                let ingredientes = [];
                
                // 1. Intentar desde la respuesta de la receta directamente
                if (recetaSeleccionada.ingredientes && Array.isArray(recetaSeleccionada.ingredientes)) {
                    ingredientes = recetaSeleccionada.ingredientes;
                    console.log('✅ Ingredientes obtenidos desde receta.ingredientes:', ingredientes.length);
                }
                // 2. Intentar desde endpoint específico de ingredientes
                else {
                    try {
                        const ingredientesResponse = await fetch(`${API_BASE_URL}/recetas/${recetaId}/ingredientes`);
                        if (ingredientesResponse.ok) {
                            const ingredientesData = await ingredientesResponse.json();
                            // Puede venir como array directo o como objeto con propiedad ingredientes
                            ingredientes = Array.isArray(ingredientesData) ? ingredientesData : 
                                         (ingredientesData.ingredientes || ingredientesData.data || []);
                            console.log('✅ Ingredientes obtenidos desde endpoint:', ingredientes.length);
                        } else {
                            console.warn('⚠️ Endpoint de ingredientes no disponible, intentando alternativa...');
                        }
                    } catch (err) {
                        console.warn('⚠️ Error al obtener ingredientes desde endpoint:', err);
                    }
                }
                
                // 3. Si aún no hay ingredientes, intentar desde tabla ingredientes_receta
                if (ingredientes.length === 0) {
                    try {
                        const ingredientesRecetaResponse = await fetch(`${API_BASE_URL}/ingredientes-receta/receta/${recetaId}`);
                        if (ingredientesRecetaResponse.ok) {
                            const ingredientesData = await ingredientesRecetaResponse.json();
                            ingredientes = Array.isArray(ingredientesData) ? ingredientesData : 
                                         (ingredientesData.ingredientes || ingredientesData.data || []);
                            console.log('✅ Ingredientes obtenidos desde ingredientes-receta:', ingredientes.length);
                        }
                    } catch (err) {
                        console.warn('⚠️ Error al obtener ingredientes desde ingredientes-receta:', err);
                    }
                }
                
                // Normalizar ingredientes para asegurar que tengan la estructura correcta
                ingredientes = ingredientes.map(ing => ({
                    id_ingrediente: ing.id_ingrediente || ing.id,
                    id_receta: ing.id_receta || recetaId,
                    id_producto: ing.id_producto,
                    nombre_ingrediente: ing.nombre_ingrediente || ing.nombre || ing.nombre_producto || '',
                    cantidad: parseFloat(ing.cantidad || ing.cantidad_necesaria || ing.cantidad_base || 0),
                    unidad: ing.unidad || ing.unidad_medida || ing.unidad_base || 'lb',
                    orden: ing.orden || 0
                }));
                
                console.log('📊 Ingredientes normalizados:', ingredientes);
                
                if (ingredientes.length === 0) {
                    console.warn('⚠️ No se encontraron ingredientes para esta receta');
                    mostrarNotificacion('Esta receta no tiene ingredientes registrados', 'warning');
                }
                
                ingredientesCalculados = ingredientes;
                productosSeleccionados = []; // Resetear selecciones
                
                // Si hay cantidad a producir, recalcular
                const cantidadInput = document.getElementById('produccion-cantidad');
                if (cantidadInput && cantidadInput.value) {
                    cantidadAProducir = parseFloat(cantidadInput.value) || 0;
                    recalcularIngredientes();
                } else {
                    mostrarIngredientes(ingredientes, cantidadBaseReceta);
                }
            } else {
                throw new Error('No se pudo cargar la receta');
            }
        } catch (error) {
            console.error('❌ Error al cargar ingredientes:', error);
            mostrarNotificacion('Error al cargar ingredientes de la receta: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Recalcular ingredientes según cantidad a producir
    function recalcularIngredientes() {
        if (!recetaSeleccionada || !ingredientesCalculados.length || cantidadAProducir <= 0) {
            return;
        }
        
        mostrarIngredientes(ingredientesCalculados, cantidadBaseReceta, cantidadAProducir);
    }

    // Descontar ingredientes del inventario después de una producción
    async function descontarIngredientesDelInventario(ingredientesUsados) {
        try {
            // Obtener inventarios actuales para cada ingrediente
            for (const ingrediente of ingredientesUsados) {
                // Buscar el inventario más reciente para este ingrediente
                // Nota: Aquí necesitarías obtener el id_producto del ingrediente
                // Por ahora, asumimos que el backend manejará esto
                // Esta función se puede mejorar consultando productos por nombre
                console.log(`Descontando ${ingrediente.cantidad_usada} ${ingrediente.unidad} del inventario`);
            }
            
            // El backend debería manejar el descuento automáticamente
            // cuando se registra la producción con detalle_produccion
            console.log('✅ Descuento de inventario procesado');
        } catch (error) {
            console.error('Error al descontar ingredientes:', error);
        }
    }

    // Mostrar ingredientes en tabla
    function mostrarIngredientes(ingredientes, cantidadBase = 100, cantidadProducir = 0) {
        if (!ingredientesContainer) return;
        
        if (!ingredientes || ingredientes.length === 0) {
            ingredientesContainer.innerHTML = '<p class="produccion-info-text">Esta receta no tiene ingredientes registrados</p>';
            return;
        }

        // Calcular factor de proporción
        const factor = cantidadProducir > 0 && cantidadBase > 0 ? cantidadProducir / cantidadBase : 1;
        
        let html = `
            <div class="produccion-ingredientes-table-container">
                <table class="produccion-ingredientes-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ingredientes.forEach((ingrediente, index) => {
            const cantidadCalculada = parseFloat(ingrediente.cantidad_necesaria || ingrediente.cantidad || 0) * factor;
            const unidadOriginal = ingrediente.unidad_medida || ingrediente.unidad || 'lb';
            const unidad = normalizarUnidad(unidadOriginal); // Normalizar unidad (gr, lb, kg, unidad)
            const cantidadFormateada = formatearNumeroConSeparadores(cantidadCalculada);
            const nombreIngrediente = ingrediente.nombre_producto || ingrediente.nombre_ingrediente || `Ingrediente ${index + 1}`;
            const idIngrediente = ingrediente.id_ingrediente || ingrediente.id_producto || index;
            const esMateriaPrima = index === 0; // El primer ingrediente es la materia prima

            if (esMateriaPrima) {
                // Materia prima con selector de producto
            html += `
                    <tr class="produccion-ingrediente-row produccion-materia-prima-row" data-ingrediente-id="${idIngrediente}" data-cantidad-necesaria="${cantidadCalculada}" data-unidad="${unidad}">
                        <td>
                            <div class="produccion-producto-selector-container">
                                <div class="produccion-buscar-producto">
                                    <input type="text" 
                                           class="produccion-buscar-input" 
                                           id="buscar-producto-${index}"
                                           placeholder="Buscar producto (ej: CAD, BO, PE...)"
                                           autocomplete="off">
                                    <div class="produccion-productos-dropdown" id="dropdown-productos-${index}" style="display: none;"></div>
                    </div>
                                <div class="produccion-producto-seleccionado" id="producto-seleccionado-${index}">
                                    <span class="produccion-placeholder">Selecciona un producto</span>
                    </div>
                </div>
                        </td>
                        <td>
                            <div class="produccion-cantidad-container" id="cantidad-container-${index}">
                                <span class="produccion-cantidad-necesaria">${cantidadFormateada}</span>
                            </div>
                        </td>
                        <td>
                            <span class="produccion-badge-unidad">${unidad}</span>
                        </td>
                    </tr>
                `;
            } else {
                // Otros ingredientes (solo lectura)
                html += `
                    <tr class="produccion-ingrediente-row" data-ingrediente-id="${idIngrediente}" data-cantidad-necesaria="${cantidadCalculada}" data-unidad="${unidad}">
                        <td><strong>${nombreIngrediente}</strong></td>
                        <td>${cantidadFormateada}</td>
                        <td><span class="produccion-badge-unidad">${unidad}</span></td>
                    </tr>
                `;
            }
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        ingredientesContainer.innerHTML = html;

        // Inicializar búsqueda de productos para materia prima
        if (ingredientes.length > 0) {
            const primerIngrediente = ingredientes[0];
            const cantidadPrimerIngrediente = parseFloat(primerIngrediente.cantidad_necesaria || primerIngrediente.cantidad || 0) * factor;
            const unidadOriginal = primerIngrediente.unidad_medida || primerIngrediente.unidad || 'lb';
            const unidadPrimerIngrediente = normalizarUnidad(unidadOriginal);
            inicializarBusquedaProducto(0, cantidadPrimerIngrediente, unidadPrimerIngrediente);
        }
    }

    // Inicializar búsqueda de productos
    function inicializarBusquedaProducto(index, cantidadNecesaria, unidad) {
        const buscarInput = document.getElementById(`buscar-producto-${index}`);
        const dropdown = document.getElementById(`dropdown-productos-${index}`);
        const productoSeleccionado = document.getElementById(`producto-seleccionado-${index}`);
        const cantidadContainer = document.getElementById(`cantidad-container-${index}`);

        if (!buscarInput || !dropdown) return;

        // Evento de búsqueda
        buscarInput.addEventListener('input', function() {
            const termino = this.value.trim().toUpperCase();
            if (termino.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            // Filtrar productos
            const productosFiltrados = allProductos.filter(producto => {
                const nombre = (producto.nombre_producto || producto.nombre || '').toUpperCase();
                return nombre.includes(termino) && producto.estado !== 'inactivo';
            });

            if (productosFiltrados.length === 0) {
                dropdown.innerHTML = '<div class="produccion-dropdown-item produccion-dropdown-empty">No se encontraron productos</div>';
                dropdown.style.display = 'block';
                return;
            }

            // Mostrar productos filtrados
            dropdown.innerHTML = productosFiltrados.map(producto => {
                const stock = parseFloat(producto.stock_actual || producto.inventario_inicial || 0);
                const nombre = producto.nombre_producto || producto.nombre;
                const unidadProductoOriginal = producto.unidad_medida || 'unidad';
                const unidadProducto = normalizarUnidad(unidadProductoOriginal);
                const stockFormateado = formatearNumeroConSeparadores(stock);
                return `
                    <div class="produccion-dropdown-item" 
                         data-producto-id="${producto.id_producto}"
                         data-producto-nombre="${nombre}"
                         data-producto-stock="${stock}"
                         data-producto-unidad="${unidadProducto}">
                        <strong>${nombre}</strong>
                        <span class="produccion-stock-info">Stock: ${stockFormateado} ${unidadProducto}</span>
                    </div>
                `;
            }).join('');

            dropdown.style.display = 'block';

            // Eventos de clic en items
            dropdown.querySelectorAll('.produccion-dropdown-item').forEach(item => {
                item.addEventListener('click', function() {
                    const productoId = this.dataset.productoId;
                    const productoNombre = this.dataset.productoNombre;
                    const productoStock = parseFloat(this.dataset.productoStock);
                    const productoUnidad = this.dataset.productoUnidad;

                    seleccionarProductoMateriaPrima(index, productoId, productoNombre, productoStock, productoUnidad, cantidadNecesaria, unidad);
                    dropdown.style.display = 'none';
                    buscarInput.value = '';
                });
            });
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!buscarInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Seleccionar producto para materia prima
    function seleccionarProductoMateriaPrima(index, productoId, productoNombre, productoStock, productoUnidad, cantidadNecesaria, unidadNecesaria) {
        // Verificar si ya existe una selección para este índice
        const seleccionExistente = productosSeleccionados.find(p => p.index === index && p.productoId === productoId);
        if (seleccionExistente) {
            mostrarNotificacion('Este producto ya está seleccionado', 'error');
            return;
        }

        // Agregar o actualizar selección
        const seleccionIndex = productosSeleccionados.findIndex(p => p.index === index);
        if (seleccionIndex >= 0) {
            productosSeleccionados[seleccionIndex] = {
                index: index,
                productoId: productoId,
                productoNombre: productoNombre,
                stockDisponible: productoStock,
                unidad: productoUnidad,
                cantidadNecesaria: cantidadNecesaria,
                unidadNecesaria: unidadNecesaria
            };
        } else {
            productosSeleccionados.push({
                index: index,
                productoId: productoId,
                productoNombre: productoNombre,
                stockDisponible: productoStock,
                unidad: productoUnidad,
                cantidadNecesaria: cantidadNecesaria,
                unidadNecesaria: unidadNecesaria
            });
        }

        // Validar stock
        validarYMostrarStock(index, productoId, productoNombre, productoStock, cantidadNecesaria, unidadNecesaria);
    }

    // Validar stock y mostrar interfaz
    function validarYMostrarStock(index, productoId, productoNombre, productoStock, cantidadNecesaria, unidad) {
        const productoSeleccionado = document.getElementById(`producto-seleccionado-${index}`);
        const cantidadContainer = document.getElementById(`cantidad-container-${index}`);

        if (!productoSeleccionado || !cantidadContainer) return;

        // Mostrar producto seleccionado
        const indexParam = typeof index === 'string' ? `'${index}'` : index;
        const unidadNormalizada = normalizarUnidad(unidad);
        const stockFormateado = formatearNumeroConSeparadores(productoStock);
        productoSeleccionado.innerHTML = `
            <div class="produccion-producto-info">
                <strong>${productoNombre}</strong>
                <span class="produccion-stock-disponible">Stock: ${stockFormateado} ${unidadNormalizada}</span>
            </div>
            <button type="button" class="produccion-btn-eliminar-producto" onclick="eliminarProductoSeleccionado(${indexParam})">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Calcular cantidad total ya usada de productos adicionales para este índice base
        const esProductoAdicional = typeof index === 'string' && index.startsWith('adicional-');
        let cantidadTotalUsada = 0;
        
        if (!esProductoAdicional) {
            // Si es el producto principal, calcular total de productos adicionales relacionados
            const productosAdicionales = productosSeleccionados.filter(p => 
                typeof p.index === 'string' && p.index.startsWith('adicional-')
            );
            cantidadTotalUsada = productosAdicionales.reduce((sum, p) => {
                const input = document.querySelector(`#cantidad-container-${p.index} input.produccion-cantidad-input[data-producto-id="${p.productoId}"]`);
                return sum + (input ? parseFloat(input.value) || 0 : 0);
            }, 0);
        }

        const cantidadDisponible = Math.min(productoStock, cantidadNecesaria);
        const cantidadARestar = cantidadNecesaria - cantidadTotalUsada;
        const faltante = cantidadARestar - cantidadDisponible;
        
        // Formatear valores para el input
        const cantidadNecesariaFormateada = formatearNumeroParaInput(cantidadNecesaria);
        const cantidadDisponibleFormateada = formatearNumeroParaInput(cantidadDisponible);

        if (productoStock >= cantidadARestar && cantidadTotalUsada === 0) {
            // Stock suficiente y no hay productos adicionales
            cantidadContainer.innerHTML = `
                <input type="number" 
                       class="produccion-cantidad-input" 
                       value="${cantidadNecesariaFormateada}" 
                       min="0" 
                       max="${productoStock}"
                       step="0.001"
                       data-producto-id="${productoId}"
                       data-index="${index}"
                       onchange="actualizarCantidadProducto(${indexParam}, ${productoId})">
                <span class="produccion-cantidad-status produccion-cantidad-ok">
                    <i class="fas fa-check-circle"></i> Suficiente
                </span>
            `;
        } else if (faltante > 0) {
            // Stock insuficiente o hay productos adicionales
            cantidadContainer.innerHTML = `
                <input type="number" 
                       class="produccion-cantidad-input" 
                       value="${cantidadDisponibleFormateada}" 
                       min="0" 
                       max="${productoStock}"
                       step="0.001"
                       data-producto-id="${productoId}"
                       data-index="${index}"
                       onchange="actualizarCantidadProducto(${indexParam}, ${productoId}); actualizarFaltante(${indexParam}, '${unidad}')">
                <span class="produccion-cantidad-status produccion-cantidad-warning">
                    <i class="fas fa-exclamation-triangle"></i> Faltan ${formatearNumeroConSeparadores(faltante)} ${normalizarUnidad(unidad)}
                </span>
                <button type="button" class="produccion-btn-agregar-producto" onclick="agregarProductoAdicional(${indexParam}, ${faltante}, '${unidad}')">
                    <i class="fas fa-plus"></i> Agregar otro producto
                </button>
            `;
        } else {
            // Stock suficiente considerando productos adicionales
            cantidadContainer.innerHTML = `
                <input type="number" 
                       class="produccion-cantidad-input" 
                       value="${cantidadDisponibleFormateada}" 
                       min="0" 
                       max="${productoStock}"
                       step="0.001"
                       data-producto-id="${productoId}"
                       data-index="${index}"
                       onchange="actualizarCantidadProducto(${indexParam}, ${productoId}); actualizarFaltante(${indexParam}, '${unidad}')">
                <span class="produccion-cantidad-status produccion-cantidad-ok">
                    <i class="fas fa-check-circle"></i> Completo
                </span>
            `;
        }
    }

    // Actualizar faltante cuando cambia la cantidad
    window.actualizarFaltante = function(index, unidad) {
        // Recalcular faltante basado en la cantidad total usada
        const row = document.querySelector(`tr[data-ingrediente-id], tr[data-index-adicional="${index}"]`);
        if (!row) return;
        
        const cantidadNecesaria = parseFloat(row.dataset.cantidadNecesaria || 0);
        const inputs = document.querySelectorAll(`input[data-index="${index}"], input[data-index^="adicional-"]`);
        let totalUsado = 0;
        
        inputs.forEach(input => {
            if (input.value) {
                totalUsado += parseFloat(input.value) || 0;
            }
        });
        
        const faltante = Math.max(0, cantidadNecesaria - totalUsado);
        
        // Actualizar mensaje de faltante en todos los contenedores relacionados
        const contenedores = document.querySelectorAll(`#cantidad-container-${index}, [id^="cantidad-container-adicional-"]`);
        contenedores.forEach(container => {
            const warningSpan = container.querySelector('.produccion-cantidad-warning');
            if (warningSpan && faltante > 0) {
                const unidadNormalizada = normalizarUnidad(unidad);
                const faltanteFormateado = formatearNumeroConSeparadores(faltante);
                warningSpan.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Faltan ${faltanteFormateado} ${unidadNormalizada}`;
            } else if (warningSpan && faltante <= 0) {
                warningSpan.innerHTML = `<i class="fas fa-check-circle"></i> Completo`;
                warningSpan.className = 'produccion-cantidad-status produccion-cantidad-ok';
            }
        });
    };

    // Funciones globales para los botones
    window.eliminarProductoSeleccionado = function(index) {
        productosSeleccionados = productosSeleccionados.filter(p => p.index != index);
        const productoSeleccionado = document.getElementById(`producto-seleccionado-${index}`);
        const cantidadContainer = document.getElementById(`cantidad-container-${index}`);
        
        if (productoSeleccionado) {
            productoSeleccionado.innerHTML = '<span class="produccion-placeholder">Selecciona un producto</span>';
        }
        if (cantidadContainer) {
            const row = cantidadContainer.closest('tr');
            if (row) {
                const cantidadNecesaria = parseFloat(row.dataset.cantidadNecesaria || 0);
                if (typeof index === 'string' && index.startsWith('adicional-')) {
                    // Si es una fila adicional, eliminarla completamente
                    row.remove();
                } else {
                    const cantidadFormateada = formatearNumeroConSeparadores(cantidadNecesaria);
                    cantidadContainer.innerHTML = `<span class="produccion-cantidad-necesaria">${cantidadFormateada}</span>`;
                }
            }
        }
    };

    window.actualizarCantidadProducto = function(index, productoId) {
        // Buscar input por índice (puede ser numérico o string)
        const input = document.querySelector(`input[data-index="${index}"][data-producto-id="${productoId}"]`) ||
                      document.querySelector(`#cantidad-container-${index} input.produccion-cantidad-input[data-producto-id="${productoId}"]`);
        if (!input) return;
        
        const cantidad = parseFloat(input.value) || 0;
        const seleccion = productosSeleccionados.find(p => p.index == index && p.productoId == productoId);
        if (seleccion) {
            seleccion.cantidadUsada = cantidad;
        }
    };

    window.agregarProductoAdicional = function(index, cantidadFaltante, unidad) {
        // Crear nueva fila para producto adicional
        const tbody = document.querySelector('.produccion-ingredientes-table tbody');
        if (!tbody) return;

        contadorProductosAdicionales++;
        const nuevoIndex = `adicional-${contadorProductosAdicionales}`;
        const cantidadNecesaria = cantidadFaltante;

        const nuevaFila = document.createElement('tr');
        nuevaFila.className = 'produccion-ingrediente-row produccion-producto-adicional';
        nuevaFila.setAttribute('data-index-adicional', nuevoIndex);
        nuevaFila.setAttribute('data-cantidad-necesaria', cantidadNecesaria);
        nuevaFila.setAttribute('data-unidad', unidad);
        nuevaFila.innerHTML = `
            <td>
                <div class="produccion-producto-selector-container">
                    <div class="produccion-buscar-producto">
                        <input type="text" 
                               class="produccion-buscar-input" 
                               id="buscar-producto-${nuevoIndex}"
                               placeholder="Buscar producto adicional (ej: CAD, BO, PE...)"
                               autocomplete="off">
                        <div class="produccion-productos-dropdown" id="dropdown-productos-${nuevoIndex}" style="display: none;"></div>
                    </div>
                    <div class="produccion-producto-seleccionado" id="producto-seleccionado-${nuevoIndex}">
                        <span class="produccion-placeholder">Selecciona otro producto</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="produccion-cantidad-container" id="cantidad-container-${nuevoIndex}">
                    <span class="produccion-cantidad-faltante">Faltan: ${formatearNumeroConSeparadores(cantidadFaltante)} ${normalizarUnidad(unidad)}</span>
                </div>
            </td>
            <td>
                <span class="produccion-badge-unidad">${normalizarUnidad(unidad)}</span>
                <button type="button" class="produccion-btn-eliminar-fila" onclick="eliminarFilaAdicional('${nuevoIndex}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(nuevaFila);
        
        // Inicializar búsqueda para esta nueva fila
        setTimeout(() => {
            inicializarBusquedaProducto(nuevoIndex, cantidadNecesaria, unidad);
        }, 100);
    };

    // Eliminar fila adicional
    window.eliminarFilaAdicional = function(index) {
        const fila = document.querySelector(`tr[data-index-adicional="${index}"]`);
        if (fila) {
            // Remover de productosSeleccionados
            productosSeleccionados = productosSeleccionados.filter(p => p.index !== index);
            fila.remove();
        }
    };

    // Guardar producción
    async function guardarProduccion() {
        try {
            showLoading(true);
            const formData = new FormData(form);
            
            // Validar que se haya seleccionado un producto para la materia prima
            if (productosSeleccionados.length === 0) {
                mostrarNotificacion('Debes seleccionar un producto para la materia prima', 'error');
                showLoading(false);
                return;
            }

            // Recolectar ingredientes usados
            const ingredientesUsados = [];
            
            // 1. Productos seleccionados para materia prima (pueden ser múltiples)
            productosSeleccionados.forEach(seleccion => {
                // Buscar input por índice (puede ser numérico o "adicional-X")
                const input = document.querySelector(`input[data-index="${seleccion.index}"][data-producto-id="${seleccion.productoId}"]`) ||
                              document.querySelector(`#cantidad-container-${seleccion.index} input.produccion-cantidad-input[data-producto-id="${seleccion.productoId}"]`);
                
                const cantidadUsada = input ? parseFloat(input.value) || 0 : (seleccion.cantidadUsada || seleccion.cantidadNecesaria || 0);
                
                if (cantidadUsada > 0) {
                    ingredientesUsados.push({
                        id_producto: seleccion.productoId,
                        nombre_producto: seleccion.productoNombre,
                        cantidad_usada: cantidadUsada,
                        unidad: seleccion.unidadNecesaria || seleccion.unidad
                    });
                }
            });

            // 2. Otros ingredientes (no materia prima)
            if (ingredientesCalculados.length > 1) {
                for (let i = 1; i < ingredientesCalculados.length; i++) {
                    const ingrediente = ingredientesCalculados[i];
                    const factor = cantidadAProducir > 0 && cantidadBaseReceta > 0 ? cantidadAProducir / cantidadBaseReceta : 1;
                    const cantidadNecesaria = parseFloat(ingrediente.cantidad_necesaria || ingrediente.cantidad || 0) * factor;
                    const unidad = ingrediente.unidad_medida || ingrediente.unidad || 'lb';
                    
                    // Buscar el producto por nombre o id
                    const producto = allProductos.find(p => 
                        p.id_producto === ingrediente.id_producto || 
                        (p.nombre_producto || p.nombre) === (ingrediente.nombre_producto || ingrediente.nombre_ingrediente)
                    );

                    if (producto && cantidadNecesaria > 0) {
                        ingredientesUsados.push({
                            id_producto: producto.id_producto,
                            nombre_producto: producto.nombre_producto || producto.nombre,
                            cantidad_usada: cantidadNecesaria,
                            unidad: unidad
                        });
                    }
                }
            }

            // Validar que haya ingredientes
            if (ingredientesUsados.length === 0) {
                mostrarNotificacion('Debes tener al menos un ingrediente para la producción', 'error');
                showLoading(false);
                return;
            }

            const datos = {
                id_receta: parseInt(formData.get('id_receta')),
                cantidad_producida: parseFloat(formData.get('cantidad_producida')),
                unidad: formData.get('unidad'),
                ingredientes_usados: ingredientesUsados
            };

            // Validar unidad
            if (datos.unidad && !['lb', 'unidad'].includes(datos.unidad)) {
                mostrarNotificacion('La unidad debe ser "lb" para cárnicos o "unidad" para embutidos', 'error');
                showLoading(false);
                return;
            }

            console.log('📦 Datos de producción a enviar:', datos);

            // Determinar si es edición o creación
            const isEdit = produccionEditando !== null;
            const url = isEdit ? `${API_BASE_URL}/producciones/${produccionEditando}` : `${API_BASE_URL}/producciones`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Error al ${isEdit ? 'actualizar' : 'guardar'} producción`);
            }

            const resultado = await response.json();
            console.log(`✅ Producción ${isEdit ? 'actualizada' : 'registrada'}:`, resultado);
            
            mostrarNotificacion(`Producción ${isEdit ? 'actualizada' : 'registrada'} exitosamente`, 'success');

            // Limpiar formulario y variables
            form.reset();
            limpiarFormulario();
            produccionEditando = null;
            
            // Restaurar título del modal
            const modalTitle = document.getElementById('produccion-modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Gestión de Producción';
            }
            
            // Volver al historial
            showSection('historial');
            cargarProducciones();
            
            // Disparar evento para actualizar inventario
            const idProduccion = isEdit ? produccionEditando : (resultado.id_produccion || resultado.id);
            window.dispatchEvent(new CustomEvent('produccionGuardada', {
                detail: { id_produccion: idProduccion }
            }));

            showLoading(false);
        } catch (error) {
            console.error('Error al guardar producción:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Cargar producciones
    async function cargarProducciones() {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/producciones`);
            if (response.ok) {
                allProducciones = await response.json();
                renderizarProducciones(allProducciones);
            }
        } catch (error) {
            console.error('Error al cargar producciones:', error);
            mostrarNotificacion('Error al cargar producciones', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Función auxiliar para formatear números sin decimales innecesarios
    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') {
            return '0';
        }
        const num = parseFloat(numero);
        if (isNaN(num)) {
            return '0';
        }
        // Si es un número entero, devolver sin decimales
        if (num % 1 === 0) {
            return num.toString();
        }
        
        const numStr = num.toString();
        // Eliminar ceros innecesarios al final y el punto si no quedan decimales
        return numStr.replace(/\.?0+$/, '');
    }
    
    // Formatear número con separadores de miles (formato colombiano)
    function formatearNumeroConSeparadores(numero) {
        if (numero === null || numero === undefined || numero === '') {
            return '0';
        }
        const num = parseFloat(numero);
        if (isNaN(num)) {
            return '0';
        }
        
        // Formatear con separadores de miles usando formato colombiano
        return num.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        });
    }
    
    // Normalizar unidad de medida (gr -> gr, gramos -> gr, etc.)
    function normalizarUnidad(unidad) {
        if (!unidad) return 'lb';
        const unidadLower = unidad.toLowerCase().trim();
        if (unidadLower === 'gr' || unidadLower === 'gramos' || unidadLower === 'gramo' || unidadLower === 'g') {
            return 'gr';
        }
        if (unidadLower === 'lb' || unidadLower === 'libras' || unidadLower === 'libra') {
            return 'lb';
        }
        if (unidadLower === 'kg' || unidadLower === 'kilogramos' || unidadLower === 'kilogramo') {
            return 'kg';
        }
        if (unidadLower === 'unidad' || unidadLower === 'unidades' || unidadLower === 'ud') {
            return 'unidad';
        }
        return unidad;
    }
    
    // Formatear número para input (máximo 3 decimales, sin ceros innecesarios)
    function formatearNumeroParaInput(numero) {
        if (numero === null || numero === undefined || isNaN(numero)) {
            return '0';
        }
        const num = parseFloat(numero);
        if (isNaN(num)) {
            return '0';
        }
        
        // Si es un número entero, devolver sin decimales
        if (num % 1 === 0) {
            return num.toString();
        }
        
        // Redondear a máximo 3 decimales y eliminar ceros finales
        const redondeado = Math.round(num * 1000) / 1000;
        return redondeado.toString().replace(/\.?0+$/, '');
    }

    // Renderizar producciones
    function renderizarProducciones(producciones) {
        const tbody = document.getElementById('produccion-tbody');
        if (!tbody) return;

        if (!producciones || producciones.length === 0) {
            tbody.innerHTML = `
                <tr class="produccion-empty-state">
                    <td colspan="7">
                        <div class="produccion-empty-message">
                            <i class="fas fa-inbox"></i>
                            <p>No se encontraron producciones registradas</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = producciones.map(produccion => {
            // Formatear fecha: usar fecha_produccion o fecha actual si no hay fecha válida
            let fecha = 'N/A';
            const fechaProduccion = produccion.fecha_produccion;
            if (fechaProduccion) {
                try {
                    const fechaObj = new Date(fechaProduccion);
                    // Verificar que la fecha sea válida (no sea 1970 o anterior)
                    if (!isNaN(fechaObj.getTime()) && fechaObj.getFullYear() > 1970) {
                        fecha = fechaObj.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    } else {
                        // Si la fecha es inválida, usar la fecha actual
                        fecha = new Date().toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    }
                } catch (e) {
                    // Si hay error al parsear, usar fecha actual
                    fecha = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                }
            } else {
                // Si no hay fecha, usar la fecha actual
                fecha = new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            }
            const cantidadFormateada = formatearNumero(produccion.cantidad_producida);
            
            // Formatear rendimiento como porcentaje (0-100%)
            const rendimiento = parseFloat(produccion.rendimiento || 1.0);
            const rendimientoPorcentaje = (rendimiento * 100).toFixed(0); // Convertir a porcentaje y redondear
            const rendimientoFormateado = `${rendimientoPorcentaje}%`;
            
            // Obtener nombre de la receta (el backend devuelve nombre_receta directamente)
            const nombreReceta = produccion.nombre_receta || produccion.receta?.nombre || produccion.receta?.nombre_receta || 'Sin receta';
            
            return `
                <tr>
                    <td>${produccion.id_produccion}</td>
                    <td>${fecha}</td>
                    <td>${nombreReceta}</td>
                    <td>${cantidadFormateada}</td>
                    <td>${produccion.unidad}</td>
                    <td>${rendimientoFormateado}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button class="produccion-btn produccion-btn-sm produccion-btn-info" onclick="verDetalleProduccion(${produccion.id_produccion})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                        </button>
                            <button class="produccion-btn produccion-btn-sm produccion-btn-warning" onclick="editarProduccion(${produccion.id_produccion})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="produccion-btn produccion-btn-sm produccion-btn-danger" onclick="eliminarProduccion(${produccion.id_produccion})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
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
        notification.className = `produccion-notification produccion-notification-${tipo}`;
        notification.innerHTML = `
            <div class="produccion-notification-content">
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

    // Ver detalle de producción
    window.verDetalleProduccion = async function(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/producciones/${id}`);
            if (response.ok) {
                const produccion = await response.json();
                let detalleTexto = produccion.ingredientes_usados?.map(i => 
                    `${i.nombre_producto || i.nombre_ingrediente || 'Ingrediente'}: ${i.cantidad_usada || i.cantidad} ${i.unidad || 'lb'}`
                ).join('\n') || 'No hay detalles';
                alert(`Detalle de Producción #${id}\n\n${detalleTexto}`);
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            mostrarNotificacion('Error al cargar detalles de la producción', 'error');
        }
    };

    // Función para editar producción
    window.editarProduccion = async function(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/producciones/${id}`);
            if (!response.ok) {
                throw new Error('Error al cargar la producción');
            }
            
            const produccion = await response.json();
            produccionEditando = id;
            
            // Cambiar a la sección de registro
            showSection('registro');
            
            // Cargar recetas y productos si no están cargados
            if (allRecetas.length === 0) {
                await cargarRecetas();
            }
            if (allProductos.length === 0) {
                await cargarProductos();
            }
            
            // Llenar el formulario con los datos de la producción
            if (recetaSelect) {
                recetaSelect.value = produccion.id_receta || '';
                if (produccion.id_receta) {
                    await cargarIngredientesReceta(produccion.id_receta);
                }
            }
            
            const cantidadInput = document.getElementById('produccion-cantidad');
            if (cantidadInput) {
                cantidadInput.value = produccion.cantidad_producida || '';
                cantidadAProducir = parseFloat(produccion.cantidad_producida) || 0;
            }
            
            const unidadSelect = document.getElementById('produccion-unidad');
            if (unidadSelect) {
                unidadSelect.value = produccion.unidad || '';
            }
            
            // Actualizar el título del modal o botón
            const modalTitle = document.getElementById('produccion-modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Producción';
            }
            
            // Mostrar el botón de guardar
            if (saveBtn) {
                saveBtn.style.display = 'block';
            }
            
            mostrarNotificacion('Producción cargada para editar', 'info');
        } catch (error) {
            console.error('Error al cargar producción para editar:', error);
            mostrarNotificacion('Error al cargar la producción: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    };

    // Función para eliminar producción
    window.eliminarProduccion = function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta producción? Esta acción no se puede deshacer.')) {
            eliminarProduccionAPI(id);
        }
    };

    // Función para eliminar producción desde la API
    async function eliminarProduccionAPI(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/producciones/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarNotificacion('Producción eliminada correctamente', 'success');
                cargarProducciones(); // Recargar lista
                
                // Disparar evento para actualizar inventario
                window.dispatchEvent(new CustomEvent('produccionEliminada', {
                    detail: { id_produccion: id }
                }));
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar producción');
            }
        } catch (error) {
            console.error('Error al eliminar producción:', error);
            mostrarNotificacion('Error al eliminar producción: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
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
        
        .produccion-ingredientes-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .produccion-ingrediente-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .produccion-ingrediente-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .produccion-ingrediente-input {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .produccion-unidad-display {
            font-weight: 600;
            color: #6b7280;
        }
    `;
    document.head.appendChild(style);
});

