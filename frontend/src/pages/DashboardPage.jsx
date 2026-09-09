import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import presenceService from "../services/presenceService";
import notificacaoService from "../services/notificacaoService";
import {
  AlertCircle,
  Award,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  Database,
  Home,
  Info,
  LogOut,
  Mail,
  Menu,
  Settings,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

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

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadActiveUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await presenceService.getActiveUsers();
      setActiveUsers(
        users.map((activeUser, index) => ({
          ...activeUser,
          color: avatarColors[index % avatarColors.length],
          isCurrentUser: activeUser._id === user?._id,
        })),
      );
    } catch (error) {
      console.error("Erro ao carregar usuários ativos:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?._id]);

  useEffect(() => {
    presenceService.startTracking();
    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 30000);

    return () => {
      clearInterval(interval);
      presenceService.stopTracking();
    };
  }, [loadActiveUsers]);

  useEffect(() => {
    if (showActiveUsers) loadActiveUsers();
  }, [showActiveUsers, loadActiveUsers]);

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

  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        await notificacaoService.verificarVencimentos();
        await loadNotifications();
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    };

    loadInitialNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (showNotifications) loadNotifications();
  }, [showNotifications, loadNotifications]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await notificacaoService.marcarComoLida(id);
      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? { ...notification, lida: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificacaoService.marcarTodasComoLidas();
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, lida: true })),
      );
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
    }
  }, []);

  const formatRelativeDate = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return "Agora mesmo";
    if (minutes < 60) return `Há ${minutes} minuto${minutes === 1 ? "" : "s"}`;
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getNotificationIcon = (type) => {
    if (type === "success")
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (type === "warning")
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    if (type === "error")
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const menuItems = useMemo(
    () => [
      { icon: Home, label: "Dashboard", path: "/dashboard", active: true },
      { icon: Users, label: "Clientes", path: "/clientes" },
      { icon: Award, label: "Certificados", path: "/selecionar-cliente" },
      { icon: Database, label: "Storage", path: "/storage" },
      { icon: Settings, label: "Configurações", path: "/configuracoes" },
    ],
    [],
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.lida,
  ).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={`${collapsed ? "w-20" : "w-64"} h-screen bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-border">
          {!collapsed && (
            <h1 className="text-2xl font-bold text-primary">BioOrbit</h1>
          )}
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="hover:bg-muted p-2 rounded-lg transition-colors"
            title="Recolher menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-all duration-200"
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
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
              onClick={() => setShowNotifications((value) => !value)}
              className="relative hover:bg-muted p-2 rounded-lg transition-colors"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.nome || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.cargo || ""}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email || "Não informado"}
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Cargo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.cargo || "Não informado"}
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Setor
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.setor || "Não informado"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActiveUsers(true)}
                className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 text-left cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {activeUsers.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Usuários Ativos
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {loadingUsers
                      ? "Carregando..."
                      : `${activeUsers.length} ${activeUsers.length === 1 ? "usuário" : "usuários"}`}
                  </p>
                </div>
              </button>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
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
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all px-4 py-2 rounded-lg"
                  >
                    Gerenciar Clientes
                  </button>
                </div>
                <div className="group bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
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
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all px-4 py-2 rounded-lg"
                  >
                    Emitir Certificado
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mt-16 mr-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {unreadCount} novas
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="hover:bg-muted p-2 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
                  <button
                    key={notification._id}
                    onClick={() =>
                      !notification.lida && handleMarkAsRead(notification._id)
                    }
                    className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 ${!notification.lida ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {notification.titulo}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatRelativeDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            {unreadCount > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full text-center text-sm text-primary font-medium"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showActiveUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowActiveUsers(false)}
          />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Usuários Ativos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeUsers.length}{" "}
                  {activeUsers.length === 1 ? "pessoa" : "pessoas"} trabalhando
                  agora
                </p>
              </div>
              <button
                onClick={() => setShowActiveUsers(false)}
                className="hover:bg-muted p-2 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {loadingUsers ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando usuários...
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário ativo no momento
                </div>
              ) : (
                activeUsers.map((activeUser) => (
                  <div
                    key={activeUser._id}
                    className={`p-4 rounded-lg border ${activeUser.isCurrentUser ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-full ${activeUser.color} flex items-center justify-center`}
                      >
                        <span className="text-lg font-semibold text-white">
                          {activeUser.nome.charAt(0)}
                        </span>
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
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                Online e ativo
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
