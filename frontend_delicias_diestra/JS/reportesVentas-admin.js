// Reportes de Ventas - Funcionalidades JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const API_BASE_URL = 'http://localhost:3000/api';
    let chartInstances = {};
    let currentData = {
        ventas: [],
        productos: [],
        clientes: [],
        categorias: [],
        pedidos: [],
        detallesPedidos: []
    };
    let fechaInicioFiltro = null;
    let fechaFinFiltro = null;

    // Inicialización
    initializeReportes();

    // Función de inicialización
    function initializeReportes() {
        setupEventListeners();
        loadInitialData();
        setupDateFilters();
        initializeCharts();
        loadCategoriasEnFiltros(); // Cargar categorías dinámicamente
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Navegación del sidebar
        document.querySelectorAll('.admin-sidebar-link').forEach(link => {
            link.addEventListener('click', handleSidebarNavigation);
        });

        // Filtros de fecha
        document.getElementById('aplicar-filtros').addEventListener('click', applyDateFilters);
        document.getElementById('periodo-rapido').addEventListener('change', handleQuickPeriod);

        // Búsquedas
        document.getElementById('search-productos-ventas').addEventListener('input', filterProductosVentas);
        document.getElementById('search-clientes-ventas').addEventListener('input', filterClientesVentas);

        // Filtros de categoría
        document.getElementById('filter-categoria-productos').addEventListener('change', filterProductosVentas);
        document.getElementById('filter-tipo-cliente').addEventListener('change', filterClientesVentas);

        // Exportación
        document.getElementById('generar-reporte').addEventListener('click', generateReport);
        document.getElementById('previsualizar-reporte').addEventListener('click', previewReport);

        // Botones de exportación específicos
        document.getElementById('exportar-productos').addEventListener('click', () => exportData('productos'));
        document.getElementById('exportar-clientes').addEventListener('click', () => exportData('clientes'));

        // Cambio de tipo de gráfico
        document.getElementById('tipo-grafico-temporal').addEventListener('change', updateTemporalChart);
    }

    // Manejar navegación del sidebar
    function handleSidebarNavigation(e) {
        e.preventDefault();
        const targetSection = e.currentTarget.getAttribute('data-section');
        
        // Remover clase active de todos los enlaces
        document.querySelectorAll('.admin-sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al enlace clickeado
        e.currentTarget.classList.add('active');
        
        // Mostrar sección correspondiente
        showSection(targetSection);
    }

    // Mostrar sección específica
    function showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar sección seleccionada
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Cargar datos específicos de la sección
            loadSectionData(sectionName);
        }
    }

    // Cargar datos iniciales desde la API
    async function loadInitialData() {
        showLoading(true);
        
        try {
            await cargarDatosReales();
            updateStatsCards();
            loadSectionData('resumen');
        } catch (error) {
            console.error('Error al cargar datos:', error);
            mostrarNotificacion('Error al cargar los datos de reportes', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Cargar datos reales desde la API
    async function cargarDatosReales() {
        try {
            // Cargar pedidos, productos, clientes y categorías en paralelo
            const [pedidosResponse, productosResponse, clientesResponse, categoriasResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/pedidos`).catch(() => ({ ok: false })),
                fetch(`${API_BASE_URL}/productos`).catch(() => ({ ok: false })),
                fetch(`${API_BASE_URL}/clientes`).catch(() => ({ ok: false })),
                fetch(`${API_BASE_URL}/categorias`).catch(() => ({ ok: false }))
            ]);
            
            // Procesar pedidos
            let pedidos = [];
            if (pedidosResponse.ok) {
                const pedidosData = await pedidosResponse.json();
                pedidos = Array.isArray(pedidosData) ? pedidosData : (pedidosData.pedidos || pedidosData.data || []);
            }
            
            // Cargar detalles de todos los pedidos
            const detallesPedidos = [];
            for (const pedido of pedidos) {
                try {
                    const detallesResponse = await fetch(`${API_BASE_URL}/detalle-pedido/pedido/${pedido.id_pedido}`);
                    if (detallesResponse.ok) {
                        const detalles = await detallesResponse.json();
                        const detallesArray = Array.isArray(detalles) ? detalles : (detalles.detalles || detalles.data || []);
                        detallesArray.forEach(detalle => {
                            detallesPedidos.push({
                                ...detalle,
                                id_pedido: pedido.id_pedido,
                                fecha_pedido: pedido.fecha_pedido,
                                id_cliente: pedido.id_cliente,
                                total_pedido: pedido.total
                            });
                        });
                    }
                } catch (error) {
                    console.warn(`Error al cargar detalles del pedido ${pedido.id_pedido}:`, error);
                }
            }
            
            // Procesar productos
            let productos = [];
            if (productosResponse.ok) {
                const productosData = await productosResponse.json();
                productos = Array.isArray(productosData) ? productosData : (productosData.productos || productosData.data || []);
            }
            
            // Procesar clientes
            let clientes = [];
            if (clientesResponse.ok) {
                const clientesData = await clientesResponse.json();
                clientes = Array.isArray(clientesData) ? clientesData : (clientesData.clientes || clientesData.data || []);
            }
            
            // Procesar categorías
            let categorias = [];
            if (categoriasResponse.ok) {
                const categoriasData = await categoriasResponse.json();
                categorias = Array.isArray(categoriasData) ? categoriasData : (categoriasData.categorias || categoriasData.data || []);
            }
            
            // Calcular estadísticas reales
            currentData = calcularEstadisticasReales(pedidos, detallesPedidos, productos, clientes, categorias);
            
            console.log('Datos reales cargados:', {
                pedidos: pedidos.length,
                detalles: detallesPedidos.length,
                productos: productos.length,
                clientes: clientes.length
            });
            
        } catch (error) {
            console.error('Error al cargar datos reales:', error);
            throw error;
        }
    }
    
    // Calcular estadísticas reales basadas en pedidos
    function calcularEstadisticasReales(pedidos, detallesPedidos, productos, clientes, categorias) {
        // Filtrar pedidos por fecha si hay filtros aplicados
        let pedidosFiltrados = pedidos;
        if (fechaInicioFiltro && fechaFinFiltro) {
            pedidosFiltrados = pedidos.filter(pedido => {
                if (!pedido.fecha_pedido) return false;
                const fechaPedido = new Date(pedido.fecha_pedido).toISOString().split('T')[0];
                return fechaPedido >= fechaInicioFiltro && fechaPedido <= fechaFinFiltro;
            });
        }
        
        // Filtrar detalles por pedidos filtrados
        const idsPedidosFiltrados = new Set(pedidosFiltrados.map(p => p.id_pedido));
        const detallesFiltrados = detallesPedidos.filter(d => idsPedidosFiltrados.has(d.id_pedido));
        
        // Calcular ventas por producto
        const ventasPorProducto = {};
        detallesFiltrados.forEach(detalle => {
            const idProducto = detalle.id_producto;
            if (!ventasPorProducto[idProducto]) {
                ventasPorProducto[idProducto] = {
                    id_producto: idProducto,
                    cantidad_vendida: 0,
                    total_vendido: 0,
                    pedidos_count: 0
                };
            }
            ventasPorProducto[idProducto].cantidad_vendida += parseFloat(detalle.cantidad || 0);
            ventasPorProducto[idProducto].total_vendido += parseFloat(detalle.precio_unitario || 0) * parseFloat(detalle.cantidad || 0);
            ventasPorProducto[idProducto].pedidos_count += 1;
        });
        
        // Enriquecer con información de productos
        const productosVentas = Object.values(ventasPorProducto).map(venta => {
            const producto = productos.find(p => p.id_producto === venta.id_producto);
            const categoria = categorias.find(c => c.id_categoria === producto?.id_categoria);
            
            return {
                id: venta.id_producto,
                nombre: producto?.nombre_producto || producto?.nombre || 'Producto desconocido',
                categoria: categoria?.nombre_categoria || categoria?.nombre || 'Sin categoría',
                precio: venta.total_vendido / venta.cantidad_vendida || 0,
                vendido: venta.cantidad_vendida,
                total: venta.total_vendido,
                pedidos_count: venta.pedidos_count
            };
        }).sort((a, b) => b.vendido - a.vendido);
        
        // Calcular ventas por cliente
        const ventasPorCliente = {};
        pedidosFiltrados.forEach(pedido => {
            if (!pedido.id_cliente) return;
            const idCliente = pedido.id_cliente;
            if (!ventasPorCliente[idCliente]) {
                ventasPorCliente[idCliente] = {
                    id_cliente: idCliente,
                    totalCompras: 0,
                    cantidadPedidos: 0,
                    ultimaCompra: null
                };
            }
            ventasPorCliente[idCliente].totalCompras += parseFloat(pedido.total || 0);
            ventasPorCliente[idCliente].cantidadPedidos += 1;
            const fechaPedido = pedido.fecha_pedido ? new Date(pedido.fecha_pedido) : null;
            if (fechaPedido && (!ventasPorCliente[idCliente].ultimaCompra || fechaPedido > new Date(ventasPorCliente[idCliente].ultimaCompra))) {
                ventasPorCliente[idCliente].ultimaCompra = pedido.fecha_pedido;
            }
        });
        
        // Enriquecer con información de clientes
        const clientesVentas = Object.values(ventasPorCliente).map(venta => {
            const cliente = clientes.find(c => c.id_cliente === venta.id_cliente);
            const promedioPedido = venta.cantidadPedidos > 0 ? venta.totalCompras / venta.cantidadPedidos : 0;
            
            return {
                id: venta.id_cliente,
                nombre: cliente ? `${cliente.nombre_cliente || cliente.nombre || ''} ${cliente.apellido_cliente || cliente.apellido || ''}`.trim() : 'Cliente desconocido',
                email: cliente?.email || 'N/A',
                totalCompras: venta.totalCompras,
                cantidadPedidos: venta.cantidadPedidos,
                promedioPedido: promedioPedido,
                ultimaCompra: venta.ultimaCompra ? new Date(venta.ultimaCompra).toISOString().split('T')[0] : 'N/A'
            };
        }).sort((a, b) => b.totalCompras - a.totalCompras);
        
        // Calcular ventas diarias
        const ventasDiarias = calcularVentasDiarias(pedidosFiltrados);
        
        // Calcular ventas por categoría
        const ventasPorCategoria = calcularVentasPorCategoria(productosVentas);
        
        // Calcular totales
        const totalVentas = pedidosFiltrados.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        const totalPedidos = pedidosFiltrados.length;
        const clientesActivos = new Set(pedidosFiltrados.filter(p => p.id_cliente).map(p => p.id_cliente)).size;
        
        return {
            productos: productosVentas,
            clientes: clientesVentas,
            ventasDiarias,
            ventasPorCategoria,
            totalVentas,
            totalPedidos,
            clientesActivos,
            pedidos: pedidosFiltrados,
            detallesPedidos: detallesFiltrados
        };
    }
    
    // Calcular ventas diarias desde pedidos reales
    function calcularVentasDiarias(pedidos) {
        const ventasPorFecha = {};
        
        pedidos.forEach(pedido => {
            if (!pedido.fecha_pedido) return;
            const fecha = new Date(pedido.fecha_pedido).toISOString().split('T')[0];
            if (!ventasPorFecha[fecha]) {
                ventasPorFecha[fecha] = {
                    fecha: fecha,
                    ventas: 0,
                    pedidos: 0
                };
            }
            ventasPorFecha[fecha].ventas += parseFloat(pedido.total || 0);
            ventasPorFecha[fecha].pedidos += 1;
        });
        
        // Ordenar por fecha
        return Object.values(ventasPorFecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
    }
    
    // Calcular ventas por categoría
    function calcularVentasPorCategoria(productosVentas) {
        const categorias = {};
        
        productosVentas.forEach(producto => {
            const categoria = producto.categoria || 'Sin categoría';
            if (!categorias[categoria]) {
                categorias[categoria] = {
                    nombre: categoria,
                    total: 0,
                    cantidad: 0,
                    productos_count: 0
                };
            }
            categorias[categoria].total += producto.total;
            categorias[categoria].cantidad += producto.vendido;
            categorias[categoria].productos_count += 1;
        });
        
        return Object.values(categorias);
    }

    // Cargar categorías en los filtros dinámicamente
    async function loadCategoriasEnFiltros() {
        try {
            const categoriaSelect = document.getElementById('filter-categoria-productos');
            if (!categoriaSelect) return;
            
            // Cargar categorías desde la API
            const response = await fetch('http://localhost:3000/api/categorias');
            if (!response.ok) {
                console.warn('No se pudieron cargar las categorías, usando datos mock');
                return;
            }
            
            const categorias = await response.json();
            
            // Limpiar opciones existentes (excepto la primera)
            categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
            
            // Agregar categorías dinámicamente
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.nombre || categoria.nombre_categoria;
                option.textContent = categoria.nombre || categoria.nombre_categoria;
                categoriaSelect.appendChild(option);
            });
            
            console.log('Categorías cargadas en filtros de reportes');
            
        } catch (error) {
            console.warn('Error al cargar categorías en reportes:', error);
        }
    }

    // Generar datos de prueba
    function generateMockData() {
        const productos = [
            { id: 1, nombre: 'Pechuga de Pollo', categoria: 'Pollo', precio: 8500, vendido: 150, total: 1275000 },
            { id: 2, nombre: 'Carne Molida', categoria: 'Res', precio: 12000, vendido: 89, total: 1068000 },
            { id: 3, nombre: 'Chuleta de Cerdo', categoria: 'Cerdo', precio: 9500, vendido: 120, total: 1140000 },
            { id: 4, nombre: 'Salchichas', categoria: 'Embutidos', precio: 6500, vendido: 200, total: 1300000 },
            { id: 5, nombre: 'Lomo de Res', categoria: 'Res', precio: 15000, vendido: 45, total: 675000 },
            { id: 6, nombre: 'Muslo de Pollo', categoria: 'Pollo', precio: 7000, vendido: 180, total: 1260000 },
            { id: 7, nombre: 'Costilla de Cerdo', categoria: 'Cerdo', precio: 11000, vendido: 75, total: 825000 },
            { id: 8, nombre: 'Jamón', categoria: 'Embutidos', precio: 8000, vendido: 95, total: 760000 }
        ];

        const clientes = [
            { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', totalCompras: 450000, cantidadPedidos: 12, ultimaCompra: '2024-01-15' },
            { id: 2, nombre: 'María García', email: 'maria@email.com', totalCompras: 320000, cantidadPedidos: 8, ultimaCompra: '2024-01-14' },
            { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', totalCompras: 280000, cantidadPedidos: 6, ultimaCompra: '2024-01-13' },
            { id: 4, nombre: 'Ana Martínez', email: 'ana@email.com', totalCompras: 520000, cantidadPedidos: 15, ultimaCompra: '2024-01-16' },
            { id: 5, nombre: 'Luis Rodríguez', email: 'luis@email.com', totalCompras: 190000, cantidadPedidos: 4, ultimaCompra: '2024-01-12' }
        ];

        const ventasDiarias = generateDailySales();
        const ventasPorCategoria = calculateCategorySales(productos);

        return {
            productos: productos.sort((a, b) => b.vendido - a.vendido),
            clientes: clientes.sort((a, b) => b.totalCompras - a.totalCompras),
            ventasDiarias,
            ventasPorCategoria,
            totalVentas: productos.reduce((sum, p) => sum + p.total, 0),
            totalPedidos: clientes.reduce((sum, c) => sum + c.cantidadPedidos, 0),
            clientesActivos: clientes.length
        };
    }

    // Generar datos de ventas diarias
    function generateDailySales() {
        const days = 30;
        const sales = [];
        const baseAmount = 50000;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const randomFactor = 0.7 + Math.random() * 0.6; // Entre 0.7 y 1.3
            const amount = Math.round(baseAmount * randomFactor);
            
            sales.push({
                fecha: date.toISOString().split('T')[0],
                ventas: amount,
                pedidos: Math.round(amount / 15000)
            });
        }
        
        return sales;
    }

    // Calcular ventas por categoría
    function calculateCategorySales(productos) {
        const categorias = {};
        
        productos.forEach(producto => {
            if (!categorias[producto.categoria]) {
                categorias[producto.categoria] = {
                    nombre: producto.categoria,
                    total: 0,
                    cantidad: 0
                };
            }
            categorias[producto.categoria].total += producto.total;
            categorias[producto.categoria].cantidad += producto.vendido;
        });
        
        return Object.values(categorias);
    }

    // Actualizar tarjetas de estadísticas
    function updateStatsCards() {
        const totalVentas = currentData.totalVentas || 0;
        const totalPedidos = currentData.totalPedidos || 0;
        const clientesActivos = currentData.clientesActivos || 0;
        const promedioPedido = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
        
        document.getElementById('total-ventas').textContent = formatCurrency(totalVentas);
        document.getElementById('total-pedidos').textContent = totalPedidos.toLocaleString();
        document.getElementById('clientes-activos').textContent = clientesActivos.toLocaleString();
        document.getElementById('promedio-pedido').textContent = formatCurrency(promedioPedido);
    }

    // Cargar datos específicos de sección
    function loadSectionData(sectionName) {
        switch (sectionName) {
            case 'resumen':
                updateResumenCharts();
                break;
            case 'ventas-productos':
                loadProductosVentasTable();
                break;
            case 'ventas-clientes':
                loadClientesVentasTable();
                break;
            case 'ventas-temporales':
                updateTemporalCharts();
                break;
            case 'ventas-categorias':
                loadCategoriasVentasTable();
                updateCategoriasChart();
                break;
        }
    }

    // Actualizar gráficos de resumen
    function updateResumenCharts() {
        updateVentasDiariasChart();
        updateVentasCategoriaChart();
    }

    // Gráfico de ventas diarias
    function updateVentasDiariasChart() {
        const ctx = document.getElementById('ventas-diarias-chart').getContext('2d');
        
        if (chartInstances.ventasDiarias) {
            chartInstances.ventasDiarias.destroy();
        }
        
        chartInstances.ventasDiarias = new Chart(ctx, {
            type: 'line',
            data: {
                labels: currentData.ventasDiarias.map(v => formatDate(v.fecha)),
                datasets: [{
                    label: 'Ventas Diarias',
                    data: currentData.ventasDiarias.map(v => v.ventas),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de ventas por categoría
    function updateVentasCategoriaChart() {
        const ctx = document.getElementById('ventas-categoria-chart').getContext('2d');
        
        if (chartInstances.ventasCategoria) {
            chartInstances.ventasCategoria.destroy();
        }
        
        chartInstances.ventasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: currentData.ventasPorCategoria.map(c => c.nombre),
                datasets: [{
                    data: currentData.ventasPorCategoria.map(c => c.total),
                    backgroundColor: [
                        '#dc2626',
                        '#f59e0b',
                        '#10b981',
                        '#3b82f6',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Cargar tabla de productos más vendidos
    function loadProductosVentasTable() {
        const tbody = document.getElementById('productos-ventas-tbody');
        tbody.innerHTML = '';
        
        currentData.productos.forEach((producto, index) => {
            const row = document.createElement('tr');
            const porcentaje = ((producto.total / currentData.totalVentas) * 100).toFixed(1);
            
            row.innerHTML = `
                <td class="ranking-cell ranking-${index < 3 ? index + 1 : ''}">${index + 1}</td>
                <td>${producto.nombre}</td>
                <td><span class="admin-badge admin-badge-primary">${producto.categoria}</span></td>
                <td>${producto.vendido.toLocaleString()}</td>
                <td>${formatCurrency(producto.total)}</td>
                <td>${formatCurrency(producto.precio)}</td>
                <td>
                    <div class="admin-progress-bar">
                        <div class="admin-progress-fill" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="admin-stat-label">${porcentaje}%</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Cargar tabla de clientes más activos
    function loadClientesVentasTable() {
        const tbody = document.getElementById('clientes-ventas-tbody');
        tbody.innerHTML = '';
        
        currentData.clientes.forEach((cliente, index) => {
            const row = document.createElement('tr');
            const promedioPedido = cliente.totalCompras / cliente.cantidadPedidos;
            
            row.innerHTML = `
                <td class="ranking-cell ranking-${index < 3 ? index + 1 : ''}">${index + 1}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.email}</td>
                <td>${formatCurrency(cliente.totalCompras)}</td>
                <td>${cliente.cantidadPedidos}</td>
                <td>${formatCurrency(promedioPedido)}</td>
                <td>${formatDate(cliente.ultimaCompra)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Actualizar gráficos temporales
    function updateTemporalCharts() {
        updateTendenciasVentasChart();
        updateComparacionMensualChart();
        updateVentasDiaSemanaChart();
    }

    // Gráfico de tendencias de ventas
    function updateTendenciasVentasChart() {
        const ctx = document.getElementById('tendencias-ventas-chart').getContext('2d');
        const tipoGrafico = document.getElementById('tipo-grafico-temporal').value;
        
        if (chartInstances.tendenciasVentas) {
            chartInstances.tendenciasVentas.destroy();
        }
        
        chartInstances.tendenciasVentas = new Chart(ctx, {
            type: tipoGrafico === 'linea' ? 'line' : tipoGrafico === 'barras' ? 'bar' : 'line',
            data: {
                labels: currentData.ventasDiarias.map(v => formatDate(v.fecha)),
                datasets: [{
                    label: 'Ventas',
                    data: currentData.ventasDiarias.map(v => v.ventas),
                    borderColor: '#dc2626',
                    backgroundColor: tipoGrafico === 'area' ? 'rgba(220, 38, 38, 0.3)' : '#dc2626',
                    borderWidth: 2,
                    fill: tipoGrafico === 'area'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de comparación mensual
    function updateComparacionMensualChart() {
        const ctx = document.getElementById('comparacion-mensual-chart').getContext('2d');
        
        if (chartInstances.comparacionMensual) {
            chartInstances.comparacionMensual.destroy();
        }
        
        // Calcular ventas mensuales desde pedidos reales
        const ventasPorMes = {};
        currentData.pedidos.forEach(pedido => {
            if (!pedido.fecha_pedido) return;
            const fecha = new Date(pedido.fecha_pedido);
            const mes = fecha.toLocaleString('es-ES', { month: 'short' });
            const año = fecha.getFullYear();
            const clave = `${mes} ${año}`;
            
            if (!ventasPorMes[clave]) {
                ventasPorMes[clave] = 0;
            }
            ventasPorMes[clave] += parseFloat(pedido.total || 0);
        });
        
        // Ordenar por fecha
        const mesesOrdenados = Object.keys(ventasPorMes).sort((a, b) => {
            return new Date(a) - new Date(b);
        });
        
        const meses = mesesOrdenados.length > 0 ? mesesOrdenados : ['Sin datos'];
        const ventasMensuales = meses.map(mes => ventasPorMes[mes] || 0);
        
        chartInstances.comparacionMensual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Ventas Mensuales',
                    data: ventasMensuales,
                    backgroundColor: '#dc2626',
                    borderColor: '#b91c1c',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de ventas por día de la semana
    function updateVentasDiaSemanaChart() {
        const ctx = document.getElementById('ventas-dia-semana-chart').getContext('2d');
        
        if (chartInstances.ventasDiaSemana) {
            chartInstances.ventasDiaSemana.destroy();
        }
        
        // Calcular ventas por día de la semana desde pedidos reales
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const ventasPorDia = [0, 0, 0, 0, 0, 0, 0]; // Lunes = 0, Domingo = 6
        
        currentData.pedidos.forEach(pedido => {
            if (!pedido.fecha_pedido) return;
            const fecha = new Date(pedido.fecha_pedido);
            const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
            // Convertir: Domingo (0) -> 6, Lunes (1) -> 0, etc.
            const indice = diaSemana === 0 ? 6 : diaSemana - 1;
            ventasPorDia[indice] += parseFloat(pedido.total || 0);
        });
        
        chartInstances.ventasDiaSemana = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Ventas por Día',
                    data: ventasPorDia,
                    backgroundColor: '#f59e0b',
                    borderColor: '#d97706',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Cargar tabla de categorías
    function loadCategoriasVentasTable() {
        const tbody = document.getElementById('categorias-ventas-tbody');
        tbody.innerHTML = '';
        
        currentData.ventasPorCategoria.forEach(categoria => {
            const row = document.createElement('tr');
            const porcentaje = ((categoria.total / currentData.totalVentas) * 100).toFixed(1);
            const tendencia = Math.random() > 0.5 ? 'up' : 'down';
            
            row.innerHTML = `
                <td><span class="admin-badge admin-badge-primary">${categoria.nombre}</span></td>
                <td>${formatCurrency(categoria.total)}</td>
                <td>${categoria.cantidad.toLocaleString()}</td>
                <td>${formatCurrency(categoria.total / categoria.cantidad)}</td>
                <td>
                    <div class="admin-progress-bar">
                        <div class="admin-progress-fill" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="admin-stat-label">${porcentaje}%</span>
                </td>
                <td>
                    <i class="fas fa-arrow-${tendencia} trend-${tendencia}"></i>
                    <span class="trend-${tendencia}">${tendencia === 'up' ? 'Subiendo' : 'Bajando'}</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Gráfico de distribución de categorías
    function updateCategoriasChart() {
        const ctx = document.getElementById('distribucion-categorias-chart').getContext('2d');
        
        if (chartInstances.distribucionCategorias) {
            chartInstances.distribucionCategorias.destroy();
        }
        
        chartInstances.distribucionCategorias = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: currentData.ventasPorCategoria.map(c => c.nombre),
                datasets: [{
                    data: currentData.ventasPorCategoria.map(c => c.total),
                    backgroundColor: [
                        '#dc2626',
                        '#f59e0b',
                        '#10b981',
                        '#3b82f6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Filtros y búsquedas
    function filterProductosVentas() {
        const searchTerm = document.getElementById('search-productos-ventas').value.toLowerCase();
        const categoriaFilter = document.getElementById('filter-categoria-productos').value;
        
        const filteredProductos = currentData.productos.filter(producto => {
            const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoriaFilter || producto.categoria === categoriaFilter;
            return matchesSearch && matchesCategory;
        });
        
        updateProductosTable(filteredProductos);
    }

    function filterClientesVentas() {
        const searchTerm = document.getElementById('search-clientes-ventas').value.toLowerCase();
        const tipoFilter = document.getElementById('filter-tipo-cliente').value;
        
        let filteredClientes = currentData.clientes.filter(cliente => {
            return cliente.nombre.toLowerCase().includes(searchTerm) || 
                   cliente.email.toLowerCase().includes(searchTerm);
        });
        
        // Aplicar filtro de tipo de cliente
        if (tipoFilter) {
            filteredClientes = filteredClientes.filter(cliente => {
                switch (tipoFilter) {
                    case 'frecuente':
                        return cliente.cantidadPedidos >= 10;
                    case 'nuevo':
                        return cliente.cantidadPedidos <= 3;
                    case 'vip':
                        return cliente.totalCompras >= 400000;
                    default:
                        return true;
                }
            });
        }
        
        updateClientesTable(filteredClientes);
    }

    function updateProductosTable(productos) {
        const tbody = document.getElementById('productos-ventas-tbody');
        tbody.innerHTML = '';
        
        productos.forEach((producto, index) => {
            const row = document.createElement('tr');
            const porcentaje = ((producto.total / currentData.totalVentas) * 100).toFixed(1);
            
            row.innerHTML = `
                <td class="ranking-cell ranking-${index < 3 ? index + 1 : ''}">${index + 1}</td>
                <td>${producto.nombre}</td>
                <td><span class="admin-badge admin-badge-primary">${producto.categoria}</span></td>
                <td>${producto.vendido.toLocaleString()}</td>
                <td>${formatCurrency(producto.total)}</td>
                <td>${formatCurrency(producto.precio)}</td>
                <td>
                    <div class="admin-progress-bar">
                        <div class="admin-progress-fill" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="admin-stat-label">${porcentaje}%</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    function updateClientesTable(clientes) {
        const tbody = document.getElementById('clientes-ventas-tbody');
        tbody.innerHTML = '';
        
        clientes.forEach((cliente, index) => {
            const row = document.createElement('tr');
            const promedioPedido = cliente.totalCompras / cliente.cantidadPedidos;
            
            row.innerHTML = `
                <td class="ranking-cell ranking-${index < 3 ? index + 1 : ''}">${index + 1}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.email}</td>
                <td>${formatCurrency(cliente.totalCompras)}</td>
                <td>${cliente.cantidadPedidos}</td>
                <td>${formatCurrency(promedioPedido)}</td>
                <td>${formatDate(cliente.ultimaCompra)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Configurar filtros de fecha
    function setupDateFilters() {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        document.getElementById('fecha-inicio').value = lastMonth.toISOString().split('T')[0];
        document.getElementById('fecha-fin').value = today.toISOString().split('T')[0];
    }

    // Manejar período rápido
    async function handleQuickPeriod() {
        const periodo = document.getElementById('periodo-rapido').value;
        if (!periodo) return;
        
        const today = new Date();
        let fechaInicio, fechaFin;
        
        switch (periodo) {
            case 'hoy':
                fechaInicio = fechaFin = today.toISOString().split('T')[0];
                break;
            case 'ayer':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                fechaInicio = fechaFin = yesterday.toISOString().split('T')[0];
                break;
            case 'semana':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                fechaInicio = weekAgo.toISOString().split('T')[0];
                fechaFin = today.toISOString().split('T')[0];
                break;
            case 'mes':
                const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                fechaInicio = monthAgo.toISOString().split('T')[0];
                fechaFin = today.toISOString().split('T')[0];
                break;
            case 'trimestre':
                const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                fechaInicio = quarterAgo.toISOString().split('T')[0];
                fechaFin = today.toISOString().split('T')[0];
                break;
            case 'año':
                const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                fechaInicio = yearAgo.toISOString().split('T')[0];
                fechaFin = today.toISOString().split('T')[0];
                break;
        }
        
        if (fechaInicio && fechaFin) {
            document.getElementById('fecha-inicio').value = fechaInicio;
            document.getElementById('fecha-fin').value = fechaFin;
            await applyDateFilters();
        }
    }

    // Aplicar filtros de fecha
    async function applyDateFilters() {
        const fechaInicio = document.getElementById('fecha-inicio').value;
        const fechaFin = document.getElementById('fecha-fin').value;
        
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona ambas fechas');
            return;
        }
        
        showLoading(true);
        
        try {
            fechaInicioFiltro = fechaInicio;
            fechaFinFiltro = fechaFin;
            
            // Recargar datos con los filtros aplicados
            await cargarDatosReales();
            updateStatsCards();
            loadSectionData(getCurrentSection());
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            mostrarNotificacion('Error al aplicar filtros de fecha', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Intentar usar la función global de notificaciones si existe
        if (typeof window.showNotification === 'function') {
            window.showNotification(mensaje, tipo);
        } else {
            // Fallback: usar alert
            alert(mensaje);
        }
    }

    // Obtener sección actual
    function getCurrentSection() {
        const activeSection = document.querySelector('.admin-section.active');
        return activeSection ? activeSection.id.replace('-section', '') : 'resumen';
    }

    // Actualizar gráfico temporal
    function updateTemporalChart() {
        updateTendenciasVentasChart();
    }

    // Exportar datos
    function exportData(tipo) {
        let data, filename;
        
        switch (tipo) {
            case 'productos':
                data = currentData.productos;
                filename = 'reporte_productos_ventas';
                break;
            case 'clientes':
                data = currentData.clientes;
                filename = 'reporte_clientes_ventas';
                break;
            default:
                return;
        }
        
        // Convertir a CSV
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
    }

    // Convertir datos a CSV
    function convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // Descargar archivo CSV
    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Generar reporte completo
    function generateReport() {
        const tipoReporte = document.getElementById('tipo-reporte').value;
        const formato = document.getElementById('formato-reporte').value;
        const fechaInicio = document.getElementById('export-fecha-inicio').value;
        const fechaFin = document.getElementById('export-fecha-fin').value;
        const incluirGraficos = document.getElementById('incluir-graficos').checked;
        
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona las fechas para el reporte');
            return;
        }
        
        showLoading(true);
        
        // Simular generación de reporte
        setTimeout(() => {
            alert(`Reporte ${tipoReporte} generado en formato ${formato.toUpperCase()}`);
            showLoading(false);
        }, 2000);
    }

    // Previsualizar reporte
    function previewReport() {
        const tipoReporte = document.getElementById('tipo-reporte').value;
        alert(`Previsualización del reporte ${tipoReporte} - Esta funcionalidad se implementará en la siguiente versión`);
    }

    // Inicializar gráficos
    function initializeCharts() {
        // Los gráficos se inicializan cuando se cargan los datos
    }

    // Mostrar/ocultar loading
    function showLoading(show) {
        const loadingOverlay = document.getElementById('admin-loading');
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }

    // Funciones de utilidad
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO');
    }

    // Limpiar instancias de gráficos al cerrar la página
    window.addEventListener('beforeunload', function() {
        Object.values(chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    });
});
