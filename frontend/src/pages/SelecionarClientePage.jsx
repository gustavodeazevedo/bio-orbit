import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  Award,
  Users,
  MapPin,
  AlertCircle,
  X,
} from "lucide-react";
import { getClientes } from "../services/clienteService";
import { TableSkeleton } from "../components/SkeletonLoader";
import useColdStartDetection from "../hooks/useColdStartDetection";
import { useDebounce } from "../hooks/useDebounce";

const SelecionarClientePage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Hook para detectar cold start
  const { isColdStart, startLoading, stopLoading } =
    useColdStartDetection(1500);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      startLoading();
      const data = await getClientes();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Erro ao carregar clientes");
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleSelectCliente = (cliente) => {
    navigate(`/emitir-certificado/${cliente._id}`, {
      state: {
        clienteNome: cliente.nome,
        clienteEndereco: cliente.endereco,
      },
    });
  };

  const filteredClientes = useMemo(() => {
    if (!debouncedSearchTerm) return clientes;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return clientes.filter((cliente) =>
      cliente.nome.toLowerCase().includes(searchLower)
    );
  }, [clientes, debouncedSearchTerm]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="h-20 px-6 flex items-center border-b border-border">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:bg-muted p-2 rounded-lg transition-colors -ml-2"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground ml-2">
            Certificados
          </h1>
        </div>

        {/* Estatísticas */}
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total de Clientes
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {clientes.length}
                </p>
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {filteredClientes.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filteredClientes.length === 1 ? "resultado" : "resultados"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Selecionar Cliente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha um cliente para emitir o certificado
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="hover:bg-red-100 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            )}

            {/* Barra de Busca */}    
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome..."
                  className="w-full pl-12 pr-12 py-3 border border-border rounded-lg transition-colors bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

            {/* Tabela de Clientes */}
            {loading ? (
              <div className="bg-card rounded-xl border border-border p-6">
                <TableSkeleton rows={6} columns={3} />
              </div>
            ) : filteredClientes.length > 0 ? (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Localização
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredClientes.map((cliente) => (
                        <tr
                          key={cliente._id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold text-sm">
                                  {cliente.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {cliente.nome}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <div className="flex flex-col">
                                <p className="text-sm">
                                  {cliente.endereco?.cidade || "-"}
                                </p>
                                <p className="text-xs">
                                  {cliente.endereco?.estado || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleSelectCliente(cliente)}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                              >
                                <Award className="h-4 w-4" />
                                Selecionar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm
                      ? "Nenhum cliente encontrado"
                      : "Nenhum cliente cadastrado"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchTerm
                      ? "Tente buscar com outros termos."
                      : "Cadastre um cliente antes de emitir certificados."}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SelecionarClientePage;
