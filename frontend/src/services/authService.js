import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/usuarios` : 'http://localhost:5000/api/usuarios';

// Criar instância do axios configurada
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Adicionar token JWT aos headers automaticamente
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de resposta para tratar erros 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado ou inválido - limpar localStorage e redirecionar
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Serviço para autenticação de usuários
const authService = {
    // Login de usuário com token corporativo
    login: async (email, senha, corporateToken) => {
        const response = await axios.post(`${API_URL}/login`, {
            email,
            senha,
            corporateToken // Adicionando token corporativo
        });
        if (response.data) {
            localStorage.setItem('userInfo', JSON.stringify(response.data));
        }
        return response.data;
    },

    // Registro de novo usuário com token corporativo
    register: async (userData) => {
        // userData já contém o corporateToken enviado do formulário
        const response = await axios.post(API_URL, userData);
        if (response.data) {
            localStorage.setItem('userInfo', JSON.stringify(response.data));
        }
        return response.data;
    },

    // Logout de usuário
    logout: () => {
        localStorage.removeItem('userInfo');
    },

    // Recuperar dados do usuário logado
    getCurrentUser: () => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    // Verificar se o usuário está autenticado
    isAuthenticated: () => {
        return localStorage.getItem('userInfo') !== null;
    },

    // Verificar se o usuário é admin
    isAdmin: () => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            return user.isAdmin;
        }
        return false;
    },

    // Solicitar recuperação de senha
    requestPasswordReset: async (email) => {
        const response = await axios.post(`${API_URL}/reset-password`, { email });
        return response.data;
    },

    // Redefinir senha com token
    resetPassword: async (token, senha) => {
        const response = await axios.post(`${API_URL}/reset-password/${token}`, { senha });
        return response.data;
    }
};

export default authService;