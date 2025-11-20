const mongoose = require("mongoose");

const configuracaoSchema = new mongoose.Schema(
    {
        padroesUtilizados: {
            type: String,
            default: `Termohigrômetro Digital HT600 Instrutherm, Certificado RBC Nº CAL – A 15694/25 , (Validade 08/2026).
Balança Analítica Metter Toledo SAG250, Certificado RBC Nº CAL – A 15695/25, (Validade 08/2026).`,
        },
    },
    { timestamps: true }
);

// Garantir que existe apenas um documento de configuração no sistema
configuracaoSchema.statics.getConfiguracao = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

configuracaoSchema.statics.updatePadroesUtilizados = async function (
    padroesUtilizados
) {
    let config = await this.getConfiguracao();
    config.padroesUtilizados = padroesUtilizados;
    await config.save();
    return config;
};

module.exports = mongoose.model("Configuracao", configuracaoSchema);
