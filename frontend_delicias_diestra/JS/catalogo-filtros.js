/**
 * Sistema de Filtros para Catálogo - Actualizado para usar API
 * Este archivo maneja todos los filtros del catálogo de productos
 */

// Variables globales
let productos = [];
let productosFiltrados = [];
let categoriasCache = []; // Cache de categorías para evitar múltiples llamadas a la API

// Función auxiliar para formatear precios en formato colombiano
// Formato: $ 13.500 (sin decimales, con punto como separador de miles)
function formatearPrecio(precio) {
    // Convertir a número entero (sin decimales)
    const precioEntero = Math.round(parseFloat(precio) || 0);
    // Formatear con punto como separador de miles
    return precioEntero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// URL base de la API
var API_BASE_URL = 'http://localhost:3000/api';

// Variables globales para filtros
let filtrosActivos = {
    busqueda: '',
    categorias: ['todos'],
    precioMax: 50000,
    ordenamiento: 'nombre'
};
let modoVista = 'productos'; // 'productos' o 'ofertas'

// ========================================
// FUNCIONES DE API
// ========================================

// Cargar productos desde la API (solo los del catálogo público)
async function cargarProductosDesdeAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/productos/catalogo`);
        if (!response.ok) {
            throw new Error('Error al cargar productos desde la API');
        }
        const result = await response.json();
        
        // Debug: Ver qué devuelve el backend
        console.log('Respuesta del backend:', result);
        if (result.productos && result.productos.length > 0) {
            console.log('Primer producto del backend:', result.productos[0]);
            console.log('Campo imagen del primer producto:', result.productos[0].imagen);
        }
        
        // Convertir productos de la API al formato esperado por el frontend
        productos = (result.productos || result)
            .filter(producto => {
                // Filtrar productos de categorías que no deben mostrarse en catálogo
                // Si la categoría tiene mostrar_en_catalogo = false, no mostrar sus productos
                // Usar el cache completo de todas las categorías si está disponible
                const categoriasParaFiltrar = window.todasLasCategoriasCache || categoriasCache || [];
                
                if (categoriasParaFiltrar.length > 0) {
                    const categoria = categoriasParaFiltrar.find(cat => cat.id_categoria === producto.id_categoria);
                    if (categoria) {
                        // Si la categoría no debe mostrarse, no mostrar sus productos
                        if (!debeMostrarEnCatalogo(categoria)) {
                            console.log(`🚫 Producto "${producto.nombre_producto || producto.nombre}" oculto porque su categoría "${categoria.nombre_categoria || categoria.nombre}" tiene mostrar_en_catalogo = false`);
                            return false;
                        }
                    }
                }
                return true;
            })
            .map(producto => {
            // Obtener el orden de la categoría
            const categoriaOrden = obtenerOrdenCategoria(producto.id_categoria);
            
            // Manejar imagen: verificar si existe y no es null/vacío
            let imagenUrl = null;
            if (producto.imagen && producto.imagen.trim() !== '' && producto.imagen !== 'null' && producto.imagen !== null) {
                // Si ya es una URL completa, usarla directamente
                if (producto.imagen.startsWith('http://') || producto.imagen.startsWith('https://')) {
                    imagenUrl = producto.imagen;
                } 
                // Si empieza con /uploads, agregar el dominio
                else if (producto.imagen.startsWith('/uploads/')) {
                    imagenUrl = `http://localhost:3000${producto.imagen}`;
                }
                // Si es solo el nombre del archivo, construir la ruta completa
                else {
                    // Limpiar el nombre del archivo (eliminar espacios y caracteres especiales)
                    const nombreArchivo = producto.imagen.trim();
                    imagenUrl = `http://localhost:3000/uploads/productos/${nombreArchivo}`;
                }
            }
            
            return {
                id: producto.id_producto.toString(),
                nombre: producto.nombre_producto || producto.nombre || 'Sin nombre', // Priorizar 'nombre_producto'
                categoria: obtenerSlugCategoria(producto.id_categoria),
                categoriaId: producto.id_categoria, // Guardar ID de categoría para validar unidades
                categoriaNombre: producto.categoria_nombre || null, // Nombre de categoría desde el backend
                categoriaOrden: categoriaOrden, // Orden de visualización de la categoría
                precio: producto.precio_producto || producto.precio || 0, // Mapear precio_producto a precio
                precioOriginal: producto.precio_producto || producto.precio || 0, // Por ahora usamos el mismo precio
                stock: producto.inventario_saldo || producto.stock_actual || producto.cantidad_producto || producto.stock || 0, // Priorizar inventario_saldo
                unidad_medida: producto.unidad_medida || 'lb', // Incluir unidad de medida
                descripcion: producto.descripcion || '',
                // Guardar URL de imagen o null si no hay imagen
                imagen: imagenUrl || 'fas fa-box', // Usar icono solo si no hay URL de imagen
                esOferta: false // Por ahora no hay ofertas desde la API
            };
        });
        
        console.log('Productos mapeados:', productos.length);
        productos.forEach((producto, index) => {
            const productoOriginal = (result.productos || result)[index];
            console.log(`  - ${producto.nombre}:`);
            console.log(`    Imagen en BD: ${productoOriginal?.imagen || 'null/undefined'}`);
            console.log(`    Tipo: ${typeof productoOriginal?.imagen}`);
            if (producto.imagen && !producto.imagen.startsWith('fas fa-')) {
                console.log(`    URL de imagen: ${producto.imagen}`);
            } else {
                console.log(`    Sin imagen, usando icono: ${producto.imagen}`);
            }
        });
        
        productosFiltrados = [...productos];
        
        // Nota: No verificamos las imágenes con fetch porque causa errores CORS
        // Las imágenes se cargarán directamente en el HTML con manejo de errores usando onerror
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('productos', JSON.stringify(productos));
        
        // Hacer productos disponibles globalmente para el carrito
        window.productos = productos;
        
        console.log('Productos cargados desde API:', productos.length);
        return productos;
    } catch (error) {
        console.error('Error al cargar productos desde API:', error);
        // Si falla la API, usar localStorage
        const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
        productos = productosGuardados;
        productosFiltrados = [...productos];
        return productos;
    }
}

