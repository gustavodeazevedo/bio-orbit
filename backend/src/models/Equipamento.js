const mongoose = require('mongoose');

const equipamentoSchema = mongoose.Schema({
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        index: true
    },
    nome: {
        type: String,
        required: true
    },
    modelo: {
        type: String,
        required: true
    },
    numeroSerie: {
        type: String,
        required: true,
        unique: true
    },
    fabricante: {
        type: String,
        required: true
    },
    setor: {
        type: String,
        required: true
    },
    responsavel: {
        type: String,
        required: true
    },
    dataAquisicao: {
        type: Date,
        required: true
    },
    ultimaCalibracao: {
        type: Date
    },
    proximaCalibracao: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ['Ativo', 'Em manutenção', 'Desativado'],
        default: 'Ativo'
    }
}, {
    timestamps: true
});

const Equipamento = mongoose.model('Equipamento', equipamentoSchema);

module.exports = Equipamento;