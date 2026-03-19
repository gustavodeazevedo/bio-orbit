const Cliente = require('../models/Cliente');

const isAdmin = (req) => Boolean(req.usuario && req.usuario.isAdmin);
const ownerFilter = (req) => (isAdmin(req)
    ? {}
    : {
        $or: [
            { criadoPor: req.usuario._id },
            { criadoPor: { $exists: false } },
            { criadoPor: null }
        ]
    });

const pickAllowedFields = (payload = {}) => {
    const allowed = ['nome', 'cnpj', 'telefone', 'email', 'endereco', 'contato', 'ativo'];
    return Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowed.includes(key))
    );
};

// Obter todos os clientes
exports.getClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find({ ...ownerFilter(req), ativo: true }).sort({ nome: 1 });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar clientes',
            error: error.message
        });
    }
};

// Obter um cliente específico
exports.getCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cliente',
            error: error.message
        });
    }
};

// Criar um novo cliente
exports.createCliente = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);
        const cliente = await Cliente.create({
            ...safePayload,
            criadoPor: req.usuario._id
        });
        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            data: cliente
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao cadastrar cliente',
            error: error.message
        });
    }
};

// Atualizar um cliente
exports.updateCliente = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);
        delete safePayload.criadoPor;

        const cliente = await Cliente.findOneAndUpdate(
            { _id: req.params.id, ...ownerFilter(req) },
            safePayload,
            {
                new: true,
                runValidators: true
            }
        );

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: cliente
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar cliente',
            error: error.message
        });
    }
};

// Desativar um cliente (exclusão lógica)
exports.deleteCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findOneAndUpdate(
            { _id: req.params.id, ...ownerFilter(req) },
            { ativo: false },
            { new: true }
        );

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cliente desativado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar cliente',
            error: error.message
        });
    }
};