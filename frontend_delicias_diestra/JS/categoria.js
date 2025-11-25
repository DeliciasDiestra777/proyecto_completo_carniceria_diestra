/**
 * Sistema Global de Gestión de Categorías
 * Este archivo proporciona funciones para cargar categorías dinámicamente
 * desde la API del backend y localStorage como respaldo.
 */

// URL base de la API
var API_BASE_URL = 'http://localhost:3000/api';

// Función para obtener categorías desde localStorage (respaldo)
function getCategorias() {
    return JSON.parse(localStorage.getItem('categorias')) || [];
}

// Función para cargar categorías desde la API
async function loadCategoriasFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
        if (!response.ok) {
            throw new Error('Error al cargar categorías desde la API');
        }
        const categorias = await response.json();
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('categorias', JSON.stringify(categorias));
        
        return categorias;
    } catch (error) {
        console.error('Error al cargar categorías desde API:', error);
        // Si falla la API, usar localStorage
        return getCategorias();
    }
}

// Función para cargar categorías en un select
async function loadCategoriasInSelect(selectElement, includeEmpty = true, useIdAsValue = true) {
    if (!selectElement) {
        console.error('selectElement es null o undefined');
        return;
    }
    
    console.log('Cargando categorías en select:', selectElement.id);
    
    selectElement.innerHTML = '';
    
    if (includeEmpty) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Seleccionar categoría';
        selectElement.appendChild(emptyOption);
    }
    
    try {
        // Intentar cargar desde API primero, luego localStorage
        const categorias = await loadCategoriasFromAPI();
        console.log('Categorías obtenidas:', categorias.length);
        
        // Filtrar solo categorías activas y ordenar por nombre
        const categoriasOrdenadas = categorias
            .filter(cat => cat.estado_categoria === 'activo' || !cat.estado_categoria) // Incluir si no tiene estado
            .sort((a, b) => (a.nombre || a.nombre_categoria || '').localeCompare(b.nombre || b.nombre_categoria || ''));
        
        console.log('Categorías activas:', categoriasOrdenadas.length);
        
        categoriasOrdenadas.forEach(categoria => {
            const option = document.createElement('option');
            option.value = useIdAsValue ? categoria.id_categoria : (categoria.nombre || categoria.nombre_categoria || '').toLowerCase().replace(/\s+/g, '_');
            option.textContent = categoria.nombre || categoria.nombre_categoria || 'Sin nombre';
            selectElement.appendChild(option);
        });
        
        console.log('Categorías cargadas en select:', selectElement.id, '- Total:', categoriasOrdenadas.length);
    } catch (error) {
        console.error('Error al cargar categorías en select:', error);
    }
}

// Sistema de eventos para actualización automática de categorías
if (typeof window.CategoriaEventManager === 'undefined') {
    window.CategoriaEventManager = class {
        constructor() {
            this.selectores = new Set();
            this.init();
        }
        
        init() {
            // Escuchar evento personalizado de categoría creada
            document.addEventListener('categoriaCreada', (event) => {
                console.log('Categoría creada, actualizando todos los selectores...');
                this.actualizarTodosLosSelectores();
            });
            
            // Escuchar evento personalizado de categoría actualizada
            document.addEventListener('categoriaActualizada', (event) => {
                console.log('Categoría actualizada, actualizando todos los selectores...');
                this.actualizarTodosLosSelectores();
            });
        }
        
        // Registrar un selector para actualización automática
        registrarSelector(selectElement, includeEmpty = true, useIdAsValue = true) {
            if (selectElement) {
                this.selectores.add({
                    element: selectElement,
                    includeEmpty,
                    useIdAsValue
                });
                console.log('Selector registrado para actualización automática');
            }
        }
        
        // Actualizar todos los selectores registrados
        async actualizarTodosLosSelectores() {
            console.log(`Actualizando ${this.selectores.size} selectores de categorías...`);
            
            for (const selector of this.selectores) {
                try {
                    await loadCategoriasInSelect(
                        selector.element, 
                        selector.includeEmpty, 
                        selector.useIdAsValue
                    );
                    console.log('Selector actualizado:', selector.element.id || 'sin-id');
                } catch (error) {
                    console.error('Error actualizando selector:', error);
                }
            }
        }
    };
}

// Instancia global del gestor de eventos (solo si no existe)
if (typeof window.categoriaEventManager === 'undefined') {
    window.categoriaEventManager = new window.CategoriaEventManager();
}

