const Equipamento = require('../models/Equipamento');

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
    const allowed = [
        'nome',
        'modelo',
        'numeroSerie',
        'fabricante',
        'setor',
        'responsavel',
        'dataAquisicao',
        'ultimaCalibracao',
        'proximaCalibracao',
        'status'
    ];
    return Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowed.includes(key))
    );
};

// @desc    Buscar todos os equipamentos
// @route   GET /api/equipamentos
// @access  Public
const getEquipamentos = async (req, res) => {
    try {
        const equipamentos = await Equipamento.find(ownerFilter(req));
        res.json(equipamentos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Buscar um equipamento pelo ID
// @route   GET /api/equipamentos/:id
// @access  Public
const getEquipamentoById = async (req, res) => {
    try {
        const equipamento = await Equipamento.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (equipamento) {
            res.json(equipamento);
        } else {
            res.status(404).json({ message: 'Equipamento não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Criar um novo equipamento
// @route   POST /api/equipamentos
// @access  Private
const createEquipamento = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);

        const equipamento = new Equipamento({
            ...safePayload,
            criadoPor: req.usuario._id
        });

        const createdEquipamento = await equipamento.save();
        res.status(201).json(createdEquipamento);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Atualizar um equipamento
// @route   PUT /api/equipamentos/:id
// @access  Private
const updateEquipamento = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);
        delete safePayload.criadoPor;

        const equipamento = await Equipamento.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (equipamento) {
            Object.entries(safePayload).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    equipamento[key] = value;
                }
            });

            const updatedEquipamento = await equipamento.save();
            res.json(updatedEquipamento);
        } else {
            res.status(404).json({ message: 'Equipamento não encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remover um equipamento
// @route   DELETE /api/equipamentos/:id
// @access  Private
const deleteEquipamento = async (req, res) => {
    try {
        const equipamento = await Equipamento.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (equipamento) {
            await equipamento.deleteOne();
            res.json({ message: 'Equipamento removido' });
        } else {
            res.status(404).json({ message: 'Equipamento não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEquipamentos,
    getEquipamentoById,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento
};