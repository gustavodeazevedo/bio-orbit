const express = require('express');
const router = express.Router();
const {
    authUsuario,
    registerUsuario,
    getUsuarioPerfil,
    updateUsuarioPerfil,
    getUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    deleteMinhaConta,
    updateHeartbeat,
    setOffline,
    getUsuariosAtivos,
    requestPasswordReset,
    resetPassword
} = require('../controllers/usuariosController');
const { protect, admin } = require('../middlewares/auth');
const { verifyToken } = require('../middlewares/tokenVerification');

// @route   POST /api/usuarios/login
// @desc    Authenticate usuario & get token
// @access  Public
router.post('/login', verifyToken, authUsuario);

// @route   POST /api/usuarios
// @desc    Register a usuario
// @access  Public
router.post('/', verifyToken, registerUsuario);

// @route   POST /api/usuarios/reset-password
// @desc    Request password reset
// @access  Public
router.post('/reset-password', requestPasswordReset);

// @route   POST /api/usuarios/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', resetPassword);

// @route   GET /api/usuarios/perfil
// @desc    Get user profile
// @access  Private
router.get('/perfil', protect, getUsuarioPerfil);

// @route   PUT /api/usuarios/perfil
// @desc    Update user profile
// @access  Private
router.put('/perfil', protect, updateUsuarioPerfil);

// @route   DELETE /api/usuarios/perfil
// @desc    Excluir a própria conta
// @access  Private
router.delete('/perfil', protect, deleteMinhaConta);

// @route   POST /api/usuarios/heartbeat
// @desc    Update user heartbeat (presence)
// @access  Private
router.post('/heartbeat', protect, updateHeartbeat);

// @route   POST /api/usuarios/offline
// @desc    Set user status to offline
// @access  Private
router.post('/offline', protect, setOffline);

// @route   GET /api/usuarios/ativos
// @desc    Get active users
// @access  Private
router.get('/ativos', protect, getUsuariosAtivos);

// @route   GET /api/usuarios
// @desc    Get all usuarios
// @access  Private/Admin
router.get('/', protect, admin, getUsuarios);

// @route   GET /api/usuarios/:id
// @desc    Get usuario by ID
// @access  Private/Admin
router.get('/:id', protect, admin, getUsuarioById);

// @route   PUT /api/usuarios/:id
// @desc    Update usuario
// @access  Private/Admin
router.put('/:id', protect, admin, updateUsuario);

// @route   DELETE /api/usuarios/:id
// @desc    Delete usuario
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteUsuario);

module.exports = router;