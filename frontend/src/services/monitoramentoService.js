import { api } from './authService';

const monitoramentoService = {
    getStorageUsage: async () => {
        const response = await api.get('/monitoramento/armazenamento');
        return response.data;
    },
};

export default monitoramentoService;
