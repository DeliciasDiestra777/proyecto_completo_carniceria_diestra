const express = require('express');
const ClientesController = require('../controllers/clientes.controller');

const router = express.Router();
const clientesController = new ClientesController();

router.get('/', (req, res) => clientesController.obtenerClientes(req, res));
router.get('/perfil/:email', (req, res) => clientesController.obtenerClientePorEmail(req, res));
router.get('/:id', (req, res) => clientesController.obtenerClientePorId(req, res));
router.post('/', (req, res) => clientesController.agregarCliente(req, res));
router.put('/:id', (req, res) => clientesController.actualizarCliente(req, res));
router.delete('/:id', (req, res) => clientesController.eliminarCliente(req, res));

module.exports = router;