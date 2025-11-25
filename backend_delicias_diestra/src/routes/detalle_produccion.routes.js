const express = require('express');
const DetalleProduccionController = require('../controllers/detalle_produccion.controller');

const router = express.Router();
const detalleProduccionController = new DetalleProduccionController();

router.get('/', (req, res) => detalleProduccionController.obtenerDetallesProduccion(req, res));
router.get('/produccion/:id_produccion', (req, res) => detalleProduccionController.obtenerDetallesPorProduccion(req, res));
router.get('/:id', (req, res) => detalleProduccionController.obtenerDetalleProduccionPorId(req, res));
router.post('/', (req, res) => detalleProduccionController.agregarDetalleProduccion(req, res));
router.put('/:id', (req, res) => detalleProduccionController.actualizarDetalleProduccion(req, res));
router.delete('/:id', (req, res) => detalleProduccionController.eliminarDetalleProduccion(req, res));

module.exports = router;




