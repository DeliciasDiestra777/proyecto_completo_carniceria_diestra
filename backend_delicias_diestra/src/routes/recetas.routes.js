const express = require('express');
const RecetasController = require('../controllers/recetas.controller');

const router = express.Router();
const recetasController = new RecetasController();

router.get('/', (req, res) => recetasController.obtenerRecetas(req, res));
router.get('/:id/ingredientes', (req, res) => recetasController.obtenerIngredientesReceta(req, res));
router.get('/:id', (req, res) => recetasController.obtenerRecetaPorId(req, res));
router.post('/', (req, res) => recetasController.agregarReceta(req, res));
router.put('/:id', (req, res) => recetasController.actualizarReceta(req, res));
router.delete('/:id', (req, res) => recetasController.eliminarReceta(req, res));

module.exports = router;




