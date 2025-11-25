const express = require('express');
const NotificacionesController = require('../controllers/notificaciones.controller');

const router = express.Router();
const notificacionesController = new NotificacionesController();

router.get('/', (req, res) => notificacionesController.obtenerNotificaciones(req, res));
router.get('/pendientes', (req, res) => notificacionesController.obtenerNotificacionesPendientesCount(req, res));
router.get('/:id', (req, res) => notificacionesController.obtenerNotificacionPorId(req, res));
router.post('/', (req, res) => notificacionesController.crearNotificacion(req, res));
router.put('/:id', (req, res) => notificacionesController.actualizarNotificacion(req, res));
router.put('/:id/aceptar', (req, res) => notificacionesController.aceptarPedido(req, res));
router.put('/:id/estado', (req, res) => notificacionesController.actualizarEstadoPedido(req, res));
router.delete('/:id', (req, res) => notificacionesController.eliminarNotificacion(req, res));

module.exports = router;

