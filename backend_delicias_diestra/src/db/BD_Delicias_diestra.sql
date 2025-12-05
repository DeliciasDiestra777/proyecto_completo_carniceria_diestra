-- =======================================
-- BASE DE DATOS: DELICIAS DIESTRA 
-- =======================================
CREATE DATABASE BD_delicias_diestra 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE BD_delicias_diestra;

-- ========================
-- ROLES / PERMISOS / USUARIOS
-- ========================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre_permiso VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE rol_permiso (
    id_rol_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    permiso_id INT NOT NULL,
    CONSTRAINT fk_rolperm_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    CONSTRAINT fk_rolperm_perm FOREIGN KEY (permiso_id) REFERENCES permisos(id_permiso)
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre_usuario VARCHAR(100) NOT NULL,
    email VARCHAR(300) UNIQUE NOT NULL,
    clave VARCHAR(500) NOT NULL,
    telefono VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    fecha_registro DATETIME DEFAULT NOW(),
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- ========================
-- CLIENTES
-- ========================
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    apellido_cliente VARCHAR(100) NOT NULL,
    tipo_documento ENUM('CC', 'CE', 'NIT') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    telefono VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    email VARCHAR(300) UNIQUE,
    clave VARCHAR(500) NOT NULL,
    fecha_registro DATETIME DEFAULT NOW(),
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    -- Clave única compuesta: permite el mismo número con diferentes tipos de documento
    CONSTRAINT uk_cliente_documento UNIQUE (tipo_documento, numero_documento)
);

-- ========================
-- CATEGORÍAS Y PRODUCTOS
-- ========================
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    nombre_producto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_producto DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    unidad_medida ENUM('kg', 'lb', 'gr', 'unidad') NOT NULL,
    inventario_inicial DECIMAL(10,3) NOT NULL DEFAULT 0,
    entrada_compras DECIMAL(10,3) NOT NULL DEFAULT 0,
    salida_pedidos DECIMAL(10,3) NOT NULL DEFAULT 0,
    stock_actual DECIMAL(10,3) GENERATED ALWAYS AS 
        (inventario_inicial + entrada_compras - salida_pedidos) STORED,
    stock_minimo DECIMAL(10,3) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    costo DECIMAL(10,2) DEFAULT 0,
    estado ENUM('activo','inactivo') DEFAULT 'activo',

    -- ⭐ NUEVO CAMPO INTEGRADO
    mostrar_en_catalogo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- ========================
-- PROVEEDORES Y COMPRAS
-- ========================
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nombre_proveedor VARCHAR(150),
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    metodo_pago ENUM('Efectivo', 'Transferencia') DEFAULT 'Efectivo',
    tiempo_entrega_dias INT,
    observaciones TEXT,
    CONSTRAINT fk_proveedores_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    fecha_compra DATETIME DEFAULT NOW(),
    total_compra DECIMAL(12,2) DEFAULT 0,
    CONSTRAINT fk_compras_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

CREATE TABLE detalle_compra (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad ENUM('kg','lb','gr','unidad') NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_compra) STORED,
    CONSTRAINT fk_detallecompra_compra FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    CONSTRAINT fk_detallecompra_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- ========================
-- PEDIDOS Y DETALLES
-- ========================
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    fecha_pedido DATETIME DEFAULT NOW(),
    metodo_pago ENUM('Transferencia','Efectivo'),
    total DECIMAL(10,2),
    estado ENUM('Pendiente','Pagado','Entregado','Cancelado') DEFAULT 'Pendiente',
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE detalle_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_producto INT,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad ENUM('kg','lb','gr','unidad') NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    CONSTRAINT fk_detallepedido_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_detallepedido_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);


