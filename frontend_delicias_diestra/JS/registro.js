
// Registro de usuarios - Jonathan Rodriguez ADSO

// Validar nombre: solo letras, máximo 2 nombres
function validarNombre(nombre) {
    const nombreTrimmed = nombre.trim();
    
    // Verificar que no esté vacío
    if (!nombreTrimmed) {
        return {
            valid: false,
            message: 'El nombre es requerido'
        };
    }
    
    // Verificar que solo contenga letras, espacios y caracteres especiales permitidos (acentos, ñ)
    const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    if (!soloLetrasRegex.test(nombreTrimmed)) {
        return {
            valid: false,
            message: 'El nombre solo puede contener letras (sin números ni caracteres especiales)'
        };
    }
    
    // Verificar que tenga máximo 2 palabras (nombres)
    const palabras = nombreTrimmed.split(/\s+/).filter(palabra => palabra.length > 0);
    if (palabras.length > 2) {
        return {
            valid: false,
            message: 'El nombre puede tener máximo dos nombres (ej: Andres Felipe)'
        };
    }
    
    // Verificar que cada palabra tenga al menos 2 caracteres
    for (const palabra of palabras) {
        if (palabra.length < 2) {
            return {
                valid: false,
                message: 'Cada nombre debe tener al menos 2 letras'
            };
        }
    }
    
    // Verificar longitud total
    if (nombreTrimmed.length > 50) {
        return {
            valid: false,
            message: 'El nombre no puede exceder 50 caracteres'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar error de nombre
function showNombreError(message) {
    const errorElement = document.getElementById('error-nombre');
    const nombreInput = document.getElementById('nombre');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (nombreInput) {
        nombreInput.classList.remove('success');
        nombreInput.classList.add('error');
    }
}

// Ocultar error de nombre y mostrar éxito
function hideNombreError() {
    const errorElement = document.getElementById('error-nombre');
    const nombreInput = document.getElementById('nombre');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (nombreInput) {
        nombreInput.classList.remove('error');
        if (nombreInput.value.trim()) {
            nombreInput.classList.add('success');
        }
    }
}

// Validar apellido: solo letras, máximo 2 apellidos
function validarApellido(apellido) {
    const apellidoTrimmed = apellido.trim();
    
    if (!apellidoTrimmed) {
        return {
            valid: false,
            message: 'El apellido es requerido'
        };
    }
    
    const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    if (!soloLetrasRegex.test(apellidoTrimmed)) {
        return {
            valid: false,
            message: 'El apellido solo puede contener letras (sin números ni caracteres especiales)'
        };
    }
    
    const palabras = apellidoTrimmed.split(/\s+/).filter(palabra => palabra.length > 0);
    if (palabras.length > 2) {
        return {
            valid: false,
            message: 'El apellido puede tener máximo dos apellidos (ej: González Martínez)'
        };
    }
    
    for (const palabra of palabras) {
        if (palabra.length < 2) {
            return {
                valid: false,
                message: 'Cada apellido debe tener al menos 2 letras'
            };
        }
    }
    
    if (apellidoTrimmed.length > 50) {
        return {
            valid: false,
            message: 'El apellido no puede exceder 50 caracteres'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de apellido
function showApellidoError(message) {
    const errorElement = document.getElementById('error-apellido');
    const apellidoInput = document.getElementById('apellido');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (apellidoInput) {
        apellidoInput.classList.remove('success');
        apellidoInput.classList.add('error');
    }
}

function hideApellidoError() {
    const errorElement = document.getElementById('error-apellido');
    const apellidoInput = document.getElementById('apellido');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (apellidoInput) {
        apellidoInput.classList.remove('error');
        if (apellidoInput.value.trim()) {
            apellidoInput.classList.add('success');
        }
    }
}

// Validar número de documento
function validarNumeroDocumento(numero) {
    const numeroTrimmed = numero.trim();
    
    if (!numeroTrimmed) {
        return {
            valid: false,
            message: 'El número de documento es requerido'
        };
    }
    
    // Solo números
    if (!/^\d+$/.test(numeroTrimmed)) {
        return {
            valid: false,
            message: 'El número de documento solo puede contener números'
        };
    }
    
    // Validar longitud: mínimo 6, máximo 11 dígitos
    if (numeroTrimmed.length < 6) {
        return {
            valid: false,
            message: 'El número de documento debe tener al menos 6 dígitos'
        };
    }
    
    if (numeroTrimmed.length > 11) {
        return {
            valid: false,
            message: 'El número de documento no puede exceder 11 dígitos'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de número de documento
function showNumeroDocumentoError(message) {
    const errorElement = document.getElementById('error-numero-documento');
    const numeroInput = document.getElementById('numero_documento');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (numeroInput) {
        numeroInput.classList.remove('success');
        numeroInput.classList.add('error');
    }
}

function hideNumeroDocumentoError() {
    const errorElement = document.getElementById('error-numero-documento');
    const numeroInput = document.getElementById('numero_documento');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (numeroInput) {
        numeroInput.classList.remove('error');
        if (numeroInput.value.trim()) {
            numeroInput.classList.add('success');
        }
    }
}

// Validar dirección
function validarDireccion(direccion) {
    const direccionTrimmed = direccion.trim();
    
    if (!direccionTrimmed) {
        return {
            valid: false,
            message: 'La dirección es requerida'
        };
    }
    
    if (direccionTrimmed.length < 10) {
        return {
            valid: false,
            message: 'La dirección debe tener al menos 10 caracteres'
        };
    }
    
    if (direccionTrimmed.length > 200) {
        return {
            valid: false,
            message: 'La dirección no puede exceder 200 caracteres'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de dirección
function showDireccionError(message) {
    const errorElement = document.getElementById('error-direccion');
    const direccionInput = document.getElementById('direccion');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (direccionInput) {
        direccionInput.classList.remove('success');
        direccionInput.classList.add('error');
    }
}

function hideDireccionError() {
    const errorElement = document.getElementById('error-direccion');
    const direccionInput = document.getElementById('direccion');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (direccionInput) {
        direccionInput.classList.remove('error');
        if (direccionInput.value.trim()) {
            direccionInput.classList.add('success');
        }
    }
}

// Validar teléfono
function validarTelefono(telefono) {
    const telefonoTrimmed = telefono.trim();
    
    if (!telefonoTrimmed) {
        return {
            valid: false,
            message: 'El teléfono es requerido'
        };
    }
    
    // Solo números
    if (!/^\d+$/.test(telefonoTrimmed)) {
        return {
            valid: false,
            message: 'El teléfono solo puede contener números'
        };
    }
    
    // Exactamente 10 dígitos
    if (telefonoTrimmed.length !== 10) {
        return {
            valid: false,
            message: 'El teléfono debe tener exactamente 10 dígitos'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de teléfono
function showTelefonoError(message) {
    const errorElement = document.getElementById('error-telefono');
    const telefonoInput = document.getElementById('telefono');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (telefonoInput) {
        telefonoInput.classList.remove('success');
        telefonoInput.classList.add('error');
    }
}

function hideTelefonoError() {
    const errorElement = document.getElementById('error-telefono');
    const telefonoInput = document.getElementById('telefono');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (telefonoInput) {
        telefonoInput.classList.remove('error');
        if (telefonoInput.value.trim()) {
            telefonoInput.classList.add('success');
        }
    }
}

// Validar contraseña
function validarPassword(password) {
    if (!password) {
        return {
            valid: false,
            message: 'La contraseña es requerida'
        };
    }
    
    if (password.length < 8) {
        return {
            valid: false,
            message: 'La contraseña debe tener al menos 8 caracteres'
        };
    }
    
    if (password.length > 100) {
        return {
            valid: false,
            message: 'La contraseña no puede exceder 100 caracteres'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de contraseña
function showPasswordError(message) {
    const errorElement = document.getElementById('error-password');
    const passwordInput = document.getElementById('password');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (passwordInput) {
        passwordInput.classList.remove('success');
        passwordInput.classList.add('error');
    }
}

function hidePasswordError() {
    const errorElement = document.getElementById('error-password');
    const passwordInput = document.getElementById('password');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (passwordInput) {
        passwordInput.classList.remove('error');
        if (passwordInput.value.trim()) {
            passwordInput.classList.add('success');
        }
    }
}

// Validar confirmación de contraseña
function validarConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
        return {
            valid: false,
            message: 'Debes confirmar tu contraseña'
        };
    }
    
    if (password !== confirmPassword) {
        return {
            valid: false,
            message: 'Las contraseñas no coinciden'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de confirmación de contraseña
function showConfirmPasswordError(message) {
    const errorElement = document.getElementById('error-confirm-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.classList.remove('success');
        confirmPasswordInput.classList.add('error');
    }
}

function hideConfirmPasswordError() {
    const errorElement = document.getElementById('error-confirm-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.classList.remove('error');
        if (confirmPasswordInput.value.trim()) {
            confirmPasswordInput.classList.add('success');
        }
    }
}

// Validar tipo de documento
function validarTipoDocumento(tipoDocumento) {
    if (!tipoDocumento || tipoDocumento === '') {
        return {
            valid: false,
            message: 'Debes seleccionar un tipo de documento'
        };
    }
    
    const tiposValidos = ['CC', 'CE', 'NIT'];
    if (!tiposValidos.includes(tipoDocumento)) {
        return {
            valid: false,
            message: 'Tipo de documento inválido'
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Mostrar/ocultar error de tipo de documento
function showTipoDocumentoError(message) {
    const errorElement = document.getElementById('error-tipo-documento');
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (tipoDocumentoSelect) {
        tipoDocumentoSelect.classList.remove('success');
        tipoDocumentoSelect.classList.add('error');
    }
}

function hideTipoDocumentoError() {
    const errorElement = document.getElementById('error-tipo-documento');
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    if (tipoDocumentoSelect) {
        tipoDocumentoSelect.classList.remove('error');
        if (tipoDocumentoSelect.value) {
            tipoDocumentoSelect.classList.add('success');
        }
    }
}

// Mostrar/ocultar error de email
function showEmailError(message) {
    let errorDiv = document.getElementById('email-error');
    const emailInput = document.getElementById('email');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'email-error';
        errorDiv.className = 'form-error';
        const emailGroup = emailInput.closest('.form-group');
        if (emailGroup) {
            emailGroup.appendChild(errorDiv);
        }
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    if (emailInput) {
        emailInput.classList.remove('success');
        emailInput.classList.add('error');
    }
}

function hideEmailError() {
    const errorDiv = document.getElementById('email-error');
    const emailInput = document.getElementById('email');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    if (emailInput) {
        emailInput.classList.remove('error');
        if (emailInput.value.trim()) {
            emailInput.classList.add('success');
        }
    }
}

// ========================================
// FUNCIÓN PARA MOSTRAR ERRORES DEL BACKEND
// ========================================
/**
 * Muestra un error del backend de forma clara y resalta el campo problemático
 * @param {string} mensaje - Mensaje de error detallado del backend
 * @param {string|null} campoId - ID del campo que tiene el error (null si es error general)
 */
function mostrarErrorRegistro(mensaje, campoId) {
    // Limpiar errores previos de todos los campos
    const campos = ['numero_documento', 'email', 'telefono', 'tipo_documento'];
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.classList.remove('error');
        }
    });
    
    // Resaltar el campo específico con error
    if (campoId) {
        const campoInput = document.getElementById(campoId);
        if (campoInput) {
            // Agregar clase de error
            campoInput.classList.add('error');
            campoInput.classList.remove('success');
            
            // Hacer scroll suave al campo
            campoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Enfocar el campo después de un pequeño delay
            setTimeout(() => {
                campoInput.focus();
                // Seleccionar el texto si es un input de texto
                if (campoInput.type === 'text' || campoInput.type === 'email' || campoInput.type === 'tel') {
                    campoInput.select();
                }
            }, 300);
            
            // Mostrar mensaje de error específico del campo
            mostrarErrorCampo(campoId, mensaje);
        }
    }
    
    // Mostrar notificación clara al usuario
    const icono = campoId ? '⚠️' : '❌';
    const titulo = campoId ? 'Campo con error' : 'Error en el registro';
    
    // Crear mensaje formateado
    let mensajeFormateado = `${icono} ${titulo}\n\n${mensaje}`;
    
    if (campoId) {
        const nombreCampo = obtenerNombreCampo(campoId);
        mensajeFormateado = `${icono} Error en el campo "${nombreCampo}"\n\n${mensaje}`;
    }
    
    // Mostrar alerta con el mensaje detallado
    alert(mensajeFormateado);
}

/**
 * Obtiene el nombre legible del campo
 */
function obtenerNombreCampo(campoId) {
    const nombres = {
        'numero_documento': 'Número de documento',
        'email': 'Correo electrónico',
        'telefono': 'Teléfono',
        'tipo_documento': 'Tipo de documento'
    };
    return nombres[campoId] || campoId;
}

/**
 * Muestra el error en el campo específico del formulario
 */
function mostrarErrorCampo(campoId, mensaje) {
    // Mapeo de campos a sus elementos de error
    const mapeoErrores = {
        'numero_documento': 'error-numero-documento',
        'email': 'email-error',
        'telefono': 'error-telefono',
        'tipo_documento': 'error-tipo-documento'
    };
    
    const errorId = mapeoErrores[campoId];
    if (errorId) {
        let errorElement = document.getElementById(errorId);
        if (!errorElement) {
            // Si no existe, crear el elemento de error
            const campoInput = document.getElementById(campoId);
            if (campoInput) {
                const formGroup = campoInput.closest('.form-group');
                if (formGroup) {
                    errorElement = document.createElement('div');
                    errorElement.id = errorId;
                    errorElement.className = 'form-error';
                    formGroup.appendChild(errorElement);
                }
            }
        }
        
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.style.display = 'block';
            errorElement.style.color = '#dc3545';
        }
    }
}

// ========================================
// FUNCIONES PARA MODALES
// ========================================

// Función para abrir el modal de términos y condiciones
function abrirModalTerminos() {
    const modal = document.getElementById('modal-terminos');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
}

// Función para cerrar el modal de términos y condiciones
function cerrarModalTerminos() {
    const modal = document.getElementById('modal-terminos');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll del body
    }
}

// Función para abrir el modal de política de privacidad
function abrirModalPrivacidad() {
    const modal = document.getElementById('modal-privacidad');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
}

// Función para cerrar el modal de política de privacidad
function cerrarModalPrivacidad() {
    const modal = document.getElementById('modal-privacidad');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll del body
    }
}

// Hacer las funciones globales para que estén disponibles en onclick
window.abrirModalTerminos = abrirModalTerminos;
window.cerrarModalTerminos = cerrarModalTerminos;
window.abrirModalPrivacidad = abrirModalPrivacidad;
window.cerrarModalPrivacidad = cerrarModalPrivacidad;

// Función para cerrar modales al hacer clic fuera del contenido
function cerrarModalAlClicExterior(event) {
    if (event.target.classList.contains('modal')) {
        const modal = event.target;
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Función para cerrar modales con la tecla Escape
function cerrarModalConEscape(event) {
    if (event.key === 'Escape') {
        const modalesAbiertos = document.querySelectorAll('.modal.show');
        modalesAbiertos.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// INICIALIZACIÓN DE EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para cerrar modales
    document.addEventListener('click', cerrarModalAlClicExterior);
    document.addEventListener('keydown', cerrarModalConEscape);
    
    // Event listeners para enlaces de términos y privacidad
    const linkTerminos = document.getElementById('link-terminos');
    const linkPrivacidad = document.getElementById('link-privacidad');
    
    if (linkTerminos) {
        linkTerminos.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalTerminos();
        });
    }
    
    if (linkPrivacidad) {
        linkPrivacidad.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalPrivacidad();
        });
    }
    
    // Event listeners para botones de cerrar
    const botonesCerrar = document.querySelectorAll('.modal-close');
    botonesCerrar.forEach(boton => {
        boton.addEventListener('click', function() {
            const modalType = this.getAttribute('data-modal');
            if (modalType === 'terminos') {
                cerrarModalTerminos();
            } else if (modalType === 'privacidad') {
                cerrarModalPrivacidad();
            }
        });
    });
    
    // Event listeners para botones de footer
    const botonesFooter = document.querySelectorAll('.modal-footer .btn');
    botonesFooter.forEach(boton => {
        boton.addEventListener('click', function() {
            const modalType = this.getAttribute('data-modal');
            if (modalType === 'terminos') {
                cerrarModalTerminos();
            } else if (modalType === 'privacidad') {
                cerrarModalPrivacidad();
            }
        });
    });
    
    // Validación en tiempo real del campo nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', function(e) {
            const valor = e.target.value;
            const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]*$/;
            if (!soloLetrasRegex.test(valor)) {
                e.target.value = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            }
            // Validar en tiempo real
            const validation = validarNombre(nombreInput.value);
            if (!validation.valid && nombreInput.value.trim()) {
                showNombreError(validation.message);
            } else if (validation.valid) {
                hideNombreError();
            }
            verificarTodosLosCamposValidos();
        });
        nombreInput.addEventListener('blur', function() {
            const validation = validarNombre(nombreInput.value);
            if (!validation.valid) {
                showNombreError(validation.message);
            } else {
                hideNombreError();
            }
            verificarTodosLosCamposValidos();
        });
        nombreInput.addEventListener('focus', function() {
            // No ocultar error al enfocar, solo validar
        });
    }
    
    // Validación en tiempo real del campo apellido
    const apellidoInput = document.getElementById('apellido');
    if (apellidoInput) {
        apellidoInput.addEventListener('input', function(e) {
            const valor = e.target.value;
            const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]*$/;
            if (!soloLetrasRegex.test(valor)) {
                e.target.value = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            }
            // Validar en tiempo real
            const validation = validarApellido(apellidoInput.value);
            if (!validation.valid && apellidoInput.value.trim()) {
                showApellidoError(validation.message);
            } else if (validation.valid) {
                hideApellidoError();
            }
            verificarTodosLosCamposValidos();
        });
        apellidoInput.addEventListener('blur', function() {
            const validation = validarApellido(apellidoInput.value);
            if (!validation.valid) {
                showApellidoError(validation.message);
            } else {
                hideApellidoError();
            }
            verificarTodosLosCamposValidos();
        });
        apellidoInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real del tipo de documento
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    if (tipoDocumentoSelect) {
        tipoDocumentoSelect.addEventListener('change', function() {
            const validation = validarTipoDocumento(tipoDocumentoSelect.value);
            if (!validation.valid) {
                showTipoDocumentoError(validation.message);
            } else {
                hideTipoDocumentoError();
            }
            verificarTodosLosCamposValidos();
        });
    }
    
    // Validación en tiempo real del número de documento
    const numeroDocumentoInput = document.getElementById('numero_documento');
    if (numeroDocumentoInput) {
        numeroDocumentoInput.addEventListener('input', function(e) {
            const valor = e.target.value;
            // Solo permitir números y limitar a 11 dígitos
            if (!/^\d*$/.test(valor)) {
                e.target.value = valor.replace(/\D/g, '');
            }
            // Limitar a máximo 11 dígitos
            if (e.target.value.length > 11) {
                e.target.value = e.target.value.substring(0, 11);
            }
            // Validar en tiempo real
            const validation = validarNumeroDocumento(numeroDocumentoInput.value);
            if (!validation.valid && numeroDocumentoInput.value.trim()) {
                showNumeroDocumentoError(validation.message);
            } else if (validation.valid) {
                hideNumeroDocumentoError();
            }
            verificarTodosLosCamposValidos();
        });
        numeroDocumentoInput.addEventListener('blur', function() {
            const validation = validarNumeroDocumento(numeroDocumentoInput.value);
            if (!validation.valid) {
                showNumeroDocumentoError(validation.message);
            } else {
                hideNumeroDocumentoError();
            }
            verificarTodosLosCamposValidos();
        });
        numeroDocumentoInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real de dirección
    const direccionInput = document.getElementById('direccion');
    if (direccionInput) {
        direccionInput.addEventListener('input', function() {
            const validation = validarDireccion(direccionInput.value);
            if (!validation.valid && direccionInput.value.trim()) {
                showDireccionError(validation.message);
            } else if (validation.valid) {
                hideDireccionError();
            }
            verificarTodosLosCamposValidos();
        });
        direccionInput.addEventListener('blur', function() {
            const validation = validarDireccion(direccionInput.value);
            if (!validation.valid) {
                showDireccionError(validation.message);
            } else {
                hideDireccionError();
            }
            verificarTodosLosCamposValidos();
        });
        direccionInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real de teléfono
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function(e) {
            const valor = e.target.value;
            // Solo permitir números
            if (!/^\d*$/.test(valor)) {
                e.target.value = valor.replace(/\D/g, '');
            }
            // Limitar a máximo 10 dígitos
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.substring(0, 10);
            }
            // Validar en tiempo real
            const validation = validarTelefono(telefonoInput.value);
            if (!validation.valid && telefonoInput.value.trim()) {
                showTelefonoError(validation.message);
            } else if (validation.valid) {
                hideTelefonoError();
            }
            verificarTodosLosCamposValidos();
        });
        telefonoInput.addEventListener('blur', function() {
            const validation = validarTelefono(telefonoInput.value);
            if (!validation.valid) {
                showTelefonoError(validation.message);
            } else {
                hideTelefonoError();
            }
            verificarTodosLosCamposValidos();
        });
        telefonoInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = emailInput.value.trim();
            if (email.length > 0) {
                const emailValidation = isValidEmail(email);
                if (!emailValidation.valid) {
                    showEmailError(emailValidation.message);
                } else {
                    hideEmailError();
                }
            } else {
                hideEmailError();
            }
            verificarTodosLosCamposValidos();
        });
        emailInput.addEventListener('blur', function() {
            const email = emailInput.value.trim();
            if (email.length > 0) {
                const emailValidation = isValidEmail(email);
                if (!emailValidation.valid) {
                    showEmailError(emailValidation.message);
                } else {
                    hideEmailError();
                }
            } else {
                hideEmailError();
            }
            verificarTodosLosCamposValidos();
        });
        emailInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real de contraseña
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const validation = validarPassword(passwordInput.value);
            if (!validation.valid && passwordInput.value.trim()) {
                showPasswordError(validation.message);
            } else if (validation.valid) {
                hidePasswordError();
            }
            // Revalidar confirmación de contraseña si ya tiene valor
            const confirmPasswordInput = document.getElementById('confirm-password');
            if (confirmPasswordInput && confirmPasswordInput.value) {
                const confirmValidation = validarConfirmPassword(passwordInput.value, confirmPasswordInput.value);
                if (!confirmValidation.valid) {
                    showConfirmPasswordError(confirmValidation.message);
                } else {
                    hideConfirmPasswordError();
                }
            }
            verificarTodosLosCamposValidos();
        });
        passwordInput.addEventListener('blur', function() {
            const validation = validarPassword(passwordInput.value);
            if (!validation.valid) {
                showPasswordError(validation.message);
            } else {
                hidePasswordError();
            }
            verificarTodosLosCamposValidos();
        });
        passwordInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real de confirmación de contraseña
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            // Validar en tiempo real si ambas contraseñas están llenas
            if (passwordInput.value && confirmPasswordInput.value) {
                const validation = validarConfirmPassword(passwordInput.value, confirmPasswordInput.value);
                if (!validation.valid) {
                    showConfirmPasswordError(validation.message);
                } else {
                    hideConfirmPasswordError();
                }
            } else if (confirmPasswordInput.value.trim()) {
                showConfirmPasswordError('Debes confirmar tu contraseña');
            } else {
                hideConfirmPasswordError();
            }
            verificarTodosLosCamposValidos();
        });
        confirmPasswordInput.addEventListener('blur', function() {
            const validation = validarConfirmPassword(passwordInput.value, confirmPasswordInput.value);
            if (!validation.valid) {
                showConfirmPasswordError(validation.message);
            } else {
                hideConfirmPasswordError();
            }
            verificarTodosLosCamposValidos();
        });
        confirmPasswordInput.addEventListener('focus', function() {
            // No ocultar error al enfocar
        });
    }
    
    // Validación en tiempo real del checkbox de términos
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            verificarTodosLosCamposValidos();
        });
    }
    
    // Inicializar estado del botón
    verificarTodosLosCamposValidos();
    
    // Función para mostrar/ocultar contraseña mientras se mantiene presionado
    const togglePasswordButton = document.getElementById('toggle-password');
    if (togglePasswordButton && passwordInput) {
        const icon = togglePasswordButton.querySelector('i');
        
        // Mostrar contraseña al presionar el botón
        togglePasswordButton.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevenir que el input pierda el foco
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        // Ocultar contraseña al soltar el botón
        togglePasswordButton.addEventListener('mouseup', function() {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Ocultar contraseña si el mouse sale del botón mientras está presionado
        togglePasswordButton.addEventListener('mouseleave', function() {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Manejar también eventos táctiles para dispositivos móviles
        togglePasswordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        togglePasswordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
    }
    
    // Función para mostrar/ocultar confirmación de contraseña mientras se mantiene presionado
    const toggleConfirmPasswordButton = document.getElementById('toggle-confirm-password');
    if (toggleConfirmPasswordButton && confirmPasswordInput) {
        const icon = toggleConfirmPasswordButton.querySelector('i');
        
        // Mostrar contraseña al presionar el botón
        toggleConfirmPasswordButton.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevenir que el input pierda el foco
            confirmPasswordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        // Ocultar contraseña al soltar el botón
        toggleConfirmPasswordButton.addEventListener('mouseup', function() {
            confirmPasswordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Ocultar contraseña si el mouse sale del botón mientras está presionado
        toggleConfirmPasswordButton.addEventListener('mouseleave', function() {
            confirmPasswordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Manejar también eventos táctiles para dispositivos móviles
        toggleConfirmPasswordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            confirmPasswordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        toggleConfirmPasswordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            confirmPasswordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
    }
});

// ========================================
// FUNCIONES AUXILIARES
// ========================================


// ========================================
// FUNCIÓN PARA VERIFICAR SI TODOS LOS CAMPOS SON VÁLIDOS
// ========================================

function verificarTodosLosCamposValidos() {
    const nombre = document.getElementById('nombre')?.value.trim() || '';
    const apellido = document.getElementById('apellido')?.value.trim() || '';
    const tipoDocumento = document.getElementById('tipo_documento')?.value || '';
    const numeroDocumento = document.getElementById('numero_documento')?.value.trim() || '';
    const direccion = document.getElementById('direccion')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const telefono = document.getElementById('telefono')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    const terms = document.getElementById('terms')?.checked || false;
    
    const validaciones = {
        nombre: validarNombre(nombre).valid,
        apellido: validarApellido(apellido).valid,
        tipoDocumento: validarTipoDocumento(tipoDocumento).valid,
        numeroDocumento: validarNumeroDocumento(numeroDocumento).valid,
        direccion: validarDireccion(direccion).valid,
        email: isValidEmail(email).valid,
        telefono: validarTelefono(telefono).valid,
        password: validarPassword(password).valid,
        confirmPassword: validarConfirmPassword(password, confirmPassword).valid,
        terms: terms
    };
    
    const todosValidos = Object.values(validaciones).every(v => v === true);
    
    // Habilitar/deshabilitar botón
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = !todosValidos;
        if (todosValidos) {
            submitButton.classList.remove('btn-disabled');
            submitButton.classList.add('btn-enabled');
        } else {
            submitButton.classList.remove('btn-enabled');
            submitButton.classList.add('btn-disabled');
        }
    }
    
    return todosValidos;
}

// ========================================
// VALIDACIÓN DE EMAIL
// ========================================

// Función para validar el email con validaciones específicas
function isValidEmail(email) {
    // Validar que tenga el símbolo @
    if (!email.includes('@')) {
        return { valid: false, message: 'El correo debe contener el símbolo @' };
    }
    
    // Validar formato completo: usuario@dominio.extension
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        // Verificar qué parte falta
        const parts = email.split('@');
        if (parts.length !== 2) {
            return { valid: false, message: 'El correo debe tener un solo símbolo @' };
        }
        if (!parts[1] || !parts[1].includes('.')) {
            return { valid: false, message: 'El correo debe tener un dominio válido con extensión (ej: .com, .co, .org)' };
        }
        const domainParts = parts[1].split('.');
        if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
            return { valid: false, message: 'La extensión del dominio debe tener al menos 2 caracteres (ej: .com, .co)' };
        }
        return { valid: false, message: 'Formato de correo inválido. Debe ser: usuario@dominio.com' };
    }
    
    return { valid: true, message: '' };
}

// Función para mostrar error de email
function showEmailError(message) {
    let errorDiv = document.getElementById('email-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'email-error';
        errorDiv.className = 'form-error';
        const emailGroup = document.getElementById('email').closest('.form-group');
        emailGroup.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('email').classList.add('input-error');
}

// Función para ocultar error de email
function hideEmailError() {
    const errorDiv = document.getElementById('email-error');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.classList.remove('input-error');
    }
}

// ========================================
// FUNCIONALIDAD DE REGISTRO
// ========================================

document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar datos del formulario
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        tipo_documento: document.getElementById('tipo_documento').value,
        numero_documento: document.getElementById('numero_documento').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        clave: document.getElementById('password').value,
        confirm_password: document.getElementById('confirm-password').value,
        terms: document.getElementById('terms').checked ? 'on' : 'off'
    };

    // Validación de nombre
    const nombreValidation = validarNombre(datos.nombre);
    if (!nombreValidation.valid) {
        showNombreError(nombreValidation.message);
        alert("⚠️ " + nombreValidation.message);
        document.getElementById('nombre').focus();
        return;
    } else {
        hideNombreError();
    }

    // Validación de apellido
    const apellidoValidation = validarApellido(datos.apellido);
    if (!apellidoValidation.valid) {
        showApellidoError(apellidoValidation.message);
        alert("⚠️ " + apellidoValidation.message);
        document.getElementById('apellido').focus();
        return;
    } else {
        hideApellidoError();
    }

    // Validación de tipo de documento
    if (!datos.tipo_documento) {
        alert("⚠️ Debes seleccionar un tipo de documento");
        document.getElementById('tipo_documento').focus();
        return;
    }

    // Validación de número de documento
    const numeroDocumentoValidation = validarNumeroDocumento(datos.numero_documento);
    if (!numeroDocumentoValidation.valid) {
        showNumeroDocumentoError(numeroDocumentoValidation.message);
        alert("⚠️ " + numeroDocumentoValidation.message);
        document.getElementById('numero_documento').focus();
        return;
    } else {
        hideNumeroDocumentoError();
    }

    // Validación de dirección
    const direccionValidation = validarDireccion(datos.direccion);
    if (!direccionValidation.valid) {
        showDireccionError(direccionValidation.message);
        alert("⚠️ " + direccionValidation.message);
        document.getElementById('direccion').focus();
        return;
    } else {
        hideDireccionError();
    }

    // Validación de email
    const emailValidation = isValidEmail(datos.email);
    if (!emailValidation.valid) {
        showEmailError(emailValidation.message);
        alert("⚠️ " + emailValidation.message);
        document.getElementById('email').focus();
        return;
    } else {
        hideEmailError();
    }

    // Validación de teléfono
    const telefonoValidation = validarTelefono(datos.telefono);
    if (!telefonoValidation.valid) {
        showTelefonoError(telefonoValidation.message);
        alert("⚠️ " + telefonoValidation.message);
        document.getElementById('telefono').focus();
        return;
    } else {
        hideTelefonoError();
    }

    // Validación de contraseña
    const passwordValidation = validarPassword(datos.clave);
    if (!passwordValidation.valid) {
        showPasswordError(passwordValidation.message);
        alert("⚠️ " + passwordValidation.message);
        document.getElementById('password').focus();
        return;
    } else {
        hidePasswordError();
    }

    // Validación de confirmación de contraseña
    const confirmPasswordValidation = validarConfirmPassword(datos.clave, datos.confirm_password);
    if (!confirmPasswordValidation.valid) {
        showConfirmPasswordError(confirmPasswordValidation.message);
        alert("⚠️ " + confirmPasswordValidation.message);
        document.getElementById('confirm-password').focus();
        return;
    } else {
        hideConfirmPasswordError();
    }

    // Validación de términos y condiciones
    if (!document.getElementById('terms').checked) {
        alert("⚠️ Debes aceptar los términos y condiciones y la política de privacidad");
        document.getElementById('terms').focus();
        return;
    }

    try {
        // Crear objeto solo con los campos que espera la base de datos
        const datosEnviar = {
            nombre_cliente: datos.nombre,
            apellido_cliente: datos.apellido,
            tipo_documento: datos.tipo_documento,
            numero_documento: datos.numero_documento,
            telefono: datos.telefono || null,
            direccion: datos.direccion,
            email: datos.email,
            clave: datos.clave
        };
        
        console.log('📋 Datos a enviar al backend:', datosEnviar);
        console.log('🔗 URL:', "http://localhost:3000/api/clientes");
        
        // Crear cliente directamente en la tabla clientes
        const respuesta = await fetch("http://localhost:3000/api/clientes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosEnviar)
        });

        console.log('Respuesta status:', respuesta.status);
        console.log('Respuesta headers:', respuesta.headers);
        
        const resultado = await respuesta.json();
        console.log('Resultado completo:', resultado);

        if (!respuesta.ok) {
            // Obtener información del error del backend
            const errorMessage = resultado.error || resultado.mensaje || "No se pudo registrar";
            const campoError = resultado.campo || null;
            const mensajeDetallado = resultado.mensaje || errorMessage;
            
            // Mapeo de campos del backend a IDs de campos del formulario
            const mapeoCampos = {
                'numero_documento': 'numero_documento',
                'email': 'email',
                'telefono': 'telefono',
                'tipo_documento': 'tipo_documento',
                'general': null
            };
            
            // Obtener el ID del campo a resaltar
            const campoId = campoError ? mapeoCampos[campoError] : null;
            
            // Mostrar notificación clara y específica
            mostrarErrorRegistro(mensajeDetallado, campoId);
            
            console.error('Error detallado:', resultado);
        } else {
            // Registro exitoso en tabla clientes
            console.log('✅ Cliente creado exitosamente en tabla clientes');
            console.log('✅ El cliente puede iniciar sesión usando su email y contraseña');
            
            // Mostrar mensaje de éxito
            alert("✅ " + resultado.mensaje);
            
            // Crear sesión de cliente automáticamente
            const nombreCompleto = `${datosEnviar.nombre_cliente} ${datosEnviar.apellido_cliente}`;
            sessionStorage.setItem('clientSession', JSON.stringify({
                isClient: true,
                name: nombreCompleto,
                email: datos.email,
                loginTime: new Date().toISOString()
            }));
            
            // Redirigir al catálogo
            setTimeout(() => {
                window.location.href = "catalogo.html";
            }, 1500);
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        alert("❌ Error en el servidor");
    }
});

// ========================================
// FUNCIONALIDAD ADICIONAL
// ========================================

// Función para mostrar notificación de términos aceptados
function mostrarNotificacionTerminos() {
    const checkbox = document.getElementById('terms');
    if (checkbox && checkbox.checked) {
        console.log('Términos y condiciones aceptados');
    }
}

// Event listener para el checkbox de términos
document.addEventListener('DOMContentLoaded', function() {
    const checkboxTerminos = document.getElementById('terms');
    if (checkboxTerminos) {
        checkboxTerminos.addEventListener('change', mostrarNotificacionTerminos);
    }
    
    // Validación en tiempo real del email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            if (email.length > 0) {
                const emailValidation = isValidEmail(email);
                if (!emailValidation.valid) {
                    showEmailError(emailValidation.message);
                } else {
                    hideEmailError();
                }
            } else {
                hideEmailError();
            }
        });
        
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email.length > 0) {
                const emailValidation = isValidEmail(email);
                if (!emailValidation.valid) {
                    showEmailError(emailValidation.message);
                } else {
                    hideEmailError();
                }
            } else {
                hideEmailError();
            }
        });
    }
});

