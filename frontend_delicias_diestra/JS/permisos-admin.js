// permisos-admin.js - Sistema de control de permisos por rol
// Carga permisos desde la base de datos

const API_BASE_URL_PERMISOS = 'http://localhost:3000/api';

// Cache de permisos por rol
let PERMISOS_POR_ROL_CACHE = {};

// Cargar permisos de un rol desde la API
async function cargarPermisosRol(rolId) {
    try {
        // Si ya está en cache, retornar
        if (PERMISOS_POR_ROL_CACHE[rolId]) {
            return PERMISOS_POR_ROL_CACHE[rolId];
        }
        
        const response = await fetch(`${API_BASE_URL_PERMISOS}/roles/${rolId}`);
        if (!response.ok) {
            console.warn(`No se pudieron cargar permisos para el rol ${rolId}`);
            return null;
        }
        
        const rol = await response.json();
        const permisos = rol.permisos 
            ? rol.permisos.map(p => p.nombre || p.nombre_permiso)
            : [];
        
        PERMISOS_POR_ROL_CACHE[rolId] = {
            nombre: rol.nombre_rol,
            permisos: permisos
        };
        
        return PERMISOS_POR_ROL_CACHE[rolId];
    } catch (error) {
        console.error('Error al cargar permisos del rol:', error);
        return null;
    }
}

// Función para obtener el rol del usuario actual
function obtenerRolUsuario() {
    const adminSession = sessionStorage.getItem('adminSession');
    
    if (!adminSession) {
        return null;
    }
    
    try {
        const sessionData = JSON.parse(adminSession);
        return sessionData.id_rol || sessionData.rol || null;
    } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
        return null;
    }
}

// Función para verificar si un rol es administrador
function esRolAdministrador(rolId, nombreRol) {
    // Verificar por ID (1 es el ID del rol Administrador por defecto)
    if (rolId === 1) {
        return true;
    }
    
    // Verificar por nombre (case-insensitive)
    if (nombreRol) {
        const nombreLower = nombreRol.toLowerCase();
        if (nombreLower === 'administrador' || nombreLower === 'admin') {
            return true;
        }
    }
    
    return false;
}

// Función para verificar si el usuario tiene permiso para una sección
async function tienePermiso(seccion) {
    const rolId = obtenerRolUsuario();
    
    if (!rolId) {
        return false;
    }
    
    // Cargar información del rol
    const configRol = await cargarPermisosRol(rolId);
    
    // Si es administrador, tiene acceso a todo
    if (esRolAdministrador(rolId, configRol?.nombre)) {
        return true;
    }
    
    if (!configRol || !configRol.permisos) {
        // Si el rol no está configurado, denegar acceso
        console.warn(`Rol ${rolId} no tiene configuración de permisos`);
        return false;
    }
    
    return configRol.permisos.includes(seccion);
}

// Función para ocultar elementos según permisos
async function aplicarPermisos() {
    const rolId = obtenerRolUsuario();
    const adminUserRole = document.getElementById('admin-user-role');
    
    // Cargar permisos del rol
    const configRol = await cargarPermisosRol(rolId);
    
    // Actualizar nombre del rol en la UI
    if (adminUserRole && configRol) {
        adminUserRole.textContent = configRol.nombre || 'Desconocido';
    }
    
    // Si es administrador, mostrar todos los elementos
    const esAdmin = esRolAdministrador(rolId, configRol?.nombre);
    
    if (esAdmin) {
        // Mostrar todos los elementos del sidebar
        const sidebarLinks = document.querySelectorAll('.admin-sidebar-link');
        sidebarLinks.forEach(link => {
            const listItem = link.closest('.admin-sidebar-item');
            if (listItem) {
                listItem.style.display = '';
            }
        });
        console.log(`Permisos aplicados para rol: ${rolId} (${configRol?.nombre || 'Administrador'}) - Acceso completo`);
        return;
    }
    
    // Para otros roles, verificar permisos individualmente
    const sidebarLinks = document.querySelectorAll('.admin-sidebar-link');
    
    for (const link of sidebarLinks) {
        const section = link.getAttribute('data-section');
        
        if (section) {
            const tieneAcceso = await tienePermiso(section);
            if (!tieneAcceso) {
                const listItem = link.closest('.admin-sidebar-item');
                if (listItem) {
                    listItem.style.display = 'none';
                }
            } else {
                // Asegurar que esté visible si tiene permiso
                const listItem = link.closest('.admin-sidebar-item');
                if (listItem) {
                    listItem.style.display = '';
                }
            }
        }
    }
    
    // Log para debugging
    const nombreRol = configRol?.nombre || 'Desconocido';
    console.log(`✅ Permisos aplicados para rol: ${rolId} (${nombreRol})`);
}

// Función para verificar y bloquear acceso a una página
async function verificarAccesoPagina(seccionRequerida) {
    const tieneAcceso = await tienePermiso(seccionRequerida);
    if (!tieneAcceso) {
        mostrarErrorAcceso();
        return false;
    }
    return true;
}

// Función para mostrar error de acceso
function mostrarErrorAcceso() {
    const adminContent = document.querySelector('.admin-content');
    
    if (adminContent) {
        adminContent.innerHTML = `
            <div class="admin-error-access">
                <div class="admin-error-content">
                    <i class="fas fa-lock"></i>
                    <h2>Acceso Denegado</h2>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <a href="panel-admin.html" class="admin-btn admin-btn-primary">
                        <i class="fas fa-home"></i>
                        Volver al Dashboard
                    </a>
                </div>
            </div>
        `;
    }
}

// Función para obtener configuración de un rol
async function obtenerConfiguracionRol(rolId) {
    return await cargarPermisosRol(rolId);
}

// Función para limpiar cache de permisos (útil después de actualizar roles)
function limpiarCachePermisos() {
    PERMISOS_POR_ROL_CACHE = {};
}

// Exportar funciones para uso global
window.PermisosAdmin = {
    tienePermiso,
    aplicarPermisos,
    verificarAccesoPagina,
    obtenerRolUsuario,
    obtenerConfiguracionRol,
    limpiarCachePermisos
};


