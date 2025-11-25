// catalogo.js - Jonathan Rodriguez ADSO
window.catalogo = {
    navegarConFiltro: function(categoria) {
        const url = `catalogo.html?categoria=${categoria.toLowerCase()}`;
        window.location.href = url;
    },
    
    navegarConBusqueda: function(termino) {
        const url = `catalogo.html?busqueda=${encodeURIComponent(termino)}`;
        window.location.href = url;
    },
    
    obtenerParametrosURL: function() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            categoria: urlParams.get('categoria'),
            busqueda: urlParams.get('busqueda'),
            orden: urlParams.get('orden')
        };
    },
    
    aplicarFiltros: function(productos, filtros) {
        let productosFiltrados = [...productos];
        
        // Filtrar por categoría
        if (filtros.categoria) {
            productosFiltrados = productosFiltrados.filter(producto => 
                producto.categoria.toLowerCase() === filtros.categoria.toLowerCase()
            );
        }
        
        // Filtrar por búsqueda
        if (filtros.busqueda) {
            const termino = filtros.busqueda.toLowerCase();
            productosFiltrados = productosFiltrados.filter(producto => 
                producto.nombre.toLowerCase().includes(termino) ||
                producto.descripcion.toLowerCase().includes(termino)
            );
        }
        
        return productosFiltrados;
    },
    
    ordenarProductos: function(productos, criterio) {
        const productosOrdenados = [...productos];
        
        switch (criterio) {
            case 'precio-asc':
                return productosOrdenados.sort((a, b) => a.precio - b.precio);
            case 'precio-desc':
                return productosOrdenados.sort((a, b) => b.precio - a.precio);
            case 'nombre-asc':
                return productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            case 'nombre-desc':
                return productosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
            default:
                return productosOrdenados;
        }
    },
    
    obtenerCategorias: function() {
        return [
            { id: 'pollo', nombre: 'Pollo', icono: 'fas fa-drumstick-bite' },
            { id: 'res', nombre: 'Carne de Res', icono: 'fas fa-hamburger' },
            { id: 'cerdo', nombre: 'Carne de Cerdo', icono: 'fas fa-bacon' },
            { id: 'embutidos', nombre: 'Embutidos', icono: 'fas fa-sausage' }
        ];
    },
    
    generarBreadcrumb: function(filtros) {
        let breadcrumb = '<a href="index.html">Inicio</a> > ';
        
        if (filtros.categoria) {
            const categoria = this.obtenerCategorias().find(cat => 
                cat.id === filtros.categoria.toLowerCase()
            );
            breadcrumb += `<span>${categoria ? categoria.nombre : filtros.categoria}</span>`;
        } else if (filtros.busqueda) {
            breadcrumb += `<span>Búsqueda: "${filtros.busqueda}"</span>`;
        } else {
            breadcrumb += '<span>Catálogo</span>';
        }
        
        return breadcrumb;
    },
    
    mostrarResultados: function(productos, total, filtros) {
        const resultadosDiv = document.getElementById('resultados-info');
        if (!resultadosDiv) return;
        
        let mensaje = '';
        
        if (filtros.busqueda) {
            mensaje = `Se encontraron ${total} productos para "${filtros.busqueda}"`;
        } else if (filtros.categoria) {
            const categoria = this.obtenerCategorias().find(cat => 
                cat.id === filtros.categoria.toLowerCase()
            );
            mensaje = `${total} productos en ${categoria ? categoria.nombre : filtros.categoria}`;
        } else {
            mensaje = `${total} productos disponibles`;
        }
        
        resultadosDiv.innerHTML = `
            <div class="resultados-info">
                <p>${mensaje}</p>
            </div>
        `;
    },
    
    inicializar: function() {
        console.log('Catálogo inicializado');
        
        // Obtener parámetros de URL
        const parametros = this.obtenerParametrosURL();
        
        // Mostrar breadcrumb si estamos en catálogo.html
        if (window.location.pathname.includes('catalogo.html')) {
            const breadcrumb = this.generarBreadcrumb(parametros);
            const breadcrumbDiv = document.getElementById('breadcrumb');
            if (breadcrumbDiv) {
                breadcrumbDiv.innerHTML = breadcrumb;
            }
        }
        
        // Configurar eventos de filtros
        this.configurarEventos();
    },
    
    configurarEventos: function() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const termino = e.target.value.trim();
                    if (termino) {
                        catalogo.navegarConBusqueda(termino);
                    }
                }
            });
        }
        
        const categoriaLinks = document.querySelectorAll('[data-categoria]');
        categoriaLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const categoria = this.getAttribute('data-categoria');
                catalogo.navegarConFiltro(categoria);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    catalogo.inicializar();
});
