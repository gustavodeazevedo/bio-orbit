import React, { useState } from "react";
import {
  Brain,
  Copy,
  Wand2,
  CheckCircle,
  AlertCircle,
  Upload,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import ActionButton from "./ActionButton";
import useDataExtraction from "../hooks/useDataExtraction";
import { EXEMPLOS_FORMATOS, DICAS_IA } from "../utils/exemplaosIA";

const AIDataExtractor = ({ onDataExtracted, isVisible, onClose }) => {
  const [inputText, setInputText] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  const { extractPipetteData, isProcessing, error, setError } =
    useDataExtraction();

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError("Por favor, cole os dados da micropipeta");
      return;
    }

    try {
      const data = await extractPipetteData(inputText);
      setExtractedData(data);
    } catch (err) {
      setExtractedData(null);
    }
  };

  const handleApplyData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData, inputText);
      setInputText("");
      setExtractedData(null);
      if (onClose) onClose();
    }
  };

  const exampleText = EXEMPLOS_FORMATOS.FORMATO_MONOCANAL;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: "800px" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Assistente IA - Extração de Dados
                </h2>
                <p className="text-sm text-gray-600">
                  Cole os dados do Notion para preenchimento automático
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMostrarAjuda(!mostrarAjuda)}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Ver exemplos e dicas"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Área de input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cole os dados da micropipeta aqui:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Exemplo:\n${exampleText}`}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ fontFamily: "monospace" }}
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Formato esperado: Modelo / Série / Marca / Linha / ID
              </p>
              <button
                onClick={() => setInputText(exampleText)}
                className="text-xs text-green-600 hover:text-green-800 flex items-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                Usar exemplo
              </button>
            </div>
          </div>

          {/* Botão de processar */}
          <div className="flex justify-center">
            <ActionButton
              onClick={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              variant="secondary"
              size="lg"
              icon={isProcessing ? null : Wand2}
              className="px-8"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  Processando...
                </div>
              ) : (
                "Processar com IA"
              )}
            </ActionButton>
          </div>

          {/* Seção de Ajuda */}
          {mostrarAjuda && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium mb-3">
                    Exemplos de formatos suportados:
                  </p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">
                        Micropipeta Monocanal:
                      </p>
                      <pre className="bg-white p-2 rounded border text-gray-700 overflow-x-auto text-xs">
                        {EXEMPLOS_FORMATOS.FORMATO_MONOCANAL}
                      </pre>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">
                        Micropipeta Multicanal:
                      </p>
                      <pre className="bg-white p-2 rounded border text-gray-700 overflow-x-auto text-xs">
                        {EXEMPLOS_FORMATOS.FORMATO_MULTICANAL}
                      </pre>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">
                        Repipetador:
                      </p>
                      <pre className="bg-white p-2 rounded border text-gray-700 overflow-x-auto text-xs">
                        {EXEMPLOS_FORMATOS.FORMATO_REPIPETADOR}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium text-blue-800 mb-2">
                      Dicas importantes:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {DICAS_IA.map((dica, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {dica}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Erro no processamento
                </p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Resultado extraído */}
          {extractedData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium mb-3">
                    Dados extraídos com sucesso!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Marca:</strong> {extractedData.marcaPipeta}
                      </p>
                      <p>
                        <strong>Modelo:</strong> {extractedData.modeloPipeta}
                      </p>
                      <p>
                        <strong>Série:</strong> {extractedData.numeroPipeta}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Capacidade:</strong> {extractedData.capacidade}{" "}
                        {extractedData.unidadeCapacidade}
                      </p>
                      <p>
                        <strong>Identificação:</strong>{" "}
                        {extractedData.numeroIdentificacao}
                      </p>
                      <p>
                        <strong>Pontos:</strong>{" "}
                        {extractedData.pontosCalibra.length} ponto(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium text-green-800 mb-2">
                      Pontos de Calibração:
                    </p>
                    <div className="space-y-2">
                      {extractedData.pontosCalibra.map((ponto, index) => (
                        <div
                          key={ponto.id}
                          className="bg-white p-2 rounded border"
                        >
                          <p className="text-xs">
                            <strong>
                              {ponto.volumeNominal} {ponto.unidade}:
                            </strong>{" "}
                            {ponto.valoresTexto}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <ActionButton onClick={onClose} variant="outline" size="md">
            Cancelar
          </ActionButton>

          {extractedData && (
            <ActionButton
              onClick={handleApplyData}
              variant="secondary"
              size="md"
              icon={Upload}
            >
              Aplicar Dados
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDataExtractor;
