window.app = {
    filtrarPorCategoria: function(categoria) {
        console.log('Filtrando por categoría:', categoria);
        const url = `catalogo.html?categoria=${categoria.toLowerCase()}`;
        window.location.href = url;
    },
    
    cargarProductosDestacados: async function() {
        console.log('Cargando productos destacados...');
        
        const productosGrid = document.getElementById('productos-grid');
        if (!productosGrid) return;
        
        productosGrid.innerHTML = `
            <div class="loading-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #dc2626; margin-bottom: 10px;"></i>
                <p style="color: #666; font-size: 1.1rem;">Cargando productos destacados...</p>
            </div>
        `;
        
        try {
            const response = await fetch('http://localhost:3000/api/productos/mas-vendidos?limite=4');
            
            if (!response.ok) {
                throw new Error('Error al cargar productos destacados');
            }
            
            const data = await response.json();
            const productosDestacados = data.productos || [];
            
            if (productosDestacados.length === 0) {
                productosGrid.innerHTML = '';
                return;
            }
            
            this.mostrarProductosDestacados(productosDestacados);
            
        } catch (error) {
            console.error('Error al cargar productos destacados:', error);
            productosGrid.innerHTML = '';
        }
    },
    
    mostrarProductosDestacados: function(productosDestacados) {
        const productosGrid = document.getElementById('productos-grid');
        if (!productosGrid) return;
        
        let html = '';
        productosDestacados.forEach(producto => {
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
            
            // Si no hay imagen válida, usar fallback
            if (!imagenUrl) {
                imagenUrl = '../IMG/pollo-muestra.jpg';
            }
            
            html += `
                <div class="producto-card">
                    <div class="producto-imagen">
                        <img src="${imagenUrl}" alt="${producto.nombre_producto || 'Producto'}" onerror="this.src='../IMG/pollo-muestra.jpg'">
                    </div>
                    <div class="producto-info">
                        <h3 class="producto-nombre">${producto.nombre_producto || 'Sin nombre'}</h3>
                        <p class="producto-precio">$${parseFloat(producto.precio_producto || 0).toLocaleString()}</p>
                        <button class="btn btn-primary btn-sm" onclick="agregarAlCarrito('${producto.id_producto}')">
                            <i class="fas fa-cart-plus"></i>
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            `;
        });
        
        productosGrid.innerHTML = html;
    },
    
    agregarAlCarrito: function(idProducto) {
        console.log('Agregando producto al carrito:', idProducto);
        
        if (typeof window.agregarAlCarrito === 'function') {
            window.agregarAlCarrito(idProducto, 1);
        } else {
            console.error('La función agregarAlCarrito no está disponible');
            this.mostrarMensaje('Error al agregar producto al carrito', 'error');
        }
    },
    
    actualizarBadgeCarrito: function() {
        if (typeof window.actualizarBadgeCarrito === 'function') {
            window.actualizarBadgeCarrito();
        } else {
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
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación inicializada');
    
    app.cargarProductosDestacados();
    app.actualizarBadgeCarrito();
    initMobileMenu();
    initUserDropdown();
});

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        mobileMenu.classList.toggle('active');
        
        const icon = mobileMenuBtn.querySelector('i');
        if (mobileMenu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    const mobileMenuLinks = mobileMenu.querySelectorAll('.nav-link, .btn');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

function initUserDropdown() {
    const userButtons = document.querySelectorAll('.user-button');
    
    userButtons.forEach(userButton => {
        if (!userButton) return;
        
        const userDropdown = userButton.closest('.user-dropdown');
        if (!userDropdown) return;
        
        userButton.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.user-dropdown.active').forEach(dropdown => {
                if (dropdown !== userDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            userDropdown.classList.toggle('active');
        });
    });
    
    if (!window.userDropdownListenerAdded) {
        window.userDropdownListenerAdded = true;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-dropdown')) {
                document.querySelectorAll('.user-dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }
    
    document.querySelectorAll('.user-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const userDropdown = this.closest('.user-dropdown');
            if (userDropdown) {
                setTimeout(() => {
                    userDropdown.classList.remove('active');
                }, 100);
            }
        });
    });
}
