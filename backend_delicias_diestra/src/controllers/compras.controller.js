const db = require('../config/conexion_db');

class ComprasController {
  // Obtener todas las compras con información del proveedor
  async obtenerCompras(req, res) {
    try {
      // Verificar qué campo de nombre existe en la tabla proveedores
      const [columnCheck] = await db.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'proveedores' 
         AND COLUMN_NAME IN ('nombre_proveedor', 'nombre_comercial')`
      );
      
      const camposDisponibles = columnCheck.map(col => col.COLUMN_NAME);
      let campoNombre = null;
      
      if (camposDisponibles.includes('nombre_proveedor')) {
        campoNombre = 'p.nombre_proveedor';
      } else if (camposDisponibles.includes('nombre_comercial')) {
        campoNombre = 'p.nombre_comercial';
      }
      
      // Construir la consulta según el campo disponible
      let query;
      if (campoNombre) {
        query = `SELECT c.id_compra, c.id_proveedor, 
          COALESCE(${campoNombre}, 'Sin nombre') AS nombre_proveedor,
          c.fecha_compra, c.total_compra
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        ORDER BY c.fecha_compra DESC`;
      } else {
        // Si no existe ningún campo de nombre, usar un valor por defecto
        query = `SELECT c.id_compra, c.id_proveedor, 
          'Sin nombre' AS nombre_proveedor,
          c.fecha_compra, c.total_compra
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        ORDER BY c.fecha_compra DESC`;
      }
      
      const [compras] = await db.query(query);

      res.json(compras);
    } catch (error) {
      console.error('Error al obtener compras:', error);
      res.status(500).json({ error: 'Error al obtener compras', detalles: error.message });
    }
  }

  // Obtener compra por ID
  async obtenerCompraPorId(req, res) {
    const { id } = req.params;
    try {
      // Verificar qué campo de nombre existe en la tabla proveedores
      const [columnCheck] = await db.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'proveedores' 
         AND COLUMN_NAME IN ('nombre_proveedor', 'nombre_comercial')`
      );
      
      const camposDisponibles = columnCheck.map(col => col.COLUMN_NAME);
      let campoNombre = null;
      
      if (camposDisponibles.includes('nombre_proveedor')) {
        campoNombre = 'p.nombre_proveedor';
      } else if (camposDisponibles.includes('nombre_comercial')) {
        campoNombre = 'p.nombre_comercial';
      }
      
      // Construir la consulta según el campo disponible
      let query;
      if (campoNombre) {
        query = `SELECT c.id_compra, c.id_proveedor, 
          COALESCE(${campoNombre}, 'Sin nombre') AS nombre_proveedor,
          c.fecha_compra, c.total_compra
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        WHERE c.id_compra = ?`;
      } else {
        // Si no existe ningún campo de nombre, usar un valor por defecto
        query = `SELECT c.id_compra, c.id_proveedor, 
          'Sin nombre' AS nombre_proveedor,
          c.fecha_compra, c.total_compra
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        WHERE c.id_compra = ?`;
      }
      
      const [compra] = await db.query(query, [id]);

      if (compra.length === 0) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      res.json(compra[0]);
    } catch (error) {
      console.error('Error al obtener compra:', error);
      res.status(500).json({ error: 'Error al obtener compra', detalles: error.message });
    }
  }

  // Agregar una compra nueva
  async agregarCompra(req, res) {
    const { id_proveedor, fecha_compra, total_compra, detalle } = req.body;
    try {
      // Crear la compra
      const [resultado] = await db.query(
        'INSERT INTO compras (id_proveedor, fecha_compra, total_compra) VALUES (?, ?, ?)',
        [id_proveedor, fecha_compra || null, total_compra || 0]
      );
      
      const id_compra = resultado.insertId;
      
      // Si hay detalles, crearlos
      if (detalle && Array.isArray(detalle) && detalle.length > 0) {
        console.log(`📦 Creando ${detalle.length} detalles de compra para compra ID: ${id_compra}`);
        
        for (const item of detalle) {
          await db.query(
            'INSERT INTO detalle_compra (id_compra, id_producto, cantidad, unidad, precio_compra) VALUES (?, ?, ?, ?, ?)',
            [id_compra, item.id_producto, item.cantidad, item.unidad, item.precio_compra]
          );
        }
        
        console.log(`✅ ${detalle.length} detalles de compra creados correctamente`);
      }
      
      res.json({ 
        mensaje: 'Compra agregada correctamente',
        id_compra: id_compra
      });
    } catch (error) {
      console.error('Error al agregar compra:', error);
      res.status(500).json({ error: 'Error al agregar compra', detalles: error.message });
    }
  }

  // Actualizar compra
  async actualizarCompra(req, res) {
    const { id } = req.params;
    const { id_proveedor, fecha_compra, total_compra } = req.body;
    try {
      await db.query(
        'UPDATE compras SET id_proveedor = ?, fecha_compra = ?, total_compra = ? WHERE id_compra = ?',
        [id_proveedor, fecha_compra, total_compra, id]
      );
      res.json({ mensaje: 'Compra actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar compra' });
    }
  }

  // Eliminar compra
  async eliminarCompra(req, res) {
    const { id } = req.params;
    try {
      // Primero, obtener los detalles de compra para revertir el inventario
      const [detalles] = await db.query(
        'SELECT id_producto, cantidad FROM detalle_compra WHERE id_compra = ?',
        [id]
      );

      // Revertir las cantidades en el inventario (restar de entrada_compras)
      if (detalles && detalles.length > 0) {
        console.log(`🔄 Revirtiendo ${detalles.length} detalles de compra para actualizar inventario`);
        
        for (const detalle of detalles) {
          await db.query(
            `UPDATE productos 
             SET entrada_compras = GREATEST(COALESCE(entrada_compras, 0) - ?, 0)
             WHERE id_producto = ?`,
            [detalle.cantidad, detalle.id_producto]
          );
        }
        
        console.log(`✅ Inventario revertido para ${detalles.length} productos`);
      }

      // Eliminar los detalles de compra
      await db.query('DELETE FROM detalle_compra WHERE id_compra = ?', [id]);
      console.log(`🗑️ Detalles de compra eliminados para compra ID: ${id}`);

      // Finalmente, eliminar la compra
      await db.query('DELETE FROM compras WHERE id_compra = ?', [id]);
      console.log(`✅ Compra ${id} eliminada correctamente`);

      res.json({ mensaje: 'Compra eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      res.status(500).json({ error: 'Error al eliminar compra', detalles: error.message });
    }
  }
}

module.exports = ComprasController;

