const Notificacao = require("../models/Notificacao");
const Configuracao = require("../models/Configuracao");

// @desc    Buscar notificações ativas
// @route   GET /api/notificacoes
// @access  Private
const getNotificacoes = async (req, res) => {
    try {
        const notificacoes = await Notificacao.buscarNotificacoesAtivas();
        res.json(notificacoes);
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        res.status(500).json({ message: "Erro ao buscar notificações" });
    }
};

// @desc    Marcar notificação como lida
// @route   PUT /api/notificacoes/:id/lida
// @access  Private
const marcarComoLida = async (req, res) => {
    try {
        const notificacao = await Notificacao.findByIdAndUpdate(
            req.params.id,
            { lida: true },
            { new: true }
        );

        if (!notificacao) {
            return res.status(404).json({ message: "Notificação não encontrada" });
        }

        res.json(notificacao);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
};

// @desc    Marcar todas notificações como lidas
// @route   PUT /api/notificacoes/marcar-todas-lidas
// @access  Private
const marcarTodasComoLidas = async (req, res) => {
    try {
        await Notificacao.updateMany({ lida: false }, { lida: true });
        res.json({ message: "Todas as notificações foram marcadas como lidas" });
    } catch (error) {
        console.error("Erro ao marcar todas notificações como lidas:", error);
        res
            .status(500)
            .json({ message: "Erro ao marcar todas notificações como lidas" });
    }
};

// @desc    Verificar vencimentos de padrões e criar notificações
// @route   POST /api/notificacoes/verificar-vencimentos
// @access  Private
const verificarVencimentos = async (req, res) => {
    try {
        const config = await Configuracao.getConfiguracao();
        const padroesTexto = config.padroesUtilizados;

        // Regex para extrair datas de validade no formato (Validade MM/AAAA)
        const regexValidade = /\(Validade\s+(\d{2})\/(\d{4})\)/gi;
        const matches = [...padroesTexto.matchAll(regexValidade)];

        if (matches.length === 0) {
            return res.json({
                message: "Nenhuma data de validade encontrada nos padrões",
                notificacoes: [],
            });
        }

        const notificacoesCriadas = [];
        const hoje = new Date();

        for (const match of matches) {
            const mes = parseInt(match[1]);
            const ano = parseInt(match[2]);
            const dataVencimento = new Date(ano, mes - 1, 1); // Primeiro dia do mês de vencimento

            // Calcular dias restantes
            const diffTime = dataVencimento - hoje;
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Criar notificação se faltar 90 dias ou menos, OU se já venceu (dias negativos)
            if (diasRestantes <= 90) {
                // Extrair nome do equipamento (texto antes da vírgula)
                const linhaCompleta = padroesTexto.split("\n").find((linha) =>
                    linha.includes(match[0])
                );
                const equipamento = linhaCompleta
                    ? linhaCompleta.split(",")[0].trim()
                    : "Equipamento não identificado";

                const notificacao = await Notificacao.criarNotificacaoVencimento(
                    equipamento,
                    dataVencimento,
                    diasRestantes
                );

                notificacoesCriadas.push(notificacao);
            }
        }

        res.json({
            message: `${notificacoesCriadas.length} notificação(ões) criada(s)`,
            notificacoes: notificacoesCriadas,
        });
    } catch (error) {
        console.error("Erro ao verificar vencimentos:", error);
        res.status(500).json({ message: "Erro ao verificar vencimentos" });
    }
};

module.exports = {
    getNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    verificarVencimentos,
};
