// Unidades de medida por categoría
function obtenerUnidadPorCategoria(categoriaId, categoriaNombre = null) {
    // Si se proporciona el nombre de la categoría, usarlo
    let nombreCategoria = categoriaNombre;
    
    // Si solo tenemos el ID, obtener el nombre de la categoría
    if (!nombreCategoria && categoriaId) {
        // Intentar obtener de localStorage
        const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
        const categoria = categorias.find(cat => cat.id_categoria == categoriaId);
        if (categoria) {
            nombreCategoria = categoria.nombre || categoria.nombre_categoria || '';
        }
    }
    
    // Normalizar el nombre de la categoría
    const nombreNormalizado = (nombreCategoria || '').toLowerCase().trim();
    
    // Categorías cárnicas (solo libras)
    const categoriasCarnicas = ['res', 'cerdo', 'pollo', 'carne de res', 'carne de cerdo'];
    
    // Categorías embutidos (solo unidades)
    const categoriasEmbutidos = ['embutidos', 'embutido', 'chorizo', 'salchicha', 'longaniza', 'jamón', 'jamón', 'mortadela'];
    
    // Verificar si es una categoría cárnica
    if (categoriasCarnicas.some(cat => nombreNormalizado.includes(cat))) {
        return 'lb';
    }
    
    // Verificar si es una categoría de embutidos
    if (categoriasEmbutidos.some(cat => nombreNormalizado.includes(cat))) {
        return 'unidad';
    }
    
    // Por defecto, retornar null para que el usuario seleccione
    return null;
}

function obtenerUnidadesPermitidas(categoriaId, categoriaNombre = null) {
    const unidad = obtenerUnidadPorCategoria(categoriaId, categoriaNombre);
    
    if (unidad === 'lb') {
        return [{ value: 'lb', label: 'Libra (lb)' }];
    } else if (unidad === 'unidad') {
        return [{ value: 'unidad', label: 'Unidad' }];
    }
    
    // Si no se puede determinar, permitir todas las opciones (pero esto no debería pasar)
    return [
        { value: 'kg', label: 'Kilogramo (kg)' },
        { value: 'lb', label: 'Libra (lb)' },
        { value: 'gr', label: 'Gramo (gr)' },
        { value: 'unidad', label: 'Unidad' }
    ];
}

function validarUnidadParaCategoria(unidad, categoriaId, categoriaNombre = null) {
    const unidadRequerida = obtenerUnidadPorCategoria(categoriaId, categoriaNombre);
    
    // Si no hay restricción, cualquier unidad es válida
    if (!unidadRequerida) {
        return true;
    }
    
    // Si hay restricción, la unidad debe coincidir
    return unidad === unidadRequerida;
}

function obtenerTextoAyudaUnidad(categoriaId, categoriaNombre = null) {
    const unidad = obtenerUnidadPorCategoria(categoriaId, categoriaNombre);
    
    if (unidad === 'lb') {
        return 'Los productos cárnicos frescos se manejan exclusivamente en libras';
    } else if (unidad === 'unidad') {
        return 'Los embutidos se manejan exclusivamente por unidades';
    }
    
    return 'Seleccione la unidad de medida';
}

function actualizarSelectUnidad(selectUnidad, categoriaId, categoriaNombre = null, unidadActual = null) {
    if (!selectUnidad) return;
    
    const unidadesPermitidas = obtenerUnidadesPermitidas(categoriaId, categoriaNombre);
    const unidadRequerida = obtenerUnidadPorCategoria(categoriaId, categoriaNombre);
    
    // Guardar valor actual si existe
    const valorActual = unidadActual || selectUnidad.value;
    
    // Limpiar select
    selectUnidad.innerHTML = '';
    
    // Si solo hay una opción permitida, hacer el select readonly
    if (unidadesPermitidas.length === 1) {
        const option = document.createElement('option');
        option.value = unidadesPermitidas[0].value;
        option.textContent = unidadesPermitidas[0].label;
        option.selected = true;
        selectUnidad.appendChild(option);
        selectUnidad.disabled = false; // Mantener habilitado pero con una sola opción
        selectUnidad.style.backgroundColor = '#f3f4f6'; // Indicar visualmente que está restringido
        
        // Agregar texto de ayuda
        const helpText = selectUnidad.parentElement.querySelector('.unidad-help-text');
        if (helpText) {
            helpText.textContent = obtenerTextoAyudaUnidad(categoriaId, categoriaNombre);
            helpText.style.display = 'block';
        }
    } else {
        // Agregar opción vacía
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Seleccionar unidad';
        selectUnidad.appendChild(emptyOption);
        
        // Agregar todas las opciones
        unidadesPermitidas.forEach(unidad => {
            const option = document.createElement('option');
            option.value = unidad.value;
            option.textContent = unidad.label;
            if (valorActual === unidad.value) {
                option.selected = true;
            }
            selectUnidad.appendChild(option);
        });
        
        selectUnidad.style.backgroundColor = '';
        
        // Ocultar texto de ayuda si existe
        const helpText = selectUnidad.parentElement.querySelector('.unidad-help-text');
        if (helpText) {
            helpText.style.display = 'none';
        }
    }
}

// Función para obtener el nombre de la categoría por ID
async function obtenerNombreCategoriaPorId(categoriaId) {
    if (!categoriaId) return null;
    
    try {
        // Intentar obtener de localStorage primero
        const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
        const categoria = categorias.find(cat => cat.id_categoria == categoriaId);
        if (categoria) {
            return categoria.nombre || categoria.nombre_categoria || null;
        }
        
        // Si no está en localStorage, consultar API
        const response = await fetch(`http://localhost:3000/api/categorias/${categoriaId}`);
        if (response.ok) {
            const categoria = await response.json();
            return categoria.nombre || categoria.nombre_categoria || null;
        }
    } catch (error) {
        console.error('Error al obtener nombre de categoría:', error);
    }
    
    return null;
}

// Exportar funciones globalmente
window.obtenerUnidadPorCategoria = obtenerUnidadPorCategoria;
window.obtenerUnidadesPermitidas = obtenerUnidadesPermitidas;
window.validarUnidadParaCategoria = validarUnidadParaCategoria;
window.obtenerTextoAyudaUnidad = obtenerTextoAyudaUnidad;
window.actualizarSelectUnidad = actualizarSelectUnidad;
window.obtenerNombreCategoriaPorId = obtenerNombreCategoriaPorId;

