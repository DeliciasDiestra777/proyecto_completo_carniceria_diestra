// productos.js
window.productos = {
    // Lista de productos destacados
    productosDestacados: [
        {
            id: 1,
            nombre: 'Pechuga de Pollo Premium',
            descripcion: 'Pechuga de pollo fresca de granja',
            precio: 6500,
            imagen: '../IMG/pollo-muestra.jpg',
            categoria: 'Pollo',
            inventario: { stock: 50 },
            destacado: true
        },
        {
            id: 2,
            nombre: 'Carne Molida de Res',
            descripcion: 'Carne molida fresca de res',
            precio: 8500,
            imagen: '../IMG/carne-res.jpg',
            categoria: 'Res',
            inventario: { stock: 30 },
            destacado: true
        },
        {
            id: 3,
            nombre: 'Chuleta de Cerdo',
            descripcion: 'Chuleta de cerdo de primera calidad',
            precio: 7500,
            imagen: '../IMG/carne-cerdo.jpg',
            categoria: 'Cerdo',
            inventario: { stock: 25 },
            destacado: true
        },
        {
            id: 4,
            nombre: 'Salchichas Artesanales',
            descripcion: 'Salchichas artesanales tradicionales',
            precio: 4500,
            imagen: '../IMG/embutidos.jpg',
            categoria: 'Embutidos',
            inventario: { stock: 40 },
            destacado: true
        }
    ],
    
    // Obtener productos destacados
    obtenerDestacados: function() {
        return this.productosDestacados.filter(producto => producto.destacado);
    },
    
    // Obtener producto por ID
    obtenerPorId: function(id) {
        return this.productosDestacados.find(producto => producto.id === id);
    },
    
    // Obtener productos por categoría
    obtenerPorCategoria: function(categoria) {
        return this.productosDestacados.filter(producto => 
            producto.categoria.toLowerCase() === categoria.toLowerCase()
        );
    },
    
    // Renderizar productos en el grid
    renderizarProductos: function(productos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (productos.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>No hay productos disponibles</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        productos.forEach(producto => {
            html += this.generarHTMLProducto(producto);
        });
        
        container.innerHTML = html;
    },
    
    // Generar HTML para un producto
    generarHTMLProducto: function(producto) {
        return `
            <div class="producto-card" data-producto-id="${producto.id}">
                <div class="producto-imagen">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
                    <div class="producto-badge">
                        <span class="badge-destacado">Destacado</span>
                    </div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${producto.nombre}</h3>
                    <p class="producto-descripcion">${producto.descripcion}</p>
                    <div class="producto-precio">
                        <span class="precio-actual">$${producto.precio.toLocaleString()}</span>
                    </div>
                    <div class="producto-acciones">
                        <button class="btn btn-primary btn-sm" onclick="agregarAlCarrito('${producto.id}')">
                            <i class="fas fa-cart-plus"></i>
                            Agregar al Carrito
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="productos.verDetalles(${producto.id})">
                            <i class="fas fa-eye"></i>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Agregar producto al carrito (usa la función global de carrito.js)
    agregarAlCarrito: function(idProducto) {
        console.log('Agregando producto al carrito desde productos.js:', idProducto);
        
        // Usar la función global agregarAlCarrito de carrito.js
        if (typeof window.agregarAlCarrito === 'function') {
            window.agregarAlCarrito(idProducto, 1);
        } else {
            console.error('La función agregarAlCarrito no está disponible');
            this.mostrarMensaje('Error al agregar producto al carrito', 'error');
        }
    },
    
    // Ver detalles del producto
    verDetalles: function(idProducto) {
        const producto = this.obtenerPorId(idProducto);
        if (!producto) return;
        
        // Por ahora, mostrar alerta (se puede implementar modal después)
        alert(`Detalles de ${producto.nombre}:\n\n${producto.descripcion}\n\nPrecio: $${producto.precio.toLocaleString()}\nStock: ${producto.inventario?.stock || producto.stock || 0} unidades`);
    },
    
    // Actualizar badge del carrito (usa la función global de carrito.js)
    actualizarBadgeCarrito: function() {
        // Usar la función global actualizarBadgeCarrito de carrito.js si está disponible
        if (typeof window.actualizarBadgeCarrito === 'function') {
            window.actualizarBadgeCarrito();
        } else {
            // Fallback: usar el sistema de carrito correcto
            const clientSession = sessionStorage.getItem('clientSession');
            let claveCarrito = 'carrito_temp';
            
            if (clientSession) {
                try {
                    const sessionData = JSON.parse(clientSession);
                    if (sessionData.isClient && sessionData.id) {
                        claveCarrito = `carrito_${sessionData.id}`;
                    }
                } catch (error) {
                    console.error('Error al parsear clientSession:', error);
                }
            }
            
            const carrito = JSON.parse(localStorage.getItem(claveCarrito) || '[]');
            const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
            
            const badge = document.getElementById('carrito-badge');
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
            }
        }
    },
    
    // Mostrar mensaje
    mostrarMensaje: function(mensaje, tipo = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${tipo}`;
        messageDiv.textContent = mensaje;
        
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
        
        if (tipo === 'success') {
            messageDiv.style.backgroundColor = '#10b981';
        } else if (tipo === 'error') {
            messageDiv.style.backgroundColor = '#ef4444';
        } else {
            messageDiv.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    },
    
    // Cargar productos destacados
    cargarDestacados: function() {
        const productosDestacados = this.obtenerDestacados();
        this.renderizarProductos(productosDestacados, 'productos-grid');
    }
};

// Inicializar productos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Productos inicializados');
    
    // Cargar productos destacados
    productos.cargarDestacados();
    
    // Actualizar badge del carrito
    productos.actualizarBadgeCarrito();
});
