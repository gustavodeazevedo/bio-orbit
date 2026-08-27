import { api } from './authService';

class PresenceService {
    constructor() {
        this.heartbeatInterval = null;
        this.HEARTBEAT_INTERVAL = 30000; // 30 segundos
        this.INACTIVE_THRESHOLD = 90000; // 1 minuto e 30 segundos para considerar inativo
    }

    // Iniciar rastreamento de presença
    startTracking() {
        console.log('🎯 Iniciando tracking de presença...');
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            console.log('⏰ Intervalo de heartbeat acionado (30s)');
            this.sendHeartbeat();
        }, this.HEARTBEAT_INTERVAL);

        // Detectar quando o usuário sai da página
        window.addEventListener('beforeunload', () => {
            console.log('👋 Usuário saindo, marcando como offline...');
            this.stopTracking();
        });
        console.log('✅ Tracking de presença iniciado');
    }

    // Parar rastreamento
    stopTracking() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.sendOffline();
    }

    // Enviar heartbeat ao backend
    async sendHeartbeat() {
        try {
            console.log('🔄 Enviando heartbeat...');
            const response = await api.post('/usuarios/heartbeat', {
                timestamp: new Date().toISOString()
            });
            console.log('✅ Heartbeat enviado com sucesso:', response.data);
        } catch (error) {
            console.error('❌ Erro ao enviar heartbeat:', error.response?.data || error.message);
        }
    }

    // Marcar como offline
    async sendOffline() {
        try {
            await api.post('/usuarios/offline');
        } catch (error) {
            console.error('Erro ao marcar offline:', error);
        }
    }

    // Obter usuários ativos
    async getActiveUsers() {
        try {
            console.log('📋 Buscando usuários ativos...');
            const response = await api.get('/usuarios/ativos');
            console.log('✅ Usuários ativos recebidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar usuários ativos:', error.response?.data || error.message);
            throw error;
        }
    }
}

export default new PresenceService();
