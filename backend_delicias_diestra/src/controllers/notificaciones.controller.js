const db = require('../config/conexion_db');

class NotificacionesController {
  // Obtener todas las notificaciones
  async obtenerNotificaciones(req, res) {
    try {
      const { estado } = req.query;
      
      let query = `
        SELECT 
          n.id_notificacion,
          n.id_pedido,
          n.id_detalle_pedido,
          n.nombre_cliente,
          n.telefono_cliente,
          n.email_cliente,
          n.direccion_cliente,
          n.productos,
          n.total_pedido,
          n.metodo_pago,
          n.estado,
          n.comprobante_verificado,
          n.fecha_creacion,
          n.fecha_actualizacion,
          n.fecha_verificacion,
          n.observaciones
        FROM notificaciones n
      `;
      
      const params = [];
      if (estado) {
        query += ' WHERE n.estado = ?';
        params.push(estado);
      }
      
      query += ' ORDER BY n.fecha_creacion DESC';
      
      const [notificaciones] = await db.query(query, params);
      
      // Parsear JSON fields
      const notificacionesParseadas = notificaciones.map(notif => ({
        ...notif,
        productos: JSON.parse(notif.productos || '[]'),
        id_detalle_pedido: JSON.parse(notif.id_detalle_pedido || '[]')
      }));
      
      res.json(notificacionesParseadas);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({ error: 'Error al obtener notificaciones', detalles: error.message });
    }
  }

