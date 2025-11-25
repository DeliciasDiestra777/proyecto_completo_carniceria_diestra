const express = require('express');
const DetallePedidoController = require('../controllers/detalle_pedido.controller');

const router = express.Router();
const detallePedidoController = new DetallePedidoController();

router.get('/', (req, res) => detallePedidoController.obtenerDetallesPedido(req, res));
router.get('/pedido/:id_pedido', (req, res) => detallePedidoController.obtenerDetallesPorPedido(req, res));
router.get('/:id', (req, res) => detallePedidoController.obtenerDetallePedidoPorId(req, res));
router.post('/', (req, res) => detallePedidoController.agregarDetallePedido(req, res));
router.put('/:id', (req, res) => detallePedidoController.actualizarDetallePedido(req, res));
router.delete('/:id', (req, res) => detallePedidoController.eliminarDetallePedido(req, res));

module.exports = router;




