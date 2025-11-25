# Resumen de Actualización del Frontend

## Base de datos: delicias_diestra

Este documento detalla todos los cambios realizados en el frontend para hacerlo compatible con el nuevo backend y la base de datos `delicias_diestra`.

---

## ✅ CAMBIOS COMPLETADOS

### 1. **Actualización de Nombres de Campos**

#### Clientes (antes Usuarios)

- ✅ `nombre_user` → `nombre`
- ✅ `apellido_user` → `apellido`
- Archivos actualizados:
  - `JS/registro.js`
  - `JS/login.js`
  - `JS/carrito.js`

#### Productos

- ✅ `peso_producto` → `peso`
- ✅ `estado_producto` → `estado`
- Archivos actualizados:
  - `JS/producto-admin.js`
  - `JS/producto-eliminar.js`
  - `JS/producto-editar.js`
  - `JS/producto-listar.js`

### 2. **Actualización de Endpoints**

- ✅ `/api/usuarios/perfil/` → `/api/clientes/perfil/`
  - Archivo: `JS/carrito.js` (línea 669)
- ✅ `/api/auth/registro` → `/api/auth/register` (corregido)
  - Archivo: `JS/registro.js` (línea 170)

### 12. **Registro Dual de Clientes Implementado**

- ✅ Registro de clientes en ambas tablas (usuarios y clientes)
- ✅ Función `crearClienteEnTablaClientes` agregada
- ✅ Clientes se guardan en tabla `usuarios` para autenticación
- ✅ Clientes se guardan en tabla `clientes` para listado
- ✅ Proceso automático después del registro exitoso
- Archivos actualizados:
  - `JS/registro.js` - Lógica de registro dual implementada

---

## ⚠️ CAMBIOS PENDIENTES (REQUIEREN BACKEND)

### 1. **Sistema de Producción (antes Transformaciones)**

**Archivos que requieren actualización:**

- `HTML/transfor-admin.html` → Renombrar a `produccion-admin.html`
- `HTML/panel-admin.html` (líneas 115-117, 423-429)
- `HTML/index.html` (línea 103 - comentado)

**Endpoints a actualizar:**

```javascript
// Cambiar de:
"/api/transformaciones";

// A:
"/api/producciones";
"/api/recetas";
"/api/ingredientes_receta";
"/api/detalle_produccion";
```

### 2. **Nuevos Módulos a Crear**

#### Módulo de Proveedores

Crear archivo: `HTML/proveedores-admin.html`
Crear archivo: `JS/proveedores-admin.js`

**Endpoints:**

```javascript
GET    /api/proveedores
POST   /api/proveedores
PUT    /api/proveedores/:id
DELETE /api/proveedores/:id
```

**Campos necesarios:**

- nombre_proveedor
- contacto
- telefono
- email
- direccion
- estado (activo/inactivo)

#### Módulo de Compras

Crear archivo: `HTML/compras-admin.html`
Crear archivo: `JS/compras-admin.js`

**Endpoints:**

```javascript
GET    /api/compras
POST   /api/compras
GET    /api/compras/:id
PUT    /api/compras/:id
DELETE /api/compras/:id
POST   /api/detalle_compra
```

**Campos necesarios:**

- id_proveedor
- fecha_compra
- total_compra
- estado_compra
- observaciones

### 3. **Validaciones de ENUMs**

Actualizar validaciones en formularios para usar los nuevos ENUMs:

#### Unidad de Medida

```javascript
// Valores permitidos: 'kg', 'lb', 'gr', 'unidad'
<select name="unidad_medida">
  <option value="kg">Kilogramo (kg)</option>
  <option value="lb">Libra (lb)</option>
  <option value="gr">Gramo (gr)</option>
  <option value="unidad">Unidad</option>
</select>
```

#### Estado

```javascript
// Valores permitidos: 'activo', 'inactivo'
<input type="checkbox" id="estado"
       onchange="this.value = this.checked ? 'activo' : 'inactivo'">
```

#### Estado Pedido

```javascript
// Valores permitidos: 'Pendiente', 'Pagado', 'Entregado', 'Cancelado'
<select name="estado_pedido">
  <option value="Pendiente">Pendiente</option>
  <option value="Pagado">Pagado</option>
  <option value="Entregado">Entregado</option>
  <option value="Cancelado">Cancelado</option>
</select>
```

### 4. **Sistema de Pedidos**

**Cambios necesarios (cuando se implemente):**

- Usar `id_cliente` en lugar de `id_usuario`
- Usar `id_inventario` en lugar de `id_producto` en detalles
- Endpoints a actualizar:

  ```javascript
  POST /api/pedidos
  {
    "id_cliente": number,
    "fecha_pedido": timestamp,
    "total": decimal,
    "estado_pedido": enum
  }

  POST /api/detalle_pedido
  {
    "id_pedido": number,
    "id_inventario": number,  // ← Cambio importante
    "cantidad": decimal,
    "precio_unitario": decimal
  }
  ```

