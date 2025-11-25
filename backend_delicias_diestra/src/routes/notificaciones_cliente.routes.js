const express = require('express');
const NotificacionesClienteController = require('../controllers/notificaciones_cliente.controller');

const router = express.Router();
const notificacionesClienteController = new NotificacionesClienteController();

router.get('/', (req, res) => notificacionesClienteController.obtenerNotificacionesCliente(req, res));
router.get('/no-leidas', (req, res) => notificacionesClienteController.obtenerNotificacionesNoLeidas(req, res));
router.get('/contador', (req, res) => notificacionesClienteController.obtenerContadorNoLeidas(req, res));
router.put('/:id/leida', (req, res) => notificacionesClienteController.marcarComoLeida(req, res));
router.put('/marcar-todas', (req, res) => notificacionesClienteController.marcarTodasComoLeidas(req, res));

module.exports = router;

