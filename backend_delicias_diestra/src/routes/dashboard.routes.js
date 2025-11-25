const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Obtener estadísticas del dashboard
router.get('/estadisticas', (req, res) => dashboardController.obtenerEstadisticas(req, res));

// Obtener actividades recientes
router.get('/actividades', (req, res) => dashboardController.obtenerActividades(req, res));

module.exports = router;


