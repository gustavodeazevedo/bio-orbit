const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        index: true
    },
    nome: {
        type: String,
        required: [true, 'Nome do cliente é obrigatório'],
        trim: true
    },
    cnpj: {
        type: String,
        trim: true
    },
    telefone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Por favor, insira um email válido']
    },
    endereco: {
        rua: {
            type: String,
            trim: true,
            required: [true, 'Rua é obrigatória']
        }, numero: {
            type: String,
            trim: true,
            required: [true, 'Número é obrigatório']
        },
        bairro: {
            type: String,
            trim: true,
            required: [true, 'Bairro é obrigatório']
        },
        cidade: {
            type: String,
            trim: true,
            required: [true, 'Cidade é obrigatória']
        },
        estado: {
            type: String,
            trim: true,
            required: [true, 'Estado é obrigatório']
        },
        cep: {
            type: String,
            trim: true
        }
    },
    contato: {
        nome: {
            type: String,
            trim: true
        },
        cargo: {
            type: String,
            trim: true
        },
        telefone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Por favor, insira um email válido para o contato']
        }
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    },
    ativo: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Cliente', ClienteSchema);