const db = require('../config/conexion_db');

class CategoriasController {
  // Obtener todas las categorías
  async obtenerCategorias(req, res) {
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'categorias' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      const campoMostrar = tieneCampo ? ', mostrar_en_catalogo' : ', 1 as mostrar_en_catalogo';
      
      const [categorias] = await db.query(`SELECT *${campoMostrar} FROM categorias`);
      res.json(categorias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las categorías' });
    }
  }

  // Obtener categorías del catálogo público (solo las que deben mostrarse)
  async obtenerCategoriasCatalogo(req, res) {
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'categorias' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      const condicionMostrar = tieneCampo ? 'AND mostrar_en_catalogo = 1' : '';
      
      const [categorias] = await db.query(
        `SELECT * FROM categorias 
         WHERE estado = 'activo' ${condicionMostrar}
         ORDER BY orden_visualizacion ASC, nombre_categoria ASC`
      );
      
      res.json(categorias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las categorías del catálogo' });
    }
  }

  // Obtener categoría por ID
  async obtenerCategoriaPorId(req, res) {
    const { id } = req.params;
    try {
      const [categoria] = await db.query('SELECT * FROM categorias WHERE id_categoria = ?', [id]);

      if (categoria.length === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json(categoria[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la categoría' });
    }
  }

  // Agregar nueva categoría
  async agregarCategoria(req, res) {
    const { nombre_categoria, descripcion, mostrar_en_catalogo = true } = req.body;
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'categorias' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      
      if (tieneCampo) {
        await db.query(
          'INSERT INTO categorias (nombre_categoria, descripcion, mostrar_en_catalogo) VALUES (?, ?, ?)',
          [nombre_categoria, descripcion, mostrar_en_catalogo ? 1 : 0]
        );
      } else {
        await db.query(
          'INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)',
          [nombre_categoria, descripcion]
        );
      }
      
      res.json({ mensaje: 'Categoría agregada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar la categoría' });
    }
  }

  // Actualizar categoría
  async actualizarCategoria(req, res) {
    const { id } = req.params;
    const { nombre_categoria, descripcion, mostrar_en_catalogo } = req.body;
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'categorias' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      
      if (tieneCampo && mostrar_en_catalogo !== undefined) {
        await db.query(
          'UPDATE categorias SET nombre_categoria = ?, descripcion = ?, mostrar_en_catalogo = ? WHERE id_categoria = ?',
          [nombre_categoria, descripcion, mostrar_en_catalogo ? 1 : 0, id]
        );
      } else {
        await db.query(
          'UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?',
          [nombre_categoria, descripcion, id]
        );
      }
      
      res.json({ mensaje: 'Categoría actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
  }

  // Eliminar categoría
  async eliminarCategoria(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM categorias WHERE id_categoria = ?', [id]);
      res.json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
  }
}

module.exports = CategoriasController;
