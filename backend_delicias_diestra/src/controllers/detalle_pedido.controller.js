const db = require('../config/conexion_db');
const ProductosController = require('./productos.controller');

class DetallePedidoController {
  constructor() {
    this.productosController = new ProductosController();
  }
  // Obtener todos los detalles de pedido
  async obtenerDetallesPedido(req, res) {
    try {
      const [detalles] = await db.query(
        `SELECT dp.id_detalle, dp.id_pedido, dp.id_producto,
          dp.cantidad, dp.unidad, dp.precio_unitario, dp.subtotal
        FROM detalle_pedido dp
        ORDER BY dp.id_detalle DESC`
      );

      res.json(detalles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalles de pedido' });
    }
  }

  // Obtener detalle de pedido por ID
  async obtenerDetallePedidoPorId(req, res) {
    const { id } = req.params;
    try {
      const [detalle] = await db.query(
        `SELECT dp.id_detalle, dp.id_pedido, dp.id_producto,
          dp.cantidad, dp.unidad, dp.precio_unitario, dp.subtotal
        FROM detalle_pedido dp
        WHERE dp.id_detalle = ?`,
        [id]
      );

      if (detalle.length === 0) {
        return res.status(404).json({ error: 'Detalle de pedido no encontrado' });
      }

      res.json(detalle[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalle de pedido' });
    }
  }

  // Obtener detalles de pedido por ID de pedido
  async obtenerDetallesPorPedido(req, res) {
    const { id_pedido } = req.params;
    try {
      const [detalles] = await db.query(
        `SELECT dp.id_detalle, dp.id_pedido, dp.id_producto,
          dp.cantidad, dp.unidad, dp.precio_unitario, dp.subtotal
        FROM detalle_pedido dp
        WHERE dp.id_pedido = ?`,
        [id_pedido]
      );

      res.json(detalles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalles de pedido' });
    }
  }

  // Agregar un detalle de pedido nuevo
  async agregarDetallePedido(req, res) {
    const { id_pedido, id_producto, cantidad, unidad, precio_unitario } = req.body;
    try {
      await db.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, unidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
        [id_pedido, id_producto, cantidad, unidad, precio_unitario]
      );
      
      // Actualizar estado de productos con stock 0 después de agregar pedido
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de pedido agregado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar detalle de pedido' });
    }
  }

  // Actualizar detalle de pedido
  async actualizarDetallePedido(req, res) {
    const { id } = req.params;
    const { id_pedido, id_producto, cantidad, unidad, precio_unitario } = req.body;
    try {
      await db.query(
        'UPDATE detalle_pedido SET id_pedido = ?, id_producto = ?, cantidad = ?, unidad = ?, precio_unitario = ? WHERE id_detalle = ?',
        [id_pedido, id_producto, cantidad, unidad, precio_unitario, id]
      );
      
      // Actualizar estado de productos con stock 0 después de actualizar pedido
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de pedido actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar detalle de pedido' });
    }
  }

  // Eliminar detalle de pedido
  async eliminarDetallePedido(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM detalle_pedido WHERE id_detalle = ?', [id]);
      
      // Actualizar estado de productos con stock 0 después de eliminar pedido
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de pedido eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar detalle de pedido' });
    }
  }
}

module.exports = DetallePedidoController;




