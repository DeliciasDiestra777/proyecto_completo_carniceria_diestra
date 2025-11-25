const db = require('../config/conexion_db');

class RolesController {
async obtenerRoles(req, res) {
  try {
    const [roles] = await db.query(`
      SELECT r.id_rol, r.nombre_rol, 
      COUNT(u.id_usuario) AS cantidad_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON u.id_rol = r.id_rol
      GROUP BY r.id_rol, r.nombre_rol
    `);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
}


async obtenerRolPorId(req, res) {
  const { id } = req.params;
  try {
    const [rolRows] = await db.query('SELECT * FROM roles WHERE id_rol = ?', [id]);

    if (rolRows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    const rol = rolRows[0];

    // Traemos los permisos de ese rol
    const [permisos] = await db.query(
        `SELECT p.id_permiso, p.nombre_permiso 
        FROM rol_permiso rp
        JOIN permisos p ON rp.permiso_id = p.id_permiso
        WHERE rp.id_rol = ?`,
      [rol.id_rol]
    );

    rol.permisos = permisos.map(p => ({ id: p.id_permiso, nombre: p.nombre_permiso }));

    res.json(rol);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rol con permisos' });
  }
}


  async agregarRol(req, res) {
    const { nombre_rol, permisos } = req.body; // permisos: [1, 2, 3]
    
    // Validar que nombre_rol esté presente
    if (!nombre_rol || nombre_rol.trim() === '') {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insertamos el rol
      const [result] = await connection.query(
        'INSERT INTO roles (nombre_rol) VALUES (?)',
        [nombre_rol.trim()]
      );
      const idRol = result.insertId;

      // Insertamos los permisos
      if (permisos && Array.isArray(permisos) && permisos.length > 0) {
        // Asegurar que los permisos sean números enteros
        const values = permisos
          .map(id_permiso => parseInt(id_permiso))
          .filter(id => !isNaN(id) && id > 0)
          .map(id_permiso => [idRol, id_permiso]);
        
        if (values.length > 0) {
          await connection.query(
            'INSERT INTO rol_permiso (id_rol, permiso_id) VALUES ?',
            [values]
          );
        }
      }

      await connection.commit();
      res.json({ mensaje: 'Rol agregado correctamente', id_rol: idRol });
    } catch (error) {
      await connection.rollback();
      console.error('Error al agregar rol:', error);
      res.status(500).json({ 
        error: 'Error al agregar rol con permisos',
        detalle: error.message 
      });
    } finally {
      connection.release();
    }
  }


async actualizarRol(req, res) {
  const { id } = req.params;
  const { nombre_rol, permisos } = req.body;
  const connection = await db.getConnection();
  try {
    // Prevenir modificación del nombre del rol de administrador (ID 1)
    if (parseInt(id) === 1) {
      // Permitir actualizar permisos pero no el nombre
      const [rolActual] = await connection.query('SELECT nombre_rol FROM roles WHERE id_rol = ?', [id]);
      if (rolActual.length > 0 && nombre_rol && nombre_rol.toLowerCase() !== rolActual[0].nombre_rol.toLowerCase()) {
        return res.status(400).json({ error: 'No se puede modificar el nombre del rol de Administrador' });
      }
    }

    await connection.beginTransaction();

    // Actualizamos el nombre (solo si no es el rol de administrador o si el nombre no cambió)
    if (parseInt(id) !== 1 || !nombre_rol) {
      await connection.query(
        'UPDATE roles SET nombre_rol = ? WHERE id_rol = ?',
        [nombre_rol, id]
      );
    }

    // Para el rol de administrador, no modificamos los permisos (siempre tiene todos)
    if (parseInt(id) === 1) {
      await connection.commit();
      return res.json({ mensaje: 'Rol actualizado correctamente (el rol Administrador siempre tiene todos los permisos)' });
    }

    // Borramos permisos anteriores
    await connection.query('DELETE FROM rol_permiso WHERE id_rol = ?', [id]);

    // Insertamos los nuevos permisos
    if (permisos && permisos.length > 0) {
      const values = permisos.map(id_permiso => [id, id_permiso]);
      await connection.query(
        'INSERT INTO rol_permiso (id_rol, permiso_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error al actualizar rol con permisos' });
  } finally {
    connection.release();
  }
}


async eliminarRol(req, res) {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    // Prevenir eliminación del rol de administrador (ID 1)
    if (parseInt(id) === 1) {
      return res.status(400).json({ error: 'No se puede eliminar el rol de Administrador' });
    }

    await connection.beginTransaction();

    // Verificar si hay usuarios con este rol
    const [usuarios] = await connection.query('SELECT COUNT(*) as count FROM usuarios WHERE id_rol = ?', [id]);
    if (usuarios[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados' });
    }

    // Eliminar permisos asociados
    await connection.query('DELETE FROM rol_permiso WHERE id_rol = ?', [id]);

    // Eliminar rol
    await connection.query('DELETE FROM roles WHERE id_rol = ?', [id]);

    await connection.commit();
    res.json({ mensaje: 'Rol eliminado correctamente' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error al eliminar rol' });
  } finally {
    connection.release();
  }
}

}

module.exports = RolesController;
