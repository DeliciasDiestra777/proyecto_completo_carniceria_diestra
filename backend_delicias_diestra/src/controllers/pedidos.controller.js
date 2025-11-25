const db = require('../config/conexion_db');

class PedidosController {
  // Obtener todos los pedidos con información del cliente y detalles
  async obtenerPedidos(req, res) {
    try {
      const [pedidos] = await db.query(
        `SELECT p.id_pedido, p.id_cliente, 
          CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) AS nombre_cliente,
          p.fecha_pedido, p.metodo_pago, p.total, p.estado
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        ORDER BY p.fecha_pedido DESC`
      );

      // Para cada pedido, obtener sus detalles
      const pedidosConDetalles = await Promise.all(
        pedidos.map(async (pedido) => {
          const [detalles] = await db.query(
            `SELECT id_detalle, id_pedido, id_producto, cantidad, unidad, precio_unitario, subtotal
             FROM detalle_pedido
             WHERE id_pedido = ?
             ORDER BY id_detalle`,
            [pedido.id_pedido]
          );

          return {
            ...pedido,
            detalle: detalles.map(d => ({
              id_detalle: d.id_detalle,
              id_pedido: d.id_pedido,
              id_producto: d.id_producto,
              cantidad: parseFloat(d.cantidad),
              unidad: d.unidad,
              precio_unitario: parseFloat(d.precio_unitario),
              subtotal: parseFloat(d.subtotal)
            }))
          };
        })
      );

      res.json(pedidosConDetalles);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      res.status(500).json({ error: 'Error al obtener pedidos', detalles: error.message });
    }
  }

  // Obtener pedidos por ID de cliente
  async obtenerPedidosPorCliente(req, res) {
    const { id_cliente } = req.params;
    try {
      const [pedidos] = await db.query(
        `SELECT p.id_pedido, p.id_cliente, 
          CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) AS nombre_cliente,
          p.fecha_pedido, p.metodo_pago, p.total, p.estado
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        WHERE p.id_cliente = ?
        ORDER BY p.fecha_pedido DESC`,
        [id_cliente]
      );

      // Para cada pedido, obtener sus detalles
      const pedidosConDetalles = await Promise.all(
        pedidos.map(async (pedido) => {
          const [detalles] = await db.query(
            `SELECT dp.id_detalle, dp.id_pedido, dp.id_producto, 
                    pr.nombre_producto, dp.cantidad, dp.unidad, dp.precio_unitario, dp.subtotal
             FROM detalle_pedido dp
             LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
             WHERE dp.id_pedido = ?
             ORDER BY dp.id_detalle`,
            [pedido.id_pedido]
          );

          return {
            ...pedido,
            detalle: detalles.map(d => ({
              id_detalle: d.id_detalle,
              id_pedido: d.id_pedido,
              id_producto: d.id_producto,
              nombre_producto: d.nombre_producto,
              cantidad: parseFloat(d.cantidad),
              unidad: d.unidad,
              precio_unitario: parseFloat(d.precio_unitario),
              subtotal: parseFloat(d.subtotal)
            }))
          };
        })
      );

      res.json(pedidosConDetalles);
    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error);
      res.status(500).json({ error: 'Error al obtener pedidos del cliente', detalles: error.message });
    }
  }

  // Obtener pedido por ID
  async obtenerPedidoPorId(req, res) {
    const { id } = req.params;
    try {
      const [pedido] = await db.query(
        `SELECT p.id_pedido, p.id_cliente, 
          CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) AS nombre_cliente,
          p.fecha_pedido, p.metodo_pago, p.total, p.estado
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        WHERE p.id_pedido = ?`,
        [id]
      );

      if (pedido.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json(pedido[0]);
    } catch (error) {
      console.error('Error al obtener pedido:', error);
      res.status(500).json({ error: 'Error al obtener pedido', detalles: error.message });
    }
  }

  // Agregar un pedido nuevo
  async agregarPedido(req, res) {
    const { id_cliente, fecha_pedido, metodo_pago, total, estado } = req.body;
    try {
      // Normalizar estado
      let estadoNormalizado = estado || 'Pendiente';
      if (estadoNormalizado && typeof estadoNormalizado === 'string') {
        if (estadoNormalizado.toLowerCase() === 'pendiente') {
          estadoNormalizado = 'Pendiente';
        } else if (estadoNormalizado.toLowerCase() === 'pagado') {
          estadoNormalizado = 'Pagado';
        } else if (estadoNormalizado.toLowerCase() === 'entregado') {
          estadoNormalizado = 'Entregado';
        } else if (estadoNormalizado.toLowerCase() === 'cancelado') {
          estadoNormalizado = 'Cancelado';
        }
      }
      
      // Normalizar metodo_pago
      let metodoPagoNormalizado = metodo_pago;
      if (metodoPagoNormalizado && typeof metodoPagoNormalizado === 'string') {
        metodoPagoNormalizado = metodoPagoNormalizado.charAt(0).toUpperCase() + metodoPagoNormalizado.slice(1).toLowerCase();
        if (metodoPagoNormalizado !== 'Transferencia' && metodoPagoNormalizado !== 'Efectivo') {
          metodoPagoNormalizado = null;
        }
      } else {
        metodoPagoNormalizado = null;
      }
      
      const [resultado] = await db.query(
        'INSERT INTO pedidos (id_cliente, fecha_pedido, metodo_pago, total, estado) VALUES (?, ?, ?, ?, ?)',
        [id_cliente || null, fecha_pedido || null, metodoPagoNormalizado, total || 0, estadoNormalizado]
      );
      
      res.json({ 
        mensaje: 'Pedido agregado correctamente',
        id_pedido: resultado.insertId
      });
    } catch (error) {
      console.error('Error al agregar pedido:', error);
      res.status(500).json({ error: 'Error al agregar pedido', detalles: error.message });
    }
  }

  // Actualizar pedido
  async actualizarPedido(req, res) {
    const { id } = req.params;
    const { id_cliente, fecha_pedido, metodo_pago, total, estado } = req.body;
    try {
      await db.query(
        'UPDATE pedidos SET id_cliente = ?, fecha_pedido = ?, metodo_pago = ?, total = ?, estado = ? WHERE id_pedido = ?',
        [id_cliente, fecha_pedido, metodo_pago, total, estado, id]
      );
      
      // Si el estado se cambió a "Entregado", el inventario ya está actualizado por los triggers
      // cuando se crearon los detalles de pedido. Solo confirmamos la actualización.
      if (estado === 'Entregado') {
        console.log(`✅ Pedido ${id} marcado como Entregado. El inventario ya está actualizado.`);
      }
      
      res.json({ mensaje: 'Pedido actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  }

  // Eliminar pedido
  async eliminarPedido(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id]);
      res.json({ mensaje: 'Pedido eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar pedido' });
    }
  }
}

module.exports = PedidosController;




