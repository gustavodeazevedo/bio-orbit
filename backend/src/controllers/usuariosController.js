const Usuario = require('../models/Usuario');
const ResetToken = require('../models/ResetToken');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Função para gerar token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'abc123', {
        expiresIn: '30d'
    });
};

// @desc    Autenticar usuário e gerar token
// @route   POST /api/usuarios/login
// @access  Public
const authUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verificar se o usuário existe
        // Adicionando timeout explícito para a operação findOne
        const usuario = await Usuario.findOne({ email }).maxTimeMS(15000); // 15 segundos de timeout

        if (usuario && (await usuario.matchPassword(senha))) {
            // Verificar se a conta está verificada como funcionário
            if (!usuario.verificado) {
                return res.status(401).json({
                    message: 'Conta não verificada. Entre em contato com o administrador.'
                });
            }

            res.json({
                _id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                setor: usuario.setor,
                verificado: usuario.verificado,
                isAdmin: usuario.isAdmin,
                padroesUtilizados: usuario.padroesUtilizados,
                token: generateToken(usuario._id)
            });
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Registrar um novo usuário
// @route   POST /api/usuarios
// @access  Public
const registerUsuario = async (req, res) => {
    try {
        const { nome, email, senha, cargo, setor, isAdmin } = req.body;

        // Verificar se o usuário já existe
        // Adicionando timeout explícito para a operação findOne
        const usuarioExists = await Usuario.findOne({ email }).maxTimeMS(15000); // 15 segundos de timeout

        if (usuarioExists) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }

        // Criar novo usuário - agora incluindo o campo verificado como true porque passou pelo middleware de token
        const usuario = await Usuario.create({
            nome,
            email,
            senha,
            cargo,
            setor,
            verificado: true,
            isAdmin: isAdmin || false
        });

        if (usuario) {
            res.status(201).json({
                _id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                setor: usuario.setor,
                verificado: usuario.verificado,
                isAdmin: usuario.isAdmin,
                token: generateToken(usuario._id)
            });
        } else {
            res.status(400).json({ message: 'Dados de usuário inválidos' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Obter perfil do usuário
// @route   GET /api/usuarios/perfil
// @access  Private
const getUsuarioPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id);

        if (usuario) {
            res.json({
                _id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                setor: usuario.setor,
                verificado: usuario.verificado,
                isAdmin: usuario.isAdmin,
                padroesUtilizados: usuario.padroesUtilizados
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Atualizar perfil do usuário
// @route   PUT /api/usuarios/perfil
// @access  Private
const updateUsuarioPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id);

        if (usuario) {
            // Se está tentando alterar a senha, verificar senha atual
            if (req.body.novaSenha) {
                if (!req.body.senhaAtual) {
                    return res.status(400).json({
                        message: 'Senha atual é obrigatória para alterar a senha'
                    });
                }

                // Verificar se a senha atual está correta
                const isMatch = await usuario.matchPassword(req.body.senhaAtual);
                if (!isMatch) {
                    return res.status(401).json({
                        message: 'Senha atual incorreta'
                    });
                }

                // Atualizar com a nova senha
                usuario.senha = req.body.novaSenha;
            }

            // Atualizar outros campos
            usuario.nome = req.body.nome || usuario.nome;
            usuario.email = req.body.email || usuario.email;
            usuario.cargo = req.body.cargo || usuario.cargo;
            usuario.setor = req.body.setor || usuario.setor;

            // Atualizar padrões utilizados se fornecido
            if (req.body.padroesUtilizados !== undefined) {
                usuario.padroesUtilizados = req.body.padroesUtilizados;
            }

            const updatedUsuario = await usuario.save();

            res.json({
                _id: updatedUsuario._id,
                nome: updatedUsuario.nome,
                email: updatedUsuario.email,
                cargo: updatedUsuario.cargo,
                setor: updatedUsuario.setor,
                verificado: updatedUsuario.verificado,
                isAdmin: updatedUsuario.isAdmin,
                padroesUtilizados: updatedUsuario.padroesUtilizados,
                token: generateToken(updatedUsuario._id)
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Obter todos os usuários
// @route   GET /api/usuarios
// @access  Private/Admin
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find({}).select('-senha');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Obter usuário por ID
// @route   GET /api/usuarios/:id
// @access  Private/Admin
const getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-senha');

        if (usuario) {
            res.json(usuario);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Atualizar usuário
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
const updateUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (usuario) {
            usuario.nome = req.body.nome || usuario.nome;
            usuario.email = req.body.email || usuario.email;
            usuario.cargo = req.body.cargo || usuario.cargo;
            usuario.setor = req.body.setor || usuario.setor;
            usuario.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : usuario.isAdmin;

            const updatedUsuario = await usuario.save();

            res.json({
                _id: updatedUsuario._id,
                nome: updatedUsuario.nome,
                email: updatedUsuario.email,
                cargo: updatedUsuario.cargo,
                setor: updatedUsuario.setor,
                isAdmin: updatedUsuario.isAdmin
            });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remover usuário
// @route   DELETE /api/usuarios/:id
// @access  Private/Admin
const deleteUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (usuario) {
            await usuario.deleteOne();
            res.json({ message: 'Usuário removido' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Atualizar heartbeat do usuário (presença)
// @route   POST /api/usuarios/heartbeat
// @access  Private
const updateHeartbeat = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id);

        if (usuario) {
            usuario.ultimoHeartbeat = new Date();
            usuario.status = 'online';
            await usuario.save();
            res.json({ message: 'Heartbeat atualizado' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Marcar usuário como offline
// @route   POST /api/usuarios/offline
// @access  Private
const setOffline = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id);

        if (usuario) {
            usuario.status = 'offline';
            await usuario.save();
            res.json({ message: 'Status atualizado para offline' });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Obter usuários ativos
// @route   GET /api/usuarios/ativos
// @access  Private
const getUsuariosAtivos = async (req, res) => {
    try {
        const umMinutoAtras = new Date(Date.now() - 60000); // 1 minuto atrás

        const usuariosAtivos = await Usuario.find({
            verificado: true,
            ultimoHeartbeat: { $gte: umMinutoAtras }
        })
            .select('nome email cargo setor ultimoHeartbeat')
            .sort({ ultimoHeartbeat: -1 });

        res.json(usuariosAtivos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Solicitar recuperação de senha
// @route   POST /api/usuarios/reset-password
// @access  Public
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email é obrigatório' });
        }

        // Buscar usuário
        const usuario = await Usuario.findOne({ email }).maxTimeMS(15000);

        // Sempre retornar sucesso por segurança (não revelar se email existe)
        if (!usuario) {
            console.log(`Tentativa de reset para email não cadastrado: ${email}`);
            return res.json({
                message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
            });
        }

        // Gerar token único
        const token = crypto.randomBytes(32).toString('hex');

        // Salvar token no banco
        await ResetToken.create({
            usuario: usuario._id,
            token: token
        });

        // URL de reset (frontend)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha/${token}`;

        // Enviar email
        await emailService.sendPasswordResetEmail(
            usuario.email,
            usuario.nome,
            resetUrl
        );

        console.log(`Email de recuperação enviado para: ${usuario.email}`);

        res.json({
            message: 'Email de recuperação enviado. Verifique sua caixa de entrada.'
        });

    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error);
        res.status(500).json({
            message: 'Erro ao processar solicitação. Tente novamente mais tarde.'
        });
    }
};

// @desc    Redefinir senha com token
// @route   POST /api/usuarios/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { senha } = req.body;

        if (!senha) {
            return res.status(400).json({ message: 'Nova senha é obrigatória' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
        }

        // Buscar token válido
        const resetToken = await ResetToken.findOne({
            token: token,
            usado: false,
            expiresAt: { $gt: new Date() }
        }).populate('usuario');

        if (!resetToken) {
            return res.status(400).json({
                message: 'Token inválido ou expirado. Solicite uma nova recuperação.'
            });
        }

        // Atualizar senha do usuário
        const usuario = resetToken.usuario;
        usuario.senha = senha; // O hash será feito pelo pre-save hook do modelo
        await usuario.save();

        // Marcar token como usado
        resetToken.usado = true;
        await resetToken.save();

        // Enviar email de confirmação
        await emailService.sendPasswordResetConfirmation(
            usuario.email,
            usuario.nome
        );

        console.log(`Senha redefinida com sucesso para: ${usuario.email}`);

        res.json({
            message: 'Senha redefinida com sucesso! Você já pode fazer login.'
        });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({
            message: 'Erro ao redefinir senha. Tente novamente.'
        });
    }
};

module.exports = {
    authUsuario,
    registerUsuario,
    getUsuarioPerfil,
    updateUsuarioPerfil,
    getUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    updateHeartbeat,
    setOffline,
    getUsuariosAtivos,
    requestPasswordReset,
    resetPassword
};