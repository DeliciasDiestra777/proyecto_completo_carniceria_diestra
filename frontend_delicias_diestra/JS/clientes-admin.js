// clientes-admin.js - Gestión de clientes en el panel de administración
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnListarClientes = document.getElementById('btn-listar-clientes');
    const clientesFormSection = document.getElementById('clientes-form-section');
    const clientesListSection = document.getElementById('clientes-list-section');
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Variable para almacenar todos los clientes
    let allClientes = [];
    
    // Variables para el modo de edición (globales para acceso desde HTML)
    window.currentClienteId = null;
    window.currentAction = '';
    
    // ========================================
    // MANEJADORES DE EVENTOS
    // ========================================
    
    // Botón Listar Clientes
    if (btnListarClientes) {
        btnListarClientes.addEventListener('click', function() {
            console.log('Clic en Listar Clientes');
            mostrarListaClientes();
        });
    }
    
    // ========================================
    // FUNCIONES PRINCIPALES
    // ========================================
    
    // Mostrar lista de clientes
    async function mostrarListaClientes() {
        try {
            console.log('Cargando lista de clientes...');
            
            // Ocultar formulario si está visible
            if (clientesFormSection) {
                clientesFormSection.style.display = 'none';
            }
            
            // Mostrar sección de lista
            if (clientesListSection) {
                clientesListSection.style.display = 'block';
            }
            
            // Cargar clientes
            await cargarClientes();
            
        } catch (error) {
            console.error('Error al mostrar lista de clientes:', error);
            mostrarNotificacion('Error al cargar la lista de clientes', 'error');
        }
    }
    
    // Cargar clientes desde la API (función global)
    window.cargarClientes = async function() {
        try {
            console.log('Obteniendo clientes desde la API...');
            
            const response = await fetch(`${API_BASE_URL}/clientes`);
            console.log('Respuesta status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const clientes = await response.json();
            console.log('Clientes obtenidos:', clientes);
            
            allClientes = clientes;
            renderizarListaClientes(clientes);
            
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            mostrarNotificacion(`Error al cargar clientes: ${error.message}`, 'error');
            
            // Mostrar mensaje de error en la lista
            if (clientesListSection) {
                clientesListSection.innerHTML = `
                    <div class="clientes-error-state">
                        <div class="clientes-error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 class="clientes-error-title">Error al cargar clientes</h3>
                        <p class="clientes-error-message">No se pudieron cargar los clientes. Verifica la conexión con el servidor.</p>
                        <button class="clientes-btn clientes-btn-primary" onclick="location.reload()">
                            <i class="fas fa-refresh"></i>
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }
    
    // Renderizar lista de clientes
    function renderizarListaClientes(clientes) {
        if (!clientesListSection) return;
        
        if (!clientes || clientes.length === 0) {
            clientesListSection.innerHTML = `
                <div class="clientes-empty-state">
                    <div class="clientes-empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3 class="clientes-empty-title">No hay clientes registrados</h3>
                    <p class="clientes-empty-message">Aún no hay clientes registrados en el sistema.</p>
                </div>
            `;
            return;
        }
        
        // Generar HTML de la tabla
        let html = `
            <div class="clientes-list-header">
                <h3 class="clientes-list-title">Lista de Clientes</h3>
                <div class="clientes-list-actions">
                    <div class="clientes-search-box">
                        <input type="text" id="clientes-search" placeholder="Buscar clientes..." class="clientes-search-input">
                        <i class="fas fa-search clientes-search-icon"></i>
                    </div>
                    <button class="clientes-btn clientes-btn-secondary" id="btn-volver-clientes">
                        <i class="fas fa-arrow-left"></i>
                        Volver
                    </button>
                </div>
            </div>
            
            <div class="clientes-stats">
                <div class="clientes-stat">
                    <span class="clientes-stat-number">${clientes.length}</span>
                    <span class="clientes-stat-label">Total Clientes</span>
                </div>
                <div class="clientes-stat">
                    <span class="clientes-stat-number">${clientes.filter(c => c.estado === 'activo').length}</span>
                    <span class="clientes-stat-label">Activos</span>
                </div>
                <div class="clientes-stat">
                    <span class="clientes-stat-number">${clientes.filter(c => c.estado === 'inactivo').length}</span>
                    <span class="clientes-stat-label">Inactivos</span>
                </div>
            </div>
            
            <div class="clientes-table-container">
                <table class="clientes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Documento</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        clientes.forEach(cliente => {
            const fechaRegistro = new Date(cliente.fecha_registro).toLocaleDateString('es-ES');
            const estadoClass = cliente.estado === 'activo' ? 'clientes-estado-activo' : 'clientes-estado-inactivo';
            
            html += `
                <tr>
                    <td>${cliente.id_cliente}</td>
                    <td>${cliente.nombre_cliente || cliente.nombre || 'N/A'}</td>
                    <td>${cliente.apellido_cliente || cliente.apellido || 'N/A'}</td>
                    <td>${cliente.email || 'N/A'}</td>
                    <td>${cliente.telefono || 'N/A'}</td>
                    <td>${cliente.tipo_documento} ${cliente.numero_documento}</td>
                    <td>
                        <span class="clientes-estado-badge ${estadoClass}">
                            <i class="fas fa-circle"></i>
                            ${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>${fechaRegistro}</td>
                    <td>
                        <div class="clientes-actions">
                            <button class="clientes-btn clientes-btn-sm clientes-btn-warning" onclick="editarCliente(${cliente.id_cliente})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="clientes-btn clientes-btn-sm clientes-btn-danger" onclick="eliminarCliente(${cliente.id_cliente})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        clientesListSection.innerHTML = html;
        
        // Configurar eventos
        configurarEventosLista();
    }
    
    // Configurar eventos de la lista
    function configurarEventosLista() {
        // Botón volver
        const btnVolver = document.getElementById('btn-volver-clientes');
        if (btnVolver) {
            btnVolver.addEventListener('click', function() {
                if (clientesListSection) {
                    clientesListSection.style.display = 'none';
                }
            });
        }
        
        // Búsqueda
        const searchInput = document.getElementById('clientes-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const termino = this.value.toLowerCase();
                const clientesFiltrados = allClientes.filter(cliente => 
                    (cliente.nombre_cliente || cliente.nombre)?.toLowerCase().includes(termino) ||
                    (cliente.apellido_cliente || cliente.apellido)?.toLowerCase().includes(termino) ||
                    cliente.email?.toLowerCase().includes(termino) ||
                    cliente.numero_documento?.includes(termino)
                );
                renderizarListaClientes(clientesFiltrados);
            });
        }
    }
    
    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================
    
    // Mostrar notificación
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `clientes-notification clientes-notification-${tipo}`;
        notification.innerHTML = `
            <div class="clientes-notification-content">
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
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        if (tipo === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (tipo === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }
        
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
    
    // Editar cliente
    window.editarCliente = async function(id) {
        try {
            console.log('Editar cliente:', id);
            
            // Obtener elementos del DOM
            const clientesFormSection = document.getElementById('clientes-form-section');
            const modalTitle = document.getElementById('clientes-modal-title');
            const saveBtn = document.getElementById('save-cliente');
            const deleteBtn = document.getElementById('delete-cliente');
            
            if (!clientesFormSection || !modalTitle) {
                mostrarNotificacion('Error: No se encontraron los elementos del formulario', 'error');
                return;
            }
            
            // Mostrar loading
            const loadingOverlay = document.getElementById('clientes-loading');
            if (loadingOverlay) {
                loadingOverlay.classList.add('show');
            }
            
            // Obtener datos del cliente desde la API
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar el cliente');
            }
            
            const cliente = await response.json();
            
            // Guardar ID y acción actual
            window.currentClienteId = id;
            window.currentAction = 'edit';
            
            // Ocultar lista y mostrar formulario
            if (clientesListSection) {
                clientesListSection.style.display = 'none';
            }
            clientesFormSection.style.display = 'block';
            
            // Mostrar botones
            if (saveBtn) {
                saveBtn.style.display = 'inline-flex';
            }
            if (deleteBtn) {
                deleteBtn.style.display = 'inline-flex';
            }
            
            // Llenar formulario con los datos del cliente
            const nombreInput = document.getElementById('cliente-nombre');
            const apellidoInput = document.getElementById('cliente-apellido');
            const tipoDocSelect = document.getElementById('cliente-tipo-doc');
            const numDocInput = document.getElementById('cliente-num-doc');
            const telefonoInput = document.getElementById('cliente-telefono');
            const emailInput = document.getElementById('cliente-email');
            const direccionTextarea = document.getElementById('cliente-direccion');
            const passwordInput = document.getElementById('cliente-password');
            const passwordConfirmInput = document.getElementById('cliente-password-confirm');
            const activoCheckbox = document.getElementById('cliente-activo');
            
            if (nombreInput) nombreInput.value = cliente.nombre_cliente || cliente.nombre || '';
            if (apellidoInput) apellidoInput.value = cliente.apellido_cliente || cliente.apellido || '';
            if (tipoDocSelect) tipoDocSelect.value = cliente.tipo_documento || '';
            if (numDocInput) numDocInput.value = cliente.numero_documento || '';
            if (telefonoInput) telefonoInput.value = cliente.telefono || '';
            if (emailInput) emailInput.value = cliente.email || '';
            if (direccionTextarea) direccionTextarea.value = cliente.direccion || '';
            if (activoCheckbox) activoCheckbox.checked = cliente.estado === 'activo' || cliente.activo === 1;
            
            // Limpiar campos de contraseña (no se muestran en edición)
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.removeAttribute('required');
            }
            if (passwordConfirmInput) {
                passwordConfirmInput.value = '';
                passwordConfirmInput.removeAttribute('required');
            }
            
            // Actualizar título del modal
            modalTitle.textContent = 'Editar Cliente';
            
            // Ocultar loading
            if (loadingOverlay) {
                loadingOverlay.classList.remove('show');
            }
            
            // Hacer scroll al formulario
            clientesFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Error al cargar cliente para editar:', error);
            mostrarNotificacion(`Error al cargar cliente: ${error.message}`, 'error');
            
            const loadingOverlay = document.getElementById('clientes-loading');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('show');
            }
        }
    };
    
    // Eliminar cliente
    window.eliminarCliente = function(id) {
        console.log('Eliminar cliente:', id);
        const cliente = allClientes.find(c => c.id_cliente === id);
        const nombreCliente = cliente?.nombre_cliente || cliente?.nombre || 'N/A';
        const apellidoCliente = cliente?.apellido_cliente || cliente?.apellido || 'N/A';
        if (cliente && confirm(`¿Estás seguro de que quieres eliminar al cliente ${nombreCliente} ${apellidoCliente}?`)) {
            mostrarNotificacion('Función de eliminar cliente en desarrollo', 'info');
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
