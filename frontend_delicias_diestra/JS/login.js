// login.js - Lógica para el formulario de inicio de sesión - J Rodriguez ADSO

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('boton-login');
    const loginForm = document.getElementById('login-form');
    const togglePasswordButton = document.getElementById('toggle-password');
    const rememberCheckbox = document.getElementById('remember');
    
    // Cargar credenciales guardadas al iniciar
    cargarCredencialesGuardadas();

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

    // Función para verificar credenciales de administrador
    function checkAdminCredentials(email, password) {
        // Base de datos simulada de administradores
        const adminUsers = [
            {
                email: 'admin@carniceria.com',
                password: 'admin123',
                name: 'Jojhan'
            },
            {
                email: 'administrador@carniceria.com',
                password: 'admin456',
                name: 'María'
            },
            {
                email: 'gerente@carniceria.com',
                password: 'gerente789',
                name: 'Carlos'
            }
        ];

        // Buscar el usuario en la lista de administradores
        const adminUser = adminUsers.find(user => 
            user.email.toLowerCase() === email.toLowerCase() && 
            user.password === password
        );

        if (adminUser) {
            return {
                isAdmin: true,
                name: adminUser.name,
                email: adminUser.email
            };
        }

        return {
            isAdmin: false,
            name: null,
            email: null
        };
    }

    // Función para verificar credenciales de clientes
    function checkClientCredentials(email, password) {
        // Base de datos simulada de clientes
        const clientUsers = [
            {
                email: 'cliente@carniceria.com',
                password: 'cliente123',
                name: 'Jojhan'
            },
            {
                email: 'usuario@carniceria.com',
                password: 'usuario456',
                name: 'María'
            },
            {
                email: 'comprador@carniceria.com',
                password: 'comprador789',
                name: 'Carlos'
            },
            {
                email: 'test@test.com',
                password: 'test123',
                name: 'Usuario Test'
            }
        ];

        // Buscar el usuario en la lista de clientes
        const clientUser = clientUsers.find(user => 
            user.email.toLowerCase() === email.toLowerCase() && 
            user.password === password
        );

        if (clientUser) {
            return {
                isClient: true,
                name: clientUser.name,
                email: clientUser.email
            };
        }

        return {
            isClient: false,
            name: null,
            email: null
        };
    }

    // Función para mostrar error de email
    function showEmailError(message) {
        let errorDiv = document.getElementById('email-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'email-error';
            errorDiv.className = 'form-error';
            const formGroup = emailInput.closest('.form-group');
            if (formGroup) {
                formGroup.appendChild(errorDiv);
            } else {
                emailInput.parentElement.appendChild(errorDiv);
            }
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        emailInput.classList.add('input-error');
    }

    // Función para ocultar error de email
    function hideEmailError() {
        const errorDiv = document.getElementById('email-error');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        emailInput.classList.remove('input-error');
    }

    // Función para validar el formulario
    function validateForm() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validar email
        const emailValidation = isValidEmail(email);
        if (email.length > 0 && !emailValidation.valid) {
            showEmailError(emailValidation.message);
        } else if (email.length > 0 && emailValidation.valid) {
            hideEmailError();
        } else {
            hideEmailError();
        }
        
        // Verificar que ambos campos tengan contenido y el email sea válido
        const isFormValid = email.length > 0 && 
                           password.length > 0 && 
                           emailValidation.valid;
        
        // Habilitar/deshabilitar el botón según la validación
        loginButton.disabled = !isFormValid;
        
        // Cambiar el estilo del botón según su estado
        if (isFormValid) {
            loginButton.classList.remove('btn-disabled');
            loginButton.classList.add('btn-enabled');
        } else {
            loginButton.classList.remove('btn-enabled');
            loginButton.classList.add('btn-disabled');
        }
    }

    // Event listeners para validación en tiempo real
    emailInput.addEventListener('input', validateForm);
    emailInput.addEventListener('blur', validateForm);
    passwordInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('blur', validateForm);

    // Función para mostrar/ocultar contraseña mientras se mantiene presionado
    if (togglePasswordButton) {
        const passwordField = passwordInput;
        const icon = togglePasswordButton.querySelector('i');
        
        // Mostrar contraseña al presionar el botón
        togglePasswordButton.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevenir que el input pierda el foco
            passwordField.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        // Ocultar contraseña al soltar el botón
        togglePasswordButton.addEventListener('mouseup', function() {
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Ocultar contraseña si el mouse sale del botón mientras está presionado
        togglePasswordButton.addEventListener('mouseleave', function() {
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        // Manejar también eventos táctiles para dispositivos móviles
        togglePasswordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            passwordField.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        });
        
        togglePasswordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
    }
    
    // Listener para el checkbox "Recordarme"
    rememberCheckbox.addEventListener('change', function() {
        if (!this.checked) {
            // Si se desmarca, eliminar credenciales guardadas
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
            localStorage.removeItem('rememberCredentials');
        }
    });

    // Manejo del envío del formulario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir envío por defecto
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberCheckbox.checked;
        
        // Guardar credenciales si el checkbox está marcado
        guardarCredenciales(email, password, rememberMe);
        
        // Validación final antes del envío
        const emailValidation = isValidEmail(email);
        if (!emailValidation.valid) {
            showEmailError(emailValidation.message);
            showMessage(emailValidation.message, 'error');
            return;
        }
        
        if (!password || password.trim().length === 0) {
            showMessage('Por favor, ingresa tu contraseña.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        
        // Proceso de login con backend
        loginButton.disabled = true;
        loginButton.textContent = 'Iniciando sesión...';
        
        console.log('Datos de login:', {
            email: email,
            password: password,
            remember: rememberMe
        });
        
        console.log('Iniciando petición a:', 'http://localhost:3000/api/auth/login');
        
        // Llamada real al backend
        fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(async response => {
            // Intentar parsear la respuesta
            let data;
            try {
                const textResponse = await response.text();
                console.log('Respuesta del servidor (texto):', textResponse);
                
                if (textResponse) {
                    data = JSON.parse(textResponse);
                } else {
                    data = {};
                }
            } catch (parseError) {
                console.error('Error al parsear respuesta JSON:', parseError);
                data = { error: 'Error al procesar respuesta del servidor' };
            }
            
            // Si la respuesta no es exitosa, lanzar error con más detalles
            if (!response.ok) {
                const errorMessage = data.error || data.mensaje || `Error en el servidor (${response.status})`;
                console.error('=== ERROR DEL SERVIDOR ===');
                console.error('Status:', response.status);
                console.error('Status Text:', response.statusText);
                console.error('Error:', data.error);
                console.error('Mensaje:', data.mensaje);
                console.error('Detalles:', data.detalles);
                console.error('Datos completos:', data);
                console.error('==========================');
                
                // Mostrar mensaje más descriptivo
                let mensajeFinal = errorMessage;
                if (response.status === 500) {
                    mensajeFinal = `Error interno del servidor (500). ${errorMessage}. Revisa los logs del backend para más detalles.`;
                }
                
                throw new Error(mensajeFinal);
            }
            
            return data;
        })
        .then(data => {
            console.log('Respuesta del servidor:', data);
            
            if (data.mensaje === 'Inicio de sesión exitoso' && data.usuario) {
                // Login exitoso
                const usuario = data.usuario;
                console.log('Objeto usuario completo:', usuario);
                console.log('Propiedades del usuario:', Object.keys(usuario));
                
                // Guardar token si viene en la respuesta
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    console.log('✅ Token guardado en localStorage');
                }
                
                // Obtener el nombre del usuario según el tipo
                // Para usuarios administrativos: usar nombre_usuario (nuevo) o nombre (antiguo)
                // Para clientes: usar nombre_cliente (nuevo) o nombre (antiguo)
                let nombreUsuario = 'Usuario';
                
                if (usuario.tipo === 'administrativo') {
                    nombreUsuario = usuario.nombre_usuario || usuario.nombre || usuario.name || 'Usuario';
                } else if (usuario.tipo === 'cliente') {
                    const nombreCliente = usuario.nombre_cliente || usuario.nombre || usuario.name || '';
                    const apellidoCliente = usuario.apellido_cliente || usuario.apellido || '';
                    nombreUsuario = apellidoCliente ? `${nombreCliente} ${apellidoCliente}` : nombreCliente || 'Usuario';
                } else {
                    // Fallback genérico
                    nombreUsuario = usuario.nombre_usuario || usuario.nombre_cliente || usuario.nombre || usuario.name || 'Usuario';
                }
                
                // LOGS DE DEPURACIÓN
                console.log('=== INFORMACIÓN DE REDIRECCIÓN ===');
                console.log('Objeto usuario completo recibido:', usuario);
                console.log('Tipo de usuario:', usuario.tipo);
                console.log('Rol del usuario:', usuario.rol);
                console.log('usuario.nombre_usuario:', usuario.nombre_usuario);
                console.log('usuario.nombre:', usuario.nombre);
                console.log('Nombre del usuario calculado:', nombreUsuario);
                console.log('Email:', usuario.email);
                console.log('================================');
                
                // Usar el campo 'tipo' para determinar la redirección
                if (usuario.tipo === 'administrativo') {
                    // Usuario administrativo (Admin o Empleado)
                    const rolNombre = usuario.rol || 'Administrador';
                    const esEmpleado = rolNombre.toLowerCase() === 'empleado';
                    
                    console.log(esEmpleado ? '👷 REDIRIGIENDO A PANEL ADMINISTRADOR (EMPLEADO)' : '🔧 REDIRIGIENDO A PANEL ADMINISTRADOR');
                    
                    sessionStorage.setItem('adminSession', JSON.stringify({
                        isAdmin: true,
                        name: nombreUsuario,
                        email: email,
                        loginTime: new Date().toISOString(),
                        id_rol: usuario.id_rol || null,
                        rol: rolNombre,
                        permisos: usuario.permisos || [],
                        tipo: 'administrativo'
                    }));
                    
                    showMessage(`¡Bienvenido ${nombreUsuario}!${esEmpleado ? ' (Empleado)' : ''}`, 'success');
                    
                    setTimeout(() => {
                        console.log('🚀 Ejecutando redirección a panel-admin.html');
                        try {
                            window.location.href = 'panel-admin.html';
                        } catch (error) {
                            console.error('Error en redirección:', error);
                            window.location.replace('panel-admin.html');
                        }
                    }, 1500);
                    
                } else if (usuario.tipo === 'cliente') {
                    // Cliente
                    console.log('🛒 REDIRIGIENDO A CATÁLOGO');
                    
                    const clienteId = usuario.id || usuario.id_cliente || null;
                    
                    sessionStorage.setItem('clientSession', JSON.stringify({
                        isClient: true,
                        id: clienteId,
                        name: nombreUsuario,
                        email: email,
                        loginTime: new Date().toISOString(),
                        tipo: 'cliente',
                        nombre_cliente: usuario.nombre_cliente || usuario.nombre || '',
                        apellido_cliente: usuario.apellido_cliente || usuario.apellido || '',
                        apellido: usuario.apellido_cliente || usuario.apellido || '',
                        tipo_documento: usuario.tipo_documento || '',
                        numero_documento: usuario.numero_documento || '',
                        telefono: usuario.telefono || '',
                        direccion: usuario.direccion || ''
                    }));
                    
                    // Transferir carrito temporal al carrito del cliente si existe
                    if (clienteId) {
                        const claveCarrito = `carrito_${clienteId}`;
                        const carritoCliente = JSON.parse(localStorage.getItem(claveCarrito)) || [];
                        const carritoTemp = JSON.parse(localStorage.getItem('carrito_temp')) || [];
                        
                        console.log('Carrito del cliente al iniciar sesión:', carritoCliente);
                        console.log('Carrito temporal al iniciar sesión:', carritoTemp);
                        
                        // Si hay carrito temporal, combinarlo con el del cliente
                        if (carritoTemp.length > 0) {
                            let carritoCombinado = [...carritoCliente];
                            
                            carritoTemp.forEach(itemTemp => {
                                const itemExistente = carritoCombinado.find(item => item.id === itemTemp.id);
                                if (itemExistente) {
                                    // Si ya existe, sumar las cantidades
                                    itemExistente.cantidad += itemTemp.cantidad;
                                } else {
                                    // Si no existe, agregarlo
                                    carritoCombinado.push(itemTemp);
                                }
                            });
                            
                            // Guardar el carrito combinado
                            localStorage.setItem(claveCarrito, JSON.stringify(carritoCombinado));
                            // Limpiar el carrito temporal
                            localStorage.removeItem('carrito_temp');
                            console.log('Carrito temporal transferido al carrito del cliente');
                        } else if (carritoCliente.length === 0) {
                            // Si ambos están vacíos, asegurarse de que esté limpio
                            localStorage.setItem(claveCarrito, JSON.stringify([]));
                        }
                    }
                    
                    showMessage(`¡Bienvenido ${nombreUsuario}!`, 'success');
                    
                    setTimeout(() => {
                        console.log('🚀 Ejecutando redirección a catalogo.html');
                        try {
                            window.location.href = 'catalogo.html';
                        } catch (error) {
                            console.error('Error en redirección:', error);
                            window.location.replace('catalogo.html');
                        }
                    }, 1500);
                    
                } else {
                    // Tipo no reconocido
                    console.error('❌ TIPO DE USUARIO NO RECONOCIDO:', usuario.tipo);
                    showMessage(`Error: Tipo de usuario no reconocido - ${usuario.tipo}`, 'error');
                }
            } else {
                // Credenciales incorrectas u otro error
                const mensajeError = data.error || data.mensaje || 'Credenciales incorrectas';
                console.error('Error en login:', mensajeError);
                showMessage(mensajeError, 'error');
            }
        })
        .catch(error => {
            console.error('=== ERROR EN EL LOGIN ===');
            console.error('Tipo de error:', error.name);
            console.error('Mensaje de error:', error.message);
            console.error('Stack trace:', error.stack);
            console.error('========================');
            
            // Si el error tiene un mensaje, mostrarlo; si no, mostrar mensaje genérico
            let mensajeError = error.message || 'Error de conexión. Intenta nuevamente.';
            
            // Si el mensaje es genérico, intentar dar más contexto
            if (mensajeError === 'Error en el servidor' || mensajeError.includes('500')) {
                mensajeError = 'Error en el servidor (500). Verifica que el backend esté funcionando correctamente. Revisa la consola para más detalles.';
            }
            
            showMessage(mensajeError, 'error');
        })
        .finally(() => {
            // Restaurar el botón
            loginButton.disabled = false;
            loginButton.textContent = 'Iniciar Sesión';
        });
    });

    // Función para mostrar mensajes
    function showMessage(message, type) {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Estilos para el mensaje
        messageDiv.style.cssText = `
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
        
        // Colores según el tipo
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#ef4444';
        } else {
            messageDiv.style.backgroundColor = '#3b82f6';
        }
        
        // Agregar al DOM
        document.body.appendChild(messageDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
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
        
        .btn-enabled {
            background-color: #3b82f6 !important;
            cursor: pointer !important;
            opacity: 1 !important;
        }
        
        .btn-disabled {
            background-color: #9ca3af !important;
            cursor: not-allowed !important;
            opacity: 0.6 !important;
        }
    `;
    document.head.appendChild(style);

    // Función para guardar credenciales
    function guardarCredenciales(email, password, remember) {
        if (remember) {
            // Guardar email
            localStorage.setItem('rememberedEmail', email);
            // Guardar contraseña con encriptación básica (btoa es Base64, no es seguro pero es mejor que texto plano)
            // En producción, se recomienda usar una encriptación más segura
            try {
                const encryptedPassword = btoa(password); // Base64 encoding
                localStorage.setItem('rememberedPassword', encryptedPassword);
                localStorage.setItem('rememberCredentials', 'true');
            } catch (error) {
                console.error('Error al guardar credenciales:', error);
                // Si falla, guardar solo el email
                localStorage.setItem('rememberCredentials', 'true');
            }
        } else {
            // Si no quiere recordar, eliminar credenciales guardadas
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
            localStorage.removeItem('rememberCredentials');
        }
    }
    
    // Función para cargar credenciales guardadas
    function cargarCredencialesGuardadas() {
        const rememberCredentials = localStorage.getItem('rememberCredentials');
        
        if (rememberCredentials === 'true') {
            const savedEmail = localStorage.getItem('rememberedEmail');
            const savedPassword = localStorage.getItem('rememberedPassword');
            
            if (savedEmail) {
                emailInput.value = savedEmail;
                rememberCheckbox.checked = true;
            }
            
            if (savedPassword) {
                try {
                    // Desencriptar contraseña (Base64 decoding)
                    const decryptedPassword = atob(savedPassword);
                    passwordInput.value = decryptedPassword;
                } catch (error) {
                    console.error('Error al cargar contraseña guardada:', error);
                    // Si hay error, limpiar la contraseña guardada
                    localStorage.removeItem('rememberedPassword');
                }
            }
            
            // Validar formulario después de cargar credenciales
            setTimeout(() => {
                validateForm();
            }, 100);
        }
    }
    
    // Validación inicial
    validateForm();
});
