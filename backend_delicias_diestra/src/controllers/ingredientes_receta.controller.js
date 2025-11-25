const db = require('../config/conexion_db');

class IngredientesRecetaController {
  // Obtener todos los ingredientes de recetas
  async obtenerIngredientesReceta(req, res) {
    try {
      const [ingredientes] = await db.query(
        `SELECT ir.id_ingrediente, ir.id_receta, r.nombre AS nombre_receta,
          ir.nombre_ingrediente, ir.cantidad, ir.unidad
        FROM ingredientes_receta ir
        LEFT JOIN recetas r ON ir.id_receta = r.id_receta
        ORDER BY ir.id_ingrediente DESC`
      );

      res.json(ingredientes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener ingredientes de recetas' });
    }
  }

  // Obtener ingrediente de receta por ID
  async obtenerIngredienteRecetaPorId(req, res) {
    const { id } = req.params;
    try {
      const [ingrediente] = await db.query(
        `SELECT ir.id_ingrediente, ir.id_receta, r.nombre AS nombre_receta,
          ir.nombre_ingrediente, ir.cantidad, ir.unidad
        FROM ingredientes_receta ir
        LEFT JOIN recetas r ON ir.id_receta = r.id_receta
        WHERE ir.id_ingrediente = ?`,
        [id]
      );

      if (ingrediente.length === 0) {
        return res.status(404).json({ error: 'Ingrediente de receta no encontrado' });
      }

      res.json(ingrediente[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener ingrediente de receta' });
    }
  }

  // Agregar un ingrediente de receta nuevo
  async agregarIngredienteReceta(req, res) {
    const { id_receta, nombre_ingrediente, cantidad, unidad } = req.body;
    try {
      await db.query(
        'INSERT INTO ingredientes_receta (id_receta, nombre_ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)',
        [id_receta, nombre_ingrediente, cantidad, unidad]
      );
      res.json({ mensaje: 'Ingrediente de receta agregado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar ingrediente de receta' });
    }
  }

  // Actualizar ingrediente de receta
  async actualizarIngredienteReceta(req, res) {
    const { id } = req.params;
    const { id_receta, nombre_ingrediente, cantidad, unidad } = req.body;
    try {
      await db.query(
        'UPDATE ingredientes_receta SET id_receta = ?, nombre_ingrediente = ?, cantidad = ?, unidad = ? WHERE id_ingrediente = ?',
        [id_receta, nombre_ingrediente, cantidad, unidad, id]
      );
      res.json({ mensaje: 'Ingrediente de receta actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar ingrediente de receta' });
    }
  }

  // Eliminar ingrediente de receta
  async eliminarIngredienteReceta(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM ingredientes_receta WHERE id_ingrediente = ?', [id]);
      res.json({ mensaje: 'Ingrediente de receta eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar ingrediente de receta' });
    }
  }
}

module.exports = IngredientesRecetaController;




