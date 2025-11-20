import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";
import UpdateNotification from "./components/UpdateNotification";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Lazy loading de páginas para melhorar INP
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RecuperarSenhaPage = lazy(() => import("./pages/RecuperarSenhaPage"));
const RedefinirSenhaPage = lazy(() => import("./pages/RedefinirSenhaPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ClientesPage = lazy(() => import("./pages/ClientesPage"));
const ClienteFormPage = lazy(() => import("./pages/ClienteFormPage"));
const SelecionarClientePage = lazy(
  () => import("./pages/SelecionarClientePage")
);
const EmitirCertificadoPage = lazy(
  () => import("./pages/EmitirCertificadoPage")
);
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));

// Componente de loading
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(144,199,45)] mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <UpdateNotification />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            {/* Rotas públicas - com wrapper */}
            <Route
              path="/login"
              element={
                <div className="min-h-screen bg-gray-50">
                  <main className="container mx-auto px-4 py-8">
                    <LoginPage />
                  </main>
                </div>
              }
            />
            <Route
              path="/registro"
              element={
                <div className="min-h-screen bg-gray-50">
                  <main className="container mx-auto px-4 py-8">
                    <RegisterPage />
                  </main>
                </div>
              }
            />
            <Route
              path="/recuperar-senha"
              element={
                <div className="min-h-screen bg-gray-50">
                  <main className="container mx-auto px-4 py-8">
                    <RecuperarSenhaPage />
                  </main>
                </div>
              }
            />
            <Route
              path="/redefinir-senha/:token"
              element={
                <div className="min-h-screen bg-gray-50">
                  <main className="container mx-auto px-4 py-8">
                    <RedefinirSenhaPage />
                  </main>
                </div>
              }
            />

            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard - SEM wrapper */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Configurações - SEM wrapper */}
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />

              {/* Rotas de clientes - com wrapper */}
              <Route
                path="/clientes"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <main className="container mx-auto px-4 py-8">
                      <ClientesPage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/clientes/novo"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <main className="container mx-auto px-4 py-8">
                      <ClienteFormPage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/clientes/editar/:id"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <main className="container mx-auto px-4 py-8">
                      <ClienteFormPage />
                    </main>
                  </div>
                }
              />

              {/* Rotas de certificados - com wrapper */}
              <Route
                path="/selecionar-cliente"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <main className="container mx-auto px-4 py-8">
                      <SelecionarClientePage />
                    </main>
                  </div>
                }
              />
              <Route
                path="/emitir-certificado/:id"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <main className="container mx-auto px-4 py-8">
                      <EmitirCertificadoPage />
                    </main>
                  </div>
                }
              />
            </Route>

            {/* Rotas protegidas apenas para admin */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              {/* Outras rotas de admin serão adicionadas aqui */}
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