-- ========================================
-- TABLA DE NOTIFICACIONES DE PEDIDOS
-- ========================================
CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_detalle_pedido TEXT, -- JSON array de IDs de detalle_pedido
    nombre_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(20),
    email_cliente VARCHAR(255),
    direccion_cliente TEXT,
    productos TEXT NOT NULL, -- JSON array con detalles de productos
    total_pedido DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50),
    estado ENUM('pendiente', 'en_proceso', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    comprobante_verificado BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_verificacion DATETIME NULL,
    observaciones TEXT,
    CONSTRAINT fk_notificaciones_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    INDEX idx_estado (estado),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA DE NOTIFICACIONES PARA CLIENTES
-- ========================================
CREATE TABLE notificaciones_cliente (
    id_notificacion_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_cliente INT,
    telefono_cliente VARCHAR(20),
    email_cliente VARCHAR(255),
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura DATETIME NULL,
    CONSTRAINT fk_notificaciones_cliente_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_cliente_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    INDEX idx_cliente (id_cliente),
    INDEX idx_telefono (telefono_cliente),
    INDEX idx_leida (leida),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================
-- RECETAS Y PRODUCCIÓN
-- ========================
CREATE TABLE recetas (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    nombre_receta VARCHAR(150) NOT NULL,
    descripcion TEXT,
    rendimiento DECIMAL(10,2),
    unidad ENUM('kg','lb','gr','unidad'),
    estado_receta ENUM('activa', 'inactiva') DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT NOW(),
    ingrediente_base VARCHAR(150),
    cantidad_base DECIMAL(10,3),
    unidad_base ENUM('kg','lb','gr','unidad'),
    observaciones TEXT
);

CREATE TABLE producciones (
    id_produccion INT AUTO_INCREMENT PRIMARY KEY,
    id_receta INT NOT NULL,
    referencia VARCHAR(200),
    cantidad_producida DECIMAL(10,3) NOT NULL,
    unidad ENUM('kg','lb','gr','unidad') NOT NULL,
    factor_conversion DECIMAL(10,3) DEFAULT 1.0,
    rendimiento DECIMAL(10,3) DEFAULT 1.0,
    fecha_produccion DATETIME DEFAULT NOW(),
    observaciones TEXT,
    CONSTRAINT fk_producciones_receta FOREIGN KEY (id_receta) REFERENCES recetas(id_receta)
);

CREATE TABLE detalle_produccion (
    id_detalle_produccion INT AUTO_INCREMENT PRIMARY KEY,
    id_produccion INT NOT NULL,
    id_producto_entrada INT NOT NULL,               
    id_producto_salida INT DEFAULT NULL,
    cantidad_usada DECIMAL(10,3) NOT NULL,
    cantidad_generada DECIMAL(10,3) DEFAULT 0,
    unidad ENUM('kg','lb','gr','unidad') NOT NULL,
    costo_unitario DECIMAL(10,2) DEFAULT NULL,
    CONSTRAINT fk_detprod_produccion FOREIGN KEY (id_produccion) REFERENCES producciones(id_produccion) ON DELETE CASCADE,
    CONSTRAINT fk_detprod_prod_entrada FOREIGN KEY (id_producto_entrada) REFERENCES productos(id_producto)
);

CREATE TABLE ingredientes_receta (
    id_ingrediente INT AUTO_INCREMENT PRIMARY KEY,
    id_receta INT NOT NULL,
    nombre_ingrediente VARCHAR(150) NOT NULL,
    cantidad DECIMAL(10, 3) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_receta) REFERENCES recetas(id_receta) ON DELETE CASCADE,
    INDEX idx_id_receta (id_receta)
);

-- ========================
-- TRIGGERS FUNCIONALES
-- ========================
DELIMITER $$

CREATE TRIGGER trg_after_insert_detalle_compra
AFTER INSERT ON detalle_compra
FOR EACH ROW
BEGIN
    UPDATE productos
    SET entrada_compras = COALESCE(entrada_compras,0) + NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END$$

CREATE TRIGGER trg_after_insert_detalle_pedido
AFTER INSERT ON detalle_pedido
FOR EACH ROW
BEGIN
    UPDATE productos
    SET salida_pedidos = COALESCE(salida_pedidos,0) + NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END$$

CREATE TRIGGER trg_before_insert_detalle_produccion
BEFORE INSERT ON detalle_produccion
FOR EACH ROW
BEGIN
    DECLARE v_stock DECIMAL(10,3);
    SELECT stock_actual INTO v_stock FROM productos WHERE id_producto = NEW.id_producto_entrada;
    IF v_stock < NEW.cantidad_usada THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para materia prima en producción.';
    END IF;
END$$

CREATE TRIGGER trg_after_insert_detalle_produccion
AFTER INSERT ON detalle_produccion
FOR EACH ROW
BEGIN
    UPDATE productos
    SET salida_pedidos = salida_pedidos + NEW.cantidad_usada
    WHERE id_producto = NEW.id_producto_entrada;

    IF NEW.id_producto_salida IS NOT NULL AND NEW.cantidad_generada > 0 THEN
        UPDATE productos
        SET entrada_compras = entrada_compras + NEW.cantidad_generada
        WHERE id_producto = NEW.id_producto_salida;
    END IF;
END$$

DELIMITER ;

-- ========================
-- DATOS INICIALES
-- ========================

-- ROLES
INSERT INTO roles (nombre_rol) VALUES 
('Administrador'),
('Empleado');

-- PERMISOS
INSERT INTO permisos (nombre_permiso, descripcion) VALUES
('Crear', 'Permite crear nuevos registros'),
('Leer', 'Permite visualizar registros');

-- ASIGNAR PERMISOS
INSERT INTO rol_permiso (id_rol, permiso_id)
SELECT 1, id_permiso FROM permisos;

INSERT INTO rol_permiso (id_rol, permiso_id)
VALUES (2, 2);

-- USUARIOS
INSERT INTO usuarios (nombre_usuario, email, clave, id_rol)
VALUES 
('Administrador Principal', 'admin@carniceria.com', '$2b$10$vWf1qwvg5TS53CQxmOw1muMthAlFwYMkJ/fxOBUG4oYZwFjqqSJNa', 1),
('Empleado', 'empleado@gmail.com', '$2b$10$wLyuMd5mP.D5YekcUa2uSOQIRXvXFyKmpz3go/ryHgHU1ihTtioa6', 2);

-- CLIENTES
INSERT INTO clientes (nombre_cliente, apellido_cliente, tipo_documento, numero_documento, telefono, direccion, email, clave)
VALUES
('Jonathan','Roca','CC','12345678977','+573162388806','cll59','cliente@carniceria.com','$2b$10$K1Ls7yv6ZoM9LtSu.E9Yd.AyEtCLvz42S6v/RGQC1HwfAA1vSh0ey');

-- CATEGORÍAS
INSERT INTO categorias (nombre_categoria, descripcion)
VALUES
('Carnes', 'Todo tipo de carnes frescas'),
('Embutidos', 'Chorizos, salchichas y embutidos');



