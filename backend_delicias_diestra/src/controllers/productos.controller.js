const db = require('../config/conexion_db');

class ProductosController {
  async obtenerProductos(req, res) {
    try {
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      const campoMostrar = tieneCampo ? 'p.mostrar_en_catalogo,' : '1 as mostrar_en_catalogo,';
      
      const [productos] = await db.query(
        `SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_producto,
          p.imagen,
          p.unidad_medida,
          p.inventario_inicial,
          p.entrada_compras,
          p.salida_pedidos,
          p.stock_actual,
          p.stock_minimo,
          p.costo,
          p.estado,
          ${campoMostrar}
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre,
          p.fecha_creacion,
          p.fecha_actualizacion
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        ORDER BY p.fecha_creacion DESC`
      );

      res.json({ productos });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ error: 'Error al obtener productos', detalles: error.message });
    }
  }

  async actualizarEstadoProductosSinStock() {
    try {
      const [resultadoDeshabilitar] = await db.query(
        `UPDATE productos 
         SET estado = 'inactivo', 
             fecha_actualizacion = NOW()
         WHERE stock_actual <= 0 
           AND estado = 'activo'`
      );
      
      if (resultadoDeshabilitar.affectedRows > 0) {
        console.log(`${resultadoDeshabilitar.affectedRows} producto(s) deshabilitado(s) por stock 0`);
      }
      
      const [resultadoReactivar] = await db.query(
        `UPDATE productos 
         SET estado = 'activo', 
             fecha_actualizacion = NOW()
         WHERE stock_actual > 0 
           AND estado = 'inactivo'`
      );
      
      if (resultadoReactivar.affectedRows > 0) {
        console.log(`${resultadoReactivar.affectedRows} producto(s) reactivado(s) por stock disponible`);
      }
      
      return {
        deshabilitados: resultadoDeshabilitar.affectedRows,
        reactivados: resultadoReactivar.affectedRows
      };
    } catch (error) {
      console.error('Error al actualizar estado de productos según stock:', error);
      return { deshabilitados: 0, reactivados: 0 };
    }
  }

  async obtenerProductosCatalogo(req, res) {
    try {
      const [columnCheckProductos] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      // Verificar si el campo mostrar_en_catalogo existe en categorias
      const [columnCheckCategorias] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'categorias' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampoProductos = columnCheckProductos[0]?.existe > 0;
      const tieneCampoCategorias = columnCheckCategorias[0]?.existe > 0;
      
      // Construir condiciones WHERE
      const condiciones = [];
      
      if (tieneCampoProductos) {
        condiciones.push('p.mostrar_en_catalogo = 1');
      }
      
      if (tieneCampoCategorias) {
        condiciones.push('c.mostrar_en_catalogo = 1');
      }
      
      condiciones.push("p.estado = 'activo'");
      condiciones.push("c.estado = 'activo'");
      condiciones.push('(p.stock_actual > 0 OR p.stock_actual IS NULL)');
      
      const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
      
      // Actualizar automáticamente productos con stock 0 a 'inactivo'
      await this.actualizarEstadoProductosSinStock();
      
      // Para el catálogo público: excluir productos con stock 0 y productos de categorías ocultas
      const [productos] = await db.query(
        `SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_producto,
          p.imagen,
          p.unidad_medida,
          p.inventario_inicial,
          p.entrada_compras,
          p.salida_pedidos,
          p.stock_actual,
          p.stock_minimo,
          p.costo,
          p.estado,
          ${tieneCampoProductos ? 'p.mostrar_en_catalogo' : '1 as mostrar_en_catalogo'},
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre,
          ${tieneCampoCategorias ? 'c.mostrar_en_catalogo as categoria_mostrar_en_catalogo' : '1 as categoria_mostrar_en_catalogo'},
          p.fecha_creacion,
          p.fecha_actualizacion,
          -- Calcular inventario_saldo: inicial + compras - pedidos - prod_salida + prod_entrada
          (
            COALESCE(p.inventario_inicial, 0) +
            COALESCE((
              SELECT SUM(dc.cantidad)
              FROM detalle_compra dc
              WHERE dc.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dp.cantidad)
              FROM detalle_pedido dp
              WHERE dp.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dpr.cantidad_usada)
              FROM detalle_produccion dpr
              WHERE dpr.id_producto_entrada = p.id_producto
            ), 0) +
            COALESCE((
              SELECT SUM(pr.cantidad_producida)
              FROM producciones pr
              WHERE pr.id_produccion IN (
                SELECT DISTINCT dpr.id_produccion
                FROM detalle_produccion dpr
                WHERE dpr.id_producto_salida = p.id_producto
              )
            ), 0)
          ) AS inventario_saldo
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        ${whereClause}
        ORDER BY p.fecha_creacion DESC`
      );

      res.json({ productos });
    } catch (error) {
      console.error('Error al obtener productos del catálogo:', error);
      res.status(500).json({ error: 'Error al obtener productos del catálogo', detalles: error.message });
    }
  }

  // Obtener productos del catálogo para administración (incluye productos con stock 0 e inactivos)
  // Este endpoint es para la tabla de lista de productos en el panel de administración
  // Muestra TODOS los productos del catálogo, incluso los inactivos, para que el admin pueda ver qué necesita stock
  // Calcula el inventario_saldo correctamente: inicial + compras - pedidos - prod_salida + prod_entrada
  async obtenerProductosCatalogoAdmin(req, res) {
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      const condicionMostrar = tieneCampo ? 'p.mostrar_en_catalogo = 1 AND' : '';
      
      // Actualizar automáticamente productos con stock 0 a 'inactivo' y reactivar los con stock > 0
      await this.actualizarEstadoProductosSinStock();
      
      // Para la tabla de administración: mostrar TODOS los productos del catálogo
      // Incluyendo los inactivos (por stock 0) para que el admin pueda ver qué necesita stock
      // Calcular inventario_saldo: inicial + compras - pedidos - prod_salida + prod_entrada
      const [productos] = await db.query(
        `SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_producto,
          p.imagen,
          p.unidad_medida,
          p.inventario_inicial,
          p.entrada_compras,
          p.salida_pedidos,
          p.stock_actual,
          p.stock_minimo,
          p.costo,
          p.estado,
          ${tieneCampo ? 'p.mostrar_en_catalogo' : '1 as mostrar_en_catalogo'},
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre,
          p.fecha_creacion,
          p.fecha_actualizacion,
          -- Calcular compras totales desde detalle_compra
          COALESCE((
            SELECT SUM(dc.cantidad)
            FROM detalle_compra dc
            WHERE dc.id_producto = p.id_producto
          ), 0) AS compras_totales,
          -- Calcular pedidos totales desde detalle_pedido
          COALESCE((
            SELECT SUM(dp.cantidad)
            FROM detalle_pedido dp
            WHERE dp.id_producto = p.id_producto
          ), 0) AS pedidos_totales,
          -- Calcular producción salida (ingredientes usados)
          COALESCE((
            SELECT SUM(dpr.cantidad_usada)
            FROM detalle_produccion dpr
            WHERE dpr.id_producto_entrada = p.id_producto
          ), 0) AS produccion_salida,
          -- Calcular producción entrada (productos finales producidos)
          -- Evitar duplicados cuando hay múltiples ingredientes en la misma producción
          COALESCE((
            SELECT SUM(pr.cantidad_producida)
            FROM producciones pr
            WHERE pr.id_produccion IN (
              SELECT DISTINCT dpr.id_produccion
              FROM detalle_produccion dpr
              WHERE dpr.id_producto_salida = p.id_producto
            )
          ), 0) AS produccion_entrada,
          -- Calcular inventario_saldo: inicial + compras - pedidos - prod_salida + prod_entrada
          (
            COALESCE(p.inventario_inicial, 0) +
            COALESCE((
              SELECT SUM(dc.cantidad)
              FROM detalle_compra dc
              WHERE dc.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dp.cantidad)
              FROM detalle_pedido dp
              WHERE dp.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dpr.cantidad_usada)
              FROM detalle_produccion dpr
              WHERE dpr.id_producto_entrada = p.id_producto
            ), 0) +
            COALESCE((
              SELECT SUM(pr.cantidad_producida)
              FROM producciones pr
              WHERE pr.id_produccion IN (
                SELECT DISTINCT dpr.id_produccion
                FROM detalle_produccion dpr
                WHERE dpr.id_producto_salida = p.id_producto
              )
            ), 0)
          ) AS inventario_saldo
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE ${condicionMostrar} 1=1
        ORDER BY 
          CASE WHEN (
            COALESCE(p.inventario_inicial, 0) +
            COALESCE((
              SELECT SUM(dc.cantidad)
              FROM detalle_compra dc
              WHERE dc.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dp.cantidad)
              FROM detalle_pedido dp
              WHERE dp.id_producto = p.id_producto
            ), 0) -
            COALESCE((
              SELECT SUM(dpr.cantidad_usada)
              FROM detalle_produccion dpr
              WHERE dpr.id_producto_entrada = p.id_producto
            ), 0) +
            COALESCE((
              SELECT SUM(pr.cantidad_producida)
              FROM producciones pr
              WHERE pr.id_produccion IN (
                SELECT DISTINCT dpr.id_produccion
                FROM detalle_produccion dpr
                WHERE dpr.id_producto_salida = p.id_producto
              )
            ), 0)
          ) <= 0 THEN 0 ELSE 1 END,
          p.fecha_creacion DESC`
      );

      // Reemplazar stock_actual con inventario_saldo calculado
      productos.forEach(producto => {
        producto.stock_actual = parseFloat(producto.inventario_saldo || producto.stock_actual || 0);
      });

      res.json({ productos });
    } catch (error) {
      console.error('Error al obtener productos del catálogo para administración:', error);
      res.status(500).json({ error: 'Error al obtener productos del catálogo', detalles: error.message });
    }
  }

  // Obtener producto por ID
  async obtenerProductoPorId(req, res) {
    const { id } = req.params;
    try {
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      
      const tieneCampo = columnCheck[0]?.existe > 0;
      const campoMostrar = tieneCampo ? 'p.mostrar_en_catalogo,' : '1 as mostrar_en_catalogo,';
      
      const [producto] = await db.query(
        `SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_producto,
          p.imagen,
          p.unidad_medida,
          p.inventario_inicial,
          p.entrada_compras,
          p.salida_pedidos,
          p.stock_actual,
          p.stock_minimo,
          p.costo,
          p.estado,
          ${campoMostrar}
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre,
          p.fecha_creacion,
          p.fecha_actualizacion
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?`,
        [id]
      );

      if (producto.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({ producto: producto[0] });
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({ error: 'Error al obtener producto', detalles: error.message });
    }
  }

  // Crear un nuevo producto
  async crearProducto(req, res) {
    try {
      console.log('Creando producto...');
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);
      
      // Verificar que req.body existe
      if (!req.body) {
        return res.status(400).json({
          mensaje: 'No se recibieron datos del formulario'
        });
      }
      
      // Extraer datos del FormData
      const {
        id_categoria,
        nombre_producto,
        descripcion,
        precio_producto,
        unidad_medida,
        inventario_inicial,
        stock_minimo,
        costo,
        estado,
        mostrar_en_catalogo
      } = req.body;
      
      // Validar datos requeridos
      if (!nombre_producto || !id_categoria || !precio_producto) {
        return res.status(400).json({
          mensaje: 'Faltan campos requeridos',
          campos: { nombre_producto, id_categoria, precio_producto }
        });
      }
      
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      const tieneCampoMostrar = columnCheck[0]?.existe > 0;
      
      // Preparar datos para la base de datos
      const datosProducto = {
        id_categoria: parseInt(id_categoria),
        nombre_producto: nombre_producto,
        descripcion: descripcion || '',
        precio_producto: parseFloat(precio_producto),
        unidad_medida: unidad_medida || 'kg',
        inventario_inicial: inventario_inicial ? parseFloat(inventario_inicial) : 0,
        stock_minimo: stock_minimo ? parseFloat(stock_minimo) : 0,
        costo: costo ? parseFloat(costo) : 0,
        estado: estado || 'activo',
        mostrar_en_catalogo: tieneCampoMostrar ? (mostrar_en_catalogo !== undefined ? (mostrar_en_catalogo === 'true' || mostrar_en_catalogo === true) : true) : undefined
      };
      
      // Manejar imagen si existe
      if (req.file) {
        datosProducto.imagen = req.file.filename;
        console.log('Archivo guardado:', req.file.filename);
        console.log('Ruta física:', req.file.path);
        console.log('URL de acceso:', `http://localhost:3000/uploads/productos/${req.file.filename}`);
      }
      
      console.log('Datos del producto:', datosProducto);
      
      // Validaciones adicionales
      if (datosProducto.precio_producto <= 0) {
        return res.status(400).json({ 
          error: 'El precio_producto debe ser mayor a 0' 
        });
      }

      if (datosProducto.inventario_inicial < 0) {
        return res.status(400).json({ 
          error: 'El inventario_inicial no puede ser negativo' 
        });
      }

      if (datosProducto.stock_minimo < 0) {
        return res.status(400).json({ 
          error: 'El stock_minimo no puede ser negativo' 
        });
      }

      const unidadesValidas = ['kg', 'lb', 'gr', 'unidad'];
      if (datosProducto.unidad_medida && !unidadesValidas.includes(datosProducto.unidad_medida)) {
        return res.status(400).json({ 
          error: 'Unidad de medida inválida. Valores permitidos: kg, lb, gr, unidad' 
        });
      }

      const estadosValidos = ['activo', 'inactivo'];
      if (datosProducto.estado && !estadosValidos.includes(datosProducto.estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido. Valores permitidos: activo, inactivo' 
        });
      }

      // Verificar que la categoría existe
      const [categoria] = await db.query(
        'SELECT id_categoria FROM categorias WHERE id_categoria = ?',
        [datosProducto.id_categoria]
      );

      if (categoria.length === 0) {
        return res.status(400).json({ error: 'La categoría especificada no existe' });
      }

      // Verificar que el nombre del producto no esté duplicado
      const [productoExistente] = await db.query(
        'SELECT id_producto FROM productos WHERE nombre_producto = ?',
        [datosProducto.nombre_producto]
      );

      if (productoExistente.length > 0) {
        return res.status(409).json({ error: 'Ya existe un producto con ese nombre' });
      }

      // Insertar el nuevo producto
      let insertResult;
      if (tieneCampoMostrar && datosProducto.mostrar_en_catalogo !== undefined) {
        [insertResult] = await db.query(
          `INSERT INTO productos 
          (nombre_producto, descripcion, precio_producto, imagen, unidad_medida, inventario_inicial, stock_minimo, costo, estado, id_categoria, mostrar_en_catalogo) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            datosProducto.nombre_producto, 
            datosProducto.descripcion, 
            datosProducto.precio_producto, 
            datosProducto.imagen, 
            datosProducto.unidad_medida, 
            datosProducto.inventario_inicial, 
            datosProducto.stock_minimo, 
            datosProducto.costo, 
            datosProducto.estado, 
            datosProducto.id_categoria,
            datosProducto.mostrar_en_catalogo ? 1 : 0
          ]
        );
      } else {
        [insertResult] = await db.query(
          `INSERT INTO productos 
          (nombre_producto, descripcion, precio_producto, imagen, unidad_medida, inventario_inicial, stock_minimo, costo, estado, id_categoria) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            datosProducto.nombre_producto, 
            datosProducto.descripcion, 
            datosProducto.precio_producto, 
            datosProducto.imagen, 
            datosProducto.unidad_medida, 
            datosProducto.inventario_inicial, 
            datosProducto.stock_minimo, 
            datosProducto.costo, 
            datosProducto.estado, 
            datosProducto.id_categoria
          ]
        );
      }

      // Obtener el ID del producto creado
      const idProductoCreado = insertResult.insertId;
      
      // Obtener el producto completo creado para devolverlo
      const [productoCreado] = await db.query(
        `SELECT * FROM productos WHERE id_producto = ?`,
        [idProductoCreado]
      );

      console.log('Producto creado correctamente con ID:', idProductoCreado);
      console.log('Producto completo:', productoCreado[0]);
      
      // Actualizar estado de productos con stock 0 después de crear producto
      await this.actualizarEstadoProductosSinStock();
      
      res.status(201).json({ 
        mensaje: 'Producto creado correctamente',
        producto: {
          id_producto: idProductoCreado,
          ...datosProducto,
          imagen: datosProducto.imagen || null
        }
      });
      
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ 
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar producto
  async actualizarProducto(req, res) {
    const { id } = req.params;
    try {
      console.log('Actualizando producto ID:', id);
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);
      
      const { 
        nombre_producto, 
        descripcion, 
        precio_producto, 
        imagen, 
        imagen_actual, // Nombre de la imagen actual si no se sube nueva
        unidad_medida, 
        inventario_inicial,
        stock_minimo,
        costo,
        estado,
        mostrar_en_catalogo, 
        id_categoria 
      } = req.body;

    // Validaciones
    if (precio_producto !== undefined && precio_producto <= 0) {
      return res.status(400).json({ error: 'El precio_producto debe ser mayor a 0' });
    }

    if (inventario_inicial !== undefined && inventario_inicial < 0) {
      return res.status(400).json({ error: 'El inventario_inicial no puede ser negativo' });
    }

    if (stock_minimo !== undefined && stock_minimo < 0) {
      return res.status(400).json({ error: 'El stock_minimo no puede ser negativo' });
    }

    const unidadesValidas = ['kg', 'lb', 'gr', 'unidad'];
    if (unidad_medida && !unidadesValidas.includes(unidad_medida)) {
      return res.status(400).json({ 
        error: 'Unidad de medida inválida. Valores permitidos: kg, lb, gr, unidad' 
      });
    }

    const estadosValidos = ['activo', 'inactivo'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Valores permitidos: activo, inactivo' 
      });
    }

    // Verificar que el producto existe
    const [productoExistente] = await db.query(
      'SELECT id_producto FROM productos WHERE id_producto = ?',
      [id]
    );

    if (productoExistente.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar que la categoría existe si se está actualizando
    if (id_categoria) {
      const [categoria] = await db.query(
        'SELECT id_categoria FROM categorias WHERE id_categoria = ?',
        [id_categoria]
      );

      if (categoria.length === 0) {
        return res.status(400).json({ error: 'La categoría especificada no existe' });
      }
    }

    // Verificar que el nombre del producto no esté duplicado (si se está actualizando)
    if (nombre_producto) {
      const [productoConNombre] = await db.query(
        'SELECT id_producto FROM productos WHERE nombre_producto = ? AND id_producto != ?',
        [nombre_producto, id]
      );

      if (productoConNombre.length > 0) {
        return res.status(409).json({ error: 'Ya existe otro producto con ese nombre' });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const campos = [];
    const valores = [];

    if (nombre_producto !== undefined) {
      campos.push('nombre_producto = ?');
      valores.push(nombre_producto);
    }
    if (descripcion !== undefined) {
      campos.push('descripcion = ?');
      valores.push(descripcion);
    }
    if (precio_producto !== undefined) {
      campos.push('precio_producto = ?');
      valores.push(precio_producto);
    }
    // Manejar imagen: si hay archivo nuevo, usar ese; si no, mantener la actual o usar imagen_actual
    if (req.file) {
      // Si se subió un archivo nuevo, usar ese
      campos.push('imagen = ?');
      valores.push(req.file.filename);
      console.log('Nueva imagen guardada:', req.file.filename);
    } else if (imagen_actual !== undefined && imagen_actual !== null && imagen_actual !== '') {
      // Si se envió imagen_actual, mantener esa
      campos.push('imagen = ?');
      valores.push(imagen_actual);
      console.log('Manteniendo imagen actual:', imagen_actual);
    } else if (imagen !== undefined) {
      // Si se envió imagen como string (nombre de archivo)
      campos.push('imagen = ?');
      valores.push(imagen);
      console.log('Imagen actualizada:', imagen);
    }
    // Si no hay ninguna de las anteriores, no se actualiza el campo imagen
    if (inventario_inicial !== undefined) {
      campos.push('inventario_inicial = ?');
      valores.push(inventario_inicial);
    }
    if (stock_minimo !== undefined) {
      campos.push('stock_minimo = ?');
      valores.push(stock_minimo);
    }
    if (costo !== undefined) {
      campos.push('costo = ?');
      valores.push(costo);
    }
    if (unidad_medida !== undefined) {
      campos.push('unidad_medida = ?');
      valores.push(unidad_medida);
    }
    if (estado !== undefined) {
      campos.push('estado = ?');
      valores.push(estado);
    }
    if (id_categoria !== undefined) {
      campos.push('id_categoria = ?');
      valores.push(id_categoria);
    }
    
    // Verificar si el campo mostrar_en_catalogo existe antes de actualizarlo
    if (mostrar_en_catalogo !== undefined) {
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      if (columnCheck[0]?.existe > 0) {
        campos.push('mostrar_en_catalogo = ?');
        valores.push(mostrar_en_catalogo === 'true' || mostrar_en_catalogo === true ? 1 : 0);
      }
    }

    // Agregar fecha de actualización
    campos.push('fecha_actualizacion = NOW()');
    valores.push(id);

    if (campos.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    await db.query(
      `UPDATE productos SET ${campos.join(', ')} WHERE id_producto = ?`,
      valores
    );

    // Obtener el producto actualizado para devolverlo
    const [productoActualizado] = await db.query(
      `SELECT * FROM productos WHERE id_producto = ?`,
      [id]
    );

    console.log('Producto actualizado correctamente');
    console.log('Producto actualizado:', productoActualizado[0]);

    // Actualizar estado de productos con stock 0 después de actualizar producto
    await this.actualizarEstadoProductosSinStock();

    res.json({ 
      mensaje: 'Producto actualizado correctamente',
      producto: productoActualizado[0]
    });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({ error: 'Error al actualizar producto', detalles: error.message });
    }
  }

  // Endpoint de diagnóstico para verificar imágenes
  async verificarImagenes(req, res) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const productosDir = path.join(__dirname, '../../uploads/productos');
      const [productos] = await db.query(
        `SELECT id_producto, nombre_producto, imagen 
         FROM productos 
         WHERE imagen IS NOT NULL AND imagen != '' AND imagen != 'null'
         ORDER BY fecha_creacion DESC 
         LIMIT 20`
      );
      
      const resultados = productos.map(producto => {
        const rutaArchivo = path.join(productosDir, producto.imagen);
        const existe = fs.existsSync(rutaArchivo);
        
        return {
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          imagen: producto.imagen,
          existe: existe,
          ruta_fisica: rutaArchivo,
          url_acceso: `http://localhost:3000/uploads/productos/${producto.imagen}`
        };
      });
      
      const archivosFisicos = fs.existsSync(productosDir) 
        ? fs.readdirSync(productosDir).filter(f => 
            fs.statSync(path.join(productosDir, f)).isFile()
          )
        : [];
      
      res.json({
        carpeta_productos: productosDir,
        carpeta_existe: fs.existsSync(productosDir),
        total_productos_con_imagen: productos.length,
        productos_verificados: resultados,
        archivos_fisicos: archivosFisicos.slice(0, 10), // Primeros 10
        total_archivos_fisicos: archivosFisicos.length
      });
    } catch (error) {
      console.error('Error al verificar imágenes:', error);
      res.status(500).json({ 
        error: 'Error al verificar imágenes', 
        detalles: error.message 
      });
    }
  }

  // Obtener productos más vendidos
  async obtenerProductosMasVendidos(req, res) {
    try {
      const { limite = 4 } = req.query; // Por defecto 4 productos
      
      // Consulta para obtener productos más vendidos basado en detalle_pedido
      // Solo considerar pedidos completados (estado = 'Entregado' o 'Pagado')
      const [productosVendidos] = await db.query(
        `SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_producto,
          p.imagen,
          p.unidad_medida,
          p.stock_actual,
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre,
          COALESCE(SUM(dp.cantidad), 0) AS total_vendido,
          COALESCE(SUM(dp.subtotal), 0) AS total_ingresos
        FROM detalle_pedido dp
        INNER JOIN pedidos ped ON dp.id_pedido = ped.id_pedido
        INNER JOIN productos p ON dp.id_producto = p.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE ped.estado IN ('Entregado', 'Pagado')
        GROUP BY p.id_producto, p.nombre_producto, p.descripcion, p.precio_producto, 
                 p.imagen, p.unidad_medida, p.stock_actual, p.id_categoria, c.nombre_categoria
        HAVING total_vendido > 0
        ORDER BY total_vendido DESC
        LIMIT ?`,
        [parseInt(limite)]
      );

      // Si no hay productos vendidos, devolver array vacío
      res.json({ productos: productosVendidos || [] });
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      res.status(500).json({ 
        error: 'Error al obtener productos más vendidos', 
        detalles: error.message 
      });
    }
  }

  // Eliminar producto (eliminación física con referencias)
  // Eliminar producto: puede ser eliminación física o solo ocultar del catálogo
  // Si se pasa ?fisica=true, se elimina físicamente de la base de datos
  // Si no, solo se oculta del catálogo (comportamiento por defecto)
  async eliminarProducto(req, res) {
    const { id } = req.params;
    const { fisica } = req.query; // Parámetro para eliminación física
    
    try {
      // Verificar que el producto existe
      const [producto] = await db.query(
        'SELECT id_producto, nombre_producto, mostrar_en_catalogo FROM productos WHERE id_producto = ?',
        [id]
      );

      if (producto.length === 0) {
        console.log(`Producto con ID ${id} no encontrado`);
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      console.log(`Producto encontrado: ${producto[0].nombre_producto}`);
      
      // Si se solicita eliminación física
      if (fisica === 'true' || fisica === true) {
        console.log(`ELIMINACIÓN FÍSICA del producto con ID: ${id}`);
        
        // Obtener una conexión del pool para usar transacciones
        const connection = await db.getConnection();
        
        try {
          // Iniciar transacción
          await connection.beginTransaction();
          
          console.log(`Iniciando transacción para eliminar producto y todas sus referencias...`);
          
          // Contadores para reporte
          let registrosEliminados = {
            detalle_pedido: 0,
            ingredientes_receta: 0,
            inventario: 0,
            detalle_compra: 0,
            recetas: 0
          };
          
          // 1. Eliminar referencias en detalle_pedido
          try {
            const [resultPedidos] = await connection.query(
              'DELETE FROM detalle_pedido WHERE id_producto = ?',
              [id]
            );
            registrosEliminados.detalle_pedido = resultPedidos.affectedRows;
            if (resultPedidos.affectedRows > 0) {
              console.log(`  Eliminados ${resultPedidos.affectedRows} registro(s) de detalle_pedido`);
            }
          } catch (error) {
            // Si la tabla no existe o no hay registros, continuar
            if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== '42S02') {
              console.log(`  No se pudo eliminar de detalle_pedido (puede que no exista): ${error.message}`);
            }
          }
          
          // 2. Eliminar referencias en ingredientes_receta
          try {
            const [resultIngredientes] = await connection.query(
              'DELETE FROM ingredientes_receta WHERE id_producto = ?',
              [id]
            );
            registrosEliminados.ingredientes_receta = resultIngredientes.affectedRows;
            if (resultIngredientes.affectedRows > 0) {
              console.log(`  Eliminados ${resultIngredientes.affectedRows} registro(s) de ingredientes_receta`);
            }
          } catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== '42S02') {
              console.log(`  No se pudo eliminar de ingredientes_receta (puede que no exista): ${error.message}`);
            }
          }
          
          // 3. Eliminar referencias en inventario
          try {
            const [resultInventario] = await connection.query(
              'DELETE FROM inventario WHERE id_producto = ?',
              [id]
            );
            registrosEliminados.inventario = resultInventario.affectedRows;
            if (resultInventario.affectedRows > 0) {
              console.log(`  Eliminados ${resultInventario.affectedRows} registro(s) de inventario`);
            }
          } catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== '42S02') {
              console.log(`  No se pudo eliminar de inventario (puede que no exista): ${error.message}`);
            }
          }
          
          // 4. Eliminar referencias en detalle_compra (ESTA ES LA CRÍTICA)
          try {
            const [resultCompras] = await connection.query(
              'DELETE FROM detalle_compra WHERE id_producto = ?',
              [id]
            );
            registrosEliminados.detalle_compra = resultCompras.affectedRows;
            if (resultCompras.affectedRows > 0) {
              console.log(`  Eliminados ${resultCompras.affectedRows} registro(s) de detalle_compra`);
            }
          } catch (error) {
            // Si hay un error aquí, hacer rollback
            console.error(`  Error al eliminar de detalle_compra: ${error.message}`);
            throw error;
          }
          
          // 5. Eliminar referencias en recetas (si el producto es producto_final)
          try {
            const [resultRecetas] = await connection.query(
              'DELETE FROM recetas WHERE id_producto_final = ?',
              [id]
            );
            registrosEliminados.recetas = resultRecetas.affectedRows;
            if (resultRecetas.affectedRows > 0) {
              console.log(`  Eliminadas ${resultRecetas.affectedRows} receta(s) que usaban este producto como producto final`);
            }
          } catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== '42S02') {
              console.log(`  No se pudo eliminar de recetas (puede que no exista): ${error.message}`);
            }
          }
          
          // 6. Finalmente, eliminar el producto
          const [resultado] = await connection.query(
            'DELETE FROM productos WHERE id_producto = ?',
            [id]
          );
          
          if (resultado.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Producto no encontrado o ya fue eliminado' });
          }
          
          // Confirmar transacción
          await connection.commit();
          connection.release();
          
          console.log(`Producto eliminado físicamente: ${resultado.affectedRows} fila(s) eliminada(s)`);
          console.log(`Resumen de eliminaciones:`, registrosEliminados);
          
          res.json({ 
            mensaje: 'Producto eliminado completamente de la base de datos',
            eliminado: true,
            producto: {
              id_producto: id,
              nombre_producto: producto[0].nombre_producto
            },
            referencias_eliminadas: registrosEliminados
          });
          
        } catch (error) {
          // Hacer rollback en caso de error
          await connection.rollback();
          connection.release();
          
          console.error('Error al eliminar producto físicamente:', error);
          
          // Verificar si es un error de restricción de clave foránea
          if (error.code === 'ER_ROW_IS_REFERENCED_2' || 
              error.code === 1451 ||
              error.message.includes('foreign key constraint') ||
              error.message.includes('Cannot delete or update a parent row')) {
            return res.status(409).json({ 
              error: 'No se puede eliminar el producto porque está siendo utilizado en otras partes del sistema',
              detalles: 'El producto tiene compras, pedidos u otros registros asociados que no pudieron eliminarse. Por favor, verifica las relaciones en la base de datos.',
              codigo: 'PRODUCTO_CON_REFERENCIAS',
              error_tecnico: error.message
            });
          }
          
          throw error;
        }
        
        return; // Salir de la función si se eliminó físicamente
      }
      
      // Si no se solicita eliminación física, solo ocultar del catálogo (comportamiento por defecto)
      console.log(`Ocultando producto del catálogo con ID: ${id}`);
      
      // Verificar si el campo mostrar_en_catalogo existe
      const [columnCheck] = await db.query(
        `SELECT COUNT(*) as existe 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'productos' 
         AND COLUMN_NAME = 'mostrar_en_catalogo'`
      );
      const tieneCampo = columnCheck[0]?.existe > 0;
      
      if (!tieneCampo) {
        // Si no existe el campo, solo cambiar el estado a inactivo
        console.log(`Campo mostrar_en_catalogo no existe, cambiando estado a inactivo`);
        const [resultado] = await db.query(
          'UPDATE productos SET estado = ? WHERE id_producto = ?',
          ['inactivo', id]
        );
        
        console.log(`Estado cambiado a inactivo: ${resultado.affectedRows} fila(s) actualizada(s)`);
        
        res.json({ 
          mensaje: 'Producto oculto del catálogo correctamente (estado cambiado a inactivo)',
          nota: 'El producto y su inventario se mantienen en la base de datos',
          producto: {
            id_producto: id,
            nombre_producto: producto[0].nombre_producto,
            estado: 'inactivo'
          }
        });
        return;
      }
      
      // Ocultar del catálogo estableciendo mostrar_en_catalogo = false y estado = 'inactivo'
      // NO eliminamos el producto físicamente para preservar el inventario
      console.log(`Ocultando producto del catálogo (mostrar_en_catalogo = false, estado = inactivo)...`);
      const [resultado] = await db.query(
        'UPDATE productos SET mostrar_en_catalogo = ?, estado = ? WHERE id_producto = ?',
        [false, 'inactivo', id]
      );
      
      console.log(`Producto oculto del catálogo: ${resultado.affectedRows} fila(s) actualizada(s)`);
      console.log(`El producto y su inventario se mantienen en la base de datos`);
      
      res.json({ 
        mensaje: 'Producto oculto del catálogo correctamente',
        nota: 'El producto y toda su información de inventario se mantienen en la base de datos. Solo se ocultó del catálogo público.',
        producto: {
          id_producto: id,
          nombre_producto: producto[0].nombre_producto,
          mostrar_en_catalogo: false,
          estado: 'inactivo'
        }
      });
      
    } catch (error) {
      console.error('Error detallado al eliminar/ocultar producto:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      
      res.status(500).json({ 
        error: 'Error al eliminar/ocultar producto',
        detalles: error.message
      });
    }
  }
}

module.exports = ProductosController;