// Obtener slug de categoría por ID
function obtenerSlugCategoria(idCategoria) {
    // Si no hay categorías en el cache, usar un mapeo básico
    if (!categoriasCache || categoriasCache.length === 0) {
        console.warn('categoriasCache vacío, usando mapeo básico');
        const mapeoBasico = {
            1: 'todos-los-productos',
            2: 'carne-de-res',
            3: 'carne-de-cerdo',
            4: 'pollo',
            5: 'pollo-campesino'
        };
        return mapeoBasico[idCategoria] || 'otros';
    }
    
    // Convertir el nombre de la categoría a slug
    const categoria = categoriasCache.find(cat => cat.id_categoria === idCategoria);
    if (categoria) {
        const nombreCategoria = categoria.nombre_categoria || categoria.nombre || '';
        return nombreCategoria.toLowerCase().replace(/\s+/g, '-');
    }
    return 'otros';
}

// Obtener orden de visualización de categoría por ID
function obtenerOrdenCategoria(idCategoria) {
    // Si no hay categorías en el cache, retornar un valor alto para que aparezcan al final
    if (!categoriasCache || categoriasCache.length === 0) {
        return 9999;
    }
    
    // Buscar la categoría y retornar su orden
    const categoria = categoriasCache.find(cat => cat.id_categoria === idCategoria);
    if (categoria) {
        // El orden puede venir como 'orden' o 'orden_visualizacion'
        return categoria.orden || categoria.orden_visualizacion || 9999;
    }
    return 9999;
}

// Función para renderizar imagen con fallback
// Nota: Las imágenes se renderizan directamente en el HTML con manejo de errores usando onerror
// para evitar problemas de CORS al verificar con fetch
function renderizarImagen(producto) {
    if (producto.imagen.startsWith('fas fa-')) {
        return `<i class="${producto.imagen}"></i>`;
    }
    
    // Renderizar imagen directamente con manejo de errores en el HTML
    return `<img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
             <i class="fas fa-box" style="display:none;"></i>`;
}

// ========================================
// FUNCIONES DE FILTROS
// ========================================

// Función auxiliar para determinar si una categoría debe mostrarse en el catálogo
function debeMostrarEnCatalogo(categoria) {
    // Si tiene el campo mostrar_en_catalogo, verificar su valor
    if (categoria.mostrar_en_catalogo !== undefined && categoria.mostrar_en_catalogo !== null) {
        // Verificar valores que indican que NO debe mostrarse
        if (categoria.mostrar_en_catalogo === false || 
            categoria.mostrar_en_catalogo === 0 || 
            categoria.mostrar_en_catalogo === 'false' ||
            categoria.mostrar_en_catalogo === '0' ||
            categoria.mostrar_en_catalogo === false ||
            String(categoria.mostrar_en_catalogo).toLowerCase() === 'false') {
            console.log(`Categoría "${categoria.nombre_categoria || categoria.nombre}" NO debe mostrarse (mostrar_en_catalogo = ${categoria.mostrar_en_catalogo})`);
            return false;
        }
        // Verificar valores que indican que SÍ debe mostrarse
        if (categoria.mostrar_en_catalogo === true || 
            categoria.mostrar_en_catalogo === 1 || 
            categoria.mostrar_en_catalogo === 'true' ||
            categoria.mostrar_en_catalogo === '1' ||
            String(categoria.mostrar_en_catalogo).toLowerCase() === 'true') {
            return true;
        }
    }
    // Si no tiene el campo o el valor no es claro, solo mostrar si está activa
    // Por defecto, si no existe el campo, asumimos que debe mostrarse (comportamiento legacy)
    const debeMostrar = categoria.estado === 'activo' || !categoria.estado;
    if (!debeMostrar) {
        console.log(`Categoría "${categoria.nombre_categoria || categoria.nombre}" no tiene mostrar_en_catalogo, usando estado: ${categoria.estado}`);
    }
    return debeMostrar;
}

// Función para cambiar el modo de vista (Productos/Ofertas)
function cambiarModoVista(modo) {
    modoVista = modo;
    
    // Actualizar botones de vista
    const btnProductos = document.getElementById('btn-vista-productos');
    const btnOfertas = document.getElementById('btn-vista-ofertas');
    
    if (btnProductos && btnOfertas) {
        btnProductos.classList.toggle('active', modo === 'productos');
        btnOfertas.classList.toggle('active', modo === 'ofertas');
    }
    
    aplicarFiltros();
}

