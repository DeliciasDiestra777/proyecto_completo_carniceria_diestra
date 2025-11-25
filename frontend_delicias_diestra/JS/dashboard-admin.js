// Dashboard Admin - Carga de estadísticas y actividad reciente
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Elementos del DOM
    const btnVerActividad = document.getElementById('btn-ver-actividad');
    const actividadModal = document.getElementById('actividad-modal');
    const closeActividadModal = document.getElementById('close-actividad-modal');
    const actividadTbody = document.getElementById('actividad-tbody');
    const btnFiltrarActividad = document.getElementById('btn-filtrar-actividad');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    
    // Cargar estadísticas al iniciar
    if (document.getElementById('dashboard-section')?.classList.contains('active')) {
        cargarEstadisticas();
    }
    
    // Observar cambios de sección
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const dashboardSection = document.getElementById('dashboard-section');
                if (dashboardSection && dashboardSection.classList.contains('active')) {
                    cargarEstadisticas();
                }
            }
        });
    });
    
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        observer.observe(dashboardSection, { attributes: true });
    }
    
    // Event listeners
    if (btnVerActividad) {
        btnVerActividad.addEventListener('click', function() {
            abrirModalActividad();
        });
    }
    
    if (closeActividadModal) {
        closeActividadModal.addEventListener('click', function() {
            cerrarModalActividad();
        });
    }
    
    if (actividadModal) {
        actividadModal.addEventListener('click', function(e) {
            if (e.target === actividadModal) {
                cerrarModalActividad();
            }
        });
    }
    
    if (btnFiltrarActividad) {
        btnFiltrarActividad.addEventListener('click', function() {
            cargarActividades();
        });
    }
    
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', function() {
            limpiarFiltros();
            cargarActividades();
        });
    }
    
    // Cargar estadísticas del dashboard
    async function cargarEstadisticas() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/estadisticas`);
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            
            const stats = await response.json();
            
            // Actualizar tarjetas
            actualizarTarjeta('total-productos', stats.total_productos || 0);
            actualizarTarjeta('total-usuarios', stats.total_usuarios || 0);
            actualizarTarjeta('total-pedidos', stats.total_pedidos || 0);
            actualizarTarjeta('total-ventas', formatearMoneda(stats.total_ventas || 0));
            actualizarTarjeta('total-recetas', stats.total_recetas || 0);
            actualizarTarjeta('total-inventario', stats.total_inventario || 0);
            actualizarTarjeta('total-categorias', stats.total_categorias || 0);
            actualizarTarjeta('total-proveedores', stats.total_proveedores || 0);
            actualizarTarjeta('total-compras', stats.total_compras || 0);
            actualizarTarjeta('total-producciones', stats.total_producciones || 0);
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            // Intentar cargar desde endpoints individuales como fallback
            cargarEstadisticasFallback();
        }
    }
    
    // Fallback: cargar desde endpoints individuales
    async function cargarEstadisticasFallback() {
        try {
            const [productos, usuarios, pedidos, recetas, categorias, proveedores, compras, producciones] = await Promise.all([
                fetch(`${API_BASE_URL}/productos`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/usuarios`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/pedidos`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/recetas`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/categorias`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/proveedores`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/compras`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/producciones`).then(r => r.ok ? r.json() : []).catch(() => [])
            ]);
            
            const productosArray = Array.isArray(productos) ? productos : (productos.productos || []);
            const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios.usuarios || []);
            const pedidosArray = Array.isArray(pedidos) ? pedidos : (pedidos.pedidos || []);
            const recetasArray = Array.isArray(recetas) ? recetas : (recetas.recetas || []);
            const categoriasArray = Array.isArray(categorias) ? categorias : (categorias.categorias || []);
            const proveedoresArray = Array.isArray(proveedores) ? proveedores : (proveedores.proveedores || []);
            const comprasArray = Array.isArray(compras) ? compras : (compras.compras || []);
            const produccionesArray = Array.isArray(producciones) ? producciones : (producciones.producciones || []);
            
            // Calcular ventas del día actual (usando zona horaria de Colombia)
            let totalVentas = 0;
            if (Array.isArray(pedidosArray)) {
                // Obtener fecha de hoy en zona horaria de Colombia
                let hoy;
                if (typeof getCurrentDateISO === 'function') {
                    // Usar helper de zona horaria de Colombia si está disponible
                    const hoyColombia = getCurrentDateColombia();
                    hoy = new Date(hoyColombia);
                    hoy.setHours(0, 0, 0, 0);
                } else {
                    // Fallback: usar fecha local
                    hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                }
                
                totalVentas = pedidosArray.reduce((sum, pedido) => {
                    // Filtrar solo pedidos del día actual con estado Pagado o Entregado
                    if (pedido.estado && (pedido.estado === 'Pagado' || pedido.estado === 'Entregado')) {
                        if (pedido.fecha_pedido) {
                            const fechaPedido = new Date(pedido.fecha_pedido);
                            fechaPedido.setHours(0, 0, 0, 0);
                            
                            // Comparar solo la fecha (sin hora) para verificar si es del día de hoy
                            if (fechaPedido.toDateString() === hoy.toDateString()) {
                                return sum + (parseFloat(pedido.total || pedido.total_pedido || 0));
                            }
                        }
                    }
                    return sum;
                }, 0);
            }
            
            // Contar productos con inventario
            let totalInventario = 0;
            if (Array.isArray(productosArray)) {
                totalInventario = productosArray.filter(p => {
                    const stock = parseFloat(p.stock_actual || p.inventario_inicial || 0);
                    return stock > 0;
                }).length;
            }
            
            actualizarTarjeta('total-productos', productosArray.length);
            actualizarTarjeta('total-usuarios', usuariosArray.length);
            actualizarTarjeta('total-pedidos', pedidosArray.length);
            actualizarTarjeta('total-ventas', formatearMoneda(totalVentas));
            actualizarTarjeta('total-recetas', recetasArray.length);
            actualizarTarjeta('total-inventario', totalInventario);
            actualizarTarjeta('total-categorias', categoriasArray.length);
            actualizarTarjeta('total-proveedores', proveedoresArray.length);
            actualizarTarjeta('total-compras', comprasArray.length);
            actualizarTarjeta('total-producciones', produccionesArray.length);
            
        } catch (error) {
            console.error('Error al cargar estadísticas fallback:', error);
        }
    }
    
    // Actualizar tarjeta de estadística
    function actualizarTarjeta(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }
    
    // Formatear moneda
    function formatearMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    }
    
    
    // Abrir modal de actividad
    function abrirModalActividad() {
        if (actividadModal) {
            actividadModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            cargarUsuariosFiltro();
            cargarActividades();
        }
    }
    
    // Cerrar modal de actividad
    function cerrarModalActividad() {
        if (actividadModal) {
            actividadModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    // Cargar actividades con filtros
    async function cargarActividades() {
        if (!actividadTbody) return;
        
        try {
            const fechaInicio = document.getElementById('filter-fecha-inicio-actividad')?.value || '';
            const fechaFin = document.getElementById('filter-fecha-fin-actividad')?.value || '';
            const tipo = document.getElementById('filter-tipo-actividad')?.value || '';
            const usuario = document.getElementById('filter-usuario-actividad')?.value || '';
            
            let url = `${API_BASE_URL}/dashboard/actividades?`;
            const params = new URLSearchParams();
            
            if (fechaInicio) params.append('fecha_inicio', fechaInicio);
            if (fechaFin) params.append('fecha_fin', fechaFin);
            if (tipo) params.append('tipo', tipo);
            if (usuario) params.append('usuario_id', usuario);
            
            url += params.toString();
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error al cargar actividades');
            }
            
            const actividades = await response.json();
            
            if (!actividades || actividades.length === 0) {
                actividadTbody.innerHTML = '<tr><td colspan="6" class="admin-empty-state">No se encontraron actividades</td></tr>';
                return;
            }
            
            actividadTbody.innerHTML = actividades.map(act => `
                <tr>
                    <td>${formatearFechaHora(act.fecha)}</td>
                    <td>${act.usuario_nombre || 'Sistema'}</td>
                    <td><span class="admin-badge admin-badge-${act.tipo}">${act.tipo}</span></td>
                    <td>${act.accion}</td>
                    <td>${act.descripcion}</td>
                    <td>${formatearDetalles(act.detalles)}</td>
                </tr>
            `).join('');
            
        } catch (error) {
            console.error('Error al cargar actividades:', error);
            actividadTbody.innerHTML = '<tr><td colspan="6" class="admin-error-state">Error al cargar actividades</td></tr>';
        }
    }
    
    // Cargar usuarios para el filtro
    async function cargarUsuariosFiltro() {
        const selectUsuario = document.getElementById('filter-usuario-actividad');
        if (!selectUsuario) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`);
            if (!response.ok) return;
            
            const usuarios = await response.json();
            const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios.usuarios || []);
            
            selectUsuario.innerHTML = '<option value="">Todos</option>' + 
                usuariosArray.map(u => 
                    `<option value="${u.id_usuario}">${u.nombre || u.nombre_usuario} ${u.apellido || ''}</option>`
                ).join('');
                
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    }
    
    // Limpiar filtros
    function limpiarFiltros() {
        const fechaInicio = document.getElementById('filter-fecha-inicio-actividad');
        const fechaFin = document.getElementById('filter-fecha-fin-actividad');
        const tipo = document.getElementById('filter-tipo-actividad');
        const usuario = document.getElementById('filter-usuario-actividad');
        
        if (fechaInicio) fechaInicio.value = '';
        if (fechaFin) fechaFin.value = '';
        if (tipo) tipo.value = '';
        if (usuario) usuario.value = '';
    }
    
    // Obtener icono según tipo de actividad
    function obtenerIconoActividad(tipo) {
        const iconos = {
            'producto': 'box',
            'pedido': 'shopping-cart',
            'compra': 'shopping-bag',
            'produccion': 'industry',
            'receta': 'book',
            'usuario': 'user',
            'categoria': 'tags',
            'proveedor': 'truck'
        };
        return iconos[tipo] || 'circle';
    }
    
    // Formatear fecha
    function formatearFecha(fecha) {
        if (!fecha) return '-';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Formatear fecha y hora
    function formatearFechaHora(fecha) {
        if (!fecha) return '-';
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Convertir string numérico a número (maneja punto como separador de miles o decimal)
    function parsearNumeroString(numStr) {
        // Si el string tiene punto, verificar si es separador de miles o decimal
        // Ej: "100.000" -> 100000 (miles), "100.50" -> 100.50 (decimal)
        if (numStr.includes('.')) {
            const partes = numStr.split('.');
            const ultimaParte = partes[partes.length - 1];
            
            // Si hay múltiples puntos, probablemente son separadores de miles
            // Ej: "100.000.000" -> 100000000
            if (partes.length > 2) {
                return parseInt(numStr.replace(/\./g, ''), 10);
            }
            
            // Si la parte después del punto tiene 3 dígitos, probablemente es separador de miles
            // Ej: "100.000" -> 100000
            if (partes.length === 2 && ultimaParte.length === 3 && /^\d{3}$/.test(ultimaParte)) {
                return parseInt(numStr.replace(/\./g, ''), 10);
            }
            
            // Si la parte después del punto tiene 1 o 2 dígitos, probablemente es decimal
            // Ej: "100.5" -> 100.5, "100.50" -> 100.50
            if (partes.length === 2 && ultimaParte.length <= 2 && /^\d{1,2}$/.test(ultimaParte)) {
                return parseFloat(numStr);
            }
            
            // Si tiene más de 3 dígitos después del punto, es decimal
            // Ej: "100.1234" -> 100.1234
            return parseFloat(numStr);
        }
        return parseFloat(numStr);
    }
    
    // Formatear número monetario con separadores de miles (formato colombiano)
    function formatearMonedaNumero(numero) {
        if (numero === null || numero === undefined || isNaN(numero)) return numero;
        
        const num = typeof numero === 'string' ? parsearNumeroString(numero) : parseFloat(numero);
        
        // Si es entero, formatear sin decimales con separador de miles
        if (num % 1 === 0) {
            return Math.floor(num).toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
        // Si tiene decimales, formatear con decimales
        return num.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
    
    // Formatear número sin decimales innecesarios
    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === '') return numero;
        
        // Si es un string, buscar y formatear todos los números
        if (typeof numero === 'string') {
            // Detectar si contiene símbolo de moneda ($)
            const esMoneda = numero.includes('$');
            
            if (esMoneda) {
                // Formatear valores monetarios
                // Buscar patrones como "$100.000" o "Total: $100.000" o "Total: $100"
                return numero.replace(/\$\s*(\d+(?:\.\d+)?)/g, function(match, numStr) {
                    const formateado = formatearMonedaNumero(numStr);
                    return '$ ' + formateado;
                });
            } else {
                // Formatear números normales (cantidades)
                // Buscar números con punto decimal (ej: 150.000, 150.12, 150.1)
                return numero.replace(/(\d+\.\d+)/g, function(match) {
                    const num = parseFloat(match);
                    // Si es un número entero (ej: 150.000), quitar decimales
                    if (num % 1 === 0) {
                        return Math.floor(num).toString();
                    }
                    // Si tiene decimales, quitar solo los ceros finales innecesarios
                    // Ej: 150.120 -> 150.12, 150.100 -> 150.1, 150.123 -> 150.123
                    return num.toString().replace(/\.?0+$/, '');
                });
            }
        }
        
        // Si es un número
        const num = parseFloat(numero);
        if (isNaN(num)) return numero;
        
        // Si es entero, devolver sin decimales
        if (num % 1 === 0) {
            return Math.floor(num).toString();
        }
        
        // Si tiene decimales, quitar ceros innecesarios
        return num.toString().replace(/\.?0+$/, '');
    }
    
    // Formatear detalles de actividad (puede contener números)
    function formatearDetalles(detalles) {
        if (!detalles) return '-';
        return formatearNumero(detalles);
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && actividadModal && actividadModal.classList.contains('show')) {
            cerrarModalActividad();
        }
    });
});

