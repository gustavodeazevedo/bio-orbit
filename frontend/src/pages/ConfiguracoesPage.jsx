import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import configuracaoService from "../services/configuracaoService";
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Building2,
  Shield,
  Bell,
} from "lucide-react";

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados do formulário
  const [activeTab, setActiveTab] = useState("perfil");
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
        newErrors.senhaAtual = "Senha atual é obrigatória";
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
      } else if (formData.novaSenha !== formData.confirmarSenha) {
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

        if (formData.novaSenha) {
          updateData.senhaAtual = formData.senhaAtual;
          updateData.novaSenha = formData.novaSenha;
        }

        await authService.updateProfile(updateData);
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

      // Esconder mensagem após 5 segundos
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          "Erro ao salvar configurações. Tente novamente.",
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
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Toggle visibilidade de senha
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "seguranca", label: "Segurança", icon: Lock },
    { id: "certificados", label: "Certificados", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar de Navegação */}
      <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="h-20 px-6 flex items-center border-b border-border">
          <button
            onClick={handleCancel}
            className="hover:bg-muted p-2 rounded-lg transition-colors -ml-2"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground ml-2">
            Configurações
          </h1>
        </div>

        {/* Tabs de Navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Status de Alterações */}
        {hasChanges && (
          <div className="p-4 border-t border-border">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-yellow-800">
                Alterações não salvas
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "perfil" &&
                "Gerencie suas informações pessoais e profissionais"}
              {activeTab === "seguranca" &&
                "Altere sua senha e configure a segurança da conta"}
              {activeTab === "certificados" &&
                "Configure padrões globais para emissão de certificados"}
            </p>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-lg flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-6">
            {/* Mensagem de sucesso */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    {successMessage}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="hover:bg-green-100 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-green-600" />
                </button>
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
                <button
                  onClick={() => setErrors({ ...errors, submit: undefined })}
                  className="hover:bg-red-100 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            )}

            {/* Tab: Perfil */}
            {activeTab === "perfil" && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Card de Informações do Usuário */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Informações Pessoais
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Atualize seus dados básicos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label
                        htmlFor="nome"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-lg transition-colors bg-background ${
                          errors.nome
                            ? "border-red-500 focus:border-red-500"
                            : "border-border focus:border-primary"
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder="Seu nome completo"
                      />
                      {errors.nome && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nome}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-lg transition-colors bg-background ${
                          errors.email
                            ? "border-red-500 focus:border-red-500"
                            : "border-border focus:border-primary"
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder="seu@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Cargo e Setor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="cargo"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          Cargo
                        </label>
                        <input
                          type="text"
                          id="cargo"
                          name="cargo"
                          value={formData.cargo}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg transition-colors bg-background ${
                            errors.cargo
                              ? "border-red-500 focus:border-red-500"
                              : "border-border focus:border-primary"
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          placeholder="Seu cargo"
                        />
                        {errors.cargo && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.cargo}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="setor"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          Setor
                        </label>
                        <input
                          type="text"
                          id="setor"
                          name="setor"
                          value={formData.setor}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg transition-colors bg-background ${
                            errors.setor
                              ? "border-red-500 focus:border-red-500"
                              : "border-border focus:border-primary"
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          placeholder="Seu setor"
                        />
                        {errors.setor && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.setor}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cards de Informação Rápida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Email de Contato
                      </p>
                      <p
                        className="text-sm font-medium text-foreground truncate"
                        title={formData.email}
                      >
                        {formData.email || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Função
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {formData.cargo || "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Tab: Segurança */}
            {activeTab === "seguranca" && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Card de Segurança */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Alterar Senha
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Mantenha sua conta segura com uma senha forte
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Senha Atual */}
                    <div>
                      <label
                        htmlFor="senhaAtual"
                        className="block text-sm font-medium text-foreground mb-2"
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
                          className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors bg-background ${
                            errors.senhaAtual
                              ? "border-red-500 focus:border-red-500"
                              : "border-border focus:border-primary"
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          placeholder="Digite sua senha atual"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("atual")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showPassword.atual ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.senhaAtual && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.senhaAtual}
                        </p>
                      )}
                    </div>

                    {/* Nova Senha e Confirmar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="novaSenha"
                          className="block text-sm font-medium text-foreground mb-2"
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
                            className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors bg-background ${
                              errors.novaSenha
                                ? "border-red-500 focus:border-red-500"
                                : "border-border focus:border-primary"
                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("nova")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {showPassword.nova ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.novaSenha && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.novaSenha}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirmarSenha"
                          className="block text-sm font-medium text-foreground mb-2"
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
                            className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors bg-background ${
                              errors.confirmarSenha
                                ? "border-red-500 focus:border-red-500"
                                : "border-border focus:border-primary"
                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="Repita a nova senha"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility("confirmar")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {showPassword.confirmar ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirmarSenha && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.confirmarSenha}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dicas de Segurança */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Dicas para uma senha forte
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-primary rounded-full"></div>
                      Use pelo menos 6 caracteres
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-primary rounded-full"></div>
                      Combine letras maiúsculas, minúsculas e números
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 bg-primary rounded-full"></div>
                      Evite informações pessoais óbvias
                    </li>
                  </ul>
                </div>
              </form>
            )}

            {/* Tab: Certificados */}
            {activeTab === "certificados" && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Card de Padrões */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Padrões de Certificação
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Configure padrões globais para todos os certificados
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="padroesUtilizados"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Padrões Utilizados
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Este texto aparecerá na seção "Padrões Utilizados" de
                      todos os certificados. Inclua equipamentos, certificados
                      RBC e datas de validade.
                    </p>
                    <textarea
                      id="padroesUtilizados"
                      name="padroesUtilizados"
                      value={padroesUtilizados}
                      onChange={(e) => setPadroesUtilizados(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-border rounded-lg transition-colors bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-vertical"
                      style={{ minHeight: "150px" }}
                      placeholder="Exemplo:&#10;Termohigrômetro Digital HT600 Instrutherm, Certificado RBC Nº CAL – A 15694/25, (Validade 08/2026).&#10;Balança Analítica Metter Toledo SAG250, Certificado RBC Nº CAL – A 15695/25, (Validade 08/2026)."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Use o formato (Validade MM/AAAA) para ativar
                      notificações automáticas de vencimento
                    </p>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Sistema de Notificações
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    O sistema verifica automaticamente as datas de validade e
                    cria notificações:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                      <span className="font-medium">
                        Vencido ou ≤10 dias - Crítico
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                      <span className="font-medium">≤60 dias - Atenção</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <span className="font-medium">≤90 dias - Lembrete</span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

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
