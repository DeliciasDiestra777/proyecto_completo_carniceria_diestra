const express = require('express');
const PedidosController = require('../controllers/pedidos.controller');

const router = express.Router();
const pedidosController = new PedidosController();

router.get('/', (req, res) => pedidosController.obtenerPedidos(req, res));
router.get('/cliente/:id_cliente', (req, res) => pedidosController.obtenerPedidosPorCliente(req, res));
router.get('/:id', (req, res) => pedidosController.obtenerPedidoPorId(req, res));
router.post('/', (req, res) => pedidosController.agregarPedido(req, res));
router.put('/:id', (req, res) => pedidosController.actualizarPedido(req, res));
router.delete('/:id', (req, res) => pedidosController.eliminarPedido(req, res));

module.exports = router;




