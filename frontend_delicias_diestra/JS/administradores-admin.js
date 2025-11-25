// JS/administradores-admin.js - Gestión completa de administradores
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Elementos del DOM
    const modal = document.getElementById('administradores-modal');
    const modalContent = document.getElementById('administradores-modal-content');
    const modalTitle = document.getElementById('administradores-modal-title');
    const modalBody = document.getElementById('administradores-modal-body');
    const modalFooter = document.getElementById('administradores-modal-footer');
    
    // Secciones del modal
    const actionsSection = document.getElementById('administradores-actions-section');
    const formSection = document.getElementById('administradores-form-section');
    const listSection = document.getElementById('administradores-list-section');
    const rolesSection = document.getElementById('administradores-roles-section');
    
    // Botones de acción
    const btnCrearAdmin = document.getElementById('btn-crear-administrador');
    const btnListarAdmins = document.getElementById('btn-listar-admins');
    const btnAsignarRoles = document.getElementById('btn-asignar-roles');
    const btnSaveAdmin = document.getElementById('save-administrador');
    const adminRolSelect = document.getElementById('admin-rol');
    
    // Elementos de la lista
    const administradoresTableBody = document.getElementById('administradores-tbody');
    const administradoresSearch = document.getElementById('administradores-search');
    const totalAdministradores = document.getElementById('total-administradores');
    const administradoresActivos = document.getElementById('administradores-activos');
    const administradoresInactivos = document.getElementById('administradores-inactivos');
    
    // Variables globales
    let allAdministradores = [];
    let filteredAdministradores = [];
    let currentSection = 'actions';
    let editingAdminId = null;
    
    // ===== FUNCIONES PRINCIPALES =====
    
    // Mostrar modal
    function mostrarModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Ocultar modal
    function ocultarModal() {
        // Cerrar el modal y volver al panel de administración
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        // Redirigir al panel de administración
        window.location.href = 'panel-admin.html';
    }
    
    // Resetear modal a estado inicial
    function resetearModal() {
        currentSection = 'actions';
        editingAdminId = null;
        mostrarSeccion('actions');
        modalTitle.textContent = 'Gestión de Administradores';
        limpiarFormulario();
    }
    
    // Mostrar sección específica
    function mostrarSeccion(seccion) {
        // Ocultar todas las secciones
        [actionsSection, formSection, listSection, rolesSection].forEach(section => {
            if (section) {
                section.style.display = 'none';
            }
        });
        
        // Mostrar sección solicitada
        switch(seccion) {
            case 'actions':
                if (actionsSection) actionsSection.style.display = 'block';
                // Ocultar botón guardar en acciones
                if (btnSaveAdmin) btnSaveAdmin.style.display = 'none';
                break;
            case 'form':
                if (formSection) formSection.style.display = 'block';
                // Mostrar botón guardar en formulario
                if (btnSaveAdmin) btnSaveAdmin.style.display = 'inline-block';
                break;
            case 'list':
                if (listSection) listSection.style.display = 'block';
                // Ocultar botón guardar en lista
                if (btnSaveAdmin) btnSaveAdmin.style.display = 'none';
                break;
            case 'roles':
                if (rolesSection) rolesSection.style.display = 'block';
                // Ocultar botón guardar en roles
                if (btnSaveAdmin) btnSaveAdmin.style.display = 'none';
                break;
        }
        
        currentSection = seccion;
    }
    
    // ===== GESTIÓN DE ADMINISTRADORES =====
    
    // Mostrar lista de administradores
    async function mostrarListaAdministradores() {
        try {
            mostrarSeccion('list');
            modalTitle.textContent = 'Usuarios del Panel Administrativo';
            mostrarLoading();
            
            const response = await fetch(`${API_BASE_URL}/usuarios`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
            }
            
            const usuarios = await response.json();
            
            // Log de diagnóstico - ver qué datos llegan del backend
            console.log('📊 Usuarios recibidos del backend:', usuarios);
            if (usuarios.length > 0) {
                console.log('📋 Ejemplo de usuario:', usuarios[0]);
            }
            
            // Mostrar todos los usuarios del panel administrativo (todos los roles)
            allAdministradores = usuarios;
            
            filteredAdministradores = [...allAdministradores];
            
            // Renderizar tabla
            renderizarTablaAdministradores(filteredAdministradores);
            actualizarEstadisticas(filteredAdministradores);
            
            // Ocultar loading
            ocultarLoading();
            
        } catch (error) {
            console.error('❌ Error al cargar administradores:', error);
            ocultarLoading();
            showNotification(`Error al cargar administradores: ${error.message}`, 'error');
        }
    }
    
    // Renderizar tabla de administradores
    function renderizarTablaAdministradores(administradores) {
        
        if (!administradoresTableBody) {
            console.error('❌ administradoresTableBody no encontrado!');
            return;
        }
        
        administradoresTableBody.innerHTML = '';
        
        if (administradores.length === 0) {
            administradoresTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 2rem; color: var(--color-gray-500);">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No se encontraron administradores
                    </td>
                </tr>
            `;
            return;
        }
        
        administradores.forEach((admin, index) => {
            
            // Log detallado de cada usuario
            console.log(`Usuario ${index + 1} completo:`, JSON.stringify(admin, null, 2));
            
            // Formatear fecha (usar fecha actual si no hay fecha_registro)
            const fechaFormateada = admin.fecha_registro ? 
                new Date(admin.fecha_registro).toLocaleDateString('es-ES') : 
                'N/A';
            
            // Determinar el nombre del rol - el backend puede devolver 'rol' o 'nombre_rol'
            let nombreRol = 'N/A';
            if (admin.rol) {
                nombreRol = admin.rol;
            } else if (admin.nombre_rol) {
                nombreRol = admin.nombre_rol;
            } else if (admin.id_rol === 1) {
                nombreRol = 'Administrador';
            } else if (admin.id_rol === 2) {
                nombreRol = 'Empleado';
            } else if (admin.id_rol) {
                nombreRol = `Rol ${admin.id_rol}`;
            }
            
            // Estado por defecto (activo)
            const estadoClass = 'administradores-status-activo';
            const estado = 'activo';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.id_usuario}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--color-secondary-dark), var(--color-secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            ${(admin.nombre_usuario || admin.nombre) ? (admin.nombre_usuario || admin.nombre).charAt(0).toUpperCase() : 'A'}
                        </div>
                        ${admin.nombre_usuario || admin.nombre || 'N/A'}
                    </div>
                </td>
                <td>${admin.email}</td>
                <td>${admin.telefono || 'N/A'}</td>
                <td>${nombreRol}</td>
                <td>${fechaFormateada}</td>
                <td>
                    <div class="administradores-table-actions">
                        <button class="administradores-table-btn administradores-table-btn-edit" onclick="editarAdministrador(${admin.id_usuario})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="administradores-table-btn administradores-table-btn-roles" onclick="asignarRolesAdministrador(${admin.id_usuario})">
                            <i class="fas fa-key"></i> Roles
                        </button>
                        <button class="administradores-table-btn administradores-table-btn-delete" onclick="eliminarAdministrador(${admin.id_usuario})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            
            administradoresTableBody.appendChild(row);
        });
    }
    
    // Actualizar estadísticas
    function actualizarEstadisticas(administradores) {
        const total = administradores.length;
        // Como no hay campo estado, todos se consideran activos
        const activos = administradores.length;
        const inactivos = 0;
        
        if (totalAdministradores) totalAdministradores.textContent = total;
        if (administradoresActivos) administradoresActivos.textContent = activos;
        if (administradoresInactivos) administradoresInactivos.textContent = inactivos;
    }
    
    // Filtrar administradores
    function filtrarAdministradores(termino) {
        if (!termino.trim()) {
            filteredAdministradores = [...allAdministradores];
        } else {
            const lowerTerm = termino.toLowerCase();
            filteredAdministradores = allAdministradores.filter(admin =>
                (admin.nombre_usuario || admin.nombre || '').toLowerCase().includes(lowerTerm) ||
                admin.email.toLowerCase().includes(lowerTerm) ||
                (admin.telefono && admin.telefono.includes(termino))
            );
        }
        renderizarTablaAdministradores(filteredAdministradores);
        actualizarEstadisticas(filteredAdministradores);
    }
    
    // ===== FORMULARIO DE ADMINISTRADOR =====
    
    // Cargar roles en el selector
    // Cargar roles en el select del formulario
    async function cargarRolesEnSelect() {
        try {
            const response = await fetch(`${API_BASE_URL}/roles`);
            if (!response.ok) throw new Error('Error al cargar roles');
            
            const roles = await response.json();
            
            if (adminRolSelect) {
                adminRolSelect.innerHTML = '<option value="">Seleccionar rol</option>';
                roles.forEach(rol => {
                    const option = document.createElement('option');
                    option.value = rol.id_rol;
                    option.textContent = rol.nombre_rol || rol.nombre || 'Sin nombre';
                    adminRolSelect.appendChild(option);
                });
                console.log(`✅ ${roles.length} roles cargados en el select`);
            }
        } catch (error) {
            console.error('Error al cargar roles en el select:', error);
            // Valores por defecto
            if (adminRolSelect) {
                adminRolSelect.innerHTML = `
                    <option value="">Seleccionar rol</option>
                    <option value="1">Administrador</option>
                    <option value="2">Empleado</option>
                `;
            }
        }
    }
    
    // Mostrar formulario para crear administrador
    function mostrarFormularioCrear() {
        mostrarSeccion('form');
        modalTitle.textContent = 'Crear Nuevo Administrador';
        editingAdminId = null;
        limpiarFormulario();
        
        // Mostrar botón guardar
        if (btnSaveAdmin) btnSaveAdmin.style.display = 'inline-block';
        
        // Cargar roles siempre para tener la lista actualizada
        cargarRolesEnSelect();
        
        // Configurar validaciones en tiempo real
        setTimeout(() => {
            configurarValidacionesEnTiempoReal();
        }, 100);
    }
    
    // Mostrar formulario para editar administrador
    async function mostrarFormularioEditar(adminId) {
        try {
            mostrarSeccion('form');
            modalTitle.textContent = 'Editar Administrador';
            editingAdminId = adminId;
            
            // Cargar roles siempre para tener la lista actualizada
            await cargarRolesEnSelect();
            
            // Buscar administrador en la lista actual
            const admin = allAdministradores.find(a => a.id_usuario === adminId);
            
            if (admin) {
                llenarFormulario(admin);
                
                // Hacer campos de contraseña opcionales al editar
                const passwordInput = document.getElementById('admin-password');
                const confirmPasswordInput = document.getElementById('admin-confirm-password');
                if (passwordInput) passwordInput.removeAttribute('required');
                if (confirmPasswordInput) confirmPasswordInput.removeAttribute('required');
            } else {
                showNotification('Administrador no encontrado', 'error');
                mostrarListaAdministradores();
            }
            
            // Configurar validaciones en tiempo real
            setTimeout(() => {
                configurarValidacionesEnTiempoReal();
            }, 100);
            
        } catch (error) {
            console.error('Error al cargar administrador:', error);
            showNotification('Error al cargar administrador', 'error');
        }
    }
    
    // Llenar formulario con datos del administrador
    function llenarFormulario(admin) {
        const form = document.getElementById('administrador-form');
        if (!form) return;
        
        // Llenar campos del formulario
        const campos = {
            'admin-nombre': admin.nombre_usuario || admin.nombre,
            'admin-email': admin.email,
            'admin-telefono': admin.telefono || '',
            'admin-direccion': admin.direccion || '',
            'admin-rol': admin.id_rol || '1',
            'admin-password': '', // No mostrar contraseña
            'admin-confirm-password': ''
        };
        
        Object.entries(campos).forEach(([id, valor]) => {
            const campo = form.querySelector(`#${id}`);
            if (campo) campo.value = valor;
        });
    }
    
    // Limpiar formulario
    function limpiarFormulario() {
        const form = document.getElementById('administrador-form');
        if (!form) return;
        
        form.reset();
        editingAdminId = null;
        limpiarErrores();
        
        // Restaurar atributos required en campos de contraseña
        const passwordInput = document.getElementById('admin-password');
        const confirmPasswordInput = document.getElementById('admin-confirm-password');
        if (passwordInput) passwordInput.setAttribute('required', 'required');
        if (confirmPasswordInput) confirmPasswordInput.setAttribute('required', 'required');
    }
    
    // Limpiar mensajes de error
    function limpiarErrores() {
        const errorElements = document.querySelectorAll('.form-error-message');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        // Remover clases de error de los inputs
        const inputs = document.querySelectorAll('.administradores-form-input');
        inputs.forEach(input => {
            input.classList.remove('input-error');
        });
    }
    
    // Mostrar error en un campo
    function mostrarError(campoId, mensaje) {
        const errorElement = document.getElementById(`error-${campoId}`);
        const inputElement = document.getElementById(`admin-${campoId}`);
        
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }
    
    // Ocultar error de un campo
    function ocultarError(campoId) {
        const errorElement = document.getElementById(`error-${campoId}`);
        const inputElement = document.getElementById(`admin-${campoId}`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }
    
    // Validar nombre (solo letras y espacios)
    function validarNombre(nombre) {
        if (!nombre || nombre.trim() === '') {
            return { valido: false, mensaje: 'El nombre es requerido' };
        }
        
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!regex.test(nombre)) {
            return { valido: false, mensaje: 'El nombre solo puede contener letras y espacios' };
        }
        
        if (nombre.trim().length < 2) {
            return { valido: false, mensaje: 'El nombre debe tener al menos 2 caracteres' };
        }
        
        return { valido: true, mensaje: '' };
    }
    
    // Validar email (debe tener @, dominio y .com o similar)
    function validarEmail(email) {
        if (!email || email.trim() === '') {
            return { valido: false, mensaje: 'El email es requerido' };
        }
        
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            return { valido: false, mensaje: 'El email debe tener formato válido (ejemplo@dominio.com)' };
        }
        
        // Verificar que tenga dominio válido (.com, .co, .org, etc.)
        const dominioRegex = /^[^\s@]+@[^\s@]+\.(com|co|org|net|edu|gov|mil|info|biz|io|xyz|es|mx|ar|cl|pe|ec|ve|uy|py|bo|cr|pa|do|gt|hn|ni|sv|cu|pr|us|uk|ca|au|nz|br|pt|fr|de|it|nl|be|ch|at|se|no|dk|fi|pl|cz|hu|ro|bg|gr|ie|ie|is|lu|mt|cy|ee|lv|lt|sk|si|hr|rs|ba|mk|al|me|md|ua|by|ru|kz|ge|am|az|tr|il|ae|sa|kw|qa|bh|om|jo|lb|sy|iq|ir|af|pk|in|bd|lk|np|bt|mm|th|la|kh|vn|ph|my|sg|id|bn|tl|mn|kp|kr|jp|cn|tw|hk|mo|au|nz|fj|pg|nc|pf|ws|to|vu|sb|ki|nr|pw|fm|mh|as|gu|mp|vi|pr|do|ht|jm|bb|tt|gd|lc|vc|ag|dm|kn|bs|bz|gt|sv|hn|ni|cr|pa|co|ve|gy|sr|gf|br|uy|py|ar|cl|pe|bo|ec|co)$/i;
        if (!dominioRegex.test(email)) {
            return { valido: false, mensaje: 'El email debe tener un dominio válido (ej: .com, .co, .org)' };
        }
        
        return { valido: true, mensaje: '' };
    }
    
    // Validar teléfono (solo números)
    function validarTelefono(telefono) {
        if (!telefono || telefono.trim() === '') {
            return { valido: true, mensaje: '' }; // Teléfono es opcional
        }
        
        // Solo permitir números
        const regex = /^[0-9]+$/;
        if (!regex.test(telefono)) {
            return { valido: false, mensaje: 'El teléfono solo puede contener números' };
        }
        
        // Validar que tenga exactamente 10 dígitos
        if (telefono.length !== 10) {
            return { valido: false, mensaje: 'El teléfono debe tener exactamente 10 dígitos' };
        }
        
        return { valido: true, mensaje: '' };
    }
    
    // Validar contraseña (mínimo 8 caracteres, letras y números)
    function validarPassword(password) {
        if (!password || password.trim() === '') {
            return { valido: false, mensaje: 'La contraseña es requerida' };
        }
        
        if (password.length < 8) {
            return { valido: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' };
        }
        
        // Verificar que tenga al menos una letra
        const tieneLetra = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(password);
        if (!tieneLetra) {
            return { valido: false, mensaje: 'La contraseña debe contener al menos una letra' };
        }
        
        // Verificar que tenga al menos un número
        const tieneNumero = /[0-9]/.test(password);
        if (!tieneNumero) {
            return { valido: false, mensaje: 'La contraseña debe contener al menos un número' };
        }
        
        return { valido: true, mensaje: '' };
    }
    
    // Validar confirmación de contraseña
    function validarConfirmPassword(password, confirmPassword) {
        if (!confirmPassword || confirmPassword.trim() === '') {
            return { valido: false, mensaje: 'Debe confirmar la contraseña' };
        }
        
        if (password !== confirmPassword) {
            return { valido: false, mensaje: 'Las contraseñas no coinciden' };
        }
        
        return { valido: true, mensaje: '' };
    }
    
    // Validar todo el formulario
    function validarFormulario() {
        limpiarErrores();
        
        const nombre = document.getElementById('admin-nombre')?.value || '';
        const email = document.getElementById('admin-email')?.value || '';
        const telefono = document.getElementById('admin-telefono')?.value || '';
        const password = document.getElementById('admin-password')?.value || '';
        const confirmPassword = document.getElementById('admin-confirm-password')?.value || '';
        const rol = document.getElementById('admin-rol')?.value || '';
        
        let esValido = true;
        
        // Validar nombre
        const validacionNombre = validarNombre(nombre);
        if (!validacionNombre.valido) {
            mostrarError('nombre', validacionNombre.mensaje);
            esValido = false;
        }
        
        // Validar email
        const validacionEmail = validarEmail(email);
        if (!validacionEmail.valido) {
            mostrarError('email', validacionEmail.mensaje);
            esValido = false;
        }
        
        // Validar teléfono (opcional)
        const validacionTelefono = validarTelefono(telefono);
        if (!validacionTelefono.valido) {
            mostrarError('telefono', validacionTelefono.mensaje);
            esValido = false;
        }
        
        // Validar contraseña (solo si es nuevo usuario o si se está cambiando)
        if (!editingAdminId || password) {
            const validacionPassword = validarPassword(password);
            if (!validacionPassword.valido) {
                mostrarError('password', validacionPassword.mensaje);
                esValido = false;
            }
            
            // Validar confirmación de contraseña
            const validacionConfirm = validarConfirmPassword(password, confirmPassword);
            if (!validacionConfirm.valido) {
                mostrarError('confirm-password', validacionConfirm.mensaje);
                esValido = false;
            }
        }
        
        // Validar rol
        if (!rol) {
            showNotification('Debe seleccionar un rol', 'warning');
            esValido = false;
        }
        
        return esValido;
    }
    
    // Agregar validaciones en tiempo real
    function configurarValidacionesEnTiempoReal() {
        const nombreInput = document.getElementById('admin-nombre');
        const emailInput = document.getElementById('admin-email');
        const telefonoInput = document.getElementById('admin-telefono');
        const passwordInput = document.getElementById('admin-password');
        const confirmPasswordInput = document.getElementById('admin-confirm-password');
        
        if (nombreInput) {
            // Prevenir entrada de números y caracteres especiales (solo letras y espacios)
            nombreInput.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which || e.keyCode);
                // Permitir letras (incluyendo acentos), espacios, y teclas de control
                const regex = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/;
                
                // Permitir teclas de control (backspace, delete, tab, etc.)
                if (e.which === 8 || e.which === 0 || e.which === 9 || e.which === 46) {
                    return true;
                }
                
                if (!regex.test(char)) {
                    e.preventDefault();
                    return false;
                }
            });
            
            // También validar en input para casos de pegar texto
            nombreInput.addEventListener('input', function() {
                // Filtrar caracteres no permitidos
                const valorOriginal = this.value;
                const valorFiltrado = valorOriginal.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                
                if (valorOriginal !== valorFiltrado) {
                    this.value = valorFiltrado;
                    // Mostrar mensaje temporal
                    mostrarError('nombre', 'Solo se permiten letras y espacios');
                    setTimeout(() => {
                        ocultarError('nombre');
                    }, 2000);
                }
                
                const validacion = validarNombre(this.value);
                if (validacion.valido) {
                    ocultarError('nombre');
                } else {
                    mostrarError('nombre', validacion.mensaje);
                }
            });
            
            nombreInput.addEventListener('blur', function() {
                const validacion = validarNombre(this.value);
                if (!validacion.valido) {
                    mostrarError('nombre', validacion.mensaje);
                }
            });
        }
        
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                const validacion = validarEmail(this.value);
                if (validacion.valido) {
                    ocultarError('email');
                } else {
                    mostrarError('email', validacion.mensaje);
                }
            });
            
            emailInput.addEventListener('blur', function() {
                const validacion = validarEmail(this.value);
                if (!validacion.valido) {
                    mostrarError('email', validacion.mensaje);
                }
            });
        }
        
        if (telefonoInput) {
            // Prevenir entrada de letras (solo números)
            telefonoInput.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which || e.keyCode);
                // Solo permitir números
                const regex = /[0-9]/;
                
                // Permitir teclas de control (backspace, delete, tab, etc.)
                if (e.which === 8 || e.which === 0 || e.which === 9 || e.which === 46) {
                    return true;
                }
                
                // Limitar a 10 dígitos
                if (this.value.length >= 10) {
                    e.preventDefault();
                    return false;
                }
                
                if (!regex.test(char)) {
                    e.preventDefault();
                    return false;
                }
            });
            
            // También validar en input para casos de pegar texto
            telefonoInput.addEventListener('input', function() {
                // Filtrar caracteres no permitidos (solo números)
                this.value = this.value.replace(/[^0-9]/g, '');
                
                // Limitar a 10 dígitos
                if (this.value.length > 10) {
                    this.value = this.value.substring(0, 10);
                }
                
                // Validar en tiempo real
                const validacion = validarTelefono(this.value);
                if (validacion.valido) {
                    ocultarError('telefono');
                } else {
                    mostrarError('telefono', validacion.mensaje);
                }
            });
            
            telefonoInput.addEventListener('blur', function() {
                const validacion = validarTelefono(this.value);
                if (!validacion.valido) {
                    mostrarError('telefono', validacion.mensaje);
                }
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const validacion = validarPassword(this.value);
                if (validacion.valido) {
                    ocultarError('password');
                } else {
                    mostrarError('password', validacion.mensaje);
                }
                
                // Validar confirmación también
                const confirmPassword = document.getElementById('admin-confirm-password')?.value || '';
                if (confirmPassword) {
                    const validacionConfirm = validarConfirmPassword(this.value, confirmPassword);
                    if (validacionConfirm.valido) {
                        ocultarError('confirm-password');
                    } else {
                        mostrarError('confirm-password', validacionConfirm.mensaje);
                    }
                }
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                const password = document.getElementById('admin-password')?.value || '';
                const validacion = validarConfirmPassword(password, this.value);
                if (validacion.valido) {
                    ocultarError('confirm-password');
                } else {
                    mostrarError('confirm-password', validacion.mensaje);
                }
            });
        }
    }
    
    // Guardar administrador
    async function guardarAdministrador() {
        try {
            const form = document.getElementById('administrador-form');
            if (!form) return;
            
            // Validar formulario antes de enviar
            if (!validarFormulario()) {
                showNotification('Por favor corrija los errores en el formulario', 'warning');
                return;
            }
            
            const formData = new FormData(form);
            const idRol = parseInt(formData.get('id_rol')) || 1;
            
            // Preparar datos según la estructura real de la tabla usuarios
            const datos = {
                nombre_usuario: formData.get('nombre') || formData.get('nombre_usuario'),
                email: formData.get('email'),
                telefono: formData.get('telefono') || null,
                direccion: formData.get('direccion') || null,
                clave: formData.get('password'), // El backend espera 'clave', no 'password'
                id_rol: idRol
            };
            
            // Si estamos editando y no hay contraseña, no enviarla
            if (editingAdminId && !datos.clave) {
                delete datos.clave;
            }
            
            // Log de diagnóstico
            console.log('📋 Datos del formulario:', datos);
            
            // Mostrar loading
            mostrarLoading();
            
            let response;
            if (editingAdminId) {
                // Actualizar administrador existente
                console.log('✏️ Actualizando administrador:', editingAdminId);
                response = await fetch(`${API_BASE_URL}/usuarios/${editingAdminId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
            } else {
                // Crear nuevo administrador
                console.log('➕ Creando nuevo administrador:', datos);
                response = await fetch(`${API_BASE_URL}/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
            }
            
            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                // Intentar obtener el mensaje de error más detallado
                let errorMessage = 'Error al guardar administrador';
                try {
                    const errorData = await response.json();
                    console.error('❌ Error detallado del servidor:', errorData);
                    errorMessage = errorData.error || errorData.mensaje || errorMessage;
                    
                    // Detectar tipo de error y mostrar mensaje específico
                    if (errorMessage.includes('correo electrónico') || errorMessage.includes('email')) {
                        errorMessage = 'El correo electrónico ya está registrado. Por favor, usa otro correo.';
                    }
                    
                    // Si hay detalles adicionales, mostrarlos
                    if (errorData.detalles) {
                        errorMessage += ': ' + errorData.detalles;
                    }
                } catch (e) {
                    const errorText = await response.text();
                    console.error('❌ Error (texto):', errorText);
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            const resultado = await response.json();
            console.log('✅ Respuesta exitosa:', resultado);
            
            // Ocultar loading
            ocultarLoading();
            
            // Mostrar mensaje de éxito
            showNotification(resultado.mensaje || 'Administrador guardado exitosamente', 'success');
            
            // Volver a la lista
            setTimeout(() => {
                mostrarListaAdministradores();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Error completo al guardar administrador:', error);
            ocultarLoading();
            showNotification(`Error al guardar administrador: ${error.message}`, 'error');
        }
    }
    
    // Eliminar administrador
    async function eliminarAdministrador(adminId) {
        try {
            if (!confirm('¿Estás seguro de que quieres eliminar este administrador?')) {
                return;
            }
            
            // Mostrar loading
            mostrarLoading();
            
            const response = await fetch(`${API_BASE_URL}/usuarios/${adminId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar administrador');
            }
            
            const resultado = await response.json();
            
            // Ocultar loading
            ocultarLoading();
            
            // Mostrar mensaje de éxito
            showNotification(resultado.mensaje || 'Administrador eliminado exitosamente', 'success');
            
            // Actualizar lista
            setTimeout(() => {
                mostrarListaAdministradores();
            }, 1500);
            
        } catch (error) {
            console.error('Error al eliminar administrador:', error);
            ocultarLoading();
            showNotification(`Error al eliminar administrador: ${error.message}`, 'error');
        }
    }
    
    // ===== GESTIÓN DE ROLES =====
    
    // Definir las secciones del panel administrativo (basadas en data-section del sidebar)
    const SECCIONES_PANEL = [
        { id: 'dashboard', nombre: 'Dashboard', descripcion: 'Panel principal' },
        { id: 'productos', nombre: 'Productos', descripcion: 'Gestión de productos' },
        { id: 'categorias', nombre: 'Categorías', descripcion: 'Gestión de categorías' },
        { id: 'usuarios', nombre: 'Usuarios', descripcion: 'Gestión de usuarios' },
        { id: 'pedidos', nombre: 'Pedidos', descripcion: 'Gestión de pedidos' },
        { id: 'inventario', nombre: 'Inventario', descripcion: 'Control de inventario' },
        { id: 'proveedores', nombre: 'Proveedores', descripcion: 'Gestión de proveedores' },
        { id: 'compras', nombre: 'Compras', descripcion: 'Gestión de compras' },
        { id: 'recetas', nombre: 'Recetas', descripcion: 'Gestión de recetas' },
        { id: 'produccion', nombre: 'Producción', descripcion: 'Control de producción' },
        { id: 'notificaciones', nombre: 'Notificaciones', descripcion: 'Autorizar notificaciones' },
        { id: 'reportes-ventas', nombre: 'Reportes de Ventas', descripcion: 'Ver reportes de ventas' }
    ];
    
    let allRoles = [];
    let editingRolId = null;
    
    // Mostrar sección de roles
    function mostrarRoles() {
        mostrarSeccion('roles');
        modalTitle.textContent = 'Gestión de Roles y Permisos';
        mostrarAccionesRoles();
    }
    
    // Mostrar acciones de roles (botones crear/listar)
    function mostrarAccionesRoles() {
        const formSection = document.getElementById('administradores-rol-form-section');
        const listSection = document.getElementById('administradores-roles-list-section');
        const actionsDiv = document.querySelector('.administradores-roles-actions');
        
        if (formSection) formSection.style.display = 'none';
        if (listSection) listSection.style.display = 'none';
        if (actionsDiv) actionsDiv.style.display = 'flex';
    }
    
    // Mostrar formulario de crear/editar rol
    function mostrarFormularioRol(rolId = null) {
        editingRolId = rolId;
        const actionsDiv = document.querySelector('.administradores-roles-actions');
        const listSection = document.getElementById('administradores-roles-list-section');
        const formSection = document.getElementById('administradores-rol-form-section');
        
        if (actionsDiv) actionsDiv.style.display = 'none';
        if (listSection) listSection.style.display = 'none';
        if (formSection) formSection.style.display = 'block';
        
        const formTitle = document.getElementById('rol-form-title');
        const nombreInput = document.getElementById('rol-nombre');
        
        if (rolId) {
            if (formTitle) formTitle.textContent = 'Editar Rol';
            cargarRolParaEditar(rolId);
        } else {
            if (formTitle) formTitle.textContent = 'Crear Nuevo Rol';
            if (nombreInput) nombreInput.value = '';
            limpiarPermisosSeleccionados();
        }
        
        cargarPermisosEnGrid();
    }
    
    // Cargar permisos en el grid de checkboxes
    function cargarPermisosEnGrid() {
        const permisosGrid = document.getElementById('permisos-grid');
        if (!permisosGrid) return;
        
        permisosGrid.innerHTML = '';
        
        SECCIONES_PANEL.forEach(seccion => {
            const permisoItem = document.createElement('div');
            permisoItem.className = 'administradores-permiso-item';
            permisoItem.innerHTML = `
                <label class="administradores-permiso-checkbox">
                    <input type="checkbox" name="permisos" value="${seccion.id}" 
                        class="permiso-checkbox" data-seccion="${seccion.id}">
                    <div class="permiso-info">
                        <strong>${seccion.nombre}</strong>
                        <small>${seccion.descripcion}</small>
                    </div>
                </label>
            `;
            permisosGrid.appendChild(permisoItem);
        });
    }
    
    // Cargar rol para editar
    async function cargarRolParaEditar(rolId) {
        try {
            mostrarLoading();
            const response = await fetch(`${API_BASE_URL}/roles/${rolId}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar rol');
            }
            
            const rol = await response.json();
            const nombreInput = document.getElementById('rol-nombre');
            if (nombreInput) {
                nombreInput.value = rol.nombre_rol || '';
            }
            
            // Marcar permisos seleccionados
            limpiarPermisosSeleccionados();
            if (rol.permisos && Array.isArray(rol.permisos)) {
                rol.permisos.forEach(permiso => {
                    const permisoNombre = permiso.nombre || permiso.nombre_permiso;
                    const checkbox = document.querySelector(`input[value="${permisoNombre}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
            
            ocultarLoading();
        } catch (error) {
            console.error('Error al cargar rol:', error);
            ocultarLoading();
            showNotification('Error al cargar el rol', 'error');
        }
    }
    
    // Limpiar selección de permisos
    function limpiarPermisosSeleccionados() {
        document.querySelectorAll('.permiso-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // Guardar rol (crear o actualizar)
    async function guardarRol(event) {
        event.preventDefault();
        
        const nombreInput = document.getElementById('rol-nombre');
        if (!nombreInput) return;
        
        const nombreRol = nombreInput.value.trim();
        if (!nombreRol) {
            showNotification('El nombre del rol es requerido', 'error');
            return;
        }
        
        const permisosSeleccionados = Array.from(document.querySelectorAll('.permiso-checkbox:checked'))
            .map(checkbox => checkbox.value);
        
        if (permisosSeleccionados.length === 0) {
            showNotification('Debes seleccionar al menos un permiso', 'error');
            return;
        }
        
        try {
            mostrarLoading();
            
            // Obtener todos los permisos existentes
            const permisosResponse = await fetch(`${API_BASE_URL}/permisos`);
            if (!permisosResponse.ok) {
                throw new Error('Error al obtener permisos');
            }
            const permisosExistentes = await permisosResponse.json();
            
            // Crear permisos que no existan
            const permisosIds = [];
            for (const permisoNombre of permisosSeleccionados) {
                let permiso = permisosExistentes.find(p => p.nombre_permiso === permisoNombre);
                
                if (!permiso) {
                    // Crear el permiso si no existe
                    const crearPermisoResponse = await fetch(`${API_BASE_URL}/permisos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre_permiso: permisoNombre,
                            descripcion: `Acceso a la sección ${permisoNombre}`
                        })
                    });
                    
                    if (crearPermisoResponse.ok) {
                        const nuevoPermiso = await crearPermisoResponse.json();
                        let idPermiso = nuevoPermiso.id_permiso || nuevoPermiso.insertId;
                        
                        // Si no se obtuvo el ID de la respuesta, buscar el permiso recién creado
                        if (!idPermiso) {
                            console.warn('No se recibió el ID en la respuesta, buscando el permiso por nombre...');
                            // Recargar la lista de permisos para obtener el recién creado
                            const permisosActualizadosResponse = await fetch(`${API_BASE_URL}/permisos`);
                            if (permisosActualizadosResponse.ok) {
                                const permisosActualizados = await permisosActualizadosResponse.json();
                                const permisoCreado = permisosActualizados.find(p => p.nombre_permiso === permisoNombre);
                                if (permisoCreado) {
                                    idPermiso = permisoCreado.id_permiso;
                                    console.log(`Permiso encontrado después de crear: ${permisoNombre} con ID: ${idPermiso}`);
                                }
                            }
                        }
                        
                        if (idPermiso) {
                            permisosIds.push(idPermiso);
                            console.log(`Permiso creado: ${permisoNombre} con ID: ${idPermiso}`);
                        } else {
                            console.error('No se pudo obtener el ID del permiso creado:', nuevoPermiso);
                            throw new Error(`No se pudo obtener el ID del permiso ${permisoNombre}. Por favor, recarga la página e intenta nuevamente.`);
                        }
                    } else {
                        const error = await crearPermisoResponse.json();
                        throw new Error(`Error al crear permiso ${permisoNombre}: ${error.error || 'Error desconocido'}`);
                    }
                } else {
                    permisosIds.push(permiso.id_permiso);
                    console.log(`Permiso existente: ${permisoNombre} con ID: ${permiso.id_permiso}`);
                }
            }
            
            console.log('Permisos IDs a enviar:', permisosIds);
            
            // Validar que tengamos al menos un permiso válido
            if (permisosIds.length === 0) {
                throw new Error('No se pudieron obtener los IDs de los permisos');
            }
            
            // Crear o actualizar el rol
            const url = editingRolId 
                ? `${API_BASE_URL}/roles/${editingRolId}`
                : `${API_BASE_URL}/roles`;
            
            const method = editingRolId ? 'PUT' : 'POST';
            
            const datosRol = {
                nombre_rol: nombreRol,
                permisos: permisosIds
            };
            
            console.log('Enviando datos del rol:', datosRol);
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosRol)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar rol');
            }
            
            const resultado = await response.json();
            ocultarLoading();
            showNotification(resultado.mensaje || 'Rol guardado exitosamente', 'success');
            
            // Limpiar cache de permisos para que se recarguen
            if (window.PermisosAdmin && window.PermisosAdmin.limpiarCachePermisos) {
                window.PermisosAdmin.limpiarCachePermisos();
            }
            
            // Recargar roles en el select del formulario para que estén actualizados
            cargarRolesEnSelect();
            
            // Volver a la lista de roles
            setTimeout(() => {
                mostrarListaRoles();
            }, 1500);
            
        } catch (error) {
            console.error('Error al guardar rol:', error);
            ocultarLoading();
            showNotification(`Error al guardar rol: ${error.message}`, 'error');
        }
    }
    
    // Mostrar lista de roles
    async function mostrarListaRoles() {
        const actionsDiv = document.querySelector('.administradores-roles-actions');
        const formSection = document.getElementById('administradores-rol-form-section');
        const listSection = document.getElementById('administradores-roles-list-section');
        
        if (actionsDiv) actionsDiv.style.display = 'none';
        if (formSection) formSection.style.display = 'none';
        if (listSection) listSection.style.display = 'block';
        
        await cargarRoles();
    }
    
    // Cargar roles desde la API
    async function cargarRoles() {
        try {
            mostrarLoading();
            const response = await fetch(`${API_BASE_URL}/roles`);
            
            if (!response.ok) {
                throw new Error('Error al cargar roles');
            }
            
            allRoles = await response.json();
            await renderizarTablaRoles(allRoles);
            ocultarLoading();
        } catch (error) {
            console.error('Error al cargar roles:', error);
            ocultarLoading();
            showNotification('Error al cargar los roles', 'error');
        }
    }
    
    // Renderizar tabla de roles
    async function renderizarTablaRoles(roles) {
        const tbody = document.getElementById('roles-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (roles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay roles registrados</td></tr>';
            return;
        }
        
        for (const rol of roles) {
            // Obtener permisos del rol
            let permisosNombres = 'Sin permisos';
            try {
                const rolDetalleResponse = await fetch(`${API_BASE_URL}/roles/${rol.id_rol}`);
                if (rolDetalleResponse.ok) {
                    const rolDetalle = await rolDetalleResponse.json();
                    if (rolDetalle.permisos && Array.isArray(rolDetalle.permisos)) {
                        permisosNombres = rolDetalle.permisos
                            .map(p => p.nombre || p.nombre_permiso)
                            .join(', ');
                    }
                }
            } catch (error) {
                console.error('Error al cargar permisos del rol:', error);
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rol.id_rol}</td>
                <td><strong>${rol.nombre_rol}</strong></td>
                <td>
                    <div class="permisos-badges" style="font-size: 0.875rem; color: #4b5563;">
                        ${permisosNombres}
                    </div>
                </td>
                <td>${rol.cantidad_usuarios || 0}</td>
                <td>
                    <div class="administradores-table-actions">
                        <button class="administradores-table-btn administradores-table-btn-edit" 
                            onclick="editarRol(${rol.id_rol})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="administradores-table-btn administradores-table-btn-delete" 
                            onclick="eliminarRol(${rol.id_rol})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
    
    // Editar rol
    window.editarRol = function(rolId) {
        mostrarFormularioRol(rolId);
    };
    
    // Eliminar rol
    window.eliminarRol = async function(rolId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este rol? Los usuarios con este rol perderán sus permisos.')) {
            return;
        }
        
        try {
            mostrarLoading();
            const response = await fetch(`${API_BASE_URL}/roles/${rolId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar rol');
            }
            
            const resultado = await response.json();
            ocultarLoading();
            showNotification(resultado.mensaje || 'Rol eliminado exitosamente', 'success');
            
            // Limpiar cache de permisos
            if (window.PermisosAdmin && window.PermisosAdmin.limpiarCachePermisos) {
                window.PermisosAdmin.limpiarCachePermisos();
            }
            
            // Recargar roles en el select del formulario para que estén actualizados
            cargarRolesEnSelect();
            
            // Actualizar lista
            setTimeout(() => {
                cargarRoles();
            }, 1500);
            
        } catch (error) {
            console.error('Error al eliminar rol:', error);
            ocultarLoading();
            showNotification(`Error al eliminar rol: ${error.message}`, 'error');
        }
    };
    
    // Filtrar roles
    function filtrarRoles(termino) {
        if (!termino.trim()) {
            renderizarTablaRoles(allRoles);
            return;
        }
        
        const lowerTerm = termino.toLowerCase();
        const rolesFiltrados = allRoles.filter(rol =>
            rol.nombre_rol.toLowerCase().includes(lowerTerm)
        );
        
        renderizarTablaRoles(rolesFiltrados);
    }
    
    // ===== FUNCIONES DE UI =====
    
    // Mostrar loading
    function mostrarLoading() {
        const loadingOverlay = document.getElementById('administradores-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }
    
    // Ocultar loading
    function ocultarLoading() {
        const loadingOverlay = document.getElementById('administradores-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
    
    // Mostrar notificación
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // ===== EVENT LISTENERS =====
    
    // Botones de acción principales
    if (btnCrearAdmin) {
        btnCrearAdmin.addEventListener('click', mostrarFormularioCrear);
    }
    
    if (btnListarAdmins) {
        btnListarAdmins.addEventListener('click', mostrarListaAdministradores);
    }
    
    if (btnAsignarRoles) {
        btnAsignarRoles.addEventListener('click', mostrarRoles);
    }
    
    // Event listeners para gestión de roles (se agregan después de que el DOM esté listo)
    setTimeout(() => {
        const btnCrearRol = document.getElementById('btn-crear-rol');
        const btnListarRoles = document.getElementById('btn-listar-roles');
        const rolForm = document.getElementById('rol-form');
        const cancelRolForm = document.getElementById('cancel-rol-form');
        const rolesSearch = document.getElementById('roles-search');
        
        if (btnCrearRol) {
            btnCrearRol.addEventListener('click', () => mostrarFormularioRol());
        }
        
        if (btnListarRoles) {
            btnListarRoles.addEventListener('click', mostrarListaRoles);
        }
        
        if (rolForm) {
            rolForm.addEventListener('submit', guardarRol);
        }
        
        if (cancelRolForm) {
            cancelRolForm.addEventListener('click', () => {
                mostrarAccionesRoles();
            });
        }
        
        if (rolesSearch) {
            rolesSearch.addEventListener('input', (e) => {
                filtrarRoles(e.target.value);
            });
        }
    }, 100);
    
    // Búsqueda
    if (administradoresSearch) {
        administradoresSearch.addEventListener('input', function() {
            filtrarAdministradores(this.value);
        });
    }
    
    // Formulario - submit
    const form = document.getElementById('administrador-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarAdministrador();
        });
    }
    
    // Botón guardar
    if (btnSaveAdmin) {
        btnSaveAdmin.addEventListener('click', function(e) {
            e.preventDefault();
            guardarAdministrador();
        });
    }
    
    // Botón cerrar modal
    const closeBtn = document.getElementById('administradores-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            window.location.href = 'usuarios-admin.html';
        });
    }
    
    // Cerrar modal al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                ocultarModal();
            }
        });
    }
    
    // Botón volver
    const btnVolver = document.getElementById('cancel-administradores');
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            // Volver al panel de administración
            ocultarModal();
        });
    }
    
    // ===== FUNCIONES GLOBALES =====
    
    // Funciones globales para los botones de la tabla
    window.editarAdministrador = function(adminId) {
        mostrarFormularioEditar(adminId);
    };
    
    window.eliminarAdministrador = function(adminId) {
        eliminarAdministrador(adminId);
    };
    
    window.asignarRolesAdministrador = function(adminId) {
        showNotification(`Asignar roles al administrador ${adminId} (funcionalidad en desarrollo)`, 'info');
    };
    
    // Función global para mostrar el modal
    window.mostrarModalAdministradores = function() {
        mostrarModal();
    };
    
    // Cargar roles al inicio (tanto para la tabla como para el select)
    cargarRoles();
    cargarRolesEnSelect();
    
    // Mostrar modal automáticamente al cargar la página
    setTimeout(() => {
        mostrarModal();
    }, 100);
});
