const db = require('../config/conexion_db');
const ProductosController = require('./productos.controller');

class DetalleCompraController {
  constructor() {
    this.productosController = new ProductosController();
  }
  // Obtener todos los detalles de compra
  async obtenerDetallesCompra(req, res) {
    try {
      const [detalles] = await db.query(
        `SELECT dc.id_detalle_compra, dc.id_compra, dc.id_producto,
          p.nombre_producto, dc.cantidad, dc.unidad,
          dc.precio_compra, dc.subtotal
        FROM detalle_compra dc
        LEFT JOIN productos p ON dc.id_producto = p.id_producto
        ORDER BY dc.id_detalle_compra DESC`
      );

      res.json(detalles);
    } catch (error) {
      console.error('Error al obtener detalles de compra:', error);
      res.status(500).json({ error: 'Error al obtener detalles de compra', detalles: error.message });
    }
  }

  // Obtener detalle de compra por ID
  async obtenerDetalleCompraPorId(req, res) {
    const { id } = req.params;
    try {
      const [detalle] = await db.query(
        `SELECT dc.id_detalle_compra, dc.id_compra, dc.id_producto,
          p.nombre_producto, dc.cantidad, dc.unidad,
          dc.precio_compra, dc.subtotal
        FROM detalle_compra dc
        LEFT JOIN productos p ON dc.id_producto = p.id_producto
        WHERE dc.id_detalle_compra = ?`,
        [id]
      );

      if (detalle.length === 0) {
        return res.status(404).json({ error: 'Detalle de compra no encontrado' });
      }

      res.json(detalle[0]);
    } catch (error) {
      console.error('Error al obtener detalle de compra:', error);
      res.status(500).json({ error: 'Error al obtener detalle de compra', detalles: error.message });
    }
  }

  // Obtener detalles de compra por ID de compra
  async obtenerDetallesPorCompra(req, res) {
    const { id_compra } = req.params;
    try {
      const [detalles] = await db.query(
        `SELECT dc.id_detalle_compra, dc.id_compra, dc.id_producto,
          p.nombre_producto, dc.cantidad, dc.unidad,
          dc.precio_compra, dc.subtotal
        FROM detalle_compra dc
        LEFT JOIN productos p ON dc.id_producto = p.id_producto
        WHERE dc.id_compra = ?`,
        [id_compra]
      );

      res.json(detalles);
    } catch (error) {
      console.error('Error al obtener detalles de compra por ID de compra:', error);
      res.status(500).json({ error: 'Error al obtener detalles de compra', detalles: error.message });
    }
  }

  // Agregar un detalle de compra nuevo
  async agregarDetalleCompra(req, res) {
    const { id_compra, id_producto, cantidad, unidad, precio_compra } = req.body;
    try {
      await db.query(
        'INSERT INTO detalle_compra (id_compra, id_producto, cantidad, unidad, precio_compra) VALUES (?, ?, ?, ?, ?)',
        [id_compra, id_producto, cantidad, unidad, precio_compra]
      );
      
      // Actualizar estado de productos con stock 0 después de agregar compra
      // (aunque las compras aumentan stock, verificamos por si acaso)
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de compra agregado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar detalle de compra' });
    }
  }

  // Actualizar detalle de compra
  async actualizarDetalleCompra(req, res) {
    const { id } = req.params;
    const { id_compra, id_producto, cantidad, unidad, precio_compra } = req.body;
    try {
      await db.query(
        'UPDATE detalle_compra SET id_compra = ?, id_producto = ?, cantidad = ?, unidad = ?, precio_compra = ? WHERE id_detalle_compra = ?',
        [id_compra, id_producto, cantidad, unidad, precio_compra, id]
      );
      
      // Actualizar estado de productos con stock 0 después de actualizar compra
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de compra actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar detalle de compra' });
    }
  }

  // Eliminar detalle de compra
  async eliminarDetalleCompra(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM detalle_compra WHERE id_detalle_compra = ?', [id]);
      
      // Actualizar estado de productos con stock 0 después de eliminar compra
      await this.productosController.actualizarEstadoProductosSinStock();
      
      res.json({ mensaje: 'Detalle de compra eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar detalle de compra' });
    }
  }
}

module.exports = DetalleCompraController;




