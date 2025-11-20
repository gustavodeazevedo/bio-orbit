const mongoose = require("mongoose");

const notificacaoSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: ["info", "warning", "success", "error"],
            default: "info",
        },
        titulo: {
            type: String,
            required: true,
        },
        mensagem: {
            type: String,
            required: true,
        },
        categoria: {
            type: String,
            enum: ["vencimento_padrao", "sistema", "certificado", "geral"],
            default: "geral",
        },
        dataVencimento: {
            type: Date, // Data do vencimento (se aplicável)
        },
        equipamento: {
            type: String, // Nome do equipamento relacionado
        },
        lida: {
            type: Boolean,
            default: false,
        },
        global: {
            type: Boolean,
            default: true, // Notificações visíveis para todos os usuários
        },
    },
    { timestamps: true }
);

// Índice para buscar notificações não lidas rapidamente
notificacaoSchema.index({ lida: 1, createdAt: -1 });

// Método estático para criar notificação de vencimento
notificacaoSchema.statics.criarNotificacaoVencimento = async function (
    equipamento,
    dataVencimento,
    diasRestantes
) {
    let tipo, titulo, mensagem;

    if (diasRestantes <= 0) {
        // Padrão vencido
        tipo = "error";
        titulo = "🚨 Padrão de Calibração VENCIDO!";
        mensagem = `O padrão de calibração está VENCIDO desde ${new Date(
            dataVencimento
        ).toLocaleDateString("pt-BR")}. É necessário providenciar URGENTEMENTE a renovação do certificado.`;
    } else if (diasRestantes <= 10) {
        // Erro urgente - menos de 10 dias
        tipo = "error";
        titulo = "⚠️ Padrão de Calibração Vencendo!";
        mensagem = `O padrão de calibração vence em ${diasRestantes} dias (${new Date(
            dataVencimento
        ).toLocaleDateString("pt-BR")}). Providencie a renovação do certificado com URGÊNCIA.`;
    } else if (diasRestantes <= 60) {
        // Aviso importante - 11 a 60 dias
        tipo = "warning";
        titulo = "⏰ Atenção: Padrão Próximo do Vencimento";
        mensagem = `O padrão de calibração vence em ${diasRestantes} dias (${new Date(
            dataVencimento
        ).toLocaleDateString("pt-BR")}). Providencie a renovação do certificado.`;
    } else {
        // Lembrete informativo - 61 a 90 dias
        tipo = "info";
        titulo = "📅 Lembrete: Renovação de Padrão";
        mensagem = `O padrão de calibração vence em ${diasRestantes} dias (${new Date(
            dataVencimento
        ).toLocaleDateString("pt-BR")}). Planeje a renovação do certificado.`;
    }

    // Verificar se já existe notificação para este equipamento e vencimento
    const existente = await this.findOne({
        equipamento,
        dataVencimento,
        categoria: "vencimento_padrao",
    });

    if (!existente) {
        return await this.create({
            tipo,
            titulo,
            mensagem,
            categoria: "vencimento_padrao",
            dataVencimento,
            equipamento,
            global: true,
        });
    }

    return existente;
};

// Método estático para buscar notificações ativas
notificacaoSchema.statics.buscarNotificacoesAtivas = async function () {
    return await this.find({ lida: false }).sort({ createdAt: -1 }).limit(20);
};

module.exports = mongoose.model("Notificacao", notificacaoSchema);
