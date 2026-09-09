const express = require('express');
const router = express.Router();
const { getStorageUsage } = require('../controllers/monitoramentoController');
const { protect } = require('../middlewares/auth');

// @route   GET /api/monitoramento/armazenamento
// @desc    Consultar uso de armazenamento do banco
// @access  Private
router.get('/armazenamento', protect, getStorageUsage);

module.exports = router;
