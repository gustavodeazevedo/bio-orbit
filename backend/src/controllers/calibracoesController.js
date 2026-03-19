const Calibracao = require('../models/Calibracao');
const Equipamento = require('../models/Equipamento');

// isAdmin guarda a lógica para verificar se o usuário é admim
const isAdmin = (req) => Boolean(req.usuario && req.usuario.isAdmin);
// ownerFilter retorna um filtro para limitar os dados ao usuário criador, a menos que seja admin
const ownerFilter = (req) => (isAdmin(req)
    ? {}
    : {
        $or: [
            { criadoPor: req.usuario._id },
            { criadoPor: { $exists: false } },
            { criadoPor: null }
        ]
    });

// pickAllowedFields filtra os campos permitidos para criação/atualização de calibração, evitando que campos não autorizados sejam processados
const pickAllowedFields = (payload = {}) => {
    const allowed = [
        'equipamento',
        'dataCalibracao',
        'dataProximaCalibracao',
        'responsavelCalibracao',
        'empresa',
        'numeroCertificado',
        'resultado',
        'observacoes'
    ];
    return Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowed.includes(key))
    );
};

// @desc    Buscar todas as calibrações
// @route   GET /api/calibracoes
// @access  Public

const getCalibracoes = async (req, res) => {
    try {
        const calibracoes = await Calibracao.find(ownerFilter(req)).populate('equipamento', 'nome numeroSerie');
        res.json(calibracoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Buscar uma calibração pelo ID
// @route   GET /api/calibracoes/:id
// @access  Public
const getCalibracaoById = async (req, res) => {
    try {
        const calibracao = await Calibracao.findOne({ _id: req.params.id, ...ownerFilter(req) }).populate('equipamento');

        if (calibracao) {
            res.json(calibracao);
        } else {
            res.status(404).json({ message: 'Calibração não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Criar uma nova calibração
// @route   POST /api/calibracoes
// @access  Private
const createCalibracao = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);
        const { equipamento } = safePayload;

        // Verificar se o equipamento existe
        const equipamentoExists = await Equipamento.findOne({ _id: equipamento, ...ownerFilter(req) });
        if (!equipamentoExists) {
            return res.status(400).json({ message: 'Equipamento não encontrado' });
        }

        const calibracao = new Calibracao({
            ...safePayload,
            criadoPor: req.usuario._id
        });

        const createdCalibracao = await calibracao.save();

        // Atualizar a data da última calibração e próxima calibração no equipamento
        equipamentoExists.ultimaCalibracao = safePayload.dataCalibracao;
        equipamentoExists.proximaCalibracao = safePayload.dataProximaCalibracao;
        await equipamentoExists.save();

        res.status(201).json(createdCalibracao);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Atualizar uma calibração
// @route   PUT /api/calibracoes/:id
// @access  Private
const updateCalibracao = async (req, res) => {
    try {
        const safePayload = pickAllowedFields(req.body);
        delete safePayload.criadoPor;

        const calibracao = await Calibracao.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (calibracao) {
            Object.entries(safePayload).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    calibracao[key] = value;
                }
            });

            const updatedCalibracao = await calibracao.save();

            // Atualizar a data da última calibração e próxima calibração no equipamento
            if (safePayload.dataCalibracao || safePayload.dataProximaCalibracao) {
                const equipamento = await Equipamento.findOne({ _id: calibracao.equipamento, ...ownerFilter(req) });
                if (equipamento) {
                    if (safePayload.dataCalibracao) equipamento.ultimaCalibracao = safePayload.dataCalibracao;
                    if (safePayload.dataProximaCalibracao) equipamento.proximaCalibracao = safePayload.dataProximaCalibracao;
                    await equipamento.save();
                }
            }

            res.json(updatedCalibracao);
        } else {
            res.status(404).json({ message: 'Calibração não encontrada' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remover uma calibração
// @route   DELETE /api/calibracoes/:id
// @access  Private
const deleteCalibracao = async (req, res) => {
    try {
        const calibracao = await Calibracao.findOne({ _id: req.params.id, ...ownerFilter(req) });

        if (calibracao) {
            await calibracao.deleteOne();
            res.json({ message: 'Calibração removida' });
        } else {
            res.status(404).json({ message: 'Calibração não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCalibracoes,
    getCalibracaoById,
    createCalibracao,
    updateCalibracao,
    deleteCalibracao
};