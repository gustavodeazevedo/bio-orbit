import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

const UpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const currentVersionRef = useRef(null);
  // Ref para rastrear a última atividade do usuário
  const lastActivityRef = useRef(Date.now());

  // Intervalo para checar atualizações (default: 30s)
  const CHECK_INTERVAL_MS = Number(import.meta.env.VITE_VERSION_CHECK_INTERVAL_MS) || 30000;

  // Tempo de inatividade para aplicar atualização automaticamente (1 minuto == 60s == 60000ms)
  const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_VERSION_IDLE_TIMEOUT_MS) || 60000;

  const buildVersionUrl = () => `/version.json?t=${Date.now()}`;

  const fetchVersion = async () => {
    const response = await fetch(buildVersionUrl(), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar version.json (${response.status})`);
    }

    return response.json();
  };

  // Checa atualizações periodicamente e ao voltar para a aba/janela
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const data = await fetchVersion();

        if (!currentVersionRef.current) {
          currentVersionRef.current = data;
          return;
        }

        if (
          data.version !== currentVersionRef.current.version ||
          data.buildTime !== currentVersionRef.current.buildTime
        ) {
          setNewVersion(data);
          setShowNotification(true);
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    // Checa imediatamente ao montar
    checkForUpdates();

    // Checa em intervalo
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL_MS);

    // Também checa ao retornar para a aba/janela
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    const onFocus = () => {
      checkForUpdates();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [CHECK_INTERVAL_MS]);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", markActivity);
    window.addEventListener("keydown", markActivity);
    window.addEventListener("click", markActivity);
    window.addEventListener("scroll", markActivity);
    window.addEventListener("touchstart", markActivity);

    return () => {
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("click", markActivity);
      window.removeEventListener("scroll", markActivity);
      window.removeEventListener("touchstart", markActivity);
    };
  }, []);

  // Se o usuário ficar inativo por um tempo, aplica a atualização automaticamente
  useEffect(() => {
    if (!newVersion) return;

    const interval = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= IDLE_TIMEOUT_MS) {
        window.location.reload();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [newVersion]);

  // Função para forçar atualização imediata
  // Esta função será chamada quando o usuário clicar no botão "Atualizar agora"
  // O botão só aparece se uma nova versão for detectada
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showNotification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Nova atualização disponível
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Uma nova versão do BioOrbit foi publicada. Para garantir o
              funcionamento correto, atualize a página.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setShowNotification(false)}
            className="px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            Mais tarde
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar agora
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          A atualização será aplicada automaticamente quando você ficar inativo.
          {newVersion?.version ? ` Versão: ${newVersion.version}` : ""}
        </p>
      </div>
    </div>
  );
};

export default UpdateNotification;
