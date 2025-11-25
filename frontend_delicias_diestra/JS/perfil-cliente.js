// Verificar sesión al cargar - JR ADSO
document.addEventListener('DOMContentLoaded', function() {
    const clientSession = sessionStorage.getItem('clientSession');
    if (!clientSession) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const sessionData = JSON.parse(clientSession);
        if (!sessionData.isClient || !sessionData.email) {
            window.location.href = 'login.html';
            return;
        }

        // Cargar datos del perfil
        cargarPerfil(sessionData.email);
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = 'login.html';
    }
});

// Función para cargar datos del perfil
async function cargarPerfil(email) {
    try {
        const response = await fetch(`http://localhost:3000/api/clientes/perfil/${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el perfil');
        }

        const cliente = await response.json();
        
        // Llenar formulario
        document.getElementById('nombre').value = cliente.nombre_cliente || '';
        document.getElementById('apellido').value = cliente.apellido_cliente || '';
        document.getElementById('tipo_documento').value = cliente.tipo_documento || '';
        document.getElementById('numero_documento').value = cliente.numero_documento || '';
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('direccion').value = cliente.direccion || '';

        // Ocultar loading y mostrar formulario
        document.getElementById('loading').style.display = 'none';
        document.getElementById('perfil-content').style.display = 'block';

        // Guardar ID del cliente para actualización
        document.getElementById('perfil-form').dataset.clienteId = cliente.id_cliente;

    } catch (error) {
        console.error('Error al cargar perfil:', error);
        document.getElementById('loading').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar el perfil. Por favor, intenta nuevamente.</p>
            </div>
        `;
    }
}

// Manejar envío del formulario
document.getElementById('perfil-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const clienteId = this.dataset.clienteId;
    if (!clienteId) {
        mostrarMensaje('error', 'No se pudo identificar el cliente');
        return;
    }

    const formData = {
        nombre_cliente: document.getElementById('nombre').value,
        apellido_cliente: document.getElementById('apellido').value,
        tipo_documento: document.getElementById('tipo_documento').value,
        numero_documento: document.getElementById('numero_documento').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value || null,
        direccion: document.getElementById('direccion').value || null
    };

    try {
        const response = await fetch(`http://localhost:3000/api/clientes/${clienteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const resultado = await response.json();

        if (!response.ok) {
            let errorMessage = resultado.error || 'Error al actualizar el perfil';
            if (errorMessage.includes('número de documento') && errorMessage.includes('tipo')) {
                errorMessage = 'El número de documento con este tipo ya está registrado';
            } else if (errorMessage.includes('correo electrónico') || errorMessage.includes('email')) {
                errorMessage = 'El correo electrónico ya está registrado';
            }
            mostrarMensaje('error', errorMessage);
            return;
        }

        mostrarMensaje('success', 'Perfil actualizado correctamente');
        
        // Actualizar nombre en la sesión
        const clientSession = sessionStorage.getItem('clientSession');
        if (clientSession) {
            const sessionData = JSON.parse(clientSession);
            sessionData.name = `${formData.nombre_cliente} ${formData.apellido_cliente}`;
            sessionStorage.setItem('clientSession', JSON.stringify(sessionData));
            
            // Actualizar nombre en el header
            const userNameSpan = document.getElementById('user-name');
            if (userNameSpan) {
                userNameSpan.textContent = sessionData.name;
            }
        }

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarMensaje('error', 'Error al actualizar el perfil. Por favor, intenta nuevamente.');
    }
});

function mostrarMensaje(tipo, mensaje) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    if (tipo === 'error') {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    } else {
        successDiv.textContent = mensaje;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    }

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
    }, 5000);
}

