// proveedores-admin.js - Gestión de proveedores en el panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnCrearProveedor = document.getElementById('btn-crear-proveedor');
    const btnListarProveedores = document.getElementById('btn-listar-proveedores');
    const proveedoresFormSection = document.getElementById('proveedores-form-section');
    const proveedoresListSection = document.getElementById('proveedores-list-section');
    const saveBtn = document.getElementById('save-proveedor');
    const deleteBtn = document.getElementById('delete-proveedor');
    const cancelBtn = document.getElementById('cancel-proveedores');
    const form = document.getElementById('proveedores-form');
    const modalTitle = document.getElementById('proveedores-modal-title');
    const loadingOverlay = document.getElementById('proveedores-loading');
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Variable para almacenar todos los proveedores
    let allProveedores = [];
    let currentAction = '';
    let currentProveedorId = null;
    let allUsuarios = [];

    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Cargar usuarios al iniciar para el select de responsable
    cargarUsuarios();

    // Botón Crear Proveedor
    if (btnCrearProveedor) {
        btnCrearProveedor.addEventListener('click', function() {
            modalTitle.textContent = 'Crear Nuevo Proveedor';
            showSection('form', 'create');
            form.reset();
            currentProveedorId = null;
            document.getElementById('proveedor-activo').checked = true;
        });
    }

    // Botón Listar Proveedores
    if (btnListarProveedores) {
        btnListarProveedores.addEventListener('click', function() {
            modalTitle.textContent = 'Lista de Proveedores';
            showSection('list', 'list');
            cargarProveedores();
        });
    }

    // Botón Guardar
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            // Usar validación personalizada en lugar de checkValidity nativo
            await guardarProveedor();
        });
    }
    
    // Agregar validación en tiempo real a los campos
    const nombreComercial = document.getElementById('proveedor-nombre-comercial');
    const telefono = document.getElementById('proveedor-telefono');
    const email = document.getElementById('proveedor-email');
    const tiempoEntrega = document.getElementById('proveedor-tiempo-entrega');
    
    // Validar nombre comercial en tiempo real
    if (nombreComercial) {
        nombreComercial.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && value.length < 2) {
                mostrarError('proveedor-nombre-comercial', 'El nombre comercial debe tener al menos 2 caracteres');
            } else if (value && value.length > 200) {
                mostrarError('proveedor-nombre-comercial', 'El nombre comercial no puede exceder 200 caracteres');
            } else if (value) {
                limpiarErrorCampo('proveedor-nombre-comercial');
            }
        });
        nombreComercial.addEventListener('input', function() {
            if (this.value.trim().length >= 2 && this.value.trim().length <= 200) {
                limpiarErrorCampo('proveedor-nombre-comercial');
            }
        });
    }
    
    // Validar teléfono en tiempo real
    if (telefono) {
        // Solo permitir números mientras se escribe
        telefono.addEventListener('input', function() {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a 10 caracteres
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
            
            // Limpiar error si el campo es válido
            if (this.value.length >= 7 && this.value.length <= 10) {
                limpiarErrorCampo('proveedor-telefono');
            }
        });
        
        telefono.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                const telefonoRegex = /^[0-9]+$/;
                if (!telefonoRegex.test(value)) {
                    mostrarError('proveedor-telefono', 'El teléfono solo puede contener números');
                } else if (value.length > 10) {
                    mostrarError('proveedor-telefono', 'El teléfono no puede exceder 10 dígitos');
                } else if (value.length < 7) {
                    mostrarError('proveedor-telefono', 'El teléfono debe tener al menos 7 dígitos');
                } else {
                    limpiarErrorCampo('proveedor-telefono');
                }
            }
        });
    }
    
    // Validar email en tiempo real
    if (email) {
        email.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    mostrarError('proveedor-email', 'El formato del email no es válido');
                } else {
                    limpiarErrorCampo('proveedor-email');
                }
            } else {
                limpiarErrorCampo('proveedor-email');
            }
        });
    }
    
    // Validar tiempo de entrega en tiempo real
    if (tiempoEntrega) {
        tiempoEntrega.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                const num = parseInt(value);
                if (isNaN(num) || num < 0) {
                    mostrarError('proveedor-tiempo-entrega', 'Debe ser un número mayor o igual a 0');
                } else if (num > 365) {
                    mostrarError('proveedor-tiempo-entrega', 'No puede ser mayor a 365 días');
                } else {
                    limpiarErrorCampo('proveedor-tiempo-entrega');
                }
            } else {
                limpiarErrorCampo('proveedor-tiempo-entrega');
            }
        });
    }
    
    // Validar dirección en tiempo real
    const direccion = document.getElementById('proveedor-direccion');
    if (direccion) {
        let direccionTieneError = false;
        
        // Función para validar dirección
        function validarDireccionCampo() {
            const value = direccion.value.trim();
            if (value) {
                // Validar longitud
                if (value.length < 5) {
                    mostrarError('proveedor-direccion', 'La dirección debe tener al menos 5 caracteres');
                    direccionTieneError = true;
                    return false;
                } else if (value.length > 255) {
                    mostrarError('proveedor-direccion', 'La dirección no puede exceder 255 caracteres');
                    direccionTieneError = true;
                    return false;
                } else {
                    // Remover código postal si existe
                    const direccionSinCodigoPostal = value.replace(/\b\d{4,6}\b/g, '').trim();
                    
                    // Validar caracteres permitidos
                    const caracteresPermitidos = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.\-]+$/;
                    if (!caracteresPermitidos.test(direccionSinCodigoPostal)) {
                        mostrarError('proveedor-direccion', 'La dirección contiene caracteres no permitidos (no se permiten símbolos como #, %, &)');
                        direccionTieneError = true;
                        return false;
                    } else if (direccionSinCodigoPostal.includes('  ')) {
                        mostrarError('proveedor-direccion', 'La dirección no puede contener espacios dobles');
                        direccionTieneError = true;
                        return false;
                    } else {
                        // Validar contenido suficiente
                        const tienePalabras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(direccionSinCodigoPostal);
                        const tieneNumero = /\d+/.test(direccionSinCodigoPostal);
                        
                        if (tieneNumero && !tienePalabras) {
                            mostrarError('proveedor-direccion', 'La dirección debe incluir el nombre de la calle además del número');
                            direccionTieneError = true;
                            return false;
                        } else if (tienePalabras && !tieneNumero) {
                            const palabras = direccionSinCodigoPostal.split(/\s+/).filter(p => p.length >= 3);
                            if (palabras.length < 2) {
                                mostrarError('proveedor-direccion', 'La dirección debe incluir el nombre de la calle y el número, o al menos el nombre de la calle y el barrio/ciudad');
                                direccionTieneError = true;
                                return false;
                            } else {
                                limpiarErrorCampo('proveedor-direccion');
                                direccionTieneError = false;
                                return true;
                            }
                        } else if (!tienePalabras && !tieneNumero) {
                            mostrarError('proveedor-direccion', 'La dirección debe contener información válida (nombre de calle y número)');
                            direccionTieneError = true;
                            return false;
                        } else {
                            limpiarErrorCampo('proveedor-direccion');
                            direccionTieneError = false;
                            return true;
                        }
                    }
                }
            } else {
                limpiarErrorCampo('proveedor-direccion');
                direccionTieneError = false;
                return true;
            }
        }
        
        // Limpiar espacios dobles mientras se escribe
        direccion.addEventListener('input', function() {
            // Remover espacios dobles
            this.value = this.value.replace(/\s{2,}/g, ' ');
            
            // Si el campo tiene error, mantener el borde rojo
            // Validar solo si el campo tiene contenido suficiente para ser válido
            const value = this.value.trim();
            if (value && value.length >= 5) {
                // Validar rápidamente si parece válido (solo si tiene palabras y números)
                const tienePalabras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(value);
                const tieneNumero = /\d+/.test(value);
                const caracteresPermitidos = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.\-]+$/;
                
                // Solo limpiar error si parece válido
                if (tienePalabras && tieneNumero && caracteresPermitidos.test(value) && !value.includes('  ')) {
                    // No limpiar automáticamente, esperar a que pierda el foco para validar completamente
                }
            }
        });
        
        // Validar al perder el foco
        direccion.addEventListener('blur', function() {
            validarDireccionCampo();
        });
        
        // Detectar cuando se hace clic en otro campo del formulario
        const camposFormulario = form.querySelectorAll('input, select, textarea');
        camposFormulario.forEach(campo => {
            if (campo.id !== 'proveedor-direccion') {
                campo.addEventListener('focus', function() {
                    // Verificar si el campo de dirección tiene error (tiene la clase de error)
                    const direccionValue = direccion.value.trim();
                    const tieneError = direccion.classList.contains('proveedores-input-error');
                    
                    if (direccionValue && tieneError) {
                        mostrarNotificacion('El campo de dirección no cumple con los estándares requeridos. Por favor, revíselo.', 'warning');
                    }
                });
            }
        });
        
        // También validar cuando se intenta enviar el formulario
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
    
    // Función para limpiar error de un campo específico
    function limpiarErrorCampo(campoId) {
        const campo = document.getElementById(campoId);
        if (!campo) return;
        
        campo.classList.remove('proveedores-input-error');
        const errorElement = campo.parentElement.querySelector('.proveedores-form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Botón Eliminar
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (currentProveedorId && confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
                await eliminarProveedor(currentProveedorId);
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
    const searchInput = document.getElementById('search-proveedores');
    const filterEstado = document.getElementById('filter-estado-proveedor');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filtrarProveedores();
        });
    }
    
    if (filterEstado) {
        filterEstado.addEventListener('change', function() {
            filtrarProveedores();
        });
    }

    // ========================================
    // FUNCIONES PRINCIPALES
    // ========================================

    // Mostrar sección
    function showSection(section, action = '') {
        if (proveedoresFormSection) proveedoresFormSection.style.display = 'none';
        if (proveedoresListSection) proveedoresListSection.style.display = 'none';

        if (section === 'form') {
            if (proveedoresFormSection) proveedoresFormSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
            if (deleteBtn) deleteBtn.style.display = action === 'edit' ? 'inline-flex' : 'none';
        } else if (section === 'list') {
            if (proveedoresListSection) proveedoresListSection.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }

        currentAction = action;
    }

    // Cargar usuarios para el select (solo usuarios del panel administrativo, no clientes)
    async function cargarUsuarios() {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`);
            if (response.ok) {
                const usuarios = await response.json();
                // La API /usuarios solo devuelve usuarios del panel administrativo (tabla usuarios)
                // Los clientes están en tabla clientes separada, así que no aparecen aquí
                allUsuarios = usuarios;
                
                const selectUsuario = document.getElementById('proveedor-id-usuario');
                if (selectUsuario) {
                    selectUsuario.innerHTML = '<option value="">Seleccionar usuario</option>';
                    allUsuarios.forEach(usuario => {
                        // Usar nombre_usuario (campo correcto de la tabla usuarios)
                        const nombreUsuario = usuario.nombre_usuario || 'Sin nombre';
                        const emailUsuario = usuario.email || 'Sin email';
                        selectUsuario.innerHTML += `<option value="${usuario.id_usuario}">${nombreUsuario} (${emailUsuario})</option>`;
                    });
                }
            } else {
                throw new Error(`Error al cargar usuarios: ${response.status}`);
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            mostrarNotificacion('Error al cargar la lista de usuarios', 'error');
        }
    }

    // Cargar proveedores desde la API
    async function cargarProveedores() {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/proveedores`);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const proveedores = await response.json();
            allProveedores = proveedores;
            renderizarListaProveedores(proveedores);
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            mostrarNotificacion(`Error al cargar proveedores: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Renderizar lista de proveedores
    function renderizarListaProveedores(proveedores) {
        if (!proveedoresListSection) return;
        
        if (!proveedores || proveedores.length === 0) {
            proveedoresListSection.innerHTML = `
                <div class="proveedores-empty-state">
                    <div class="proveedores-empty-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <h3 class="proveedores-empty-title">No hay proveedores registrados</h3>
                    <p class="proveedores-empty-message">Aún no hay proveedores registrados en el sistema.</p>
                </div>
            `;
            return;
        }
        
        let tbody = document.getElementById('proveedores-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = proveedores.map(proveedor => {
            const estadoClass = proveedor.estado === 'activo' ? 'proveedores-estado-activo' : 'proveedores-estado-inactivo';
            return `
                <tr>
                    <td>${proveedor.id_proveedor}</td>
                    <td>${proveedor.nombre_proveedor || proveedor.nombre_comercial || 'N/A'}</td>
                    <td>${proveedor.email || 'N/A'}</td>
                    <td>${proveedor.telefono || 'N/A'}</td>
                    <td>${proveedor.ciudad || 'N/A'}</td>
                    <td>${proveedor.metodo_pago || 'N/A'}</td>
                    <td>
                        <span class="proveedores-estado-badge ${estadoClass}">
                            <i class="fas fa-circle"></i>
                            ${proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <div class="proveedores-actions">
                            ${currentAction === 'edit' ? `
                                <button class="proveedores-btn proveedores-btn-sm proveedores-btn-warning" onclick="editarProveedor(${proveedor.id_proveedor})">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                            ${currentAction === 'delete' ? `
                                <button class="proveedores-btn proveedores-btn-sm proveedores-btn-danger" onclick="eliminarProveedorConfirm(${proveedor.id_proveedor})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            ${currentAction === 'list' ? `
                                <button class="proveedores-btn proveedores-btn-sm proveedores-btn-warning" onclick="editarProveedor(${proveedor.id_proveedor})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="proveedores-btn proveedores-btn-sm proveedores-btn-danger" onclick="eliminarProveedorConfirm(${proveedor.id_proveedor})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filtrar proveedores
    function filtrarProveedores() {
        const termino = searchInput?.value.toLowerCase() || '';
        const estado = filterEstado?.value || '';
        
        let proveedoresFiltrados = allProveedores.filter(proveedor => {
            const matchTermino = !termino || 
                (proveedor.nombre_proveedor || proveedor.nombre_comercial)?.toLowerCase().includes(termino) ||
                proveedor.email?.toLowerCase().includes(termino) ||
                proveedor.telefono?.includes(termino) ||
                proveedor.ciudad?.toLowerCase().includes(termino);
            
            const matchEstado = !estado || proveedor.estado === estado;
            
            return matchTermino && matchEstado;
        });
        
        renderizarListaProveedores(proveedoresFiltrados);
    }

    // Validar formulario de proveedor
    function validarFormularioProveedor() {
        const nombreComercial = document.getElementById('proveedor-nombre-comercial');
        const telefono = document.getElementById('proveedor-telefono');
        const email = document.getElementById('proveedor-email');
        const direccion = document.getElementById('proveedor-direccion');
        const ciudad = document.getElementById('proveedor-ciudad');
        const metodoPago = document.getElementById('proveedor-metodo-pago');
        const tiempoEntrega = document.getElementById('proveedor-tiempo-entrega');
        
        let esValido = true;
        
        // Limpiar mensajes de error anteriores
        limpiarMensajesError();
        
        // Validar Nombre Comercial (requerido, mínimo 2 caracteres, máximo 200)
        const nombreComercialValue = nombreComercial?.value.trim() || '';
        if (!nombreComercialValue) {
            mostrarError('proveedor-nombre-comercial', 'El nombre comercial es obligatorio');
            esValido = false;
        } else if (nombreComercialValue.length < 2) {
            mostrarError('proveedor-nombre-comercial', 'El nombre comercial debe tener al menos 2 caracteres');
            esValido = false;
        } else if (nombreComercialValue.length > 200) {
            mostrarError('proveedor-nombre-comercial', 'El nombre comercial no puede exceder 200 caracteres');
            esValido = false;
        }
        
        // Validar Teléfono (requerido, solo números, máximo 10 caracteres)
        const telefonoValue = telefono?.value.trim() || '';
        if (!telefonoValue) {
            mostrarError('proveedor-telefono', 'El teléfono es obligatorio');
            esValido = false;
        } else {
            // Solo números, máximo 10 caracteres
            const telefonoRegex = /^[0-9]+$/;
            if (!telefonoRegex.test(telefonoValue)) {
                mostrarError('proveedor-telefono', 'El teléfono solo puede contener números');
                esValido = false;
            } else if (telefonoValue.length > 10) {
                mostrarError('proveedor-telefono', 'El teléfono no puede exceder 10 dígitos');
                esValido = false;
            } else if (telefonoValue.length < 7) {
                mostrarError('proveedor-telefono', 'El teléfono debe tener al menos 7 dígitos');
                esValido = false;
            }
        }
        
        // Validar Email (opcional, pero si se proporciona debe ser válido)
        const emailValue = email?.value.trim() || '';
        if (emailValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                mostrarError('proveedor-email', 'El formato del email no es válido. Ejemplo: proveedor@ejemplo.com');
                esValido = false;
            } else if (emailValue.length > 150) {
                mostrarError('proveedor-email', 'El email no puede exceder 150 caracteres');
                esValido = false;
            }
        }
        
        // Validar Dirección (opcional, pero si se proporciona debe cumplir validaciones)
        const direccionValue = direccion?.value.trim() || '';
        if (direccionValue) {
            // Validar longitud
            if (direccionValue.length < 5) {
                mostrarError('proveedor-direccion', 'La dirección debe tener al menos 5 caracteres');
                esValido = false;
            } else if (direccionValue.length > 255) {
                mostrarError('proveedor-direccion', 'La dirección no puede exceder 255 caracteres');
                esValido = false;
            } else {
                // Remover código postal si existe (números de 4-6 dígitos al final o en medio)
                const direccionSinCodigoPostal = direccionValue.replace(/\b\d{4,6}\b/g, '').trim();
                
                // Validar caracteres permitidos: letras, números, espacios, comas, guiones, puntos, números
                // No permitir: #, %, &, y otros caracteres especiales
                const caracteresPermitidos = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.\-]+$/;
                if (!caracteresPermitidos.test(direccionSinCodigoPostal)) {
                    mostrarError('proveedor-direccion', 'La dirección contiene caracteres no permitidos. No se permiten símbolos como #, %, &');
                    esValido = false;
                } else {
                    // Validar que no tenga espacios dobles
                    if (direccionSinCodigoPostal.includes('  ')) {
                        mostrarError('proveedor-direccion', 'La dirección no puede contener espacios dobles');
                        esValido = false;
                    } else {
                        // Validar que tenga información suficiente (calle y número)
                        // Buscar patrón de calle (palabras) y número (dígitos)
                        const tienePalabras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(direccionSinCodigoPostal);
                        const tieneNumero = /\d+/.test(direccionSinCodigoPostal);
                        
                        // Si tiene número, debe tener también palabras (nombre de calle)
                        if (tieneNumero && !tienePalabras) {
                            mostrarError('proveedor-direccion', 'La dirección debe incluir el nombre de la calle además del número');
                            esValido = false;
                        } else if (tienePalabras && !tieneNumero) {
                            // Si solo tiene palabras, verificar que tenga suficiente información
                            const palabras = direccionSinCodigoPostal.split(/\s+/).filter(p => p.length >= 3);
                            if (palabras.length < 2) {
                                mostrarError('proveedor-direccion', 'La dirección debe incluir el nombre de la calle y el número, o al menos el nombre de la calle y el barrio/ciudad');
                                esValido = false;
                            }
                        } else if (!tienePalabras && !tieneNumero) {
                            mostrarError('proveedor-direccion', 'La dirección debe contener información válida (nombre de calle y número)');
                            esValido = false;
                        }
                    }
                }
            }
        }
        
        // Validar Ciudad (opcional, máximo 100 caracteres)
        const ciudadValue = ciudad?.value.trim() || '';
        if (ciudadValue && ciudadValue.length > 100) {
            mostrarError('proveedor-ciudad', 'La ciudad no puede exceder 100 caracteres');
            esValido = false;
        }
        
        // Validar Método de Pago (requerido, debe ser Efectivo o Transferencia)
        const metodoPagoValue = metodoPago?.value || '';
        if (!metodoPagoValue) {
            mostrarError('proveedor-metodo-pago', 'El método de pago es obligatorio');
            esValido = false;
        } else if (metodoPagoValue !== 'Efectivo' && metodoPagoValue !== 'Transferencia') {
            mostrarError('proveedor-metodo-pago', 'El método de pago debe ser Efectivo o Transferencia');
            esValido = false;
        }
        
        // Validar Tiempo de Entrega (opcional, pero si se proporciona debe ser número >= 0)
        const tiempoEntregaValue = tiempoEntrega?.value.trim() || '';
        if (tiempoEntregaValue) {
            const tiempoEntregaNum = parseInt(tiempoEntregaValue);
            if (isNaN(tiempoEntregaNum)) {
                mostrarError('proveedor-tiempo-entrega', 'El tiempo de entrega debe ser un número válido');
                esValido = false;
            } else if (tiempoEntregaNum < 0) {
                mostrarError('proveedor-tiempo-entrega', 'El tiempo de entrega no puede ser negativo');
                esValido = false;
            } else if (tiempoEntregaNum > 365) {
                mostrarError('proveedor-tiempo-entrega', 'El tiempo de entrega no puede ser mayor a 365 días');
                esValido = false;
            }
        }
        
        return esValido;
    }
    
    // Mostrar mensaje de error en un campo
    function mostrarError(campoId, mensaje) {
        const campo = document.getElementById(campoId);
        if (!campo) return;
        
        // Remover mensaje de error anterior si existe
        const errorAnterior = campo.parentElement.querySelector('.proveedores-form-error');
        if (errorAnterior) {
            errorAnterior.remove();
        }
        
        // Agregar clase de error al campo
        campo.classList.add('proveedores-input-error');
        
        // Crear elemento de error
        const errorElement = document.createElement('div');
        errorElement.className = 'proveedores-form-error';
        errorElement.textContent = mensaje;
        errorElement.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
        
        // Insertar después del campo
        campo.parentElement.appendChild(errorElement);
        
        // Hacer scroll al campo si está fuera de la vista
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        campo.focus();
    }
    
    // Limpiar todos los mensajes de error
    function limpiarMensajesError() {
        // Remover todos los mensajes de error
        const errores = document.querySelectorAll('.proveedores-form-error');
        errores.forEach(error => error.remove());
        
        // Remover clase de error de todos los campos
        const camposConError = document.querySelectorAll('.proveedores-input-error');
        camposConError.forEach(campo => campo.classList.remove('proveedores-input-error'));
    }
    
    // Guardar proveedor
    async function guardarProveedor() {
        // Validar formulario antes de guardar
        if (!validarFormularioProveedor()) {
            mostrarNotificacion('Por favor, corrige los errores en el formulario', 'error');
            return;
        }
        
        try {
            showLoading(true);
            const formData = new FormData(form);
            const datos = {
                nombre_proveedor: formData.get('nombre_proveedor')?.trim() || formData.get('nombre_comercial')?.trim(),
                id_usuario: formData.get('id_usuario') || null,
                telefono: formData.get('telefono')?.trim(),
                email: formData.get('email')?.trim() || null,
                direccion: formData.get('direccion')?.trim() || null,
                ciudad: formData.get('ciudad')?.trim() || null,
                metodo_pago: formData.get('metodo_pago'),
                tiempo_entrega_dias: formData.get('tiempo_entrega_dias') ? parseInt(formData.get('tiempo_entrega_dias')) : null,
                observaciones: formData.get('observaciones')?.trim() || null,
                estado: document.getElementById('proveedor-activo').checked ? 'activo' : 'inactivo'
            };

            const url = currentAction === 'create' 
                ? `${API_BASE_URL}/proveedores`
                : `${API_BASE_URL}/proveedores/${currentProveedorId}`;
            
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
                let errorMessage = error.error || 'Error al guardar proveedor';
                
                // Detectar tipo de error y mostrar mensaje específico
                if (errorMessage.includes('correo electrónico') || errorMessage.includes('email')) {
                    errorMessage = 'El correo electrónico ya está registrado. Por favor, usa otro correo.';
                }
                
                throw new Error(errorMessage);
            }

            mostrarNotificacion(
                currentAction === 'create' ? 'Proveedor creado exitosamente' : 'Proveedor actualizado exitosamente',
                'success'
            );
            
            showSection('list', 'list');
            await cargarProveedores();
            showLoading(false);
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
            showLoading(false);
        }
    }

    // Eliminar proveedor
    async function eliminarProveedor(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar proveedor');
            }

            mostrarNotificacion('Proveedor eliminado exitosamente', 'success');
            await cargarProveedores();
            showLoading(false);
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
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
        notification.className = `proveedores-notification proveedores-notification-${tipo}`;
        notification.innerHTML = `
            <div class="proveedores-notification-content">
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

    // Editar proveedor
    window.editarProveedor = async function(id) {
        try {
            showLoading(true);
            const response = await fetch(`${API_BASE_URL}/proveedores/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar proveedor');
            }
            
            const proveedor = await response.json();
            currentProveedorId = id;
            currentAction = 'edit';
            
            // Llenar formulario
            document.getElementById('proveedor-nombre-comercial').value = proveedor.nombre_proveedor || proveedor.nombre_comercial || '';
            document.getElementById('proveedor-id-usuario').value = proveedor.id_usuario || '';
            document.getElementById('proveedor-telefono').value = proveedor.telefono || '';
            document.getElementById('proveedor-email').value = proveedor.email || '';
            document.getElementById('proveedor-direccion').value = proveedor.direccion || '';
            document.getElementById('proveedor-ciudad').value = proveedor.ciudad || '';
            document.getElementById('proveedor-metodo-pago').value = proveedor.metodo_pago || 'Efectivo';
            document.getElementById('proveedor-tiempo-entrega').value = proveedor.tiempo_entrega_dias || '';
            document.getElementById('proveedor-observaciones').value = proveedor.observaciones || '';
            document.getElementById('proveedor-activo').checked = proveedor.estado === 'activo';
            
            modalTitle.textContent = 'Editar Proveedor';
            showSection('form', 'edit');
            showLoading(false);
        } catch (error) {
            console.error('Error al cargar proveedor:', error);
            mostrarNotificacion('Error al cargar proveedor', 'error');
            showLoading(false);
        }
    };

    // Confirmar eliminación
    window.eliminarProveedorConfirm = function(id) {
        const proveedor = allProveedores.find(p => p.id_proveedor === id);
        const nombreProveedor = proveedor.nombre_proveedor || proveedor.nombre_comercial || 'N/A';
        if (proveedor && confirm(`¿Estás seguro de que quieres eliminar al proveedor ${nombreProveedor}?`)) {
            eliminarProveedor(id);
        }
    };

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

