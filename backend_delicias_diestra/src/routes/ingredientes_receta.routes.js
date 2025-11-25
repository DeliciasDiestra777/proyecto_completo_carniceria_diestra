const express = require('express');
const IngredientesRecetaController = require('../controllers/ingredientes_receta.controller');

const router = express.Router();
const ingredientesRecetaController = new IngredientesRecetaController();

router.get('/', (req, res) => ingredientesRecetaController.obtenerIngredientesReceta(req, res));
router.get('/:id', (req, res) => ingredientesRecetaController.obtenerIngredienteRecetaPorId(req, res));
router.post('/', (req, res) => ingredientesRecetaController.agregarIngredienteReceta(req, res));
router.put('/:id', (req, res) => ingredientesRecetaController.actualizarIngredienteReceta(req, res));
router.delete('/:id', (req, res) => ingredientesRecetaController.eliminarIngredienteReceta(req, res));

module.exports = router;




