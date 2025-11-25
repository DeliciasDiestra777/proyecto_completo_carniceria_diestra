const express = require('express');
const ComprasController = require('../controllers/compras.controller');

const router = express.Router();
const comprasController = new ComprasController();

router.get('/', (req, res) => comprasController.obtenerCompras(req, res));
router.get('/:id', (req, res) => comprasController.obtenerCompraPorId(req, res));
router.post('/', (req, res) => comprasController.agregarCompra(req, res));
router.put('/:id', (req, res) => comprasController.actualizarCompra(req, res));
router.delete('/:id', (req, res) => comprasController.eliminarCompra(req, res));

module.exports = router;