  // Obtener notificación por ID
  async obtenerNotificacionPorId(req, res) {
    const { id } = req.params;
    try {
      const [notificaciones] = await db.query(
        `SELECT 
          n.id_notificacion,
          n.id_pedido,
          n.id_detalle_pedido,
          n.nombre_cliente,
          n.telefono_cliente,
          n.email_cliente,
          n.direccion_cliente,
          n.productos,
          n.total_pedido,
          n.metodo_pago,
          n.estado,
          n.comprobante_verificado,
          n.fecha_creacion,
          n.fecha_actualizacion,
          n.fecha_verificacion,
          n.observaciones
        FROM notificaciones n
        WHERE n.id_notificacion = ?`,
        [id]
      );

      if (notificaciones.length === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      const notificacion = notificaciones[0];
      notificacion.productos = JSON.parse(notificacion.productos || '[]');
      notificacion.id_detalle_pedido = JSON.parse(notificacion.id_detalle_pedido || '[]');

      res.json(notificacion);
    } catch (error) {
      console.error('Error al obtener notificación:', error);
      res.status(500).json({ error: 'Error al obtener notificación', detalles: error.message });
    }
  }

  // Crear notificación
  async crearNotificacion(req, res) {
    const {
      id_pedido,
      id_detalle_pedido,
      nombre_cliente,
      telefono_cliente,
      email_cliente,
      direccion_cliente,
      productos,
      total_pedido,
      metodo_pago,
      observaciones
    } = req.body;

    try {
      // Convertir arrays a JSON strings
      const productosJSON = JSON.stringify(Array.isArray(productos) ? productos : []);
      const idDetallePedidoJSON = JSON.stringify(Array.isArray(id_detalle_pedido) ? id_detalle_pedido : [id_detalle_pedido].filter(Boolean));

      const [resultado] = await db.query(
        `INSERT INTO notificaciones 
        (id_pedido, id_detalle_pedido, nombre_cliente, telefono_cliente, email_cliente, 
         direccion_cliente, productos, total_pedido, metodo_pago, estado, observaciones) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
        [
          id_pedido,
          idDetallePedidoJSON,
          nombre_cliente,
          telefono_cliente || null,
          email_cliente || null,
          direccion_cliente || null,
          productosJSON,
          total_pedido,
          metodo_pago || null,
          observaciones || null
        ]
      );

      // Obtener la notificación creada
      const [notificaciones] = await db.query(
        'SELECT * FROM notificaciones WHERE id_notificacion = ?',
        [resultado.insertId]
      );

      const notificacion = notificaciones[0];
      notificacion.productos = JSON.parse(notificacion.productos || '[]');
      notificacion.id_detalle_pedido = JSON.parse(notificacion.id_detalle_pedido || '[]');

      res.status(201).json({
        mensaje: 'Notificación creada correctamente',
        notificacion: notificacion
      });
    } catch (error) {
      console.error('Error al crear notificación:', error);
      res.status(500).json({ error: 'Error al crear notificación', detalles: error.message });
    }
  }

  // Actualizar notificación
  async actualizarNotificacion(req, res) {
    const { id } = req.params;
    const { estado, comprobante_verificado, observaciones } = req.body;

    try {
      // Validar estado
      const estadosValidos = ['pendiente', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido', 
          detalles: `Estado debe ser uno de: ${estadosValidos.join(', ')}` 
        });
      }

      // Construir query dinámicamente
      const updates = [];
      const params = [];

      if (estado) {
        updates.push('estado = ?');
        params.push(estado);
      }

      if (comprobante_verificado !== undefined) {
        updates.push('comprobante_verificado = ?');
        params.push(comprobante_verificado ? 1 : 0);
        
        if (comprobante_verificado) {
          updates.push('fecha_verificacion = NOW()');
          
          // Si se está verificando el comprobante, crear notificación para el cliente
          if (comprobante_verificado) {
            try {
              // Obtener datos de la notificación para crear notificación al cliente
              const [notifData] = await db.query(
                'SELECT id_pedido, nombre_cliente, telefono_cliente, email_cliente FROM notificaciones WHERE id_notificacion = ?',
                [id]
              );
              
              if (notifData.length > 0) {
                const notif = notifData[0];
                
                // Obtener id_cliente desde el pedido
                const [pedidoData] = await db.query(
                  'SELECT id_cliente FROM pedidos WHERE id_pedido = ?',
                  [notif.id_pedido]
                );
                
                const idCliente = pedidoData.length > 0 ? pedidoData[0].id_cliente : null;
                
                // Crear notificación para el cliente
                await db.query(
                  `INSERT INTO notificaciones_cliente 
                   (id_pedido, id_cliente, telefono_cliente, email_cliente, titulo, mensaje, tipo) 
                   VALUES (?, ?, ?, ?, ?, ?, 'success')`,
                  [
                    notif.id_pedido,
                    idCliente,
                    notif.telefono_cliente,
                    notif.email_cliente,
                    'Comprobante Verificado',
                    `¡Hola ${notif.nombre_cliente}! Tu comprobante de pago ha sido verificado exitosamente. Tu pedido está siendo preparado y será entregado aproximadamente en 30-45 minutos. Te notificaremos cuando esté en camino. ¡Gracias por tu compra!`
                  ]
                );
                
                console.log('✅ Notificación para cliente creada al verificar comprobante');
              }
            } catch (error) {
              console.error('Error al crear notificación para cliente:', error);
              // No fallar la operación principal si falla la notificación al cliente
            }
          }
        }
      }

      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        params.push(observaciones);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      updates.push('fecha_actualizacion = NOW()');
      params.push(id);

      await db.query(
        `UPDATE notificaciones SET ${updates.join(', ')} WHERE id_notificacion = ?`,
        params
      );

      // Obtener la notificación actualizada
      const [notificaciones] = await db.query(
        'SELECT * FROM notificaciones WHERE id_notificacion = ?',
        [id]
      );

      if (notificaciones.length === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      const notificacion = notificaciones[0];
      notificacion.productos = JSON.parse(notificacion.productos || '[]');
      notificacion.id_detalle_pedido = JSON.parse(notificacion.id_detalle_pedido || '[]');

      res.json({
        mensaje: 'Notificación actualizada correctamente',
        notificacion: notificacion
      });
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      res.status(500).json({ error: 'Error al actualizar notificación', detalles: error.message });
    }
  }

  // Aceptar pedido y actualizar inventario
  async aceptarPedido(req, res) {
    const { id } = req.params;
    const { observaciones } = req.body;

    try {
      // Obtener la notificación
      const [notificaciones] = await db.query(
        'SELECT * FROM notificaciones WHERE id_notificacion = ?',
        [id]
      );

      if (notificaciones.length === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      const notificacion = notificaciones[0];
      const productos = JSON.parse(notificacion.productos || '[]');
      const idDetallePedido = JSON.parse(notificacion.id_detalle_pedido || '[]');

      // Verificar que el pedido tenga detalles
      if (!productos || productos.length === 0) {
        return res.status(400).json({ error: 'El pedido no tiene productos' });
      }

      // Iniciar transacción
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Actualizar estado de la notificación
        await connection.query(
          `UPDATE notificaciones 
           SET estado = 'en_proceso', 
               comprobante_verificado = 1, 
               fecha_verificacion = NOW(),
               observaciones = ?,
               fecha_actualizacion = NOW()
           WHERE id_notificacion = ?`,
          [observaciones || null, id]
        );

        // Verificar si ya existen detalles de pedido
        const [detallesExistentes] = await connection.query(
          'SELECT id_detalle FROM detalle_pedido WHERE id_pedido = ?',
          [notificacion.id_pedido]
        );
        
        const nuevosIdsDetalle = [];
        if (detallesExistentes.length === 0) {
          // Crear detalles de pedido (esto activará los triggers que actualizan el inventario)
          for (const producto of productos) {
            const [resultadoDetalle] = await connection.query(
              'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, unidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
              [
                notificacion.id_pedido,
                producto.id_producto,
                producto.cantidad,
                producto.unidad || 'lb',
                producto.precio_unitario || 0
              ]
            );
            nuevosIdsDetalle.push(resultadoDetalle.insertId);
          }
          console.log(`✅ ${productos.length} detalles de pedido creados al aceptar pedido`);
          
          // Actualizar la notificación con los IDs de detalle creados
          await connection.query(
            'UPDATE notificaciones SET id_detalle_pedido = ? WHERE id_notificacion = ?',
            [JSON.stringify(nuevosIdsDetalle), id]
          );
        } else {
          // Ya existen detalles, usar los existentes
          nuevosIdsDetalle.push(...detallesExistentes.map(d => d.id_detalle));
        }

        // Actualizar estado del pedido a 'Pagado'
        await connection.query(
          'UPDATE pedidos SET estado = ? WHERE id_pedido = ?',
          ['Pagado', notificacion.id_pedido]
        );
        
        // Crear notificación para el cliente
        try {
          // Obtener id_cliente desde el pedido
          const [pedidoData] = await connection.query(
            'SELECT id_cliente FROM pedidos WHERE id_pedido = ?',
            [notificacion.id_pedido]
          );
          
          const idCliente = pedidoData.length > 0 ? pedidoData[0].id_cliente : null;
          
          // Normalizar teléfono: remover espacios, guiones, paréntesis para consistencia
          const telefonoNormalizado = notificacion.telefono_cliente ? 
            notificacion.telefono_cliente.replace(/[\s\-\(\)]/g, '') : null;
          
          // Crear notificación para el cliente
          await connection.query(
            `INSERT INTO notificaciones_cliente 
             (id_pedido, id_cliente, telefono_cliente, email_cliente, titulo, mensaje, tipo) 
             VALUES (?, ?, ?, ?, ?, ?, 'success')`,
            [
              notificacion.id_pedido,
              idCliente,
              telefonoNormalizado || notificacion.telefono_cliente, // Guardar normalizado si existe
              notificacion.email_cliente,
              'Pedido en Proceso',
              `¡Hola ${notificacion.nombre_cliente}! Tu pedido está siendo preparado. Te notificaremos cuando esté listo para enviar. ¡Gracias por tu compra!`
            ]
          );
          
          console.log('✅ Notificación para cliente creada al aceptar pedido');
          console.log(`   - Teléfono original: ${notificacion.telefono_cliente}`);
          console.log(`   - Teléfono normalizado: ${telefonoNormalizado}`);
          console.log(`   - ID Cliente: ${idCliente}`);
        } catch (error) {
          console.error('Error al crear notificación para cliente:', error);
          // No fallar la operación principal si falla la notificación al cliente
        }

        await connection.commit();
        connection.release();

        // Obtener la notificación actualizada
        const [notificacionesActualizadas] = await db.query(
          'SELECT * FROM notificaciones WHERE id_notificacion = ?',
          [id]
        );

        const notificacionActualizada = notificacionesActualizadas[0];
        notificacionActualizada.productos = JSON.parse(notificacionActualizada.productos || '[]');
        notificacionActualizada.id_detalle_pedido = JSON.parse(notificacionActualizada.id_detalle_pedido || '[]');

        res.json({
          mensaje: 'Pedido aceptado e inventario actualizado correctamente',
          notificacion: notificacionActualizada
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error al aceptar pedido:', error);
      res.status(500).json({ error: 'Error al aceptar pedido', detalles: error.message });
    }
  }

  // Actualizar estado de la notificación y del pedido
  async actualizarEstadoPedido(req, res) {
    const { id } = req.params;
    const { estado, comprobante_verificado, observaciones } = req.body;

    try {
      const estadosValidos = ['pendiente', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido', 
          detalles: `Estado debe ser uno de: ${estadosValidos.join(', ')}` 
        });
      }

      // Obtener la notificación para actualizar también el pedido
      const [notificacionesAntes] = await db.query(
        'SELECT id_pedido FROM notificaciones WHERE id_notificacion = ?',
        [id]
      );

      if (notificacionesAntes.length === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      const id_pedido = notificacionesAntes[0].id_pedido;

      // Iniciar transacción para actualizar notificación y pedido
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Construir query dinámicamente para notificaciones
        const updates = [];
        const params = [];

        if (estado) {
          updates.push('estado = ?');
          params.push(estado);
        }

        if (comprobante_verificado !== undefined) {
          updates.push('comprobante_verificado = ?');
          params.push(comprobante_verificado ? 1 : 0);
          
          if (comprobante_verificado) {
            updates.push('fecha_verificacion = NOW()');
          }
        }

        if (observaciones !== undefined) {
          updates.push('observaciones = ?');
          params.push(observaciones);
        }

        if (updates.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        updates.push('fecha_actualizacion = NOW()');
        params.push(id);

        // Obtener datos de la notificación antes de actualizar (para crear notificación al cliente)
        const [notifDataAntes] = await connection.query(
          'SELECT id_pedido, nombre_cliente, telefono_cliente, email_cliente FROM notificaciones WHERE id_notificacion = ?',
          [id]
        );
        
        // Actualizar notificación
        await connection.query(
          `UPDATE notificaciones SET ${updates.join(', ')} WHERE id_notificacion = ?`,
          params
        );
        
        // Si se está verificando el comprobante, crear notificación para el cliente
        if (comprobante_verificado && notifDataAntes.length > 0) {
          try {
            const notif = notifDataAntes[0];
            
            // Obtener id_cliente desde el pedido
            const [pedidoData] = await connection.query(
              'SELECT id_cliente FROM pedidos WHERE id_pedido = ?',
              [notif.id_pedido]
            );
            
            const idCliente = pedidoData.length > 0 ? pedidoData[0].id_cliente : null;
            
                // Normalizar teléfono: remover espacios, guiones, paréntesis para consistencia
                const telefonoNormalizado = notif.telefono_cliente ? 
                  notif.telefono_cliente.replace(/[\s\-\(\)]/g, '') : null;
                
                // Crear notificación para el cliente
                await connection.query(
                  `INSERT INTO notificaciones_cliente 
                   (id_pedido, id_cliente, telefono_cliente, email_cliente, titulo, mensaje, tipo) 
                   VALUES (?, ?, ?, ?, ?, ?, 'success')`,
                  [
                    notif.id_pedido,
                    idCliente,
                    telefonoNormalizado || notif.telefono_cliente, // Guardar normalizado si existe
                    notif.email_cliente,
                    'Comprobante Verificado',
                    `¡Hola ${notif.nombre_cliente}! Tu comprobante de pago ha sido verificado exitosamente. Tu pedido está siendo preparado y será entregado aproximadamente en 30-45 minutos. Te notificaremos cuando esté en camino. ¡Gracias por tu compra!`
                  ]
                );
                
                console.log('✅ Notificación para cliente creada al verificar comprobante');
                console.log(`   - Teléfono original: ${notif.telefono_cliente}`);
                console.log(`   - Teléfono normalizado: ${telefonoNormalizado}`);
                console.log(`   - ID Cliente: ${idCliente}`);
          } catch (error) {
            console.error('Error al crear notificación para cliente:', error);
            // No fallar la operación principal si falla la notificación al cliente
          }
        }

        // Si se está cambiando el estado, actualizar también el pedido
        if (estado) {
          let estadoPedido = null;
          
          // Mapear estados de notificación a estados de pedido
          if (estado === 'en_proceso') {
            estadoPedido = 'Pagado';
          } else if (estado === 'entregado') {
            estadoPedido = 'Entregado';
          } else if (estado === 'cancelado') {
            estadoPedido = 'Cancelado';
          } else if (estado === 'enviado') {
            estadoPedido = 'Pagado';
          }
          
          if (estadoPedido) {
            await connection.query(
              'UPDATE pedidos SET estado = ? WHERE id_pedido = ?',
              [estadoPedido, id_pedido]
            );
            console.log(`✅ Estado del pedido ${id_pedido} actualizado a "${estadoPedido}"`);
          }
          
          // Crear notificación para el cliente según el estado
          try {
            // Obtener datos de la notificación usando la conexión de la transacción
            const [notifData] = await connection.query(
              'SELECT id_pedido, nombre_cliente, telefono_cliente, email_cliente FROM notificaciones WHERE id_notificacion = ?',
              [id]
            );
            
            if (notifData.length > 0) {
              const notif = notifData[0];
              
              // Obtener id_cliente desde el pedido usando la conexión de la transacción
              const [pedidoData] = await connection.query(
                'SELECT id_cliente FROM pedidos WHERE id_pedido = ?',
                [notif.id_pedido]
              );
              
              const idCliente = pedidoData.length > 0 ? pedidoData[0].id_cliente : null;
              
              let titulo = '';
              let mensaje = '';
              
              // Definir mensajes según el estado
              if (estado === 'en_proceso') {
                titulo = 'Pedido en Proceso';
                mensaje = `¡Hola ${notif.nombre_cliente}! Tu pedido está siendo preparado. Te notificaremos cuando esté listo para enviar. ¡Gracias por tu compra!`;
              } else if (estado === 'enviado') {
                titulo = 'Pedido Enviado';
                mensaje = `¡Hola ${notif.nombre_cliente}! Tu pedido ha sido enviado y está en camino. Llegará a tu dirección en breve. ¡Gracias por tu compra!`;
              } else if (estado === 'entregado') {
                titulo = 'Pedido Entregado';
                mensaje = `¡Hola ${notif.nombre_cliente}! Tu pedido ha sido entregado exitosamente. ¡Esperamos que disfrutes tus productos! ¡Gracias por confiar en nosotros!`;
              }
              
              // Crear notificación para el cliente si hay mensaje
              if (titulo && mensaje) {
                // Normalizar teléfono: remover espacios, guiones, paréntesis para consistencia
                const telefonoNormalizado = notif.telefono_cliente ? 
                  notif.telefono_cliente.replace(/[\s\-\(\)]/g, '') : null;
                
                const [resultado] = await connection.query(
                  `INSERT INTO notificaciones_cliente 
                   (id_pedido, id_cliente, telefono_cliente, email_cliente, titulo, mensaje, tipo) 
                   VALUES (?, ?, ?, ?, ?, ?, 'success')`,
                  [
                    notif.id_pedido,
                    idCliente,
                    telefonoNormalizado || notif.telefono_cliente, // Guardar normalizado si existe
                    notif.email_cliente,
                    titulo,
                    mensaje,
                    'success'
                  ]
                );
                
                console.log(`✅ Notificación para cliente creada: ${titulo} (ID: ${resultado.insertId})`);
                console.log(`   - Cliente: ${notif.nombre_cliente}`);
                console.log(`   - Teléfono original: ${notif.telefono_cliente}`);
                console.log(`   - Teléfono normalizado: ${telefonoNormalizado}`);
                console.log(`   - Email: ${notif.email_cliente}`);
                console.log(`   - ID Cliente: ${idCliente}`);
              }
            } else {
              console.warn(`⚠️ No se encontró la notificación ${id} para crear notificación al cliente`);
            }
          } catch (error) {
            console.error('❌ Error al crear notificación para cliente:', error);
            console.error('   Detalles:', error.message);
            console.error('   Stack:', error.stack);
            // No fallar la operación principal si falla la notificación al cliente
          }
        }

        await connection.commit();
        connection.release();

        // Obtener la notificación actualizada
        const [notificaciones] = await db.query(
          'SELECT * FROM notificaciones WHERE id_notificacion = ?',
          [id]
        );

        const notificacion = notificaciones[0];
        notificacion.productos = JSON.parse(notificacion.productos || '[]');
        notificacion.id_detalle_pedido = JSON.parse(notificacion.id_detalle_pedido || '[]');

        res.json({
          mensaje: 'Notificación y pedido actualizados correctamente',
          notificacion: notificacion
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      res.status(500).json({ error: 'Error al actualizar notificación', detalles: error.message });
    }
  }

  // Eliminar notificación
  async eliminarNotificacion(req, res) {
    const { id } = req.params;
    try {
      const [resultado] = await db.query(
        'DELETE FROM notificaciones WHERE id_notificacion = ?',
        [id]
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      res.json({ mensaje: 'Notificación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      res.status(500).json({ error: 'Error al eliminar notificación', detalles: error.message });
    }
  }

  // Obtener contador de notificaciones pendientes
  async obtenerNotificacionesPendientesCount(req, res) {
    try {
      const [resultado] = await db.query(
        'SELECT COUNT(*) as total FROM notificaciones WHERE estado = "pendiente"'
      );

      res.json({ total: resultado[0].total || 0 });
    } catch (error) {
      console.error('Error al obtener contador:', error);
      res.status(500).json({ error: 'Error al obtener contador', detalles: error.message });
    }
  }
}

module.exports = NotificacionesController;

