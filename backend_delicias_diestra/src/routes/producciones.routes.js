const express = require('express');
const ProduccionesController = require('../controllers/producciones.controller');

const router = express.Router();
const produccionesController = new ProduccionesController();

router.get('/', (req, res) => produccionesController.obtenerProducciones(req, res));
router.get('/:id', (req, res) => produccionesController.obtenerProduccionPorId(req, res));
router.post('/', (req, res) => produccionesController.agregarProduccion(req, res));
router.put('/:id', (req, res) => produccionesController.actualizarProduccion(req, res));
router.delete('/:id', (req, res) => produccionesController.eliminarProduccion(req, res));

module.exports = router;




