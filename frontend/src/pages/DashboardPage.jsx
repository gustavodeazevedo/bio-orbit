import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import presenceService from "../services/presenceService";
import notificacaoService from "../services/notificacaoService";
import { useIdleCallback } from "../hooks/useIdleCallback";
import {
  Home,
  Users,
  Award,
  Settings,
  LogOut,
  Menu,
  Bell,
  User,
  UserPlus,
  Mail,
  Briefcase,
  Building2,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Circle,
} from "lucide-react";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConfigToast, setShowConfigToast] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Cores para avatares
  const avatarColors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-teal-500",
  ];

  // Carregar usuários ativos com useCallback
  const loadActiveUsers = useCallback(async () => {
    console.log("🔄 Iniciando carregamento de usuários ativos...");
    setLoadingUsers(true);
    try {
      const users = await presenceService.getActiveUsers();
      console.log("👥 Usuários recebidos do serviço:", users);
      const usersWithColors = users.map((u, index) => ({
        ...u,
        color: avatarColors[index % avatarColors.length],
        isCurrentUser: u._id === user?._id,
      }));
      console.log("🎨 Usuários com cores aplicadas:", usersWithColors);
      setActiveUsers(usersWithColors);
    } catch (error) {
      console.error("❌ Erro ao carregar usuários ativos:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?._id]); // Apenas re-criar se o ID do usuário mudar

  // Iniciar tracking de presença e polling otimizado
  useEffect(() => {
    console.log("🚀 Dashboard montado, iniciando tracking de presença...");
    console.log("👤 Usuário atual:", user);

    // Iniciar tracking de presença via HTTP
    presenceService.startTracking();
    loadActiveUsers();

    // Atualizar via API a cada 30 segundos usando idle time
    let isActive = true;

    const scheduleNextUpdate = () => {
      if (!isActive) return;

      // Usar requestIdleCallback se disponível para não bloquear interações
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(
          () => {
            if (isActive) {
              console.log("⏰ Atualizando usuários ativos via API (idle time)");
              loadActiveUsers();
              setTimeout(scheduleNextUpdate, 30000);
            }
          },
          { timeout: 32000 }
        ); // Timeout de segurança
      } else {
        setTimeout(() => {
          if (isActive) {
            console.log("⏰ Atualizando usuários ativos via API (30s)");
            loadActiveUsers();
            scheduleNextUpdate();
          }
        }, 30000);
      }
    };

    // Iniciar o agendamento
    setTimeout(scheduleNextUpdate, 30000);

    return () => {
      console.log("🛑 Dashboard desmontado, parando tracking...");
      isActive = false;
      presenceService.stopTracking();
    };
  }, [user, loadActiveUsers]);

  // Atualizar quando abrir o modal
  useEffect(() => {
    if (showActiveUsers) {
      loadActiveUsers();
    }
  }, [showActiveUsers]);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const data = await notificacaoService.getNotificacoes();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Verificar vencimentos ao carregar o dashboard
  useEffect(() => {
    const verificarECarregar = async () => {
      try {
        await notificacaoService.verificarVencimentos();
        await loadNotifications();
      } catch (error) {
        console.error("Erro ao verificar vencimentos:", error);
      }
    };
    verificarECarregar();
  }, [loadNotifications]);

  // Recarregar notificações quando abrir o painel
  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Marcar notificação como lida
  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await notificacaoService.marcarComoLida(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, lida: true } : n))
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }, []);

  // Marcar todas como lidas
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificacaoService.marcarTodasComoLidas();
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  }, []);

  // Formatar data relativa
  const formatarDataRelativa = (data) => {
    const agora = new Date();
    const dataNotificacao = new Date(data);
    const diffMs = agora - dataNotificacao;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHoras < 24)
      return `Há ${diffHoras} hora${diffHoras > 1 ? "s" : ""}`;
    if (diffDias < 7) return `Há ${diffDias} dia${diffDias > 1 ? "s" : ""}`;
    return dataNotificacao.toLocaleDateString("pt-BR");
  };

  // Memoizar handleConfigClick
  const handleConfigClick = useCallback(() => {
    navigate("/configuracoes");
  }, [navigate]);

  // Memoizar menuItems
  const menuItems = useMemo(
    () => [
      { icon: Home, label: "Dashboard", active: true },
      { icon: Users, label: "Clientes", active: false },
      { icon: Award, label: "Certificados", active: false },
      {
        icon: Settings,
        label: "Configurações",
        active: false,
        onClick: handleConfigClick,
      },
    ],
    [handleConfigClick]
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } h-screen bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-border">
          {!collapsed && (
            <h1 className="text-2xl font-bold text-primary">BioOrbit</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-muted p-2 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  if (item.label === "Clientes") navigate("/clientes");
                  if (item.label === "Certificados")
                    navigate("/selecionar-cliente");
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Olá,{" "}
              <span className="text-primary">{user?.nome?.split(" ")[0]}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de Emissão de Certificados para Micropipetas
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-muted p-2 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
              )}
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.nome || "Gustavo de Azevedo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.cargo || "Auxiliar de Manutenção"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* User Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p
                    className="text-sm font-medium text-foreground truncate"
                    title={user?.email || "gustavodea...@outlook.com"}
                  >
                    {user?.email || "gustavodea...@outlook.com"}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Cargo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.cargo || "Auxiliar de Manutenção"}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Setor
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.setor || "Técnico"}
                  </p>
                </div>
              </div>

              <div
                className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
                onClick={() => setShowActiveUsers(!showActiveUsers)}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {activeUsers.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse"></span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Usuários Ativos
                  </p>
                  {loadingUsers ? (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <span
                          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {activeUsers.length}{" "}
                        {activeUsers.length === 1 ? "usuário" : "usuários"}
                      </p>
                      {activeUsers.length > 0 && (
                        <div className="flex -space-x-2">
                          {activeUsers.slice(0, 3).map((u, idx) => (
                            <div
                              key={u._id || idx}
                              className={`h-5 w-5 rounded-full ${u.color} border-2 border-card flex items-center justify-center`}
                              title={u.nome}
                            >
                              <span className="text-[10px] font-semibold text-white">
                                {u.nome.charAt(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                    <UserPlus className="h-7 w-7 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Registro de Cliente
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Cadastre e gerencie os clientes da empresa de forma simples
                    e organizada.
                  </p>

                  <button
                    onClick={() => navigate("/clientes")}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 rounded-lg"
                  >
                    Gerenciar Clientes
                  </button>
                </div>

                <div className="group bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                    <Award className="h-7 w-7 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Emitir Certificado
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Selecione um cliente e emita certificados de calibração de
                    micropipetas.
                  </p>

                  <button
                    onClick={() => navigate("/selecionar-cliente")}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 rounded-lg"
                  >
                    Emitir Certificado
                  </button>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Bem-vindo ao BioOrbit
              </h3>
              <p className="text-muted-foreground text-sm">
                Sistema completo para emissão e gestão de certificados de
                calibração. Use o menu ao lado para navegar entre as
                funcionalidades.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Notificações */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mt-16 mr-4 max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header do Modal */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="hover:bg-muted p-2 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.lida ? "bg-primary/5" : ""
                    }`}
                    onClick={() =>
                      !notification.lida && handleMarkAsRead(notification._id)
                    }
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            {notification.titulo}
                          </h4>
                          {!notification.lida && (
                            <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarDataRelativa(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {unreadCount > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast de Configurações */}
      {showConfigToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-card border border-border rounded-lg shadow-xl p-4 flex items-start gap-3 max-w-md">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Em Breve</h4>
              <p className="text-sm text-muted-foreground">
                A página de configurações está em desenvolvimento e estará
                disponível em breve!
              </p>
            </div>
            <button
              onClick={() => setShowConfigToast(false)}
              className="hover:bg-muted p-1 rounded transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Usuários Ativos */}
      {showActiveUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowActiveUsers(false)}
          ></div>
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Usuários Ativos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeUsers.length}{" "}
                  {activeUsers.length === 1
                    ? "pessoa trabalhando"
                    : "pessoas trabalhando"}{" "}
                  agora
                </p>
              </div>
              <button
                onClick={() => setShowActiveUsers(false)}
                className="hover:bg-muted p-2 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de Usuários */}
            <div className="p-4 space-y-3">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex gap-2 mb-4">
                    <span
                      className="h-3 w-3 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="h-3 w-3 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="h-3 w-3 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Carregando usuários
                  </p>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário ativo no momento
                </div>
              ) : (
                activeUsers.map((activeUser) => (
                  <div
                    key={activeUser._id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      activeUser.isCurrentUser
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`h-12 w-12 rounded-full ${activeUser.color} flex items-center justify-center`}
                        >
                          <span className="text-lg font-semibold text-white">
                            {activeUser.nome.charAt(0)}
                          </span>
                        </div>
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {activeUser.nome}
                          </p>
                          {activeUser.isCurrentUser && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activeUser.cargo}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {activeUser.email}
                        </p>
                      </div>
                      <Circle className="h-2 w-2 fill-green-500 text-green-500 flex-shrink-0" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span>Online e ativo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
