import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";

// Criando o contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provedor do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listener para atualizar user quando o localStorage mudar
    const handleStorageChange = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    };

    // Listener customizado para atualizações dentro da mesma aba
    window.addEventListener("userUpdated", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("userUpdated", handleStorageChange);
    };
  }, []);

  // Função de login atualizada para incluir token corporativo
  const login = async (email, senha, corporateToken) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.login(email, senha, corporateToken);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função de registro atualizada para incluir token corporativo no userData
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await authService.register(userData);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao registrar usuário");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Verificar se o usuário é admin
  const isAdmin = () => {
    return user?.isAdmin === true;
  };

  // Solicitar recuperação de senha
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      setLoading(true);
      return await authService.requestPasswordReset(email);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erro ao solicitar recuperação de senha"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Redefinir senha com token
  const resetPassword = async (token, senha) => {
    try {
      setError(null);
      setLoading(true);
      return await authService.resetPassword(token, senha);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao redefinir senha");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Valor do contexto
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