// Función para actualizar los filtros de categorías dinámicamente
async function actualizarFiltrosCategorias() {
    const filtrosContainer = document.getElementById('filtros-categorias');
    // Si no existe el contenedor de filtros de categorías, no hacer nada (sección eliminada)
    if (!filtrosContainer) {
        console.log('Contenedor de filtros de categorías no encontrado (sección eliminada)');
        return;
    }
    
    try {
        // Cargar categorías del catálogo (solo las que deben mostrarse)
        let categorias;
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/catalogo`);
            if (response.ok) {
                categorias = await response.json();
                console.log('Categorías del catálogo cargadas desde endpoint /catalogo:', categorias.length);
            } else {
                console.warn('Endpoint /catalogo no disponible, usando endpoint normal y filtrando');
                categorias = await loadCategoriasFromAPI();
                // Filtrar solo categorías que deben mostrarse en catálogo
                categorias = categorias.filter(cat => {
                    return debeMostrarEnCatalogo(cat);
                });
            }
        } catch (error) {
            console.warn('Error al cargar categorías del catálogo, usando endpoint normal:', error);
            categorias = await loadCategoriasFromAPI();
            // Filtrar solo categorías que deben mostrarse en catálogo
            categorias = categorias.filter(cat => {
                return debeMostrarEnCatalogo(cat);
            });
        }
        
        console.log('Categorías filtradas para mostrar en catálogo:', categorias.length);
        categorias.forEach(cat => {
            const mostrar = cat.mostrar_en_catalogo;
            const debeMostrar = debeMostrarEnCatalogo(cat);
            console.log(`  - ${cat.nombre_categoria || cat.nombre}: mostrar_en_catalogo = ${mostrar} (debe mostrar: ${debeMostrar})`);
        });
        
        // Filtrar nuevamente para asegurarse de que solo se muestren las correctas
        const categoriasFinales = categorias.filter(cat => debeMostrarEnCatalogo(cat));
        console.log('Categorías finales después de filtrado:', categoriasFinales.length);
        
        // Actualizar cache de categorías (guardar todas para referencia, pero solo mostrar las del catálogo)
        categoriasCache = categoriasFinales;
        
        // Limpiar filtros existentes (excepto "Todos")
        const todosFiltro = filtrosContainer.querySelector('#filtro-todos');
        filtrosContainer.innerHTML = '';
        
        // Agregar filtro "Todos"
        if (todosFiltro) {
            filtrosContainer.appendChild(todosFiltro);
        } else {
            const todosLabel = document.createElement('label');
            todosLabel.className = 'filtro-item active';
            todosLabel.innerHTML = `
                <input type="checkbox" name="categoria" value="todos" id="filtro-todos" checked>
                <span class="checkmark"></span>
                Todos los Productos
            `;
            filtrosContainer.appendChild(todosLabel);
        }
        
        // Ordenar categorías por orden de visualización antes de agregarlas
        const categoriasOrdenadas = [...categoriasFinales].sort((a, b) => {
            const ordenA = a.orden || a.orden_visualizacion || 9999;
            const ordenB = b.orden || b.orden_visualizacion || 9999;
            return ordenA - ordenB;
        });
        
        // Agregar categorías dinámicamente en orden (solo las que deben mostrarse)
        categoriasOrdenadas.forEach(categoria => {
            // Verificar una vez más antes de agregar
            if (!debeMostrarEnCatalogo(categoria)) {
                console.log(`🚫 Omitiendo categoría "${categoria.nombre_categoria || categoria.nombre}" porque mostrar_en_catalogo = false`);
                return;
            }
            
            const slug = obtenerSlugCategoria(categoria.id_categoria);
            const label = document.createElement('label');
            label.className = 'filtro-item';
            label.innerHTML = `
                <input type="checkbox" name="categoria" value="${slug}" id="filtro-${slug}">
                <span class="checkmark"></span>
                ${categoria.nombre_categoria || categoria.nombre || 'Sin nombre'}
            `;
            filtrosContainer.appendChild(label);
        });
        
        // Agregar event listeners a los nuevos filtros
        agregarEventListenersFiltros();
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
    
    aplicarFiltros();
}

// Función para agregar event listeners a los filtros
function agregarEventListenersFiltros() {
    // Remover todos los listeners anteriores
    const filtrosCategorias = document.querySelectorAll('#filtros-categorias input[type="checkbox"]');
    
    filtrosCategorias.forEach(filtro => {
        // Remover listeners anteriores creando un nuevo elemento
        const nuevoFiltro = filtro.cloneNode(true);
        const parent = filtro.parentNode;
        parent.replaceChild(nuevoFiltro, filtro);
        
        nuevoFiltro.addEventListener('change', function() {
            const todosLosFiltros = document.querySelectorAll('#filtros-categorias input[type="checkbox"]');
            
            if (this.value === 'todos') {
                // Si se selecciona "Todos", deseleccionar otros
                if (this.checked) {
                    todosLosFiltros.forEach(f => {
                        if (f.value !== 'todos' && f.id !== this.id) {
                            f.checked = false;
                        }
                    });
                    filtrosActivos.categorias = ['todos'];
                } else {
                    // Si se deselecciona "Todos", no hacer nada (debe estar siempre seleccionado o al menos una categoría)
                    this.checked = true;
                }
            } else {
                // Si se selecciona una categoría específica, deseleccionar "Todos"
                const todosFiltro = document.getElementById('filtro-todos');
                if (todosFiltro && this.checked) {
                    todosFiltro.checked = false;
                    // Remover "todos" del array si está
                    filtrosActivos.categorias = filtrosActivos.categorias.filter(cat => cat !== 'todos');
                }
                
                // Actualizar array de categorías activas
                if (this.checked) {
                    if (!filtrosActivos.categorias.includes(this.value)) {
                        filtrosActivos.categorias.push(this.value);
                    }
                } else {
                    filtrosActivos.categorias = filtrosActivos.categorias.filter(cat => cat !== this.value);
                    // Si no hay categorías seleccionadas, seleccionar "Todos"
                    if (filtrosActivos.categorias.length === 0) {
                        const todosFiltro = document.getElementById('filtro-todos');
                        if (todosFiltro) {
                            todosFiltro.checked = true;
                            filtrosActivos.categorias = ['todos'];
                        }
                    }
                }
            }
            
            // Actualizar clases activas
            todosLosFiltros.forEach(f => {
                const label = f.closest('.filtro-item');
                if (label) {
                    if (f.checked) {
                        label.classList.add('active');
                    } else {
                        label.classList.remove('active');
                    }
                }
            });
            
            aplicarFiltros();
        });
    });
}

// Función para limpiar todos los filtros
function limpiarFiltros() {
    // Limpiar búsqueda
    const buscarInput = document.getElementById('buscar-producto');
    if (buscarInput) {
        buscarInput.value = '';
    }
    filtrosActivos.busqueda = '';
    
    // Resetear categorías a "Todos"
    const todosFiltro = document.getElementById('filtro-todos');
    const todosLosFiltros = document.querySelectorAll('#filtros-categorias input[type="checkbox"]');
    todosLosFiltros.forEach(f => {
        f.checked = (f.value === 'todos');
        const label = f.closest('.filtro-item');
        if (label) {
            label.classList.toggle('active', f.checked);
        }
    });
    filtrosActivos.categorias = ['todos'];
    
    // Resetear precio máximo
    const precioSlider = document.getElementById('precio-max');
    const precioInput = document.getElementById('precio-max-input');
    if (precioSlider) {
        precioSlider.value = 50000;
    }
    if (precioInput) {
        precioInput.value = 50000;
    }
    filtrosActivos.precioMax = 50000;
    
    // Actualizar label del precio máximo
    const precioLabels = document.querySelectorAll('.precio-labels span:last-child');
    precioLabels.forEach(label => {
        label.textContent = '$50.000';
    });
    
    // Resetear ordenamiento
    const ordenSelect = document.getElementById('filtros-ordenar');
    if (ordenSelect) {
        ordenSelect.value = 'nombre';
    }
    filtrosActivos.ordenamiento = 'nombre';
    
    // Aplicar filtros
    aplicarFiltros();
}

// Función principal para aplicar todos los filtros
function aplicarFiltros() {
    productosFiltrados = [...productos];
    
    // Filtrar por modo de vista (Productos/Ofertas)
    if (modoVista === 'ofertas') {
        productosFiltrados = productosFiltrados.filter(producto => producto.esOferta);
    }
    
    // Filtrar por búsqueda
    if (filtrosActivos.busqueda) {
        productosFiltrados = productosFiltrados.filter(producto =>
            producto.nombre.toLowerCase().includes(filtrosActivos.busqueda) ||
            producto.descripcion.toLowerCase().includes(filtrosActivos.busqueda)
        );
    }
    
    // Filtrar por categorías
    if (!filtrosActivos.categorias.includes('todos')) {
        productosFiltrados = productosFiltrados.filter(producto =>
            filtrosActivos.categorias.includes(producto.categoria)
        );
    }
    
    // Filtrar por precio
    productosFiltrados = productosFiltrados.filter(producto =>
        producto.precio <= filtrosActivos.precioMax
    );
    
    // Ordenar productos: primero por orden de categoría, luego por el criterio seleccionado
    productosFiltrados.sort((a, b) => {
        // Primero ordenar por orden de categoría (menor número = primero)
        const ordenA = a.categoriaOrden || 9999;
        const ordenB = b.categoriaOrden || 9999;
        
        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }
        
        // Si tienen el mismo orden de categoría, ordenar por el criterio seleccionado
        switch (filtrosActivos.ordenamiento) {
            case 'nombre':
                const nombreA = a.nombre || '';
                const nombreB = b.nombre || '';
                return nombreA.localeCompare(nombreB);
            case 'precio-asc':
                return (a.precio || 0) - (b.precio || 0);
            case 'precio-desc':
                return (b.precio || 0) - (a.precio || 0);
            case 'stock':
                return (b.stock || 0) - (a.stock || 0);
            default:
                // Por defecto, ordenar por nombre dentro de la misma categoría
                const nombreDefaultA = a.nombre || '';
                const nombreDefaultB = b.nombre || '';
                return nombreDefaultA.localeCompare(nombreDefaultB);
        }
    });
    
    // Actualizar la vista
    mostrarProductos();
    actualizarContador();
}

// Función para mostrar los productos filtrados
function mostrarProductos() {
    const productosContainer = document.getElementById('productos-grid');
    if (!productosContainer) return;
    
    // Mostrar mensaje si no hay productos
    if (productosFiltrados.length === 0) {
            productosContainer.innerHTML = `
            <div class="no-productos">
                <i class="fas fa-box-open"></i>
                    <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
        actualizarContador();
        return;
    }
    
        const productosHTML = productosFiltrados.map(producto => {
        // Determinar si tiene imagen o debe usar icono
        const tieneImagen = producto.imagen && !producto.imagen.startsWith('fas fa-') && producto.imagen !== null;
        const urlImagen = tieneImagen ? producto.imagen : '';
        const iconoClase = producto.imagen && producto.imagen.startsWith('fas fa-') ? producto.imagen : 'fas fa-box';
        
        // Log para diagnóstico
        if (tieneImagen) {
            console.log(`Producto "${producto.nombre}": URL de imagen = ${urlImagen}`);
        } else {
            console.log(`Producto "${producto.nombre}": Sin imagen, usando icono`);
        }
        
        return `
        <div class="producto-card" data-categoria="${producto.categoria}">
            <div class="producto-imagen">
                ${tieneImagen ? 
                    `<img src="${urlImagen}" alt="${producto.nombre}" 
                          onerror="console.error('Error al cargar imagen para ${producto.nombre}:', '${urlImagen}'); this.style.display='none'; const fallback = this.nextElementSibling; if(fallback) { fallback.style.display='flex'; }" 
                          onload="console.log('Imagen cargada correctamente para ${producto.nombre}:', '${urlImagen}');"
                          loading="lazy">
                     <i class="fas fa-box producto-imagen-fallback" style="display:none;"></i>` : 
                    `<i class="${iconoClase}"></i>`
                }
                ${producto.esOferta ? '<div class="etiqueta-oferta">¡Oferta!</div>' : ''}
            </div>
            <div class="producto-info">
                <div class="categoria-producto">${obtenerNombreCategoria(producto.categoria, producto.categoriaId, producto.categoriaNombre)}</div>
                <h3 class="nombre-producto">${producto.nombre}</h3>
                <p class="descripcion-producto">${producto.descripcion}</p>
                       <div class="precio-container">
                           <span class="precio-actual">$ ${formatearPrecio(producto.precio)} /${producto.unidad_medida || 'lb'}</span>
                           ${producto.esOferta && producto.precioOriginal > producto.precio ?
                               `<span class="precio-tachado">$ ${formatearPrecio(producto.precioOriginal)} /${producto.unidad_medida || 'lb'}</span>` : ''}
                       </div>
                       <div class="stock-container">
                           <span class="stock-label">Stock disponible:</span>
                           <span class="stock-cantidad" id="stock-${producto.id}" data-stock="${producto.stock}">
                               ${formatearNumero(producto.stock)} ${producto.unidad_medida || 'lb'}
                           </span>
                       </div>
                <div class="controles-producto">
                    <div class="selector-cantidad">
                        <button class="btn-cantidad" onclick="cambiarCantidad('${producto.id}', -1)" id="btn-cantidad-minus-${producto.id}">-</button>
                        <input type="number" class="input-cantidad" value="1" min="1" id="cantidad-${producto.id}" 
                               data-producto-id="${producto.id}" data-stock="${producto.stock}" 
                               onchange="validarCantidadStock('${producto.id}')" 
                               oninput="validarCantidadStock('${producto.id}')">
                        <button class="btn-cantidad" onclick="cambiarCantidad('${producto.id}', 1)" id="btn-cantidad-plus-${producto.id}">+</button>
                    </div>
                    <button class="btn-agregar-carrito" id="btn-agregar-${producto.id}" 
                            onclick="agregarAlCarritoCatalogo('${producto.id}')" 
                            data-producto-id="${producto.id}">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    productosContainer.innerHTML = productosHTML;
    
    // Validar stock inicial para cada producto después de renderizar
    productosFiltrados.forEach(producto => {
        setTimeout(() => {
            validarCantidadStock(producto.id);
        }, 100);
    });
}

// Función para actualizar el contador de productos
function actualizarContador() {
    const contador = document.getElementById('productos-contador');
    if (contador) {
        contador.textContent = `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''}`;
    }
}

// Función para obtener el nombre de la categoría por slug o ID
function obtenerNombreCategoria(slug, categoriaId = null, categoriaNombre = null) {
    // Si el nombre viene directamente del producto (desde el backend), usarlo primero
    if (categoriaNombre && categoriaNombre.trim() !== '') {
        return categoriaNombre;
    }
    
    // Intentar obtener desde el cache de categorías usando el ID
    if (categoriaId && categoriasCache && categoriasCache.length > 0) {
        const categoria = categoriasCache.find(cat => cat.id_categoria === categoriaId || cat.id_categoria == categoriaId);
        if (categoria) {
            return categoria.nombre_categoria || categoria.nombre || 'Sin categoría';
        }
    }
    
    // Si no se encuentra por ID, intentar por slug
    if (categoriasCache && categoriasCache.length > 0) {
        const categoria = categoriasCache.find(cat => {
            const nombreSlug = (cat.nombre_categoria || cat.nombre || '').toLowerCase().replace(/\s+/g, '-');
            return nombreSlug === slug;
        });
        if (categoria) {
            return categoria.nombre_categoria || categoria.nombre || 'Sin categoría';
        }
    }
    
    // Fallback a mapeo estático si no hay cache
    const nombresCategorias = {
        'res': 'Res',
        'carne-de-res': 'Carne de Res',
        'cerdo': 'Cerdo',
        'carne-de-cerdo': 'Carne de Cerdo',
        'pollo': 'Pollo',
        'embutidos': 'Embutidos',
        'aves': 'Aves',
        'pescado': 'Pescado',
        'otros': 'Otros'
    };
    return nombresCategorias[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
}

// ========================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================

// Función para inicializar filtros
function inicializarFiltros() {
    // Event listener para búsqueda
    const buscarInput = document.getElementById('buscar-producto');
    if (buscarInput) {
        buscarInput.addEventListener('input', function() {
            filtrosActivos.busqueda = this.value.toLowerCase().trim();
            aplicarFiltros();
        });
    }
    
    // Event listener para filtro de precio (slider)
    const precioSlider = document.getElementById('precio-max');
    const precioInput = document.getElementById('precio-max-input');
    
    if (precioSlider) {
        precioSlider.addEventListener('input', function() {
            const valor = parseInt(this.value);
            filtrosActivos.precioMax = valor;
            
            // Sincronizar con el input numérico
            if (precioInput) {
                precioInput.value = valor;
            }
            
            // Actualizar label del precio máximo
            const precioLabels = document.querySelectorAll('.precio-labels span:last-child');
            precioLabels.forEach(label => {
                label.textContent = `$${formatearPrecio(valor)}`;
            });
            
            aplicarFiltros();
        });
    }
    
    // Event listener para input numérico de precio
    if (precioInput) {
        precioInput.addEventListener('input', function() {
            let valor = parseInt(this.value);
            
            // Validar rango
            if (isNaN(valor) || valor < 0) {
                valor = 0;
            } else if (valor > 50000) {
                valor = 50000;
            }
            
            this.value = valor;
            filtrosActivos.precioMax = valor;
            
            // Sincronizar con el slider
            if (precioSlider) {
                precioSlider.value = valor;
            }
            
            // Actualizar label del precio máximo
            const precioLabels = document.querySelectorAll('.precio-labels span:last-child');
            precioLabels.forEach(label => {
                label.textContent = `$${formatearPrecio(valor)}`;
            });
            
            aplicarFiltros();
        });
        
        // Validar al perder el foco
        precioInput.addEventListener('blur', function() {
            let valor = parseInt(this.value);
            if (isNaN(valor) || valor < 0) {
                valor = 0;
            } else if (valor > 50000) {
                valor = 50000;
            }
            this.value = valor;
            filtrosActivos.precioMax = valor;
            if (precioSlider) {
                precioSlider.value = valor;
            }
            aplicarFiltros();
        });
    }
    
    // Event listener para ordenamiento
    const ordenSelect = document.getElementById('filtros-ordenar');
    if (ordenSelect) {
        ordenSelect.addEventListener('change', function() {
            filtrosActivos.ordenamiento = this.value;
            aplicarFiltros();
        });
    }
    
    // Event listener para botón limpiar filtros
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', function() {
            limpiarFiltros();
        });
    }
}

// Función para inicializar botones de vista
function inicializarBotonesVista() {
    const btnProductos = document.getElementById('btn-vista-productos');
    const btnOfertas = document.getElementById('btn-vista-ofertas');
    
    if (btnProductos) {
        btnProductos.addEventListener('click', () => cambiarModoVista('productos'));
    }
    
    if (btnOfertas) {
        btnOfertas.addEventListener('click', () => cambiarModoVista('ofertas'));
    }
}

// Función para leer parámetros de URL y aplicar filtros iniciales
function aplicarFiltrosDesdeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaParam = urlParams.get('categoria');
    
    if (categoriaParam) {
        // Convertir el parámetro a minúsculas para comparación
        const categoriaParamLower = categoriaParam.toLowerCase().trim();
        
        let slugFinal = null;
        
        // PRIMERO: Buscar en las categorías cargadas de la base de datos
        if (categoriasCache && categoriasCache.length > 0) {
            const categoriaEncontrada = categoriasCache.find(cat => {
                const nombreCat = (cat.nombre_categoria || cat.nombre || '').toLowerCase().trim();
                const slugCat = nombreCat.replace(/\s+/g, '-');
                
                // Comparaciones múltiples para encontrar la categoría correcta
                return nombreCat === categoriaParamLower ||                    // "pollo" === "pollo"
                       slugCat === categoriaParamLower ||                     // "carne-de-res" === "res" (no, pero por si acaso)
                       nombreCat.includes(categoriaParamLower) ||              // "carne de res" incluye "res"
                       categoriaParamLower.includes(nombreCat.split(' ')[0]) || // "res" incluye "carne" (no funciona bien)
                       // Casos específicos para los nombres exactos del usuario
                       (categoriaParamLower === 'res' && (nombreCat.includes('res') || nombreCat === 'carne de res')) ||
                       (categoriaParamLower === 'cerdo' && (nombreCat.includes('cerdo') || nombreCat === 'carne de cerdo')) ||
                       (categoriaParamLower === 'pollo' && nombreCat === 'pollo') ||
                       (categoriaParamLower === 'embutidos' && nombreCat === 'embutidos');
            });
            
            if (categoriaEncontrada) {
                const nombreCategoria = categoriaEncontrada.nombre_categoria || categoriaEncontrada.nombre || '';
                slugFinal = nombreCategoria.toLowerCase().replace(/\s+/g, '-');
                console.log('Categoría encontrada en BD:', nombreCategoria, '-> slug:', slugFinal);
            }
        }
        
        // SEGUNDO: Si no se encontró, usar mapeo estático como fallback
        if (!slugFinal) {
            const mapeoCategorias = {
                'pollo': 'pollo',
                'res': 'carne-de-res',        // "Res" -> "carne-de-res"
                'cerdo': 'carne-de-cerdo',   // "Cerdo" -> "carne-de-cerdo"
                'embutidos': 'embutidos'
            };
            
            slugFinal = mapeoCategorias[categoriaParamLower] || categoriaParamLower;
            console.log('Usando mapeo estático:', categoriaParamLower, '->', slugFinal);
        }
        
        // Aplicar el filtro de categoría
        filtrosActivos.categorias = [slugFinal];
        console.log('✅ Filtro de categoría aplicado desde URL:', categoriaParam, '->', slugFinal);
        
        // Marcar el checkbox correspondiente si existe
        setTimeout(() => {
            const checkbox = document.getElementById(`filtro-${slugFinal}`);
            if (checkbox) {
                checkbox.checked = true;
                console.log('✅ Checkbox marcado para:', slugFinal);
            } else {
                console.log('⚠️ Checkbox no encontrado para:', slugFinal);
            }
        }, 500);
    }
}

// Función para inicializar el catálogo
async function inicializarCatalogo() {
    try {
        // PRIMERO: Cargar TODAS las categorías para tener el cache completo (necesario para filtrar productos)
        try {
            const todasLasCategorias = await loadCategoriasFromAPI();
            // Guardar todas las categorías en un cache separado para referencia completa
            // Esto es necesario para poder filtrar productos por categoría incluso si la categoría está oculta
            window.todasLasCategoriasCache = todasLasCategorias;
            console.log('Todas las categorías cargadas para referencia:', todasLasCategorias.length);
        } catch (error) {
            console.warn('Error al cargar todas las categorías:', error);
        }
        
        // SEGUNDO: Cargar solo categorías visibles para los filtros
        await actualizarFiltrosCategorias();
        
        // TERCERO: Cargar productos desde la API (ya con categorías cargadas)
        await cargarProductosDesdeAPI();
        
        // CUARTO: Inicializar los filtros (event listeners)
        inicializarFiltros();
        
        // QUINTO: Aplicar filtros desde URL si existen
        aplicarFiltrosDesdeURL();
        
        // SEXTO: Aplicar filtros iniciales
        aplicarFiltros();
        
        console.log('Catálogo inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar el catálogo:', error);
        // Mostrar productos por defecto si hay error
        inicializarFiltros();
        aplicarFiltros();
    }
}

// Función para recargar el catálogo completamente (útil cuando se crea/actualiza una categoría)
async function recargarCatalogoCompleto() {
    console.log('Recargando catálogo completo...');
    // Limpiar todos los caches
    categoriasCache = [];
    window.todasLasCategoriasCache = null;
    localStorage.removeItem('categorias');
    localStorage.removeItem('productos');
    
    // Reinicializar el catálogo
    await inicializarCatalogo();
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar badge del carrito al cargar la página
    if (typeof actualizarBadgeCarrito === 'function') {
        actualizarBadgeCarrito();
    } else if (window.clientSession && typeof window.clientSession.updateCartBadgeFromCarrito === 'function') {
        window.clientSession.updateCartBadgeFromCarrito();
    }
    
    // Verificar si hay una señal de recarga necesaria (desde otra pestaña)
    const necesitaRecarga = sessionStorage.getItem('recargarCatalogo');
    if (necesitaRecarga === 'true') {
        sessionStorage.removeItem('recargarCatalogo');
        console.log('Recarga necesaria detectada, recargando catálogo...');
        recargarCatalogoCompleto();
    } else {
        // Inicializar catálogo normalmente
        inicializarCatalogo();
    }
    
    // Inicializar botones de vista (si existen)
    inicializarBotonesVista();
    
    // Escuchar eventos de actualización de productos para recargar el catálogo
    window.addEventListener('productoActualizado', function() {
        console.log('Producto actualizado, recargando catálogo...');
        cargarProductosDesdeAPI().then(() => {
            aplicarFiltros();
        });
    });
    
    // Escuchar eventos de categorías creadas/actualizadas para recargar filtros
    document.addEventListener('categoriaCreada', async function(event) {
        console.log('Categoría creada, recargando filtros del catálogo...', event.detail);
        // Señalar a otras pestañas que necesitan recargar
        sessionStorage.setItem('recargarCatalogo', 'true');
        
        // Limpiar cache de categorías y localStorage
        categoriasCache = [];
        window.todasLasCategoriasCache = null;
        localStorage.removeItem('categorias');
        
        // Recargar todas las categorías primero
        try {
            window.todasLasCategoriasCache = await loadCategoriasFromAPI();
            console.log('Todas las categorías recargadas:', window.todasLasCategoriasCache.length);
        } catch (error) {
            console.warn('Error al recargar todas las categorías:', error);
        }
        
        // Recargar filtros de categorías (solo las visibles)
        await actualizarFiltrosCategorias();
        // Recargar productos (por si hay productos de la nueva categoría)
        await cargarProductosDesdeAPI();
        aplicarFiltros();
    });
    
    document.addEventListener('categoriaActualizada', async function(event) {
        console.log('Categoría actualizada, recargando filtros del catálogo...', event.detail);
        // Señalar a otras pestañas que necesitan recargar
        sessionStorage.setItem('recargarCatalogo', 'true');
        
        // Limpiar cache de categorías y localStorage
        categoriasCache = [];
        window.todasLasCategoriasCache = null;
        localStorage.removeItem('categorias');
        
        // Recargar todas las categorías primero
        try {
            window.todasLasCategoriasCache = await loadCategoriasFromAPI();
            console.log('Todas las categorías recargadas:', window.todasLasCategoriasCache.length);
        } catch (error) {
            console.warn('Error al recargar todas las categorías:', error);
        }
        
        // Recargar filtros de categorías (solo las visibles)
        await actualizarFiltrosCategorias();
        // Recargar productos (por si cambió el estado de mostrar_en_catalogo)
        await cargarProductosDesdeAPI();
        aplicarFiltros();
    });
    
    // Escuchar cambios en sessionStorage para recargar cuando otra pestaña crea/actualiza una categoría
    window.addEventListener('storage', function(event) {
        if (event.key === 'recargarCatalogo' && event.newValue === 'true') {
            console.log('Cambio detectado en otra pestaña, recargando catálogo...');
            recargarCatalogoCompleto();
        }
    });
});

// ========================================
// ESTILOS CSS DINÁMICOS PARA IMÁGENES
// ========================================

const style = document.createElement('style');
style.textContent = `
    .producto-imagen {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
        border-radius: 8px;
        background: #f3f4f6;
    }
    
    .producto-imagen img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.3s ease;
    }
    
    .producto-imagen img:hover {
        transform: scale(1.05);
    }
    
    .producto-imagen i {
        font-size: 48px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f3f4f6;
        border-radius: 8px;
    }
    
    .producto-imagen-fallback {
        font-size: 48px;
        color: #6b7280;
        display: none;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: #f3f4f6;
        border-radius: 8px;
    }
    
    .producto-card:hover .producto-imagen img {
        transform: scale(1.05);
    }
    
    /* Estilos para stock */
    .stock-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.75rem 0;
        padding: 0.5rem;
        background-color: #f3f4f6;
        border-radius: 6px;
        font-size: 0.875rem;
    }
    
    .stock-label {
        color: #6b7280;
        font-weight: 500;
    }
    
    .stock-cantidad {
        color: #059669;
        font-weight: 600;
    }
    
    /* Estilos para botones deshabilitados */
    .btn-agregar-carrito.btn-disabled,
    .btn-agregar-carrito:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .btn-agregar-carrito.btn-disabled:hover,
    .btn-agregar-carrito:disabled:hover {
        background-color: #9ca3af;
        transform: none;
    }
    
    .btn-cantidad:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    @keyframes slideInStock {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutStock {
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

// ========================================
// FUNCIONES GLOBALES PARA COMPATIBILIDAD
// ========================================

// Función para formatear número (mostrar enteros sin decimales si es posible)
function formatearNumero(numero) {
    if (numero === null || numero === undefined || numero === '') {
        return '0';
    }
    const num = parseFloat(numero);
    if (isNaN(num)) {
        return '0';
    }
    // Si es un número entero, mostrar sin decimales
    if (num % 1 === 0) {
        return num.toString();
    }
    // Si tiene decimales, mostrar con los decimales necesarios (máximo 3)
    return num.toFixed(3).replace(/\.?0+$/, ''); // Eliminar ceros finales
}

// Función para validar cantidad según stock disponible
function validarCantidadStock(productoId) {
    const input = document.getElementById(`cantidad-${productoId}`);
    const btnAgregar = document.getElementById(`btn-agregar-${productoId}`);
    const btnMinus = document.getElementById(`btn-cantidad-minus-${productoId}`);
    const btnPlus = document.getElementById(`btn-cantidad-plus-${productoId}`);
    
    if (!input || !btnAgregar) return;
    
    const stock = parseFloat(input.getAttribute('data-stock')) || 0;
    let cantidad = parseFloat(input.value) || 1;
    
    // Asegurar que la cantidad sea al menos 1
    if (cantidad < 1) {
        cantidad = 1;
        input.value = 1;
    }
    
    // Usar comparación con tolerancia para números decimales
    // Si la cantidad es igual o menor al stock, está permitido
    const cantidadSuperaStock = cantidad > stock;
    const cantidadIgualOmenorStock = cantidad <= stock;
    
    // Validar y actualizar estado de botones
    if (stock <= 0) {
        // Sin stock - deshabilitar todo
        btnAgregar.disabled = true;
        btnAgregar.textContent = 'Sin Stock';
        btnAgregar.classList.add('btn-disabled');
        btnMinus.disabled = true;
        btnPlus.disabled = true;
        // Limpiar el onclick para prevenir cualquier acción
        btnAgregar.onclick = null;
        btnAgregar.setAttribute('onclick', '');
    } else if (cantidadSuperaStock) {
        // Cantidad supera stock - deshabilitar botón de agregar
        btnAgregar.disabled = true;
        btnAgregar.textContent = 'Stock Insuficiente';
        btnAgregar.classList.add('btn-disabled');
        // Limpiar el onclick para prevenir cualquier acción
        btnAgregar.onclick = null;
        btnAgregar.setAttribute('onclick', '');
        // Permitir ajustar cantidad con los botones
        btnMinus.disabled = cantidad <= 1;
        btnPlus.disabled = false; // Permitir aumentar para que el usuario vea el límite
    } else if (cantidadIgualOmenorStock) {
        // Stock suficiente (cantidad <= stock) - habilitar botón
        btnAgregar.disabled = false;
        btnAgregar.textContent = 'Agregar al Carrito';
        btnAgregar.classList.remove('btn-disabled');
        // Restaurar el onclick
        btnAgregar.setAttribute('onclick', `agregarAlCarritoCatalogo('${productoId}')`);
        btnAgregar.onclick = function() { agregarAlCarritoCatalogo(productoId); };
        // Controlar botones de cantidad
        btnMinus.disabled = cantidad <= 1;
        // Si la cantidad es igual al stock, deshabilitar el botón +
        btnPlus.disabled = cantidad >= stock;
    }
}

// Función global para cambiar cantidad (usada por el carrito)
window.cambiarCantidad = function(productoId, cambio) {
    const input = document.getElementById(`cantidad-${productoId}`);
    if (input) {
        const stock = parseFloat(input.getAttribute('data-stock')) || 0;
        let cantidad = parseInt(input.value) + cambio;
        if (cantidad < 1) cantidad = 1;
        // NO limitar automáticamente al stock - permitir que el usuario vea que supera el stock
        // La validación deshabilitará el botón si es necesario
        input.value = cantidad;
        // Validar después de cambiar para actualizar estado del botón
        validarCantidadStock(productoId);
    }
};

// Función global para validar cantidad de stock
window.validarCantidadStock = validarCantidadStock;

// Función para mostrar notificación de stock
function mostrarNotificacionStock(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `stock-notification stock-notification-${tipo}`;
    notification.innerHTML = `
        <div class="stock-notification-content">
            <i class="fas fa-${tipo === 'warning' ? 'exclamation-triangle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
        animation: slideInStock 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background-color: ${tipo === 'warning' ? '#f59e0b' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutStock 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Función global para agregar al carrito (usada por el carrito)
window.agregarAlCarritoCatalogo = function(productoId) {
    const cantidadInput = document.getElementById(`cantidad-${productoId}`);
    const btnAgregar = document.getElementById(`btn-agregar-${productoId}`);
    
    if (!cantidadInput) {
        console.error('No se encontró el input de cantidad para el producto:', productoId);
        return;
    }
    
    // Verificar si el botón está deshabilitado
    if (btnAgregar && btnAgregar.disabled) {
        const stock = parseFloat(cantidadInput.getAttribute('data-stock')) || 0;
        const cantidad = parseFloat(cantidadInput.value) || 1;
        
        if (stock <= 0) {
            mostrarNotificacionStock('Este producto no tiene stock disponible en este momento.', 'error');
        } else if (cantidad > stock) {
            const unidad = cantidadInput.closest('.producto-card')?.querySelector('.stock-cantidad')?.textContent.split(' ')[1] || 'unidades';
            mostrarNotificacionStock(`No hay suficiente stock disponible. Solo hay ${formatearNumero(stock)} ${unidad} disponibles de este producto. Por favor, ajuste la cantidad.`, 'error');
        }
        return; // No agregar al carrito si el botón está deshabilitado
    }
    
    const stock = parseFloat(cantidadInput.getAttribute('data-stock')) || 0;
    const cantidad = parseFloat(cantidadInput.value) || 1;
    
    // Validación adicional de seguridad antes de agregar
    if (stock <= 0) {
        mostrarNotificacionStock('Este producto no tiene stock disponible en este momento.', 'error');
        validarCantidadStock(productoId); // Actualizar estado del botón
        return;
    }
    
    if (cantidad > stock) {
        const unidad = cantidadInput.closest('.producto-card')?.querySelector('.stock-cantidad')?.textContent.split(' ')[1] || 'unidades';
        mostrarNotificacionStock(`No hay suficiente stock disponible. Solo hay ${formatearNumero(stock)} ${unidad} disponibles de este producto. Por favor, ajuste la cantidad.`, 'error');
        validarCantidadStock(productoId); // Actualizar estado del botón
        return;
    }
    
    // Llamar a la función del carrito directamente
    if (typeof agregarAlCarrito === 'function') {
        agregarAlCarrito(productoId, cantidad);
    } else {
        console.log('Función de carrito no disponible');
    }
};