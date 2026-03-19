const express = require('express');
const router = express.Router();
const {
    getCalibracoes,
    getCalibracaoById,
    createCalibracao,
    updateCalibracao,
    deleteCalibracao
} = require('../controllers/calibracoesController');
const { protect } = require('../middlewares/auth');

router.use(protect);

// @route   GET api/calibracoes
// @desc    Get all calibracoes
// @access  Private
router.get('/', getCalibracoes);

// @route   GET api/calibracoes/:id
// @desc    Get calibracao by ID
// @access  Private
router.get('/:id', getCalibracaoById);

// @route   POST api/calibracoes
// @desc    Create a calibracao
// @access  Private
router.post('/', createCalibracao);

// @route   PUT api/calibracoes/:id
// @desc    Update calibracao
// @access  Private
router.put('/:id', updateCalibracao);

// @route   DELETE api/calibracoes/:id
// @desc    Delete calibracao
// @access  Private
router.delete('/:id', deleteCalibracao);

module.exports = router;