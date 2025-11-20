import { api } from "./authService";

const notificacaoService = {
    // Buscar notificações ativas
    getNotificacoes: async () => {
        try {
            const response = await api.get("/notificacoes");
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            throw error;
        }
    },

    // Marcar notificação como lida
    marcarComoLida: async (id) => {
        try {
            const response = await api.put(`/notificacoes/${id}/lida`);
            return response.data;
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
            throw error;
        }
    },

    // Marcar todas como lidas
    marcarTodasComoLidas: async () => {
        try {
            const response = await api.put("/notificacoes/marcar-todas-lidas");
            return response.data;
        } catch (error) {
            console.error("Erro ao marcar todas notificações como lidas:", error);
            throw error;
        }
    },

    // Verificar vencimentos e criar notificações
    verificarVencimentos: async () => {
        try {
            const response = await api.post("/notificacoes/verificar-vencimentos");
            return response.data;
        } catch (error) {
            console.error("Erro ao verificar vencimentos:", error);
            throw error;
        }
    },
};

export default notificacaoService;
