const db = require('../config/conexion_db');

class NotificacionesClienteController {
  // Obtener notificaciones de un cliente por teléfono o email
  async obtenerNotificacionesCliente(req, res) {
    try {
      const { telefono, email, id_cliente } = req.query;
      
      let query = `
        SELECT 
          id_notificacion_cliente,
          id_pedido,
          id_cliente,
          telefono_cliente,
          email_cliente,
          titulo,
          mensaje,
          tipo,
          leida,
          fecha_creacion,
          fecha_lectura
        FROM notificaciones_cliente
        WHERE 1=1
      `;
      
      const params = [];
      
      if (id_cliente) {
        query += ' AND id_cliente = ?';
        params.push(id_cliente);
      } else if (telefono) {
        query += ' AND telefono_cliente = ?';
        params.push(telefono);
      } else if (email) {
        query += ' AND email_cliente = ?';
        params.push(email);
      } else {
        return res.status(400).json({ error: 'Debe proporcionar telefono, email o id_cliente' });
      }
      
      query += ' ORDER BY fecha_creacion DESC LIMIT 50';
      
      const [notificaciones] = await db.query(query, params);
      
      res.json(notificaciones || []);
    } catch (error) {
      console.error('Error al obtener notificaciones del cliente:', error);
      res.status(500).json({ error: 'Error al obtener notificaciones', detalles: error.message });
    }
  }

  // Obtener notificaciones no leídas de un cliente
  async obtenerNotificacionesNoLeidas(req, res) {
    try {
      const { telefono, email, id_cliente } = req.query;
      
      console.log('🔍 Buscando notificaciones no leídas con:', { telefono, email, id_cliente });
      
      let query = `
        SELECT 
          id_notificacion_cliente,
          id_pedido,
          id_cliente,
          telefono_cliente,
          email_cliente,
          titulo,
          mensaje,
          tipo,
          leida,
          fecha_creacion,
          fecha_lectura
        FROM notificaciones_cliente
        WHERE leida = 0
      `;
      
      const params = [];
      
      if (id_cliente) {
        query += ' AND id_cliente = ?';
        params.push(id_cliente);
        console.log('   Buscando por id_cliente:', id_cliente);
      } else if (telefono) {
        // Normalizar teléfono: remover espacios, guiones, paréntesis, pero mantener el +
        let telefonoNormalizado = telefono.replace(/[\s\-\(\)]/g, '');
        // Si no tiene + al inicio y empieza con 57, agregarlo
        if (!telefonoNormalizado.startsWith('+') && telefonoNormalizado.startsWith('57')) {
          telefonoNormalizado = '+' + telefonoNormalizado;
        }
        // Buscar con múltiples variaciones del teléfono
        query += ` AND (
          telefono_cliente = ? OR 
          telefono_cliente = ? OR 
          REPLACE(REPLACE(REPLACE(REPLACE(telefono_cliente, ' ', ''), '-', ''), '(', ''), ')', '') = ? OR
          REPLACE(REPLACE(REPLACE(REPLACE(telefono_cliente, ' ', ''), '-', ''), '(', ''), ')', '') = ?
        )`;
        params.push(telefono, telefonoNormalizado, telefono.replace(/[\s\-\(\)]/g, ''), telefonoNormalizado);
        console.log('   Buscando por teléfono:', telefono, '(normalizado:', telefonoNormalizado + ')');
      } else if (email) {
        query += ' AND email_cliente = ?';
        params.push(email);
        console.log('   Buscando por email:', email);
      } else {
        return res.status(400).json({ error: 'Debe proporcionar telefono, email o id_cliente' });
      }
      
      query += ' ORDER BY fecha_creacion DESC';
      
      console.log('   Query SQL:', query);
      console.log('   Parámetros:', params);
      
      const [notificaciones] = await db.query(query, params);
      
      console.log(`✅ Se encontraron ${notificaciones.length} notificaciones no leídas`);
      if (notificaciones.length > 0) {
        console.log('   Notificaciones:', notificaciones.map(n => ({ id: n.id_notificacion_cliente, titulo: n.titulo, telefono: n.telefono_cliente })));
      }
      
      res.json(notificaciones || []);
    } catch (error) {
      console.error('❌ Error al obtener notificaciones no leídas:', error);
      res.status(500).json({ error: 'Error al obtener notificaciones', detalles: error.message });
    }
  }

  // Marcar notificación como leída
  async marcarComoLeida(req, res) {
    const { id } = req.params;
    
    try {
      await db.query(
        'UPDATE notificaciones_cliente SET leida = 1, fecha_lectura = NOW() WHERE id_notificacion_cliente = ?',
        [id]
      );
      
      res.json({ mensaje: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      res.status(500).json({ error: 'Error al marcar notificación', detalles: error.message });
    }
  }

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(req, res) {
    const { telefono, email, id_cliente } = req.body;
    
    try {
      let query = 'UPDATE notificaciones_cliente SET leida = 1, fecha_lectura = NOW() WHERE leida = 0';
      const params = [];
      
      if (id_cliente) {
        query += ' AND id_cliente = ?';
        params.push(id_cliente);
      } else if (telefono) {
        query += ' AND telefono_cliente = ?';
        params.push(telefono);
      } else if (email) {
        query += ' AND email_cliente = ?';
        params.push(email);
      } else {
        return res.status(400).json({ error: 'Debe proporcionar telefono, email o id_cliente' });
      }
      
      await db.query(query, params);
      
      res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      res.status(500).json({ error: 'Error al marcar notificaciones', detalles: error.message });
    }
  }

  // Obtener contador de notificaciones no leídas
  async obtenerContadorNoLeidas(req, res) {
    try {
      const { telefono, email, id_cliente } = req.query;
      
      let query = 'SELECT COUNT(*) as total FROM notificaciones_cliente WHERE leida = 0';
      const params = [];
      
      if (id_cliente) {
        query += ' AND id_cliente = ?';
        params.push(id_cliente);
      } else if (telefono) {
        query += ' AND telefono_cliente = ?';
        params.push(telefono);
      } else if (email) {
        query += ' AND email_cliente = ?';
        params.push(email);
      } else {
        return res.status(400).json({ error: 'Debe proporcionar telefono, email o id_cliente' });
      }
      
      const [resultado] = await db.query(query, params);
      
      res.json({ total: resultado[0].total || 0 });
    } catch (error) {
      console.error('Error al obtener contador:', error);
      res.status(500).json({ error: 'Error al obtener contador', detalles: error.message });
    }
  }
}

module.exports = NotificacionesClienteController;

