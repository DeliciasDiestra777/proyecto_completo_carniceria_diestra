const express = require('express');
const InventarioController = require('../controllers/inventario.controller');

const router = express.Router();
const inventarioController = new InventarioController();

router.get('/', (req, res) => inventarioController.obtenerInventario(req, res));
router.get('/:id', (req, res) => inventarioController.obtenerInventarioPorId(req, res));
router.post('/', (req, res) => inventarioController.agregarInventario(req, res));
router.put('/:id', (req, res) => inventarioController.actualizarInventario(req, res));
router.delete('/:id', (req, res) => inventarioController.eliminarInventario(req, res));

module.exports = router;




