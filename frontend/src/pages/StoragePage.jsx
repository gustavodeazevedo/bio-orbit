import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import monitoramentoService from "../services/monitoramentoService";
import {
  ArrowLeft,
  Database,
  HardDrive,
  Home,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  Users,
  Award,
} from "lucide-react";

const StoragePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [storageUsage, setStorageUsage] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [animatedUsagePercent, setAnimatedUsagePercent] = useState(100);
  const [animatedUsedBytes, setAnimatedUsedBytes] = useState(0);
  const [animatedCollections, setAnimatedCollections] = useState([]);
  const [animatedRecordsBarPercent, setAnimatedRecordsBarPercent] =
    useState(100);
  const [storageAnimationKey, setStorageAnimationKey] = useState(0);
  const animationFrameRef = useRef(null);
  const initialLoadStartedRef = useRef(false);

  const loadStorageUsage = useCallback(async (replayAnimation = false) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (replayAnimation) {
      setStorageUsage(null);
      setAnimatedUsagePercent(100);
      setAnimatedUsedBytes(0);
      setAnimatedRecordsBarPercent(100);
      setAnimatedCollections([]);
    }

    setLoadingStorage(true);
    setStorageError(false);

    try {
      const data = await monitoramentoService.getStorageUsage();
      setStorageUsage(data);
      setStorageAnimationKey((currentKey) => currentKey + 1);
      setAnimatedUsagePercent(100);
      setAnimatedUsedBytes(data.storageLimitBytes);
      setAnimatedRecordsBarPercent(100);
      setAnimatedCollections(
        data.collections.map((collection) => ({
          ...collection,
          animatedBytes: 0,
        })),
      );

      const animationStart = performance.now();
      const animationDuration = 2600;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const animateStorage = (now) => {
        const progress = Math.min(
          (now - animationStart) / animationDuration,
          1,
        );
        const easedProgress =
          progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

        setAnimatedUsagePercent(
          100 + (data.usagePercent - 100) * easedProgress,
        );
        setAnimatedUsedBytes(
          data.storageLimitBytes +
            (data.usedBytes - data.storageLimitBytes) * easedProgress,
        );
        setAnimatedRecordsBarPercent(
          100 + (data.usagePercent - 100) * easedProgress,
        );
        setAnimatedCollections(
          data.collections.map((collection) => ({
            ...collection,
            animatedBytes: collection.storageSizeBytes * easedProgress,
          })),
        );

        if (!prefersReducedMotion && progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateStorage);
        }
      };

      if (prefersReducedMotion) {
        setAnimatedUsagePercent(data.usagePercent);
        setAnimatedUsedBytes(data.usedBytes);
        setAnimatedRecordsBarPercent(data.usagePercent);
        setAnimatedCollections(
          data.collections.map((collection) => ({
            ...collection,
            animatedBytes: collection.storageSizeBytes,
          })),
        );
      } else {
        animationFrameRef.current = requestAnimationFrame(animateStorage);
      }
    } catch (error) {
      console.error("Erro ao carregar uso de armazenamento:", error);
      setStorageError(true);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadStartedRef.current) {
      initialLoadStartedRef.current = true;
      loadStorageUsage();
    }

    const interval = setInterval(loadStorageUsage, 60000);
    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loadStorageUsage]);

  const formatBytes = (bytes = 0) => {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / 1024 ** unitIndex;

    return `${value.toLocaleString("pt-BR", {
      maximumFractionDigits: value >= 100 ? 0 : 1,
    })} ${units[unitIndex]}`;
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: Award, label: "Certificados", path: "/selecionar-cliente" },
    { icon: Database, label: "Storage", path: "/storage", active: true },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
  ];

  const formatAnimatedBytes = (bytes = 0) => formatBytes(Math.max(bytes, 0));

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
            onClick={() => setCollapsed(!collapsed)}
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
            <h2 className="text-2xl font-semibold text-foreground">Storage</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento do armazenamento do banco de dados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:bg-muted p-2 rounded-lg transition-colors"
              title="Voltar ao dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.nome || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.cargo || ""}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-right-2 duration-900">
            <section className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-900">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      Armazenamento do BioOrbit
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uso atual e distribuição do espaço por coleção
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadStorageUsage(true)}
                  disabled={loadingStorage}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingStorage ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </button>
              </div>

              {loadingStorage && !storageUsage ? (
                <div className="p-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 animate-pulse">
                  <div className="h-52 w-52 rounded-full border-[20px] border-muted mx-auto" />
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-24 bg-muted rounded" />
                  </div>
                </div>
              ) : storageError ? (
                <div className="p-12 text-center">
                  <HardDrive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Armazenamento indisponível
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Não foi possível consultar o banco agora.
                  </p>
                </div>
              ) : storageUsage ? (
                <div
                  key={storageAnimationKey}
                  className="p-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-center animate-in fade-in duration-1200"
                >
                  <div className="relative h-52 w-52 mx-auto flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(rgb(144, 199, 45) ${animatedUsagePercent}%, rgb(229, 231, 235) ${animatedUsagePercent}% 100%)`,
                      }}
                    />
                    <div className="absolute inset-[20px] rounded-full bg-card flex flex-col items-center justify-center">
                      <span className="text-4xl font-semibold text-foreground">
                        {animatedUsagePercent.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        utilizado
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
                      <div>
                        <p className="text-3xl font-semibold text-foreground">
                          {formatAnimatedBytes(animatedUsedBytes)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          de {formatBytes(storageUsage.storageLimitBytes)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {storageUsage.documents.toLocaleString("pt-BR")}{" "}
                        registros
                      </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${animatedRecordsBarPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {animatedCollections
                        .slice(0, 6)
                        .map((collection, index) => (
                          <div
                            key={collection.name}
                            style={{ animationDelay: `${index * 100}ms` }}
                            className="rounded-lg bg-muted/40 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-1 duration-900"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-sm text-foreground truncate">
                                  {collection.label}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {formatAnimatedBytes(collection.animatedBytes)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-border/70 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-primary rounded-full transition-[width] duration-300"
                                style={{
                                  width: `${Math.min(
                                    (collection.animatedBytes /
                                      Math.max(storageUsage.usedBytes, 1)) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="px-6 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
                Atualização automática a cada minuto. O limite exibido é o
                limite configurado para o ambiente.
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoragePage;
