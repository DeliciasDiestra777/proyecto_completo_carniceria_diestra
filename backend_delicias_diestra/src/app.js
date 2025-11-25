require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
            filePath.endsWith('.png') || filePath.endsWith('.gif') || 
            filePath.endsWith('.webp')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

const uploadsDir = path.join(__dirname, "../uploads");
const productosDir = path.join(__dirname, "../uploads/productos");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(productosDir)) {
  fs.mkdirSync(productosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/productos");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const multerMiddleware = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    upload.single("imagen")(req, res, (err) => {
      if (err) {
        console.error("Error en multer:", err.message);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  } else {
    next();
  }
};

app.use("/api/productos", multerMiddleware);

// Rutas
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/permisos", require("./routes/permisos.routes"));
app.use("/api/rol-permiso", require("./routes/roles_permisos.routes"));
app.use("/api/roles", require("./routes/roles.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/categorias", require("./routes/categorias.routes"));
app.use("/api/clientes", require("./routes/clientes.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/proveedores", require("./routes/proveedores.routes"));
app.use("/api/compras", require("./routes/compras.routes"));
app.use("/api/detalle-compra", require("./routes/detalle_compra.routes"));
app.use("/api/pedidos", require("./routes/pedidos.routes"));
app.use("/api/detalle-pedido", require("./routes/detalle_pedido.routes"));
app.use("/api/recetas", require("./routes/recetas.routes"));
app.use("/api/producciones", require("./routes/producciones.routes"));
app.use(
  "/api/detalle-produccion",
  require("./routes/detalle_produccion.routes")
);
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/notificaciones", require("./routes/notificaciones.routes"));
app.use("/api/notificaciones-cliente", require("./routes/notificaciones_cliente.routes"));

module.exports = app;
