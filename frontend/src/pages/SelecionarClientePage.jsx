import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Award } from "lucide-react";
import { getClientes } from "../services/clienteService";
import { TableSkeleton } from "../components/SkeletonLoader";
import useColdStartDetection from "../hooks/useColdStartDetection";

const SelecionarClientePage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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
    // Navega para a página de emissão de certificado com o ID do cliente selecionado
    navigate(`/emitir-certificado/${cliente._id}`, {
      state: {
        clienteNome: cliente.nome,
        clienteEndereco: cliente.endereco,
      },
    });
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <button
          className="hover:opacity-80 flex items-center"
          style={{ color: "rgb(144, 199, 45)" }}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2" /> Voltar
        </button>
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: "rgb(144, 199, 45)" }}
        >
          Selecionar Cliente para Certificado
        </h1>
        <div>{/* Espaço para equilibrar o layout */}</div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:border-[rgb(144,199,45)]"
            style={{ "--tw-ring-color": "rgb(144, 199, 45)" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>{/* Espaço para equilibrar o layout */}</div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : filteredClientes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Nome
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Cidade
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                  Estado
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-900">
                    {cliente.nome}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900">
                    {cliente.endereco?.cidade || "-"}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900">
                    {cliente.endereco?.estado || "-"}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleSelectCliente(cliente)}
                        className="text-white px-4 py-2 rounded-lg flex items-center hover:opacity-80"
                        style={{ backgroundColor: "rgb(144, 199, 45)" }}
                      >
                        <Award className="mr-2" /> Selecionar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {searchTerm
              ? "Nenhum cliente encontrado com os termos de busca."
              : "Nenhum cliente cadastrado. Por favor, cadastre um cliente antes de emitir certificados."}
          </p>
        </div>
      )}
    </div>
  );
};

export default SelecionarClientePage;
