const express = require('express');
const ProveedoresController = require('../controllers/proveedores.controller');

const router = express.Router();
const proveedoresController = new ProveedoresController();

router.get('/', (req, res) => proveedoresController.obtenerProveedores(req, res));
router.get('/:id', (req, res) => proveedoresController.obtenerProveedorPorId(req, res));
router.post('/', (req, res) => proveedoresController.agregarProveedor(req, res));
router.put('/:id', (req, res) => proveedoresController.actualizarProveedor(req, res));
router.delete('/:id', (req, res) => proveedoresController.eliminarProveedor(req, res));

module.exports = router;

