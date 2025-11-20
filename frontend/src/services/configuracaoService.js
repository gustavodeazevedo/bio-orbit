import { api } from "./authService";

const configuracaoService = {
    // Buscar configurações globais
    getConfiguracoes: async () => {
        try {
            const response = await api.get("/configuracoes");
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
            throw error;
        }
    },

    // Atualizar padrões utilizados (global)
    updatePadroesUtilizados: async (padroesUtilizados) => {
        try {
            const response = await api.put("/configuracoes/padroes", {
                padroesUtilizados,
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar padrões utilizados:", error);
            throw error;
        }
    },
};

export default configuracaoService;
