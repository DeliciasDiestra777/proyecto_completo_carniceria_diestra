const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');

class ClientesController {
  // Obtener todos los clientes
  async obtenerClientes(req, res) {
    try {
      const [clientes] = await db.query(
        `SELECT 
          id_cliente,
          nombre_cliente,
          apellido_cliente,
          tipo_documento,
          numero_documento,
          telefono,
          direccion,
          email,
          fecha_registro,
          estado
        FROM clientes 
        ORDER BY fecha_registro DESC`
      );

      res.json(clientes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  }

  // Obtener cliente por ID
  async obtenerClientePorId(req, res) {
    const { id } = req.params;
    try {
      const [cliente] = await db.query(
        `SELECT 
          id_cliente,
          nombre_cliente,
          apellido_cliente,
          tipo_documento,
          numero_documento,
          telefono,
          direccion,
          email,
          fecha_registro,
          estado
        FROM clientes 
        WHERE id_cliente = ?`,
        [id]
      );

      if (cliente.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(cliente[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  }

  // Obtener cliente por email
  async obtenerClientePorEmail(req, res) {
    const { email } = req.params;
    try {
      const [cliente] = await db.query(
        `SELECT 
          id_cliente,
          nombre_cliente,
          apellido_cliente,
          tipo_documento,
          numero_documento,
          telefono,
          direccion,
          email,
          fecha_registro,
          estado
        FROM clientes 
        WHERE email = ?`,
        [email]
      );

      if (cliente.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(cliente[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  }

  // Agregar un cliente nuevo
  async agregarCliente(req, res) {
    const { nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, clave } = req.body;
    try {
      // Verificar si la combinación tipo_documento + numero_documento ya existe
      const [documentosExistentes] = await db.query(
        'SELECT id_cliente FROM clientes WHERE tipo_documento = ? AND numero_documento = ?', 
        [tipo_documento, numero_documento]
      );
      if (documentosExistentes.length > 0) {
        return res.status(400).json({ 
          error: 'El número de documento ya está registrado',
          campo: 'numero_documento',
          mensaje: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado. Por favor, verifica el campo "Número de documento" e intenta con otro número.`
        });
      }

      // Verificar si el email ya existe
      const [emailsExistentes] = await db.query('SELECT id_cliente FROM clientes WHERE email = ?', [email]);
      if (emailsExistentes.length > 0) {
        return res.status(400).json({ 
          error: 'El correo electrónico ya está registrado',
          campo: 'email',
          mensaje: `El correo electrónico ${email} ya está registrado. Por favor, verifica el campo "Correo electrónico" e intenta con otro correo o inicia sesión.`
        });
      }

      // Verificar si el teléfono ya existe (si se proporciona)
      if (telefono && telefono.trim() !== '') {
        const [telefonosExistentes] = await db.query('SELECT id_cliente FROM clientes WHERE telefono = ?', [telefono]);
        if (telefonosExistentes.length > 0) {
          return res.status(400).json({ 
            error: 'El teléfono ya está registrado',
            campo: 'telefono',
            mensaje: `El teléfono ${telefono} ya está registrado. Por favor, verifica el campo "Teléfono" e intenta con otro número.`
          });
        }
      }

      // Cifrar clave
      const hash = await bcrypt.hash(clave, 10);

      await db.query(
        'INSERT INTO clientes (nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, clave) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, hash]
      );
      res.json({ mensaje: 'Cliente agregado correctamente' });
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        // Detectar qué campo está duplicado
        if (error.sqlMessage && (error.sqlMessage.includes('numero_documento') || error.sqlMessage.includes('uk_cliente_documento'))) {
          // Si hay un error de UNIQUE en numero_documento, verificar si es por tipo_documento también
          const [docExistente] = await db.query(
            'SELECT tipo_documento FROM clientes WHERE numero_documento = ? LIMIT 1', 
            [numero_documento]
          );
          if (docExistente.length > 0) {
            return res.status(400).json({ 
              error: 'El número de documento ya está registrado',
              campo: 'numero_documento',
              mensaje: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado. Por favor, verifica el campo "Número de documento" e intenta con otro número.`
            });
          }
          return res.status(400).json({ 
            error: 'El número de documento ya está registrado',
            campo: 'numero_documento',
            mensaje: 'El número de documento ya está registrado. Por favor, verifica el campo "Número de documento" e intenta con otro número.'
          });
        }
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ 
            error: 'El correo electrónico ya está registrado',
            campo: 'email',
            mensaje: `El correo electrónico ya está registrado. Por favor, verifica el campo "Correo electrónico" e intenta con otro correo o inicia sesión.`
          });
        }
        if (error.sqlMessage && error.sqlMessage.includes('telefono')) {
          return res.status(400).json({ 
            error: 'El teléfono ya está registrado',
            campo: 'telefono',
            mensaje: `El teléfono ya está registrado. Por favor, verifica el campo "Teléfono" e intenta con otro número.`
          });
        }
        return res.status(400).json({ 
          error: 'Ya existe un registro con estos datos',
          campo: 'general',
          mensaje: 'Ya existe un registro con estos datos. Por favor, verifica los campos y asegúrate de que no estén duplicados.'
        });
      }
      
      res.status(500).json({ error: 'Error al agregar cliente' });
    }
  }

  // Actualizar cliente (opcionalmente cambiar clave)
  async actualizarCliente(req, res) {
    const { id } = req.params;
    const { nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, clave, estado } = req.body;
    try {
      // Verificar si la combinación tipo_documento + numero_documento ya existe en otro cliente
      const [documentosExistentes] = await db.query(
        'SELECT id_cliente FROM clientes WHERE tipo_documento = ? AND numero_documento = ? AND id_cliente != ?', 
        [tipo_documento, numero_documento, id]
      );
      if (documentosExistentes.length > 0) {
        return res.status(400).json({ error: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado` });
      }

      // Verificar si el email ya existe en otro cliente
      const [emailsExistentes] = await db.query('SELECT id_cliente FROM clientes WHERE email = ? AND id_cliente != ?', [email, id]);
      if (emailsExistentes.length > 0) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      }

      if (clave && clave.trim() !== '') {
        const hash = await bcrypt.hash(clave, 10);
        await db.query(
          'UPDATE clientes SET nombre_cliente = ?, apellido_cliente = ?, tipo_documento = ?, numero_documento = ?, telefono = ?, direccion = ?, email = ?, clave = ?, estado = ? WHERE id_cliente = ?',
          [nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, hash, estado, id]
        );
      } else {
        await db.query(
          'UPDATE clientes SET nombre_cliente = ?, apellido_cliente = ?, tipo_documento = ?, numero_documento = ?, telefono = ?, direccion = ?, email = ?, estado = ? WHERE id_cliente = ?',
          [nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, estado, id]
        );
      }
      res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('numero_documento')) {
          // Si hay un error de UNIQUE en numero_documento, verificar si es por tipo_documento también
          const [docExistente] = await db.query(
            'SELECT tipo_documento FROM clientes WHERE numero_documento = ? AND id_cliente != ? LIMIT 1', 
            [numero_documento, id]
          );
          if (docExistente.length > 0) {
            return res.status(400).json({ 
              error: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado` 
            });
          }
          return res.status(400).json({ error: 'El número de documento ya está registrado' });
        }
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  }

  // Eliminar cliente
  async eliminarCliente(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
      res.json({ mensaje: 'Cliente eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }
}

module.exports = ClientesController;