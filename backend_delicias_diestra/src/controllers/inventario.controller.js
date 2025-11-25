const db = require('../config/conexion_db');

class InventarioController {
  // Obtener todo el inventario
  async obtenerInventario(req, res) {
    try {
      const [inventario] = await db.query(
        `SELECT i.id_inventario, i.id_producto, i.id_detalle_compra, i.fecha_inventario,
          i.inventario_inicial, i.entrada_compras, i.salida_pedidos,
          i.inventario_final, i.stock_minimo, i.ultima_actualizacion,
          i.unidad, i.costo
        FROM inventario i
        ORDER BY i.fecha_inventario DESC, i.id_inventario DESC`
      );

      res.json(inventario);
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      res.status(500).json({ error: 'Error al obtener inventario', detalles: error.message });
    }
  }

  // Obtener registro de inventario por ID
  async obtenerInventarioPorId(req, res) {
    const { id } = req.params;
    try {
      const [inventario] = await db.query(
        `SELECT i.id_inventario, i.id_producto, i.id_detalle_compra, i.fecha_inventario,
          i.inventario_inicial, i.entrada_compras, i.salida_pedidos,
          i.inventario_final, i.stock_minimo, i.ultima_actualizacion,
          i.unidad, i.costo
        FROM inventario i
        WHERE i.id_inventario = ?`,
        [id]
      );

      if (inventario.length === 0) {
        return res.status(404).json({ error: 'Registro de inventario no encontrado' });
      }

      res.json(inventario[0]);
    } catch (error) {
      console.error('Error al obtener registro de inventario:', error);
      res.status(500).json({ error: 'Error al obtener registro de inventario', detalles: error.message });
    }
  }

  // Agregar un registro de inventario nuevo
  async agregarInventario(req, res) {
    const { id_producto, id_detalle_compra, fecha_inventario, inventario_inicial, entrada_compras, salida_pedidos, stock_minimo, unidad, costo } = req.body;
    
    try {
      // Validar que se proporcione al menos id_producto o id_detalle_compra
      if (!id_producto && !id_detalle_compra) {
        return res.status(400).json({ 
          error: 'Se debe proporcionar id_producto o id_detalle_compra' 
        });
      }

      // Validar datos requeridos
      if (!fecha_inventario || !unidad) {
        return res.status(400).json({ 
          error: 'Los campos fecha_inventario y unidad son obligatorios' 
        });
      }

      const [result] = await db.query(
        'INSERT INTO inventario (id_producto, id_detalle_compra, fecha_inventario, inventario_inicial, entrada_compras, salida_pedidos, stock_minimo, unidad, costo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id_producto || null, 
          id_detalle_compra || null, 
          fecha_inventario, 
          inventario_inicial || 0, 
          entrada_compras || 0, 
          salida_pedidos || 0, 
          stock_minimo || 0, 
          unidad, 
          costo || 0
        ]
      );

      // Obtener el registro recién creado para devolverlo
      const [nuevoInventario] = await db.query(
        `SELECT i.id_inventario, i.id_producto, i.id_detalle_compra, i.fecha_inventario,
          i.inventario_inicial, i.entrada_compras, i.salida_pedidos,
          i.inventario_final, i.stock_minimo, i.ultima_actualizacion,
          i.unidad, i.costo
        FROM inventario i
        WHERE i.id_inventario = ?`,
        [result.insertId]
      );

      res.status(201).json({
        mensaje: 'Registro de inventario agregado correctamente',
        data: nuevoInventario[0]
      });
    } catch (error) {
      console.error('Error al agregar registro de inventario:', error);
      res.status(500).json({ 
        error: 'Error al agregar registro de inventario', 
        detalles: error.message 
      });
    }
  }

  // Actualizar inventario
  async actualizarInventario(req, res) {
    const { id } = req.params;
    const { id_producto, id_detalle_compra, fecha_inventario, inventario_inicial, entrada_compras, salida_pedidos, stock_minimo, unidad, costo } = req.body;
    try {
      await db.query(
        'UPDATE inventario SET id_producto = ?, id_detalle_compra = ?, fecha_inventario = ?, inventario_inicial = ?, entrada_compras = ?, salida_pedidos = ?, stock_minimo = ?, unidad = ?, costo = ? WHERE id_inventario = ?',
        [id_producto || null, id_detalle_compra || null, fecha_inventario, inventario_inicial, entrada_compras, salida_pedidos, stock_minimo, unidad, costo, id]
      );
      
      // Obtener el registro actualizado para devolverlo
      const [inventarioActualizado] = await db.query(
        `SELECT i.id_inventario, i.id_producto, i.id_detalle_compra, i.fecha_inventario,
          i.inventario_inicial, i.entrada_compras, i.salida_pedidos,
          i.inventario_final, i.stock_minimo, i.ultima_actualizacion,
          i.unidad, i.costo
        FROM inventario i
        WHERE i.id_inventario = ?`,
        [id]
      );

      res.json({ 
        mensaje: 'Registro de inventario actualizado correctamente',
        data: inventarioActualizado[0]
      });
    } catch (error) {
      console.error('Error al actualizar registro de inventario:', error);
      res.status(500).json({ 
        error: 'Error al actualizar registro de inventario', 
        detalles: error.message 
      });
    }
  }

  // Eliminar registro de inventario
  async eliminarInventario(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM inventario WHERE id_inventario = ?', [id]);
      res.json({ mensaje: 'Registro de inventario eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar registro de inventario' });
    }
  }
}

module.exports = InventarioController;



