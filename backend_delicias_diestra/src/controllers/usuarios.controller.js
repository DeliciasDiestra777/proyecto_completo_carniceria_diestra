const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');

class UsuariosController {
  // Obtener todos los usuarios con su rol
async obtenerUsuarios(req, res) {
  try {
    const [usuarios] = await db.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.email, u.id_rol, r.nombre_rol AS rol,
        COALESCE(GROUP_CONCAT(p.nombre_permiso ORDER BY p.id_permiso SEPARATOR ', '), 'Sin permisos') AS permisos
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN rol_permiso rp ON r.id_rol = rp.id_rol
    LEFT JOIN permisos p ON rp.permiso_id = p.id_permiso
    GROUP BY u.id_usuario, u.nombre_usuario, u.email, u.id_rol, r.nombre_rol`
    );

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

async obtenerUsuarioPorId(req, res) {
  const { id } = req.params;
  try {
    const [usuario] = await db.query(
      `SELECT 
          u.id_usuario,
          u.nombre_usuario,
          u.email,
          r.nombre_rol AS rol,
          COALESCE(GROUP_CONCAT(p.nombre_permiso SEPARATOR ', '), 'Sin permisos') AS permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        LEFT JOIN rol_permiso rp ON r.id_rol = rp.id_rol
        LEFT JOIN permisos p ON rp.permiso_id = p.id_permiso
        WHERE u.id_usuario = ?
        GROUP BY u.id_usuario, u.nombre_usuario, u.email, r.nombre_rol`,
      [id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

// Agregar un usuario nuevo
  async agregarUsuario(req, res) {
    const { nombre_usuario, email, clave, id_rol } = req.body;
    try {
      // Verificar si el email ya existe
      const [emailsExistentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
      if (emailsExistentes.length > 0) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      }

      // Cifrar clave
      const hash = await bcrypt.hash(clave, 10);

      await db.query(
        'INSERT INTO usuarios (nombre_usuario, email, clave, id_rol) VALUES (?, ?, ?, ?)',
        [nombre_usuario, email, hash, id_rol]
      );
      res.json({ mensaje: 'Usuario agregado correctamente' });
    } catch (error) {
      console.error('Error al agregar usuario:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error al agregar usuario' });
    }
  }

  // Actualizar usuario (opcionalmente cambiar clave)
  async actualizarUsuario(req, res) {
    const { id } = req.params;
    const { nombre_usuario, email, clave, id_rol } = req.body;
    try {
      // Verificar si el email ya existe en otro usuario
      const [emailsExistentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?', [email, id]);
      if (emailsExistentes.length > 0) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      }

      if (clave && clave.trim() !== '') {
        const hash = await bcrypt.hash(clave, 10);
        await db.query(
          'UPDATE usuarios SET nombre_usuario = ?, email = ?, clave = ?, id_rol = ? WHERE id_usuario = ?',
          [nombre_usuario, email, hash, id_rol, id]
        );
      } else {
        await db.query(
          'UPDATE usuarios SET nombre_usuario = ?, email = ?, id_rol = ? WHERE id_usuario = ?',
          [nombre_usuario, email, id_rol, id]
        );
      }
      res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  // Eliminar usuario
  async eliminarUsuario(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
      res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
}

module.exports = UsuariosController;
