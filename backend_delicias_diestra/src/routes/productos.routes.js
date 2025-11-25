const express = require("express");
const ProductosController = require("../controllers/productos.controller");

const router = express.Router();
const productosController = new ProductosController();

router.get("/catalogo", (req, res) =>
  productosController.obtenerProductosCatalogo(req, res)
);
router.get("/catalogo-admin", (req, res) =>
  productosController.obtenerProductosCatalogoAdmin(req, res)
);
router.get("/verificar-imagenes", (req, res) =>
  productosController.verificarImagenes(req, res)
);
router.get("/mas-vendidos", (req, res) =>
  productosController.obtenerProductosMasVendidos(req, res)
);
router.get("/", (req, res) => productosController.obtenerProductos(req, res));
router.get("/:id", (req, res) =>
  productosController.obtenerProductoPorId(req, res)
);
router.post("/", (req, res) => productosController.crearProducto(req, res));
router.put("/:id", (req, res) =>
  productosController.actualizarProducto(req, res)
);
router.delete("/:id", (req, res) =>
  productosController.eliminarProducto(req, res)
);

module.exports = router;
