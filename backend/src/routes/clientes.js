const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { protect } = require('../middlewares/auth');

// Proteger todas as outras rotas
router.use(protect);

// Rotas para clientes
router.get('/', clientesController.getClientes);
router.get('/:id', clientesController.getCliente);
router.post('/', clientesController.createCliente);
router.put('/:id', clientesController.updateCliente);
router.delete('/:id', clientesController.deleteCliente);

module.exports = router;