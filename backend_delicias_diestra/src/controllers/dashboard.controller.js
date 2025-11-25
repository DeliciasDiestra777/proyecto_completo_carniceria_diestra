const db = require('../config/conexion_db');

class DashboardController {
  // Obtener estadísticas del dashboard
  async obtenerEstadisticas(req, res) {
    try {
      // Obtener conteos de todas las tablas
      const [
        productos,
        usuarios,
        pedidos,
        recetas,
        categorias,
        proveedores,
        compras,
        producciones,
        ventas
      ] = await Promise.all([
        db.query('SELECT COUNT(*) as total FROM productos'),
        db.query('SELECT COUNT(*) as total FROM usuarios'),
        db.query('SELECT COUNT(*) as total FROM pedidos'),
        db.query('SELECT COUNT(*) as total FROM recetas'),
        db.query('SELECT COUNT(*) as total FROM categorias'),
        db.query('SELECT COUNT(*) as total FROM proveedores'),
        db.query('SELECT COUNT(*) as total FROM compras'),
        db.query('SELECT COUNT(*) as total FROM producciones'),
        db.query(`SELECT COALESCE(SUM(total), 0) as total 
                  FROM pedidos 
                  WHERE estado IN ('Pagado', 'Entregado') 
                  AND DATE(fecha_pedido) = DATE(NOW())`)
      ]);

      // Contar productos con inventario (stock > 0)
      const [inventario] = await db.query(
        'SELECT COUNT(*) as total FROM productos WHERE (stock_actual > 0 OR inventario_inicial > 0)'
      );

      res.json({
        total_productos: productos[0][0].total || 0,
        total_usuarios: usuarios[0][0].total || 0,
        total_pedidos: pedidos[0][0].total || 0,
        total_ventas: parseFloat(ventas[0][0].total || 0),
        total_recetas: recetas[0][0].total || 0,
        total_inventario: inventario[0].total || 0,
        total_categorias: categorias[0][0].total || 0,
        total_proveedores: proveedores[0][0].total || 0,
        total_compras: compras[0][0].total || 0,
        total_producciones: producciones[0][0].total || 0
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas: ' + error.message });
    }
  }

  // Obtener actividades recientes
  async obtenerActividades(req, res) {
    try {
      const { fecha_inicio, fecha_fin, tipo, usuario_id, limit = 50 } = req.query;
      const actividades = [];
      const limitNum = parseInt(limit) || 50;
      
      // Intentar obtener el usuario actual de la sesión (si está disponible)
      let usuarioActual = null;
      let nombreUsuarioActual = 'Sistema';
      
      // Si hay un usuario en el request (desde middleware de autenticación)
      if (req.user && req.user.id) {
        try {
          const [usuarios] = await db.query(
            'SELECT id_usuario, nombre_usuario FROM usuarios WHERE id_usuario = ?',
            [req.user.id]
          );
          if (usuarios.length > 0) {
            usuarioActual = usuarios[0];
            nombreUsuarioActual = usuarios[0].nombre_usuario || 'Usuario';
          }
        } catch (err) {
          console.error('Error al obtener usuario actual:', err);
        }
      }
      
      // Si no hay usuario en req.user, intentar obtener el primer administrador como fallback
      if (!usuarioActual) {
        try {
          const [admin] = await db.query(
            `SELECT id_usuario, nombre_usuario 
             FROM usuarios 
             WHERE id_rol = 1 
             ORDER BY id_usuario ASC 
             LIMIT 1`
          );
          if (admin.length > 0) {
            nombreUsuarioActual = admin[0].nombre_usuario || 'Administrador';
          }
        } catch (err) {
          console.error('Error al obtener administrador por defecto:', err);
        }
      }

      // Construir condiciones WHERE comunes para cada tipo
      const buildFechaWhere = (campoFecha) => {
        let where = '';
        const params = [];
        if (fecha_inicio) {
          where += ` AND ${campoFecha} >= ?`;
          params.push(fecha_inicio);
        }
        if (fecha_fin) {
          where += ` AND ${campoFecha} <= ?`;
          params.push(fecha_fin + ' 23:59:59');
        }
        return { where, params };
      };

      // Obtener actividades de productos
      if (!tipo || tipo === 'producto') {
        try {
          const fechaCond = buildFechaWhere('COALESCE(fecha_creacion, NOW())');
          const usuarioId = usuarioActual ? usuarioActual.id_usuario : null;
          const [productos] = await db.query(`
            SELECT 
              'producto' as tipo,
              'Creación' as accion,
              CONCAT('Producto: ', nombre_producto) as descripcion,
              CONCAT('ID: ', id_producto) as detalles,
              COALESCE(fecha_creacion, NOW()) as fecha,
              ? as usuario_id,
              ? as usuario_nombre
            FROM productos
            WHERE 1=1 ${fechaCond.where}
            ORDER BY COALESCE(fecha_creacion, NOW()) DESC
            LIMIT ?
          `, [usuarioId, nombreUsuarioActual, ...fechaCond.params, limitNum]);
          actividades.push(...productos);
        } catch (err) {
          console.error('Error al obtener actividades de productos:', err);
        }
      }

      // Obtener actividades de pedidos
      if (!tipo || tipo === 'pedido') {
        try {
          const fechaCond = buildFechaWhere('COALESCE(fecha_pedido, NOW())');
          const usuarioId = usuarioActual ? usuarioActual.id_usuario : null;
          const [pedidos] = await db.query(`
            SELECT 
              'pedido' as tipo,
              'Creación' as accion,
              CONCAT('Pedido #', id_pedido, ' - Cliente: ', COALESCE((SELECT CONCAT(nombre_cliente, ' ', apellido_cliente) FROM clientes WHERE id_cliente = pedidos.id_cliente LIMIT 1), 'N/A')) as descripcion,
              CONCAT('Total: $', COALESCE(total, 0)) as detalles,
              COALESCE(fecha_pedido, NOW()) as fecha,
              ? as usuario_id,
              ? as usuario_nombre
            FROM pedidos
            WHERE 1=1 ${fechaCond.where}
            ORDER BY COALESCE(fecha_pedido, NOW()) DESC
            LIMIT ?
          `, [usuarioId, nombreUsuarioActual, ...fechaCond.params, limitNum]);
          actividades.push(...pedidos);
        } catch (err) {
          console.error('Error al obtener actividades de pedidos:', err);
        }
      }

      // Obtener actividades de compras
      if (!tipo || tipo === 'compra') {
        try {
          const fechaCond = buildFechaWhere('COALESCE(fecha_compra, NOW())');
          const usuarioId = usuarioActual ? usuarioActual.id_usuario : null;
          const [compras] = await db.query(`
            SELECT 
              'compra' as tipo,
              'Creación' as accion,
              CONCAT('Compra #', id_compra, ' - Proveedor: ', COALESCE((SELECT nombre_proveedor FROM proveedores WHERE id_proveedor = compras.id_proveedor LIMIT 1), 'N/A')) as descripcion,
              CONCAT('Total: $', COALESCE(total_compra, 0)) as detalles,
              COALESCE(fecha_compra, NOW()) as fecha,
              ? as usuario_id,
              ? as usuario_nombre
            FROM compras
            WHERE 1=1 ${fechaCond.where}
            ORDER BY COALESCE(fecha_compra, NOW()) DESC
            LIMIT ?
          `, [usuarioId, nombreUsuarioActual, ...fechaCond.params, limitNum]);
          actividades.push(...compras);
        } catch (err) {
          console.error('Error al obtener actividades de compras:', err);
        }
      }

      // Obtener actividades de producciones
      if (!tipo || tipo === 'produccion') {
        try {
          const fechaCond = buildFechaWhere('COALESCE(fecha_produccion, NOW())');
          const usuarioId = usuarioActual ? usuarioActual.id_usuario : null;
          const [producciones] = await db.query(`
            SELECT 
              'produccion' as tipo,
              'Creación' as accion,
              CONCAT('Producción #', id_produccion, ' - Receta: ', COALESCE((SELECT nombre_receta FROM recetas WHERE id_receta = producciones.id_receta LIMIT 1), 'N/A')) as descripcion,
              CONCAT('Cantidad: ', cantidad_producida, ' ', unidad) as detalles,
              COALESCE(fecha_produccion, NOW()) as fecha,
              ? as usuario_id,
              ? as usuario_nombre
            FROM producciones
            WHERE 1=1 ${fechaCond.where}
            ORDER BY COALESCE(fecha_produccion, NOW()) DESC
            LIMIT ?
          `, [usuarioId, nombreUsuarioActual, ...fechaCond.params, limitNum]);
          actividades.push(...producciones);
        } catch (err) {
          console.error('Error al obtener actividades de producciones:', err);
        }
      }

      // Obtener actividades de recetas
      if (!tipo || tipo === 'receta') {
        try {
          const fechaCond = buildFechaWhere('COALESCE(fecha_creacion, NOW())');
          const usuarioId = usuarioActual ? usuarioActual.id_usuario : null;
          const [recetas] = await db.query(`
            SELECT 
              'receta' as tipo,
              'Creación' as accion,
              CONCAT('Receta: ', nombre_receta) as descripcion,
              CONCAT('ID: ', id_receta) as detalles,
              COALESCE(fecha_creacion, NOW()) as fecha,
              ? as usuario_id,
              ? as usuario_nombre
            FROM recetas
            WHERE 1=1 ${fechaCond.where}
            ORDER BY COALESCE(fecha_creacion, NOW()) DESC
            LIMIT ?
          `, [usuarioId, nombreUsuarioActual, ...fechaCond.params, limitNum]);
          actividades.push(...recetas);
        } catch (err) {
          console.error('Error al obtener actividades de recetas:', err);
        }
      }

      // Obtener actividades de usuarios
      if (!tipo || tipo === 'usuario') {
        try {
          // La tabla usuarios no tiene created_at, usar NOW() directamente
          const fechaCond = buildFechaWhere('NOW()');
          const [usuarios] = await db.query(`
            SELECT 
              'usuario' as tipo,
              'Creación' as accion,
              CONCAT('Usuario: ', COALESCE(CONCAT(nombre, ' ', apellido), nombre_usuario, '')) as descripcion,
              CONCAT('Email: ', COALESCE(email, '')) as detalles,
              NOW() as fecha,
              id_usuario as usuario_id,
              COALESCE(CONCAT(nombre, ' ', apellido), nombre_usuario, 'Usuario') as usuario_nombre
            FROM usuarios
            WHERE 1=1
            ORDER BY id_usuario DESC
            LIMIT ?
          `, [limitNum]);
          actividades.push(...usuarios);
        } catch (err) {
          console.error('Error al obtener actividades de usuarios:', err);
        }
      }

      // Ordenar por fecha descendente
      actividades.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        return fechaB - fechaA;
      });

      // Limitar resultados
      const actividadesLimitadas = actividades.slice(0, limitNum);

      res.json(actividadesLimitadas);
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      res.status(500).json({ error: 'Error al obtener actividades: ' + error.message });
    }
  }
}

module.exports = new DashboardController();

