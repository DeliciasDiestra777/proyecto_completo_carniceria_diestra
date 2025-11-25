const db = require('../config/conexion_db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      let usuario = null;
      let tipoUsuario = null;
      let rolDatos = [];
      let token = null;

      // Buscar primero en usuarios (administrativos)
      const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      
      if (usuarios.length > 0) {
        // Usuario administrativo encontrado
        usuario = usuarios[0];
        tipoUsuario = 'administrativo';

        // Verificar contraseña con bcrypt
        const esValida = await bcrypt.compare(password, usuario.clave);
        if (!esValida) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Obtener rol y permisos del usuario
        [rolDatos] = await db.query(
          `SELECT r.nombre_rol AS rol, p.nombre_permiso AS permiso
          FROM roles r
          JOIN rol_permiso rp ON r.id_rol = rp.id_rol
          JOIN permisos p ON rp.permiso_id = p.id_permiso
          WHERE r.id_rol = ?`,
          [usuario.id_rol]
        );

        // Generar JWT para usuario administrativo
        token = jwt.sign(
          { 
            id: usuario.id_usuario, 
            rol: usuario.id_rol,
            tipo: 'administrativo'
          },
          process.env.JWT_SECRET || 'secreto_super_seguro',
          { expiresIn: '2h' }
        );

        return res.json({
          mensaje: 'Inicio de sesión exitoso',
          token,
          usuario: {
            id: usuario.id_usuario,
            nombre: usuario.nombre_usuario,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            tipo: 'administrativo',
            id_rol: usuario.id_rol,
            rol: rolDatos[0]?.rol || 'Sin rol',
            permisos: rolDatos.map(p => p.permiso)
          }
        });

      } else {
        // Buscar en clientes
        const [clientes] = await db.query('SELECT * FROM clientes WHERE email = ?', [email]);
        
        if (clientes.length === 0) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Cliente encontrado
        usuario = clientes[0];
        tipoUsuario = 'cliente';

        // Verificar estado del cliente
        if (usuario.estado === 'inactivo') {
          return res.status(401).json({ error: 'Cuenta inactiva. Contacte al administrador' });
        }

        // Verificar contraseña con bcrypt
        const esValida = await bcrypt.compare(password, usuario.clave);
        if (!esValida) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar JWT para cliente
        token = jwt.sign(
          { 
            id: usuario.id_cliente, 
            tipo: 'cliente'
          },
          process.env.JWT_SECRET || 'secreto_super_seguro',
          { expiresIn: '2h' }
        );

        return res.json({
          mensaje: 'Inicio de sesión exitoso',
          token,
          usuario: {
            id: usuario.id_cliente,
            nombre: usuario.nombre_cliente,
            nombre_cliente: usuario.nombre_cliente,
            apellido: usuario.apellido_cliente,
            apellido_cliente: usuario.apellido_cliente,
            email: usuario.email,
            tipo: 'cliente',
            tipo_documento: usuario.tipo_documento,
            numero_documento: usuario.numero_documento,
            telefono: usuario.telefono,
            direccion: usuario.direccion
          }
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }

  async register(req, res) {
    const { nombre, email, password, telefono, direccion, tipo } = req.body;

    try {
      // Validar datos requeridos
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Encriptar contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      if (tipo === 'cliente') {
        // Registrar como cliente
        const { apellido, tipo_documento, numero_documento } = req.body;
        
        if (!apellido || !tipo_documento || !numero_documento) {
          return res.status(400).json({ error: 'Apellido, tipo de documento y número de documento son requeridos para clientes' });
        }

        // Verificar si el email ya existe en clientes
        const [clientesExistentes] = await db.query('SELECT id_cliente FROM clientes WHERE email = ?', [email]);
        if (clientesExistentes.length > 0) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Verificar si la combinación tipo_documento + numero_documento ya existe
        const [documentosExistentes] = await db.query(
          'SELECT id_cliente FROM clientes WHERE tipo_documento = ? AND numero_documento = ?', 
          [tipo_documento, numero_documento]
        );
        if (documentosExistentes.length > 0) {
          return res.status(400).json({ error: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado` });
        }

        // Insertar cliente
        const [resultado] = await db.query(
          'INSERT INTO clientes (nombre, apellido, tipo_documento, numero_documento, telefono, direccion, email, clave) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [nombre, apellido, tipo_documento, numero_documento, telefono, direccion, email, hashedPassword]
        );

        res.status(201).json({
          mensaje: 'Cliente registrado exitosamente',
          cliente: {
            id: resultado.insertId,
            nombre,
            apellido,
            email,
            tipo_documento,
            numero_documento
          }
        });

      } else {
        // Registrar como usuario administrativo (requiere rol)
        const { id_rol } = req.body;
        
        if (!id_rol) {
          return res.status(400).json({ error: 'ID de rol es requerido para usuarios administrativos' });
        }

        // Verificar si el email ya existe en usuarios
        const [usuariosExistentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Verificar que el rol existe
        const [rolesExistentes] = await db.query('SELECT id_rol FROM roles WHERE id_rol = ?', [id_rol]);
        if (rolesExistentes.length === 0) {
          return res.status(400).json({ error: 'El rol especificado no existe' });
        }

        // Insertar usuario administrativo
        const [resultado] = await db.query(
          'INSERT INTO usuarios (id_rol, nombre, email, clave, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
          [id_rol, nombre, email, hashedPassword, telefono, direccion]
        );

        res.status(201).json({
          mensaje: 'Usuario administrativo registrado exitosamente',
          usuario: {
            id: resultado.insertId,
            nombre,
            email,
            id_rol
          }
        });
      }

    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        // Detectar qué campo está duplicado
        if (error.sqlMessage && error.sqlMessage.includes('numero_documento') || error.sqlMessage.includes('uk_cliente_documento')) {
          const { tipo_documento, numero_documento } = req.body;
          return res.status(400).json({ 
            error: `El número de documento ${numero_documento} con tipo ${tipo_documento} ya está registrado` 
          });
        }
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
        return res.status(400).json({ error: 'Ya existe un registro con estos datos' });
      }
      
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
}

module.exports = new AuthController();
