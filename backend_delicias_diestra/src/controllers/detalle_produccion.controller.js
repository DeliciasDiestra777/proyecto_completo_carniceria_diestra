const db = require('../config/conexion_db');

class DetalleProduccionController {
  // Obtener todos los detalles de producción
  async obtenerDetallesProduccion(req, res) {
    try {
      const [detalles] = await db.query(
        `SELECT dp.id_detalle_produccion, dp.id_produccion, dp.id_producto_entrada, dp.id_producto_salida,
          dp.cantidad_usada, dp.cantidad_generada, dp.unidad, dp.costo_unitario
        FROM detalle_produccion dp
        ORDER BY dp.id_detalle_produccion DESC`
      );

      res.json(detalles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalles de producción' });
    }
  }

  // Obtener detalle de producción por ID
  async obtenerDetalleProduccionPorId(req, res) {
    const { id } = req.params;
    try {
      const [detalle] = await db.query(
        `SELECT dp.id_detalle_produccion, dp.id_produccion, dp.id_producto_entrada, dp.id_producto_salida,
          dp.cantidad_usada, dp.cantidad_generada, dp.unidad, dp.costo_unitario
        FROM detalle_produccion dp
        WHERE dp.id_detalle_produccion = ?`,
        [id]
      );

      if (detalle.length === 0) {
        return res.status(404).json({ error: 'Detalle de producción no encontrado' });
      }

      res.json(detalle[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalle de producción' });
    }
  }

  // Obtener detalles de producción por ID de producción
  async obtenerDetallesPorProduccion(req, res) {
    const { id_produccion } = req.params;
    try {
      const [detalles] = await db.query(
        `SELECT dp.id_detalle_produccion, dp.id_produccion, dp.id_producto_entrada, dp.id_producto_salida,
          dp.cantidad_usada, dp.cantidad_generada, dp.unidad, dp.costo_unitario
        FROM detalle_produccion dp
        WHERE dp.id_produccion = ?`,
        [id_produccion]
      );

      res.json(detalles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener detalles de producción' });
    }
  }

  // Agregar un detalle de producción nuevo
  async agregarDetalleProduccion(req, res) {
    const { id_produccion, id_producto_entrada, id_producto_salida, cantidad_usada, cantidad_generada, unidad, costo_unitario } = req.body;
    try {
      await db.query(
        'INSERT INTO detalle_produccion (id_produccion, id_producto_entrada, id_producto_salida, cantidad_usada, cantidad_generada, unidad, costo_unitario) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_produccion, id_producto_entrada, id_producto_salida || null, cantidad_usada, cantidad_generada || 0, unidad, costo_unitario || null]
      );
      res.json({ mensaje: 'Detalle de producción agregado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar detalle de producción' });
    }
  }

  // Actualizar detalle de producción
  async actualizarDetalleProduccion(req, res) {
    const { id } = req.params;
    const { id_produccion, id_producto_entrada, id_producto_salida, cantidad_usada, cantidad_generada, unidad, costo_unitario } = req.body;
    try {
      await db.query(
        'UPDATE detalle_produccion SET id_produccion = ?, id_producto_entrada = ?, id_producto_salida = ?, cantidad_usada = ?, cantidad_generada = ?, unidad = ?, costo_unitario = ? WHERE id_detalle_produccion = ?',
        [id_produccion, id_producto_entrada, id_producto_salida || null, cantidad_usada, cantidad_generada || 0, unidad, costo_unitario || null, id]
      );
      res.json({ mensaje: 'Detalle de producción actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar detalle de producción' });
    }
  }

  // Eliminar detalle de producción
  async eliminarDetalleProduccion(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM detalle_produccion WHERE id_detalle_produccion = ?', [id]);
      res.json({ mensaje: 'Detalle de producción eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar detalle de producción' });
    }
  }
}

module.exports = DetalleProduccionController;




