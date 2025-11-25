// usuarios-admin.js - Gestión de usuarios en el panel de administración
document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const btnClientes = document.getElementById('btn-clientes');
    const btnAdministradores = document.getElementById('btn-administradores');
    const cancelBtn = document.getElementById('cancel-usuarios');
    const loadingOverlay = document.getElementById('usuarios-loading');

    // Función para mostrar loading
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }

    // Event Listeners
    btnClientes.addEventListener('click', function () {
        // Redirigir al modal de gestión de clientes
        window.location.href = 'clientes-admin.html';
    });

    btnAdministradores.addEventListener('click', function () {
        // Redirigir al modal de gestión de administradores
        window.location.href = 'administradores-admin.html';
    });

    // Botón cerrar modal
    const closeBtn = document.getElementById('close-usuarios-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            // Redirigir a administradores-admin.html
            window.location.href = 'administradores-admin.html';
        });
    }

    cancelBtn.addEventListener('click', function () {
        window.location.href = 'panel-admin.html';
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            window.location.href = 'administradores-admin.html';
        }
    });

    // Animación de entrada del modal
    setTimeout(() => {
        document.getElementById('usuarios-modal').classList.add('show');
    }, 100);
});

