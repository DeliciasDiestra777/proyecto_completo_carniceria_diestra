const express = require('express');
const DetalleCompraController = require('../controllers/detalle_compra.controller');

const router = express.Router();
const detalleCompraController = new DetalleCompraController();

router.get('/', (req, res) => detalleCompraController.obtenerDetallesCompra(req, res));
router.get('/compra/:id_compra', (req, res) => detalleCompraController.obtenerDetallesPorCompra(req, res));
router.get('/:id', (req, res) => detalleCompraController.obtenerDetalleCompraPorId(req, res));
router.post('/', (req, res) => detalleCompraController.agregarDetalleCompra(req, res));
router.put('/:id', (req, res) => detalleCompraController.actualizarDetalleCompra(req, res));
router.delete('/:id', (req, res) => detalleCompraController.eliminarDetalleCompra(req, res));

module.exports = router;