// Función mejorada para cargar categorías con registro automático
async function loadCategoriasInSelectWithAutoUpdate(selectElement, includeEmpty = true, useIdAsValue = true) {
    console.log('loadCategoriasInSelectWithAutoUpdate iniciada para:', selectElement.id);
    
    if (window.categoriaEventManager) {
        console.log('Registrando selector para actualización automática');
        window.categoriaEventManager.registrarSelector(selectElement, includeEmpty, useIdAsValue);
    } else {
        console.warn('categoriaEventManager no está disponible');
    }
    
    console.log('Cargando categorías en el selector...');
    await loadCategoriasInSelect(selectElement, includeEmpty, useIdAsValue);
    console.log('Categorías cargadas en:', selectElement.id);
}

// Función para cargar categorías como checkboxes (para filtros)
async function loadCategoriasAsCheckboxes(containerElement, excludeAllOption = false) {
    if (!containerElement) return;
    
    // Intentar cargar desde API primero, luego localStorage
    const categorias = await loadCategoriasFromAPI();
    
    // Filtrar solo categorías activas y ordenar por nombre
    const categoriasOrdenadas = categorias
        .filter(cat => cat.estado_categoria === 'activo')
        .sort((a, b) => a.nombre_categoria.localeCompare(b.nombre_categoria));
    
    categoriasOrdenadas.forEach(categoria => {
        const label = document.createElement('label');
        label.className = 'filtro-item';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'categoria';
        input.value = categoria.nombre_categoria.toLowerCase().replace(/\s+/g, '_');
        input.id = `filtro-${categoria.nombre_categoria.toLowerCase().replace(/\s+/g, '_')}`;
        
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        
        const text = document.createElement('span');
        text.textContent = categoria.nombre_categoria;
        
        label.appendChild(input);
        label.appendChild(checkmark);
        label.appendChild(text);
        
        containerElement.appendChild(label);
    });
}

// Función para cargar categorías como enlaces (para footer)
async function loadCategoriasAsLinks(containerElement) {
    if (!containerElement) return;
    
    // Intentar cargar desde API primero, luego localStorage
    const categorias = await loadCategoriasFromAPI();
    
    // Filtrar solo categorías activas y ordenar por nombre
    const categoriasOrdenadas = categorias
        .filter(cat => cat.estado_categoria === 'activo')
        .sort((a, b) => a.nombre_categoria.localeCompare(b.nombre_categoria));
    
    categoriasOrdenadas.forEach(categoria => {
        const li = document.createElement('li');
        
        const link = document.createElement('a');
        link.href = `catalogo.html?categoria=${categoria.nombre_categoria.toLowerCase().replace(/\s+/g, '_')}`;
        link.textContent = categoria.nombre_categoria;
        
        li.appendChild(link);
        containerElement.appendChild(li);
    });
}

// Función para obtener el nombre de una categoría por ID
async function getCategoriaNombreById(id) {
    const categorias = await loadCategoriasFromAPI();
    const categoria = categorias.find(cat => cat.id_categoria == id);
    
    return categoria ? categoria.nombre_categoria : 'Sin categoría';
}

// Función para obtener el ID de una categoría por nombre
async function getCategoriaIdByNombre(nombre) {
    const categorias = await loadCategoriasFromAPI();
    const categoria = categorias.find(cat => 
        cat.nombre_categoria.toLowerCase().replace(/\s+/g, '_') === nombre.toLowerCase().replace(/\s+/g, '_')
    );
    
    return categoria ? categoria.id_categoria : null;
}

// Función para obtener una categoría por ID
async function getCategoriaById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}`);
        if (!response.ok) {
            throw new Error('Categoría no encontrada');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener categoría por ID:', error);
        // Fallback a localStorage
        const categorias = getCategorias();
        return categorias.find(cat => cat.id_categoria == id) || null;
    }
}

// Función para inicializar categorías
async function initializeCategorias() {
    try {
        // Intentar cargar desde la API
        await loadCategoriasFromAPI();
    } catch (error) {
        console.error('Error al inicializar categorías:', error);
        // Si no hay categorías en localStorage, inicializar array vacío
        if (!localStorage.getItem('categorias')) {
            localStorage.setItem('categorias', JSON.stringify([]));
        }
    }
}

// Función para sincronizar categorías con la API
async function syncCategorias() {
    try {
        await loadCategoriasFromAPI();
        console.log('Categorías sincronizadas correctamente');
    } catch (error) {
        console.error('Error al sincronizar categorías:', error);
    }
}

// Inicializar categorías al cargar el script
initializeCategorias();

// Exportar funciones para uso global
window.loadCategoriasFromAPI = loadCategoriasFromAPI;
window.syncCategorias = syncCategorias;
window.getCategoriaById = getCategoriaById;
