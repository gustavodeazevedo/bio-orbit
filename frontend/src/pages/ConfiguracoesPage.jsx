import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import authService, { api } from "../services/authService";
import configuracaoService from "../services/configuracaoService";
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Lock,
  Briefcase,
  Building2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";

// Constantes para cores (igual ao ClienteFormPage)
const COLORS = {
  TEXT: "rgb(75, 85, 99)",
  BORDER_FOCUS: "rgb(144, 199, 45)",
  BORDER_ERROR: "#ef4444",
};

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Classe de estilo para inputs (igual ao ClienteFormPage)
  const inputClassName = (hasError) =>
    `w-full px-3 py-2 border rounded-md transition-colors ${
      hasError ? "border-red-500" : "border-gray-300"
    } focus:outline-none`;

  // Classe de estilo para inputs com ícone (senha)
  const inputWithIconClassName = (hasError) =>
    `w-full px-3 py-2 pr-10 border rounded-md transition-colors ${
      hasError ? "border-red-500" : "border-gray-300"
    } focus:outline-none`;

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cargo: "",
    setor: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  // Estado separado para padrões (global)
  const [padroesUtilizados, setPadroesUtilizados] = useState("");
  const [padroesOriginais, setPadroesOriginais] = useState("");

  // Estados de controle
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Carregar dados do usuário e configurações globais
  useEffect(() => {
    const loadData = async () => {
      // Carregar dados do usuário
      if (user) {
        setFormData({
          nome: user.nome || "",
          email: user.email || "",
          cargo: user.cargo || "",
          setor: user.setor || "",
          senhaAtual: "",
          novaSenha: "",
          confirmarSenha: "",
        });
      }

      // Carregar configurações globais (padrões)
      try {
        const config = await configuracaoService.getConfiguracoes();
        setPadroesUtilizados(config.padroesUtilizados || "");
        setPadroesOriginais(config.padroesUtilizados || "");
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };

    loadData();
  }, [user]);

  // Detectar mudanças no formulário
  useEffect(() => {
    if (!user) return;

    const changed =
      formData.nome !== user.nome ||
      formData.email !== user.email ||
      formData.cargo !== user.cargo ||
      formData.setor !== user.setor ||
      padroesUtilizados !== padroesOriginais ||
      formData.senhaAtual !== "" ||
      formData.novaSenha !== "" ||
      formData.confirmarSenha !== "";

    setHasChanges(changed);
  }, [formData, padroesUtilizados, padroesOriginais, user]);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres";
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    // Validar cargo
    if (!formData.cargo.trim()) {
      newErrors.cargo = "Cargo é obrigatório";
    }

    // Validar setor
    if (!formData.setor.trim()) {
      newErrors.setor = "Setor é obrigatório";
    }

    // Validar senha se campos preenchidos
    if (formData.novaSenha || formData.confirmarSenha || formData.senhaAtual) {
      if (!formData.senhaAtual) {
        newErrors.senhaAtual = "Senha atual é obrigatória para alterar senha";
      }

      if (
        !formData.novaSenha &&
        (formData.confirmarSenha || formData.senhaAtual)
      ) {
        newErrors.novaSenha = "Nova senha é obrigatória";
      } else if (formData.novaSenha && formData.novaSenha.length < 6) {
        newErrors.novaSenha = "Senha deve ter pelo menos 6 caracteres";
      }

      if (
        !formData.confirmarSenha &&
        (formData.novaSenha || formData.senhaAtual)
      ) {
        newErrors.confirmarSenha = "Confirme a nova senha";
      } else if (
        formData.novaSenha &&
        formData.confirmarSenha &&
        formData.novaSenha !== formData.confirmarSenha
      ) {
        newErrors.confirmarSenha = "As senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar alterações
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      // 1. Atualizar dados do usuário (se mudaram)
      const userChanged =
        formData.nome !== user.nome ||
        formData.email !== user.email ||
        formData.cargo !== user.cargo ||
        formData.setor !== user.setor ||
        formData.novaSenha;

      if (userChanged) {
        const updateData = {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          setor: formData.setor,
        };

        // Adicionar senha se fornecida
        if (formData.novaSenha) {
          updateData.senhaAtual = formData.senhaAtual;
          updateData.novaSenha = formData.novaSenha;
        }

        const response = await api.put("/usuarios/perfil", updateData);

        // Atualizar localStorage
        if (response.data) {
          const currentUser = authService.getCurrentUser();
          const updatedUserData = {
            ...response.data,
            token: currentUser.token,
          };
          localStorage.setItem("userInfo", JSON.stringify(updatedUserData));
          window.dispatchEvent(new Event("userUpdated"));
        }
      }

      // 2. Atualizar padrões (global) se mudaram
      if (padroesUtilizados !== padroesOriginais) {
        await configuracaoService.updatePadroesUtilizados(padroesUtilizados);
        setPadroesOriginais(padroesUtilizados);
      }

      // Limpar campos de senha
      setFormData({
        ...formData,
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });

      setSuccessMessage("✅ Configurações salvas com sucesso!");
      setHasChanges(false);

      // Esconder mensagem após 8 segundos
      setTimeout(() => {
        setSuccessMessage("");
      }, 8000);
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          error.message ||
          "Erro ao salvar configurações",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancelar alterações
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      navigate("/dashboard");
    }
  }, [hasChanges, navigate]);

  // Confirmar descarte
  const handleDiscardChanges = () => {
    setShowExitConfirm(false);
    navigate("/dashboard");
  };

  // Handler de input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Toggle visibilidade de senha
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="hover:bg-muted p-2 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Configurações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie suas informações pessoais e preferências
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Alterações não salvas</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Erro de submissão */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  {errors.submit}
                </p>
              </div>
            </div>
          )}

          {/* Seção: Informações Pessoais */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Atualize seus dados básicos
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium mb-1"
                  style={{ color: COLORS.TEXT }}
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  onFocus={(e) =>
                    (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.nome
                      ? COLORS.BORDER_ERROR
                      : "")
                  }
                  className={inputClassName(errors.nome)}
                  placeholder="Seu nome completo"
                  style={{
                    borderColor: errors.nome ? COLORS.BORDER_ERROR : undefined,
                    color: COLORS.TEXT,
                  }}
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                  style={{ color: COLORS.TEXT }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={(e) =>
                    (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.email
                      ? COLORS.BORDER_ERROR
                      : "")
                  }
                  className={inputClassName(errors.email)}
                  placeholder="seu@email.com"
                  style={{
                    borderColor: errors.email ? COLORS.BORDER_ERROR : undefined,
                    color: COLORS.TEXT,
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Cargo e Setor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cargo */}
                <div>
                  <label
                    htmlFor="cargo"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT }}
                  >
                    Cargo
                  </label>
                  <input
                    type="text"
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                    onFocus={(e) =>
                      (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = errors.cargo
                        ? COLORS.BORDER_ERROR
                        : "")
                    }
                    className={inputClassName(errors.cargo)}
                    placeholder="Seu cargo"
                    style={{
                      borderColor: errors.cargo
                        ? COLORS.BORDER_ERROR
                        : undefined,
                      color: COLORS.TEXT,
                    }}
                  />
                  {errors.cargo && (
                    <p className="text-red-500 text-xs mt-1">{errors.cargo}</p>
                  )}
                </div>

                {/* Setor */}
                <div>
                  <label
                    htmlFor="setor"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT }}
                  >
                    Setor
                  </label>
                  <input
                    type="text"
                    id="setor"
                    name="setor"
                    value={formData.setor}
                    onChange={handleInputChange}
                    onFocus={(e) =>
                      (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = errors.setor
                        ? COLORS.BORDER_ERROR
                        : "")
                    }
                    className={inputClassName(errors.setor)}
                    placeholder="Seu setor"
                    style={{
                      borderColor: errors.setor
                        ? COLORS.BORDER_ERROR
                        : undefined,
                      color: COLORS.TEXT,
                    }}
                  />
                  {errors.setor && (
                    <p className="text-red-500 text-xs mt-1">{errors.setor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Padrões de Certificação */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Padrões de Certificação
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os padrões utilizados nos certificados
              </p>
            </div>

            <div className="p-6">
              <div>
                <label
                  htmlFor="padroesUtilizados"
                  className="block text-sm font-medium mb-1"
                  style={{ color: COLORS.TEXT }}
                >
                  Padrões Utilizados
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Este texto aparecerá na seção "Padrões Utilizados" dos
                  certificados gerados. Inclua os equipamentos, números de
                  certificados RBC e datas de validade.
                </p>
                <textarea
                  id="padroesUtilizados"
                  name="padroesUtilizados"
                  value={padroesUtilizados}
                  onChange={(e) => setPadroesUtilizados(e.target.value)}
                  onFocus={(e) =>
                    (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.padroesUtilizados
                      ? COLORS.BORDER_ERROR
                      : "")
                  }
                  rows={4}
                  className={inputClassName(errors.padroesUtilizados)}
                  style={{
                    borderColor: errors.padroesUtilizados
                      ? COLORS.BORDER_ERROR
                      : undefined,
                    color: COLORS.TEXT,
                    resize: "vertical",
                    minHeight: "100px",
                  }}
                />
                {errors.padroesUtilizados && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.padroesUtilizados}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Segurança */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Segurança
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Altere sua senha (opcional)
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Senha Atual */}
              <div>
                <label
                  htmlFor="senhaAtual"
                  className="block text-sm font-medium mb-1"
                  style={{ color: COLORS.TEXT }}
                >
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showPassword.atual ? "text" : "password"}
                    id="senhaAtual"
                    name="senhaAtual"
                    value={formData.senhaAtual}
                    onChange={handleInputChange}
                    onFocus={(e) =>
                      (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = errors.senhaAtual
                        ? COLORS.BORDER_ERROR
                        : "")
                    }
                    className={inputWithIconClassName(errors.senhaAtual)}
                    placeholder="Digite sua senha atual"
                    autoComplete="new-password"
                    style={{
                      borderColor: errors.senhaAtual
                        ? COLORS.BORDER_ERROR
                        : undefined,
                      color: COLORS.TEXT,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("atual")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword.atual ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.senhaAtual && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.senhaAtual}
                  </p>
                )}
              </div>

              {/* Nova Senha e Confirmar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nova Senha */}
                <div>
                  <label
                    htmlFor="novaSenha"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT }}
                  >
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.nova ? "text" : "password"}
                      id="novaSenha"
                      name="novaSenha"
                      value={formData.novaSenha}
                      onChange={handleInputChange}
                      onFocus={(e) =>
                        (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = errors.novaSenha
                          ? COLORS.BORDER_ERROR
                          : "")
                      }
                      className={inputWithIconClassName(errors.novaSenha)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      style={{
                        borderColor: errors.novaSenha
                          ? COLORS.BORDER_ERROR
                          : undefined,
                        color: COLORS.TEXT,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("nova")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword.nova ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.novaSenha && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.novaSenha}
                    </p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label
                    htmlFor="confirmarSenha"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT }}
                  >
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirmar ? "text" : "password"}
                      id="confirmarSenha"
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={handleInputChange}
                      onFocus={(e) =>
                        (e.target.style.borderColor = COLORS.BORDER_FOCUS)
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = errors.confirmarSenha
                          ? COLORS.BORDER_ERROR
                          : "")
                      }
                      className={inputWithIconClassName(errors.confirmarSenha)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                      style={{
                        borderColor: errors.confirmarSenha
                          ? COLORS.BORDER_ERROR
                          : undefined,
                        color: COLORS.TEXT,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirmar")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword.confirmar ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmarSenha}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </span>
            </button>

            <button
              type="submit"
              disabled={!hasChanges || loading}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                hasChanges && !loading
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </span>
            </button>
          </div>
        </form>
      </main>

      {/* Modal de Confirmação de Saída */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          ></div>
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Descartar Alterações?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Você tem alterações não salvas. Se sair agora, todas as
                    mudanças serão perdidas.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
                >
                  Continuar Editando
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Descartar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracoesPage;
