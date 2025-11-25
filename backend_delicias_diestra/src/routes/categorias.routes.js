const express = require('express');
const CategoriasController = require('../controllers/categorias.controller');

const router = express.Router();
const categoriasController = new CategoriasController();

router.get('/catalogo', (req, res) => categoriasController.obtenerCategoriasCatalogo(req, res));
router.get('/', (req, res) => categoriasController.obtenerCategorias(req, res));
router.get('/:id', (req, res) => categoriasController.obtenerCategoriaPorId(req, res));
router.post('/', (req, res) => categoriasController.agregarCategoria(req, res));
router.put('/:id', (req, res) => categoriasController.actualizarCategoria(req, res));
router.delete('/:id', (req, res) => categoriasController.eliminarCategoria(req, res));

module.exports = router;
