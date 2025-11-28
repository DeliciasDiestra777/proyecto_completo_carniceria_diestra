const db = require('../config/conexion_db');

class RecetasController {
  // Obtener todas las recetas
  async obtenerRecetas(req, res) {
    try {
      const [recetas] = await db.query(
        `SELECT id_receta, nombre_receta, descripcion, rendimiento, unidad,
          estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones
        FROM recetas
        ORDER BY fecha_creacion DESC`
      );

      // Obtener ingredientes para cada receta (si la tabla existe)
      for (let receta of recetas) {
        try {
          const [ingredientes] = await db.query(
            `SELECT id_ingrediente, id_receta, nombre_ingrediente, cantidad, unidad
             FROM ingredientes_receta
             WHERE id_receta = ?
             ORDER BY id_ingrediente ASC`,
            [receta.id_receta]
          );
          receta.ingredientes = ingredientes || [];
        } catch (err) {
          // Si la tabla no existe, simplemente asignar array vacío
          if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
            console.log('⚠️ Tabla ingredientes_receta no existe, asignando array vacío');
            receta.ingredientes = [];
          } else {
            console.error(`Error al obtener ingredientes para receta ${receta.id_receta}:`, err);
            receta.ingredientes = [];
          }
        }
      }

      res.json(recetas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener recetas' });
    }
  }

  // Obtener receta por ID
  async obtenerRecetaPorId(req, res) {
    const { id } = req.params;
    try {
      const [receta] = await db.query(
        `SELECT id_receta, nombre_receta, descripcion, rendimiento, unidad,
          estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones
        FROM recetas
        WHERE id_receta = ?`,
        [id]
      );

      if (receta.length === 0) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      const recetaData = receta[0];

      // Obtener ingredientes de la receta (si la tabla existe)
      try {
        const [ingredientes] = await db.query(
          `SELECT id_ingrediente, id_receta, nombre_ingrediente, cantidad, unidad
           FROM ingredientes_receta
           WHERE id_receta = ?
           ORDER BY id_ingrediente ASC`,
          [id]
        );
        recetaData.ingredientes = ingredientes || [];
      } catch (err) {
        // Si la tabla no existe, simplemente asignar array vacío
        if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
          console.log('⚠️ Tabla ingredientes_receta no existe, asignando array vacío');
          recetaData.ingredientes = [];
        } else {
          console.error(`Error al obtener ingredientes para receta ${id}:`, err);
          recetaData.ingredientes = [];
        }
      }

      res.json(recetaData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener receta' });
    }
  }

  // Agregar una receta nueva
  async agregarReceta(req, res) {
    const { nombre_receta, descripcion, rendimiento, unidad, estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones, ingredientes } = req.body;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insertar la receta
      const [result] = await connection.query(
        'INSERT INTO recetas (nombre_receta, descripcion, rendimiento, unidad, estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre_receta, descripcion || null, rendimiento || null, unidad, estado_receta || 'activa', fecha_creacion || null, ingrediente_base || null, cantidad_base || null, unidad_base || null, observaciones || null]
      );

      const idReceta = result.insertId;

      // Guardar ingredientes si se proporcionaron (si la tabla existe)
      if (ingredientes && Array.isArray(ingredientes) && ingredientes.length > 0) {
        try {
          for (const ingrediente of ingredientes) {
            const { nombre_ingrediente, cantidad, unidad: unidadIngrediente } = ingrediente;
            
            if (nombre_ingrediente && cantidad !== undefined && unidadIngrediente) {
              await connection.query(
                'INSERT INTO ingredientes_receta (id_receta, nombre_ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)',
                [idReceta, nombre_ingrediente, cantidad, unidadIngrediente]
              );
            }
          }
        } catch (err) {
          // Si la tabla no existe, hacer rollback y retornar error
          if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
            await connection.rollback();
            return res.status(500).json({ 
              error: 'La tabla ingredientes_receta no existe en la base de datos. Por favor, créala primero.' 
            });
          }
          throw err; // Re-lanzar si es otro tipo de error
        }
      }

