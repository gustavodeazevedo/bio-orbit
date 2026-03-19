const mongoose = require('mongoose');

const calibracaoSchema = mongoose.Schema({
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        index: true
    },
    equipamento: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Equipamento'
    },
    dataCalibracao: {
        type: Date,
        required: true,
        default: Date.now
    },
    dataProximaCalibracao: {
        type: Date,
        required: true
    },
    responsavelCalibracao: {
        type: String,
        required: true
    },
    empresa: {
        type: String,
        required: true
    },
    numeroCertificado: {
        type: String,
        required: true,
        unique: true
    },
    resultado: {
        type: String,
        required: true,
        enum: ['Aprovado', 'Reprovado', 'Pendente'],
        default: 'Pendente'
    },
    observacoes: {
        type: String
    }
}, {
    timestamps: true
});

const Calibracao = mongoose.model('Calibracao', calibracaoSchema);

module.exports = Calibracao;