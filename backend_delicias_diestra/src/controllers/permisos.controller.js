const db = require("../config/conexion_db");

class PermisosController {
  async obtenerPermisos(req, res) {
    try {
      const [permisos] = await db.query("SELECT * FROM permisos");
      res.json(permisos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener permisos" });
    }
  }

  async obtenerPermisoPorId(req, res) {
    const { id } = req.params;
    try {
      const [permiso] = await db.query(
        "SELECT * FROM permisos WHERE id_permiso = ?",
        [id]
      );
      if (permiso.length === 0) {
        return res.status(404).json({ error: "Permiso no encontrado" });
      }
      res.json(permiso[0]);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener permiso" });
    }
  }

  async agregarPermiso(req, res) {
    const { nombre_permiso, descripcion } = req.body;
    try {
      const [result] = await db.query(
        "INSERT INTO permisos (nombre_permiso, descripcion) VALUES (?, ?)",
        [nombre_permiso, descripcion]
      );
      
      const idPermiso = result.insertId;
      console.log(`Permiso creado: ${nombre_permiso} con ID: ${idPermiso}`);
      console.log('Result completo:', result);
      
      const respuesta = { 
        mensaje: "Permiso agregado correctamente",
        id_permiso: idPermiso 
      };
      
      console.log('Respuesta a enviar:', respuesta);
      res.json(respuesta);
    } catch (error) {
      console.error('Error al agregar permiso:', error);
      res.status(500).json({ error: "Error al agregar permiso", detalle: error.message });
    }
  }

  async actualizarPermiso(req, res) {
    const { id } = req.params;
    const { nombre_permiso, descripcion } = req.body;
    try {
      await db.query(
        "UPDATE permisos SET nombre_permiso = ?, descripcion = ? WHERE id_permiso = ?",
        [nombre_permiso, descripcion, id]
      );
      res.json({ mensaje: "Permiso actualizado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar permiso" });
    }
  }

  async eliminarPermiso(req, res) {
    const { id } = req.params;
    try {
      await db.query("DELETE FROM permisos WHERE id_permiso = ?", [id]);
      res.json({ mensaje: "Permiso eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar permiso" });
    }
  }
}

module.exports = PermisosController;
