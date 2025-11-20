const Configuracao = require("../models/Configuracao");
const Notificacao = require("../models/Notificacao");

// Função auxiliar para verificar vencimentos após atualizar padrões
const verificarVencimentosAposAtualizacao = async (padroesTexto) => {
    try {
        const regexValidade = /\(Validade\s+(\d{2})\/(\d{4})\)/gi;
        const matches = [...padroesTexto.matchAll(regexValidade)];
        const hoje = new Date();

        for (const match of matches) {
            const mes = parseInt(match[1]);
            const ano = parseInt(match[2]);
            const dataVencimento = new Date(ano, mes - 1, 1);
            const diffTime = dataVencimento - hoje;
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Verifica vencimentos até 90 dias ou padrões já vencidos
            if (diasRestantes <= 90) {
                const linhaCompleta = padroesTexto
                    .split("\n")
                    .find((linha) => linha.includes(match[0]));
                const equipamento = linhaCompleta
                    ? linhaCompleta.split(",")[0].trim()
                    : "Equipamento não identificado";

                await Notificacao.criarNotificacaoVencimento(
                    equipamento,
                    dataVencimento,
                    diasRestantes
                );
            }
        }
    } catch (error) {
        console.error("Erro ao verificar vencimentos:", error);
    }
};

// @desc    Obter configurações globais do sistema
// @route   GET /api/configuracoes
// @access  Private
const getConfiguracoes = async (req, res) => {
    try {
        const configuracao = await Configuracao.getConfiguracao();
        res.json(configuracao);
    } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        res.status(500).json({ message: "Erro ao buscar configurações" });
    }
};

// @desc    Atualizar padrões utilizados globalmente
// @route   PUT /api/configuracoes/padroes
// @access  Private
const updatePadroesUtilizados = async (req, res) => {
    try {
        const { padroesUtilizados } = req.body;

        if (!padroesUtilizados) {
            return res
                .status(400)
                .json({ message: "Campo padroesUtilizados é obrigatório" });
        }

        const configuracao = await Configuracao.updatePadroesUtilizados(
            padroesUtilizados
        );

        // Verificar vencimentos automaticamente após atualizar
        await verificarVencimentosAposAtualizacao(padroesUtilizados);

        res.json({
            message: "Padrões utilizados atualizados com sucesso",
            configuracao,
        });
    } catch (error) {
        console.error("Erro ao atualizar padrões utilizados:", error);
        res.status(500).json({ message: "Erro ao atualizar padrões utilizados" });
    }
}; module.exports = {
    getConfiguracoes,
    updatePadroesUtilizados,
};
