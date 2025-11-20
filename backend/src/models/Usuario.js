const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    senha: {
        type: String,
        required: true
    },
    cargo: {
        type: String,
        required: true
    },
    setor: {
        type: String,
        required: true
    },
    verificado: {
        type: Boolean,
        required: true,
        default: false
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    ultimoHeartbeat: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Método para comparar senha inserida com a senha hash
usuarioSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.senha);
};

// Middleware para criptografar a senha antes de salvar
usuarioSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;