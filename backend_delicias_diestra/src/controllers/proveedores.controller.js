const db = require('../config/conexion_db');

class ProveedoresController {
  // Obtener todos los proveedores con información del usuario
  async obtenerProveedores(req, res) {
    try {
      const [proveedores] = await db.query(
        `SELECT p.id_proveedor, p.id_usuario, u.nombre_usuario AS nombre_usuario,
          p.nombre_proveedor, p.telefono, p.email, p.direccion, p.ciudad,
          p.estado, p.metodo_pago, p.tiempo_entrega_dias, p.observaciones
        FROM proveedores p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        ORDER BY p.id_proveedor`
      );

      res.json(proveedores);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  }

  // Obtener proveedor por ID
  async obtenerProveedorPorId(req, res) {
    const { id } = req.params;
    try {
      const [proveedor] = await db.query(
        `SELECT p.id_proveedor, p.id_usuario, u.nombre_usuario AS nombre_usuario,
          p.nombre_proveedor, p.telefono, p.email, p.direccion, p.ciudad,
          p.estado, p.metodo_pago, p.tiempo_entrega_dias, p.observaciones
        FROM proveedores p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.id_proveedor = ?`,
        [id]
      );

      if (proveedor.length === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.json(proveedor[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener proveedor' });
    }
  }

  // Agregar un proveedor nuevo
  async agregarProveedor(req, res) {
    const { id_usuario, nombre_proveedor, telefono, email, direccion, ciudad, estado, metodo_pago, tiempo_entrega_dias, observaciones } = req.body;
    try {
      // Verificar si el email ya existe (si se proporciona)
      if (email) {
        const [emailsExistentes] = await db.query('SELECT id_proveedor FROM proveedores WHERE email = ?', [email]);
        if (emailsExistentes.length > 0) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
      }

      await db.query(
        'INSERT INTO proveedores (id_usuario, nombre_proveedor, telefono, email, direccion, ciudad, estado, metodo_pago, tiempo_entrega_dias, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id_usuario, nombre_proveedor, telefono, email, direccion, ciudad, estado, metodo_pago, tiempo_entrega_dias, observaciones]
      );
      res.json({ mensaje: 'Proveedor agregado correctamente' });
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error al agregar proveedor' });
    }
  }

  // Actualizar proveedor
  async actualizarProveedor(req, res) {
    const { id } = req.params;
    const { id_usuario, nombre_proveedor, telefono, email, direccion, ciudad, estado, metodo_pago, tiempo_entrega_dias, observaciones } = req.body;
    try {
      // Verificar si el email ya existe en otro proveedor (si se proporciona)
      if (email) {
        const [emailsExistentes] = await db.query('SELECT id_proveedor FROM proveedores WHERE email = ? AND id_proveedor != ?', [email, id]);
        if (emailsExistentes.length > 0) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
      }

      await db.query(
        'UPDATE proveedores SET id_usuario = ?, nombre_proveedor = ?, telefono = ?, email = ?, direccion = ?, ciudad = ?, estado = ?, metodo_pago = ?, tiempo_entrega_dias = ?, observaciones = ? WHERE id_proveedor = ?',
        [id_usuario, nombre_proveedor, telefono, email, direccion, ciudad, estado, metodo_pago, tiempo_entrega_dias, observaciones, id]
      );
      res.json({ mensaje: 'Proveedor actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
  }

  // Eliminar proveedor
  async eliminarProveedor(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM proveedores WHERE id_proveedor = ?', [id]);
      res.json({ mensaje: 'Proveedor eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
}

module.exports = ProveedoresController;

