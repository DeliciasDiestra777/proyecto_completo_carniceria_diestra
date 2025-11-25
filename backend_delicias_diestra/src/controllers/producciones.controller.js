const db = require('../config/conexion_db');

class ProduccionesController {
  // Obtener todas las producciones con información de la receta
  async obtenerProducciones(req, res) {
    try {
      const [producciones] = await db.query(
        `SELECT pr.id_produccion, pr.id_receta, r.nombre_receta AS nombre_receta,
          pr.referencia, pr.cantidad_producida, pr.unidad, pr.factor_conversion,
          pr.rendimiento, 
          COALESCE(pr.fecha_produccion, NOW()) AS fecha_produccion,
          pr.observaciones
        FROM producciones pr
        LEFT JOIN recetas r ON pr.id_receta = r.id_receta
        ORDER BY COALESCE(pr.fecha_produccion, NOW()) DESC`
      );

      // Cargar detalles de producción para cada producción
      for (let produccion of producciones) {
        try {
          const [detalles] = await db.query(
            `SELECT dp.id_detalle_produccion, dp.id_produccion, dp.id_producto_entrada, dp.id_producto_salida,
              dp.cantidad_usada, dp.cantidad_generada, dp.unidad, dp.costo_unitario,
              p.nombre_producto AS nombre_producto_entrada
            FROM detalle_produccion dp
            LEFT JOIN productos p ON dp.id_producto_entrada = p.id_producto
            WHERE dp.id_produccion = ?`,
            [produccion.id_produccion]
          );
          
          // Formatear detalles como ingredientes_usados
          produccion.ingredientes_usados = detalles.map(detalle => ({
            id_producto: detalle.id_producto_entrada,
            id_producto_entrada: detalle.id_producto_entrada,
            id_producto_salida: detalle.id_producto_salida, // Incluir producto final
            nombre_producto: detalle.nombre_producto_entrada,
            cantidad_usada: detalle.cantidad_usada,
            cantidad: detalle.cantidad_usada,
            cantidad_generada: detalle.cantidad_generada,
            unidad: detalle.unidad
          }));
        } catch (err) {
          console.error(`Error al obtener detalles para producción ${produccion.id_produccion}:`, err);
          produccion.ingredientes_usados = [];
        }
      }

      res.json(producciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener producciones' });
    }
  }

  // Obtener producción por ID
  async obtenerProduccionPorId(req, res) {
    const { id } = req.params;
    try {
      const [produccion] = await db.query(
        `SELECT pr.id_produccion, pr.id_receta, r.nombre_receta AS nombre_receta,
          pr.referencia, pr.cantidad_producida, pr.unidad, pr.factor_conversion,
          pr.rendimiento, 
          COALESCE(pr.fecha_produccion, NOW()) AS fecha_produccion,
          pr.observaciones
        FROM producciones pr
        LEFT JOIN recetas r ON pr.id_receta = r.id_receta
        WHERE pr.id_produccion = ?`,
        [id]
      );

      if (produccion.length === 0) {
        return res.status(404).json({ error: 'Producción no encontrada' });
      }

      res.json(produccion[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener producción' });
    }
  }

  // Agregar una producción nueva
  async agregarProduccion(req, res) {
    const { id_receta, referencia, cantidad_producida, unidad, factor_conversion, rendimiento, fecha_produccion, observaciones, ingredientes_usados } = req.body;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Insertar la producción
      // Si no se proporciona fecha_produccion, usar la fecha actual en zona horaria de Colombia
      const { getCurrentDateTimeMySQL } = require('../utils/dateHelper');
      const fechaProduccion = fecha_produccion || getCurrentDateTimeMySQL();
      const [result] = await connection.query(
        'INSERT INTO producciones (id_receta, referencia, cantidad_producida, unidad, factor_conversion, rendimiento, fecha_produccion, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id_receta, referencia || null, cantidad_producida, unidad, factor_conversion || 1.0, rendimiento || 1.0, fechaProduccion, observaciones || null]
      );

      const idProduccion = result.insertId;

      // 2. Obtener el producto final de la receta (si existe)
      // Intentar obtener id_producto_final, pero si la columna no existe, continuar sin error
      let idProductoFinal = null;
      if (id_receta) {
        try {
          // Primero verificar si la columna existe
          const [columns] = await connection.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'recetas' 
             AND COLUMN_NAME = 'id_producto_final'`
          );
          
          if (columns.length > 0) {
            // La columna existe, intentar obtener el producto final
            const [receta] = await connection.query(
              'SELECT id_producto_final FROM recetas WHERE id_receta = ?',
              [id_receta]
            );
            if (receta.length > 0 && receta[0].id_producto_final) {
              idProductoFinal = receta[0].id_producto_final;
            }
          } else {
            // La columna no existe, intentar buscar el producto por nombre de la receta
            const [recetaInfo] = await connection.query(
              'SELECT nombre_receta FROM recetas WHERE id_receta = ?',
              [id_receta]
            );
            if (recetaInfo.length > 0) {
              const nombreReceta = recetaInfo[0].nombre_receta;
              if (nombreReceta) {
                // Buscar producto que coincida con el nombre de la receta (búsqueda más flexible)
                // Primero intentar coincidencia exacta (case insensitive)
                let [productos] = await connection.query(
                  'SELECT id_producto FROM productos WHERE LOWER(TRIM(nombre_producto)) = LOWER(TRIM(?)) LIMIT 1',
                  [nombreReceta]
                );
                
                // Si no hay coincidencia exacta, intentar coincidencia parcial
                if (productos.length === 0) {
                  [productos] = await connection.query(
                    'SELECT id_producto FROM productos WHERE LOWER(nombre_producto) LIKE LOWER(?) OR LOWER(?) LIKE CONCAT("%", LOWER(nombre_producto), "%") LIMIT 1',
                    [`%${nombreReceta}%`, nombreReceta]
                  );
                }
                
                if (productos.length > 0) {
                  idProductoFinal = productos[0].id_producto;
                  console.log(`✅ Producto final encontrado por nombre: "${nombreReceta}" → Producto ID ${idProductoFinal}`);
                } else {
                  console.warn(`⚠️ No se encontró producto final para la receta "${nombreReceta}" (ID: ${id_receta})`);
                }
              }
            }
          }
        } catch (err) {
          // Si hay error al verificar la columna, continuar sin producto final
          console.warn('No se pudo obtener el producto final de la receta:', err.message);
          idProductoFinal = null;
        }
      }

            // 3. Guardar detalles de producción (ingredientes usados)
      if (ingredientes_usados && Array.isArray(ingredientes_usados) && ingredientes_usados.length > 0) {
        for (const ingrediente of ingredientes_usados) {
          const { id_producto, cantidad_usada, unidad: unidadIngrediente } = ingrediente;
          
          if (id_producto && cantidad_usada !== undefined && cantidad_usada > 0) {
            // Validar stock antes de insertar (considerando conversiones de unidades)
            const [productoInfo] = await connection.query(
              'SELECT stock_actual, unidad_medida, nombre_producto FROM productos WHERE id_producto = ?',
              [id_producto]
            );

            if (productoInfo.length === 0) {
              throw new Error(`Producto con ID ${id_producto} no encontrado`);
            }

            const producto = productoInfo[0];
            const stockActual = parseFloat(producto.stock_actual || 0);
            const unidadProducto = producto.unidad_medida || 'lb';
            const unidadIngredienteNormalizada = (unidadIngrediente || unidad || 'lb').toLowerCase().trim();
            
            // Convertir cantidad_usada a la unidad del producto si es necesario
            let cantidadUsadaEnUnidadProducto = cantidad_usada;
            
            // Si las unidades son diferentes, hacer conversión
            if (unidadIngredienteNormalizada !== unidadProducto.toLowerCase()) {
              // Conversiones comunes
              const GRAMOS_POR_LIBRA = 453.592;
              const KILOGRAMOS_POR_LIBRA = 0.453592;
              
              // Convertir a libras primero (unidad base)
              let cantidadEnLibras = cantidad_usada;
              
              if (unidadIngredienteNormalizada === 'gr' || unidadIngredienteNormalizada === 'gramos' || unidadIngredienteNormalizada === 'g') {
                cantidadEnLibras = cantidad_usada / GRAMOS_POR_LIBRA;
              } else if (unidadIngredienteNormalizada === 'kg' || unidadIngredienteNormalizada === 'kilogramos' || unidadIngredienteNormalizada === 'kilogramo') {
                cantidadEnLibras = cantidad_usada / KILOGRAMOS_POR_LIBRA;
              } else if (unidadIngredienteNormalizada === 'unidad' || unidadIngredienteNormalizada === 'unidades') {
                // Para unidades, no hay conversión directa, asumir que 1 unidad = 1 unidad
                cantidadEnLibras = cantidad_usada;
              }
              
              // Convertir de libras a la unidad del producto
              if (unidadProducto.toLowerCase() === 'gr' || unidadProducto.toLowerCase() === 'gramos') {
                cantidadUsadaEnUnidadProducto = cantidadEnLibras * GRAMOS_POR_LIBRA;
              } else if (unidadProducto.toLowerCase() === 'kg' || unidadProducto.toLowerCase() === 'kilogramos') {
                cantidadUsadaEnUnidadProducto = cantidadEnLibras * KILOGRAMOS_POR_LIBRA;
              } else if (unidadProducto.toLowerCase() === 'unidad' || unidadProducto.toLowerCase() === 'unidades') {
                // Para unidades, no hay conversión directa
                cantidadUsadaEnUnidadProducto = cantidad_usada;
              } else {
                // Si es libras, ya está en libras
                cantidadUsadaEnUnidadProducto = cantidadEnLibras;
              }
            }

            // Validar stock
            if (stockActual < cantidadUsadaEnUnidadProducto) {
              throw new Error(
                `Stock insuficiente para "${producto.nombre_producto}". ` +
                `Stock disponible: ${stockActual.toFixed(3)} ${unidadProducto}, ` +
                `Cantidad requerida: ${cantidadUsadaEnUnidadProducto.toFixed(3)} ${unidadProducto} ` +
                `(${cantidad_usada} ${unidadIngredienteNormalizada})`
              );
            }

            await connection.query(
              'INSERT INTO detalle_produccion (id_produccion, id_producto_entrada, id_producto_salida, cantidad_usada, cantidad_generada, unidad, costo_unitario) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                idProduccion,
                id_producto, // Producto usado como ingrediente
                idProductoFinal, // Producto final generado (puede ser null)
                cantidad_usada, // Cantidad del ingrediente usada (mantener unidad original)
                idProductoFinal ? cantidad_producida : 0, // Cantidad del producto final generado
                unidadIngrediente || unidad || 'lb',
                null // costo_unitario (opcional)
              ]
            );

            // NOTA: No actualizamos salida_pedidos aquí porque la producción salida se calcula
            // desde detalle_produccion en el frontend. El stock_actual se recalcula automáticamente
            // en la base de datos usando la fórmula: inventario_inicial + entrada_compras - salida_pedidos
            // La producción salida se maneja por separado en el inventario consolidado.
          }
        }
      }

      // 4. Actualizar inventario: sumar al producto final (producción entrada)
      // Esto se suma a entrada_compras porque es una entrada al inventario
      if (idProductoFinal && cantidad_producida > 0) {
        await connection.query(
          'UPDATE productos SET entrada_compras = COALESCE(entrada_compras, 0) + ? WHERE id_producto = ?',
          [cantidad_producida, idProductoFinal]
        );
      }

      await connection.commit();
      
      // Actualizar estado de productos con stock 0 después de registrar producción
      const ProductosController = require('./productos.controller');
      const productosController = new ProductosController();
      await productosController.actualizarEstadoProductosSinStock();
      res.json({ 
        mensaje: 'Producción agregada correctamente',
        id_produccion: idProduccion
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error al agregar producción:', error);
      res.status(500).json({ error: 'Error al agregar producción: ' + error.message });
    } finally {
      connection.release();
    }
  }

  // Actualizar producción
  async actualizarProduccion(req, res) {
    const { id } = req.params;
    const { id_receta, referencia, cantidad_producida, unidad, factor_conversion, rendimiento, fecha_produccion, observaciones } = req.body;
    try {
      await db.query(
        'UPDATE producciones SET id_receta = ?, referencia = ?, cantidad_producida = ?, unidad = ?, factor_conversion = ?, rendimiento = ?, fecha_produccion = ?, observaciones = ? WHERE id_produccion = ?',
        [id_receta, referencia, cantidad_producida, unidad, factor_conversion, rendimiento, fecha_produccion, observaciones, id]
      );
      res.json({ mensaje: 'Producción actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar producción' });
    }
  }

  // Eliminar producción
  async eliminarProduccion(req, res) {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Eliminar detalles de producción primero (si la tabla existe)
      try {
        await connection.query('DELETE FROM detalle_produccion WHERE id_produccion = ?', [id]);
      } catch (err) {
        // Si la tabla no existe, continuar sin error
        if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
          console.log('⚠️ Tabla detalle_produccion no existe, continuando sin eliminar detalles');
        } else {
          throw err; // Re-lanzar si es otro tipo de error
        }
      }
      
      // Eliminar la producción
      await connection.query('DELETE FROM producciones WHERE id_produccion = ?', [id]);

      await connection.commit();
      res.json({ mensaje: 'Producción eliminada correctamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al eliminar producción:', error);
      res.status(500).json({ error: 'Error al eliminar producción: ' + error.message });
    } finally {
      connection.release();
    }
  }
}

module.exports = ProduccionesController;




