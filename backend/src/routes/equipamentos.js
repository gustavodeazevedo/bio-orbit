// express utilizado para criar rotas
const express = require('express');
const router = express.Router();
const {
    getEquipamentos,
    getEquipamentoById,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento
} = require('../controllers/equipamentosController');
const { protect } = require('../middlewares/auth');

router.use(protect);

// @route   GET api/equipamentos
// @desc    Get all equipamentos
// @access  Private
router.get('/', getEquipamentos);

// @route   GET api/equipamentos/:id
// @desc    Get equipamento by ID
// @access  Private
router.get('/:id', getEquipamentoById);

// @route   POST api/equipamentos
// @desc    Create a new equipamento
// @access  Private
router.post('/', createEquipamento);

// @route   PUT api/equipamentos/:id
// @desc    Update equipamento
// @access  Private
router.put('/:id', updateEquipamento);

// @route   DELETE api/equipamentos/:id
// @desc    Delete equipamento
// @access  Private
router.delete('/:id', deleteEquipamento);

module.exports = router;