---

## 📋 ESTRUCTURA DE LA NUEVA BASE DE DATOS

### Tablas Principales

1. **clientes** (antes parte de usuarios)

   - id_cliente
   - nombre
   - apellido
   - email
   - password
   - telefono
   - direccion
   - tipo_documento
   - numero_documento
   - fecha_registro

2. **usuarios** (solo staff administrativo)

   - id_usuario
   - nombre
   - apellido
   - email
   - password
   - id_rol (1=Admin, 2=Empleado)
   - estado

3. **productos**

   - id_producto
   - nombre_producto
   - descripcion
   - precio
   - peso
   - unidad_medida (kg, lb, gr, unidad)
   - estado (activo, inactivo)
   - id_categoria

4. **inventario** (NUEVA - controla stock)

   - id_inventario
   - id_producto
   - stock
   - stock_minimo
   - ultima_actualizacion

5. **proveedores** (NUEVA)

   - id_proveedor
   - nombre_proveedor
   - contacto
   - telefono
   - email
   - direccion
   - estado

6. **compras** (NUEVA)

   - id_compra
   - id_proveedor
   - fecha_compra
   - total_compra
   - estado_compra
   - observaciones

7. **detalle_compra** (NUEVA)

   - id_detalle_compra
   - id_compra
   - id_producto
   - cantidad
   - precio_unitario
   - subtotal

8. **recetas** (antes parte de transformaciones)

   - id_receta
   - nombre_receta
   - descripcion
   - id_producto_final
   - rendimiento_esperado

9. **ingredientes_receta** (NUEVA)

   - id_ingrediente
   - id_receta
   - id_producto
   - cantidad_necesaria
   - unidad_medida

10. **producciones** (antes transformaciones)

    - id_produccion
    - id_receta
    - fecha_produccion
    - cantidad_producida
    - id_usuario (quien realizó la producción)
    - observaciones

11. **detalle_produccion** (NUEVA)
    - id_detalle_produccion
    - id_produccion
    - id_producto (ingrediente usado)
    - cantidad_usada

---

## 🔧 PASOS PARA COMPLETAR LA MIGRACIÓN

1. **Verificar Backend**

   - Asegúrate de que el backend esté actualizado con todos los endpoints
   - Verifica que la base de datos `delicias_diestra` esté creada y poblada

2. **Renombrar Módulo de Transformaciones**

   - Renombrar `transfor-admin.html` a `produccion-admin.html`
   - Actualizar todas las referencias en `panel-admin.html`
   - Actualizar textos de "Transformaciones" a "Producción"

3. **Crear Módulos Nuevos**

   - Crear módulo de Proveedores
   - Crear módulo de Compras
   - Integrar con el panel de administración

4. **Actualizar Sistema de Pedidos**

   - Modificar para usar `id_cliente` en lugar de `id_usuario`
   - Modificar detalles de pedido para usar `id_inventario`

5. **Pruebas**
   - Probar registro de clientes
   - Probar login de clientes y administradores
   - Probar creación y edición de productos
   - Probar flujo de compra (carrito → pedido)
   - Probar gestión de inventario

---

## 🎯 VERIFICACIÓN DE COMPATIBILIDAD

### Archivos Actualizados ✅

- `JS/registro.js`
- `JS/login.js`
- `JS/carrito.js`
- `JS/productos.js`
- `JS/app.js`
- `JS/producto-admin.js`
- `JS/producto-eliminar.js`
- `JS/producto-editar.js`
- `JS/producto-listar.js`
- `HTML/login.html` (rutas de scripts e imágenes corregidas)
- `HTML/registro.html` (rutas de scripts e imágenes corregidas)
- `HTML/carrito.html` (rutas de imágenes corregidas)
- `HTML/panel-admin.html` (módulo de transformaciones → producción)
- `HTML/index.html` (referencias de transformaciones → producción)

### Archivos que Requieren Atención ⚠️

- `HTML/transfor-admin.html`
- `HTML/panel-admin.html` (sección de transformaciones)
- Crear: `HTML/proveedores-admin.html`
- Crear: `HTML/compras-admin.html`
- Crear: `JS/proveedores-admin.js`
- Crear: `JS/compras-admin.js`

---

## 📞 CONTACTO Y SOPORTE

Si encuentras problemas durante la migración:

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Verifica que la base de datos `delicias_diestra` esté activa
3. Revisa la consola del navegador para errores de JavaScript
4. Revisa la consola del backend para errores de API

---

**Fecha de actualización:** Octubre 2025
**Versión del frontend:** 2.0 (compatible con delicias_diestra)