      await connection.commit();
      res.json({ mensaje: 'Receta agregada correctamente', id_receta: idReceta });
    } catch (error) {
      await connection.rollback();
      console.error('Error al agregar receta:', error);
      res.status(500).json({ error: 'Error al agregar receta: ' + error.message });
    } finally {
      connection.release();
    }
  }

  // Actualizar receta
  async actualizarReceta(req, res) {
    const { id } = req.params;
    const { nombre_receta, descripcion, rendimiento, unidad, estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones, ingredientes } = req.body;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Actualizar la receta
      await connection.query(
        'UPDATE recetas SET nombre_receta = ?, descripcion = ?, rendimiento = ?, unidad = ?, estado_receta = ?, fecha_creacion = ?, ingrediente_base = ?, cantidad_base = ?, unidad_base = ?, observaciones = ? WHERE id_receta = ?',
        [nombre_receta, descripcion, rendimiento, unidad, estado_receta, fecha_creacion, ingrediente_base, cantidad_base, unidad_base, observaciones, id]
      );

      // Actualizar ingredientes si se proporcionaron (si la tabla existe)
      if (ingredientes && Array.isArray(ingredientes)) {
        try {
          // Eliminar ingredientes antiguos
          await connection.query('DELETE FROM ingredientes_receta WHERE id_receta = ?', [id]);
          
          // Insertar nuevos ingredientes
          if (ingredientes.length > 0) {
            for (const ingrediente of ingredientes) {
              const { nombre_ingrediente, cantidad, unidad: unidadIngrediente } = ingrediente;
              
              if (nombre_ingrediente && cantidad !== undefined && unidadIngrediente) {
                await connection.query(
                  'INSERT INTO ingredientes_receta (id_receta, nombre_ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)',
                  [id, nombre_ingrediente, cantidad, unidadIngrediente]
                );
              }
            }
          }
        } catch (err) {
          // Si la tabla no existe, hacer rollback y retornar error
          if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
            await connection.rollback();
            return res.status(500).json({ 
              error: 'La tabla ingredientes_receta no existe en la base de datos. Por favor, créala primero.' 
            });
          }
          throw err; // Re-lanzar si es otro tipo de error
        }
      }

      await connection.commit();
      res.json({ mensaje: 'Receta actualizada correctamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar receta:', error);
      res.status(500).json({ error: 'Error al actualizar receta: ' + error.message });
    } finally {
      connection.release();
    }
  }

  // Eliminar receta
  async eliminarReceta(req, res) {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar si hay producciones que usan esta receta
      const [producciones] = await connection.query(
        'SELECT COUNT(*) as total FROM producciones WHERE id_receta = ?',
        [id]
      );

      if (producciones.length > 0 && producciones[0].total > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede eliminar esta receta porque está siendo utilizada en ${producciones[0].total} producción(es). Primero debes eliminar las producciones asociadas o cambiar el estado de la receta a "inactiva".` 
        });
      }

      // Intentar eliminar ingredientes primero (si la tabla existe)
      try {
        await connection.query('DELETE FROM ingredientes_receta WHERE id_receta = ?', [id]);
      } catch (err) {
        // Si la tabla no existe, continuar sin error
        if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
          console.log('⚠️ Tabla ingredientes_receta no existe, continuando sin eliminar ingredientes');
        } else {
          throw err; // Re-lanzar si es otro tipo de error
        }
      }
      
      // Eliminar la receta
      await connection.query('DELETE FROM recetas WHERE id_receta = ?', [id]);

      await connection.commit();
      res.json({ mensaje: 'Receta eliminada correctamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al eliminar receta:', error);
      
      // Manejar errores de foreign key constraint
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED' || error.message.includes('foreign key constraint')) {
        return res.status(400).json({ 
          error: 'No se puede eliminar esta receta porque está siendo utilizada en otras partes del sistema (producciones). Primero debes eliminar las producciones asociadas o cambiar el estado de la receta a "inactiva".' 
        });
      }
      
      res.status(500).json({ error: 'Error al eliminar receta: ' + error.message });
    } finally {
      connection.release();
    }
  }

  // Obtener ingredientes de una receta
  async obtenerIngredientesReceta(req, res) {
    const { id } = req.params;
    try {
      const [ingredientes] = await db.query(
        `SELECT id_ingrediente, id_receta, nombre_ingrediente, cantidad, unidad
         FROM ingredientes_receta
         WHERE id_receta = ?
         ORDER BY id_ingrediente ASC`,
        [id]
      );

      res.json(ingredientes);
    } catch (error) {
      // Si la tabla no existe, retornar array vacío
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
        console.log('⚠️ Tabla ingredientes_receta no existe, retornando array vacío');
        return res.json([]);
      }
      console.error('Error al obtener ingredientes:', error);
      res.status(500).json({ error: 'Error al obtener ingredientes de la receta' });
    }
  }
}

module.exports = RecetasController;




