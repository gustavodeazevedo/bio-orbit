import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import configuracaoService from "../services/configuracaoService";
import {
  ArrowLeft,
  FileText,
  Download,
  Thermometer,
  Droplet,
  TestTube,
  TrendingUp,
  Plus,
  Minus,
  Calculator,
  Table,
  Eye,
  EyeOff,
  FileDown,
  HelpCircle,
  Info,
  Trash2,
  Sparkles,
  Building2,
  Wrench,
  Calendar,
} from "lucide-react";
import Tooltip from "../components/Tooltip";
import CanalMestreBadge from "../components/CanalMestreBadge";
import FormInput from "../components/FormInput";
import VolumeInput from "../components/VolumeInput";
import VolumeInputPoint from "../components/VolumeInputPoint";
import ActionButton from "../components/ActionButton";
import InfoBanner from "../components/InfoBanner";
import RadioGroup from "../components/RadioGroup";
import SectionCard from "../components/SectionCard";
import AIChatAssistant from "../components/AIChatAssistant";
import CertificadoCard from "../components/CertificadoCard";
import useAnimatedInput from "../hooks/useAnimatedInput";
import { getClienteById } from "../services/clienteService";
import { formatNumberInput, formatTemperature } from "../utils/formatUtils";
import { PDFService } from "../services/pdfService";
import "../styles/AutomationButton.css";
import "../styles/AIAnimations.css";
import "../styles/AIAnimatedInputs.css";
const EmitirCertificadoPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado para padrões globais
  const [padroesUtilizados, setPadroesUtilizados] = useState("");

  // Ref para controlar a navegação entre inputs
  const formRef = useRef(null);

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    numeroCertificado: "",
    dataCalibracao: "",
    tipoEquipamento: "micropipeta", // Tipo de equipamento (micropipeta/bureta/repipetador)
    marcaPipeta: "",
    modeloPipeta: "",
    numeroPipeta: "",
    numeroIdentificacao: "",
    capacidade: "",
    unidadeCapacidade: "µL",
    faixaIndicacao: "", // Faixa de indicação da pipeta
    unidadeFaixaIndicacao: "µL",
    faixaCalibrada: "", // Faixa calibrada da pipeta
    unidadeFaixaCalibrada: "µL",
    tipoInstrumento: "monocanal", // Tipo de instrumento (monocanal/multicanal)
    quantidadeCanais: 8, // Quantidade de canais para multicanal (8 ou 12)
    temperatura: "20.0",
    umidadeRelativa: "50",
    // Novos campos para aprimorar o certificado
    equipamentoReferencia: {
      balanca: "Mettler Toledo XS105",
      termometro: "Minipa MT-241",
      higrometro: "Minipa MT-241",
    },
    metodologia: "ISO 8655",
    validadeCalibracao: "12", // Validade em meses
    condicoesAmbientaisControladas: true,
  });
  const [certificadoGerado, setCertificadoGerado] = useState(false); // Fator Z calculado com base na temperatura
  const [fatorZ, setFatorZ] = useState(1.0029); // Valor padrão para 20°C
  // Estado para controlar erros de validação
  const [validationErrors, setValidationErrors] = useState({});
  // Estado para controlar erros de anotação (unidades obrigatórias)
  const [annotationErrors, setAnnotationErrors] = useState([]);
  // Estado para os pontos de calibração
  const [pontosCalibra, setPontosCalibra] = useState([
    {
      id: 1,
      volumeNominal: "",
      unidade: "µL",
      medicoes: Array(10).fill(""),
      valoresTexto: "", // Campo para armazenar o texto original
      media: null,
      mediaMassa: null,
      inexatidao: null,
      inexatidaoPercentual: null,
      desvioPadrao: null,
    },
  ]);
  // Estado para controlar o número de canais (para multicanal)
  const [numeroCanais, setNumeroCanais] = useState(1); // Estado para controlar a quantidade de canais selecionada pelo usuário
  const [quantidadeCanais, setQuantidadeCanais] = useState(8); // 8 ou 12 canais
  // Estado para controlar o número de pontos por canal (para multicanal)
  const [pontosPorCanal, setPontosPorCanal] = useState(3); // Padrão de 3 pontos por canal

  // Estado para gerenciar seringas do repipetador
  const [seringas, setSeringas] = useState([]);
  // Estado para controlar a visibilidade da nota explicativa sobre cálculos
  const [mostrarNotaCalculos, setMostrarNotaCalculos] = useState(false);
  // Estado para controlar a automação de medições
  const [autoPreenchimento, setAutoPreenchimento] = useState({
    ativo: false,
    mensagem: "",
  });

  // Estado para controlar se a automação está habilitada
  const [automacaoHabilitada, setAutomacaoHabilitada] = useState(true);

  // Estado para exibir/esconder a seção de cálculos
  const [mostrarCalculos, setMostrarCalculos] = useState(false);

  // Hook para animação de inputs
  const {
    isAnimating,
    currentField,
    animationSpeed,
    setAnimationSpeed,
    executeAnimationSequence,
    animateButtonClick,
    stopAnimation,
    cleanup,
  } = useAnimatedInput();

  // Estado para controlar o progresso da animação
  const [animationProgress, setAnimationProgress] = useState(0);

  // Tabela de referência mais precisa para o fator Z baseado na temperatura com incrementos de 0.5°C
  const tabelaFatorZ = {
    "15.0": 1.002,
    15.5: 1.002,
    "16.0": 1.0021,
    16.5: 1.0022,
    "17.0": 1.0023,
    17.5: 1.0024,
    "18.0": 1.0025,
    18.5: 1.0026,
    "19.0": 1.0027,
    19.5: 1.0028,
    "20.0": 1.0029,
    20.5: 1.003,
    "21.0": 1.0031,
    21.5: 1.0032,
    "22.0": 1.0033,
    22.5: 1.0034,
    "23.0": 1.0035,
    23.5: 1.0036,
    "24.0": 1.0038,
    24.5: 1.0039,
    "25.0": 1.004,
    25.5: 1.0041,
    "26.0": 1.0043,
    26.5: 1.0044,
    "27.0": 1.0045,
    27.5: 1.0047,
    "28.0": 1.0048,
    28.5: 1.005,
    "29.0": 1.0051,
    29.5: 1.0052,
    "30.0": 1.0054,
  };

  // Carregar configurações globais
  useEffect(() => {
    const loadConfiguracoes = async () => {
      try {
        const config = await configuracaoService.getConfiguracoes();
        setPadroesUtilizados(config.padroesUtilizados || "");
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };
    loadConfiguracoes();
  }, []);

  // Calcula o fator Z com base na temperatura
  useEffect(() => {
    const calcularFatorZ = (temperatura) => {
      const tempFormatada = parseFloat(temperatura).toFixed(1);
      return tabelaFatorZ[tempFormatada] || tabelaFatorZ["20.0"]; // Retorna o valor padrão se não encontrar
    };

    setFatorZ(calcularFatorZ(formData.temperatura));
  }, [formData.temperatura]);

  // Ajusta a temperatura para incrementos de 0.5°C
  // Utilizando a função de formatTemperature da pasta utils
  const ajustarTemperatura = (valor) => {
    return formatTemperature(valor);
  };

  // Função para validar o número do certificado
  const validateNumeroCertificado = (valor, allowCompleteFormat = false) => {
    // Remove espaços em branco
    const valorLimpo = valor.trim();

    // Verifica se está vazio
    if (!valorLimpo) {
      return "Número do certificado é obrigatório";
    }

    if (allowCompleteFormat) {
      // Para validação final: aceita formato completo (1234.1) ou formato de entrada (1234.)
      const formatoCompletoValido = /^\d+\.\d*$/;
      if (!formatoCompletoValido.test(valorLimpo)) {
        return "Formato inválido. O número do certificado deve conter números, ponto e números após o ponto.";
      }
    } else {
      // Para entrada manual: apenas números seguidos de um ponto (sem números após o ponto)
      // Exemplos válidos: 1234., 8663., 999.
      // Exemplos inválidos: 1234.1, 8663.123, 999 (sem ponto)
      const formatoEntradaValido = /^\d+\.$/;
      if (!formatoEntradaValido.test(valorLimpo)) {
        return "Formato inválido. Use apenas números seguidos de ponto (Ex: 1234.). A IA completará automaticamente após o ponto.";
      }
    }

    return null; // Sem erro
  };

  const validateDataCalibracao = (valor) => {
    const valorLimpo = (valor || "").trim();

    if (!valorLimpo) {
      return "Data da calibração é obrigatória";
    }

    const formatoDataValido = /^\d{4}-\d{2}-\d{2}$/;
    if (!formatoDataValido.test(valorLimpo)) {
      return "Data da calibração inválida";
    }

    return null;
  };

  // Função para validar anotações do Notion (unidades obrigatórias)
  const validateNotionAnnotations = (extractedData, originalText = "") => {
    const errors = [];

    console.log("🔍 Validando dados extraídos:", extractedData);
    console.log("📝 Texto original recebido:", originalText ? "SIM" : "NÃO");
    console.log("📝 Tamanho do texto:", originalText.length);

    // ESTRATÉGIA 1: Verificar se as unidades já estão nos dados extraídos
    if (
      extractedData.unidadeCapacidade &&
      (extractedData.unidadeCapacidade === "µL" ||
        extractedData.unidadeCapacidade === "mL")
    ) {
      console.log(
        "✅ Unidade de capacidade encontrada nos dados extraídos:",
        extractedData.unidadeCapacidade,
      );
    }

    if (
      extractedData.unidadeFaixaIndicacao &&
      (extractedData.unidadeFaixaIndicacao === "µL" ||
        extractedData.unidadeFaixaIndicacao === "mL")
    ) {
      console.log(
        "✅ Unidade de faixa indicação encontrada nos dados extraídos:",
        extractedData.unidadeFaixaIndicacao,
      );
    }

    if (
      extractedData.unidadeFaixaCalibrada &&
      (extractedData.unidadeFaixaCalibrada === "µL" ||
        extractedData.unidadeFaixaCalibrada === "mL")
    ) {
      console.log(
        "✅ Unidade de faixa calibrada encontrada nos dados extraídos:",
        extractedData.unidadeFaixaCalibrada,
      );
    }

    // Se as unidades estão presentes nos dados extraídos, a validação passou
    if (
      extractedData.unidadeCapacidade ||
      extractedData.unidadeFaixaIndicacao ||
      extractedData.unidadeFaixaCalibrada
    ) {
      console.log("✅ Unidades encontradas nos dados extraídos - validação OK");
      return []; // Sem erros
    }

    // ESTRATÉGIA 2: Se não há texto original, não podemos validar - assumir que está correto
    if (!originalText || originalText.trim().length === 0) {
      console.log(
        "⚠️ Sem texto original e sem unidades extraídas - assumindo validação OK",
      );
      return []; // Sem erros por enquanto
    }

    // ESTRATÉGIA 3: Validar pelo texto original
    const volumePattern = /VOLUME:\s*.*?(ul|ml)/i;
    const volumeMatch = volumePattern.test(originalText);
    console.log("📊 VOLUME pattern match:", volumeMatch);
    if (!volumeMatch) {
      errors.push(
        "VOLUME deve incluir unidade (ul ou ml). Exemplo: 'VOLUME: 100ul'",
      );
    }

    const indicacaoPattern = /PONTOS DE INDICA[CÇ][AÃ]O:\s*.*?(ul|ml)/i;
    const indicacaoMatch = indicacaoPattern.test(originalText);
    console.log("📈 PONTOS DE INDICAÇÃO pattern match:", indicacaoMatch);
    if (!indicacaoMatch) {
      errors.push(
        "PONTOS DE INDICAÇÃO deve incluir unidade (ul ou ml). Exemplo: 'PONTOS DE INDICAÇÃO: 10-100ul'",
      );
    }

    const calibradosPattern = /PONTOS CALIBRADOS:\s*.*?(ul|ml)/i;
    const calibradosMatch = calibradosPattern.test(originalText);
    console.log("🎯 PONTOS CALIBRADOS pattern match:", calibradosMatch);
    if (!calibradosMatch) {
      errors.push(
        "PONTOS CALIBRADOS deve incluir unidade (ul ou ml). Exemplo: 'PONTOS CALIBRADOS: 10-100ul'",
      );
    }

    console.log("❌ Errors found:", errors);
    return errors;
  }; // Buscar dados do cliente se não foram passados pelo location state
  useEffect(() => {
    const fetchClienteData = async () => {
      if (location.state?.clienteNome) {
        setCliente({
          nome: location.state.clienteNome,
          endereco: location.state.clienteEndereco,
        });
        setLoading(false);
      } else {
        try {
          const data = await getClienteById(id);
          setCliente(data);
          setError(null);
        } catch (err) {
          setError(
            "Erro ao carregar dados do cliente. Por favor, tente novamente.",
          );
          console.error("Erro ao carregar cliente:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClienteData();
  }, [id, location]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    const camposNumericos = ["temperatura", "umidadeRelativa", "capacidade"];

    if (name === "temperatura") {
      // Para temperatura, ajusta para incrementos de 0.5
      const temperaturaAjustada = formatTemperature(value);
      setFormData({
        ...formData,
        [name]: temperaturaAjustada,
      });
    } else if (camposNumericos.includes(name)) {
      // Para outros campos numéricos, usa a função de formatação de números
      const valorFormatado = formatNumberInput(value);

      setFormData({
        ...formData,
        [name]: valorFormatado,
      });
    } else if (name === "tipoEquipamento") {
      // Quando o tipo de equipamento muda, ajusta configurações específicas
      const novoFormData = {
        ...formData,
        [name]: value,
      }; // Se mudou para repipetador, limpa campos específicos de micropipetas e força tipo de instrumento como monocanal
      if (value === "repipetador") {
        novoFormData.tipoInstrumento = "monocanal";
        novoFormData.quantidadeCanais = 1;
        novoFormData.capacidade = "";
        novoFormData.faixaIndicacao = "";
        novoFormData.unidadeFaixaIndicacao = "µL";
        novoFormData.faixaCalibrada = "";
        novoFormData.unidadeFaixaCalibrada = "µL";
        // Reorganiza pontos para monocanal se necessário
        reorganizarPontosParaMonocanal();
      } else if (value === "bureta") {
        // Se mudou para bureta, força tipo de instrumento como monocanal (buretas são sempre monocanais)
        novoFormData.tipoInstrumento = "monocanal";
        novoFormData.quantidadeCanais = 1;
        // Reorganiza pontos para monocanal se necessário
        reorganizarPontosParaMonocanal();
      }

      setFormData(novoFormData);
    } else if (name === "tipoInstrumento") {
      // Quando o tipo de instrumento muda, reorganiza os pontos de calibração
      if (value === "multicanal") {
        // Para multicanal, cria grupos de 3 pontos por canal
        reorganizarPontosParaMulticanal();
      } else {
        // Para monocanal, volta ao layout padrão
        reorganizarPontosParaMonocanal();
      }

      setFormData({
        ...formData,
        [name]: value,
        quantidadeCanais: value === "multicanal" ? quantidadeCanais : 1,
      });
    } else if (name === "numeroCertificado") {
      // Filtrar entrada para impedir números após o ponto
      let valorFiltrado = value;

      // Se já contém um ponto, não permite adicionar mais números depois dele
      if (value.includes(".")) {
        const partes = value.split(".");
        // Mantém apenas a parte antes do ponto + o ponto, remove qualquer coisa após o ponto
        valorFiltrado = partes[0] + ".";
      }

      // Validação específica para número do certificado
      const erro = validateNumeroCertificado(valorFiltrado);

      // Atualiza o estado de erros
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        numeroCertificado: erro,
      }));

      // Atualiza o valor filtrado (impedindo números após o ponto)
      setFormData({
        ...formData,
        [name]: valorFiltrado,
      });
    } else if (name === "dataCalibracao") {
      const erro = validateDataCalibracao(value);

      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        dataCalibracao: erro,
      }));

      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  // Manipula mudanças diretas nos controles de temperatura (botões + e -)
  const alterarTemperatura = (incremento) => {
    const temperaturaAtual = parseFloat(formData.temperatura);
    const novaTemperatura = (temperaturaAtual + incremento).toFixed(1);

    // Verifica se a temperatura está dentro dos limites permitidos
    if (novaTemperatura >= 15.0 && novaTemperatura <= 30.0) {
      setFormData({
        ...formData,
        temperatura: novaTemperatura,
      });
    }
  };
  // Função para reorganizar pontos para layout multicanal
  const reorganizarPontosParaMulticanal = (
    canaisCustomizados = null,
    pontosPorCanalCustomizados = null,
  ) => {
    // Usar a quantidade de canais customizada ou a selecionada pelo usuário
    const novosCanais = canaisCustomizados || quantidadeCanais; // 8 ou 12 canais conforme seleção
    const novosPontosPorCanal = pontosPorCanalCustomizados || pontosPorCanal;

    console.log(
      "🔄 Reorganizando pontos para",
      novosCanais,
      "canais e",
      novosPontosPorCanal,
      "pontos por canal",
    );
    const novosPontos = [];

    for (let canal = 1; canal <= novosCanais; canal++) {
      for (let ponto = 1; ponto <= novosPontosPorCanal; ponto++) {
        novosPontos.push({
          id: Date.now() + canal * 100 + ponto,
          volumeNominal: "",
          unidade: "µL",
          medicoes: Array(10).fill(""),
          valoresTexto: "",
          media: null,
          mediaMassa: null,
          inexatidao: null,
          inexatidaoPercentual: null,
          desvioPadrao: null,
          canal: canal, // Identificador do canal
          pontoPosicao: ponto, // Posição do ponto dentro do canal
        });
      }
    }

    setPontosCalibra(novosPontos);
    setNumeroCanais(novosCanais);
    if (pontosPorCanalCustomizados) {
      setPontosPorCanal(pontosPorCanalCustomizados);
    }
  };

  // Função para atualizar o número de pontos por canal
  const handlePontosPorCanalChange = (novoNumero) => {
    setPontosPorCanal(novoNumero);

    // Se estiver em modo multicanal, reorganiza os pontos
    if (formData.tipoInstrumento === "multicanal") {
      reorganizarPontosParaMulticanal();
    }
  };

  // Efeito para reorganizar pontos quando pontosPorCanal muda
  useEffect(() => {
    if (formData.tipoInstrumento === "multicanal") {
      reorganizarPontosParaMulticanal();
    }
  }, [pontosPorCanal]);

  // Cleanup da animação quando o componente for desmontado
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  // Função para reorganizar pontos para layout monocanal
  const reorganizarPontosParaMonocanal = () => {
    // Volta ao layout padrão com um ponto
    setPontosCalibra([
      {
        id: Date.now(),
        volumeNominal: "",
        unidade: "µL",
        medicoes: Array(10).fill(""),
        valoresTexto: "",
        media: null,
        mediaMassa: null,
        inexatidao: null,
        inexatidaoPercentual: null,
        desvioPadrao: null,
      },
    ]);
    setNumeroCanais(1);
  }; // Função para lidar com mudança na quantidade de canais
  const handleQuantidadeCanaisChange = (novaQuantidade) => {
    setQuantidadeCanais(novaQuantidade);

    // Atualizar também o formData
    setFormData({
      ...formData,
      quantidadeCanais: novaQuantidade,
    });

    // Se já estiver em modo multicanal, reorganiza os pontos com a nova quantidade
    if (formData.tipoInstrumento === "multicanal") {
      reorganizarPontosParaMulticanal(novaQuantidade);
    }
  };

  // Funções para gerenciar seringas do repipetador
  const adicionarSeringa = () => {
    const novaSeringa = {
      id: Date.now(),
      volumeNominal: "",
      unidade: "µL",
      pontosCalibra: Array.from({ length: 3 }, (_, index) => ({
        id: Date.now() + index + 1,
        volumeNominal: "",
        unidade: "µL",
        medicoes: Array(10).fill(""),
        valoresTexto: "",
        media: null,
        mediaMassa: null,
        inexatidao: null,
        inexatidaoPercentual: null,
        desvioPadrao: null,
        pontoIndex: index + 1,
      })),
    };
    setSeringas([...seringas, novaSeringa]);
  };

  const removerSeringa = (seringaId) => {
    if (seringas.length <= 1) {
      alert("É necessário manter pelo menos uma seringa para calibração.");
      return;
    }
    setSeringas(seringas.filter((seringa) => seringa.id !== seringaId));
  };
  const atualizarSeringa = (seringaId, campo, valor) => {
    setSeringas(
      seringas.map((seringa) => {
        if (seringa.id === seringaId) {
          return { ...seringa, [campo]: valor };
        }
        return seringa;
      }),
    );
  };

  const atualizarPontoSeringa = (seringaId, pontoId, campo, valor) => {
    setSeringas(
      seringas.map((seringa) => {
        if (seringa.id === seringaId) {
          return {
            ...seringa,
            pontosCalibra: seringa.pontosCalibra.map((ponto) => {
              if (ponto.id === pontoId) {
                return { ...ponto, [campo]: valor };
              }
              return ponto;
            }),
          };
        }
        return seringa;
      }),
    );
  };

  const atualizarMedicaoSeringa = (seringaId, pontoId, medicaoIndex, valor) => {
    setSeringas(
      seringas.map((seringa) => {
        if (seringa.id === seringaId) {
          return {
            ...seringa,
            pontosCalibra: seringa.pontosCalibra.map((ponto) => {
              if (ponto.id === pontoId) {
                const novasMedicoes = [...ponto.medicoes];
                const valorFormatado = formatNumberInput(valor);
                novasMedicoes[medicaoIndex] = valorFormatado;
                return { ...ponto, medicoes: novasMedicoes };
              }
              return ponto;
            }),
          };
        }
        return seringa;
      }),
    );
  };

  const handleValoresChangeSeringa = (seringaId, pontoId, valores) => {
    // Processa os valores colados (separados por vírgula)
    const valoresLimpos = valores
      .split(/[,\s]+/)
      .map((v) => v.trim())
      .filter((v) => v !== "" && !isNaN(parseFloat(v)));

    const medicoesFinal = Array(10).fill("");
    valoresLimpos.forEach((valor, index) => {
      if (index < 10) {
        medicoesFinal[index] = valor;
      }
    });

    setSeringas(
      seringas.map((seringa) => {
        if (seringa.id === seringaId) {
          return {
            ...seringa,
            pontosCalibra: seringa.pontosCalibra.map((ponto) => {
              if (ponto.id === pontoId) {
                return {
                  ...ponto,
                  valoresTexto: valores,
                  medicoes: medicoesFinal,
                };
              }
              return ponto;
            }),
          };
        }
        return seringa;
      }),
    );
  };

  // Inicializar com uma seringa quando o tipo muda para repipetador
  useEffect(() => {
    if (formData.tipoEquipamento === "repipetador" && seringas.length === 0) {
      adicionarSeringa();
    }
  }, [formData.tipoEquipamento]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar o número do certificado antes de gerar o PDF
    // Usar allowCompleteFormat=true para aceitar formato completo (1234.1)
    const errorNumeroCertificado = validateNumeroCertificado(
      formData.numeroCertificado,
      true, // Permite formato completo na validação final
    );
    const errorDataCalibracao = validateDataCalibracao(formData.dataCalibracao);

    if (errorNumeroCertificado) {
      // Atualiza o estado de erro para mostrar na interface
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        numeroCertificado: errorNumeroCertificado,
      }));

      // Mostra alerta para o usuário
      alert("Erro de validação: " + errorNumeroCertificado);

      // Foca no campo com erro
      const inputElement = document.querySelector(
        'input[name="numeroCertificado"]',
      );
      if (inputElement) {
        inputElement.focus();
      }

      return; // Impede a geração do certificado
    }

    if (errorDataCalibracao) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        dataCalibracao: errorDataCalibracao,
      }));

      alert("Erro de validação: " + errorDataCalibracao);

      const inputElement = document.querySelector(
        'input[name="dataCalibracao"]',
      );
      if (inputElement) {
        inputElement.focus();
      }

      return;
    }

    // Verificar se há erros de anotação pendentes
    if (annotationErrors.length > 0) {
      alert(
        "❌ ERRO: Não é possível gerar o certificado!\n\n" +
          "As anotações do Notion devem incluir unidades (ul ou ml):\n\n" +
          annotationErrors.join("\n") +
          "\n\nCorrija as anotações e use a IA novamente.",
      );
      return; // Impede a geração do certificado
    }

    // Aqui seria implementada a lógica para gerar o PDF do certificado
    // usando os dados do cliente e os dados do formulário

    setCertificadoGerado(true);

    // Simula a geração do certificado bem-sucedida
    console.log("Certificado gerado para o cliente:", cliente?.nome);
    console.log("Dados do certificado:", formData);
  };

  // Função para navegar para o próximo input quando Enter for pressionado
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!formRef.current) return;

      // Seleciona todos os inputs, selects e buttons focáveis no formulário
      const focusableElements = formRef.current.querySelectorAll(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), button:not([disabled]):not([type="submit"])',
      );

      const focusableArray = Array.from(focusableElements);
      const currentIndex = focusableArray.indexOf(e.target);

      if (currentIndex > -1 && currentIndex < focusableArray.length - 1) {
        // Move para o próximo elemento
        focusableArray[currentIndex + 1].focus();
      } else if (currentIndex === focusableArray.length - 1) {
        // Se for o último elemento, volta para o primeiro
        focusableArray[0].focus();
      }
    }
  }; // Função para fazer o download do certificado em PDF
  const handleDownloadCertificado = async () => {
    try {
      // Preparar dados específicos para repipetadores
      const dadosParaPDF =
        formData.tipoEquipamento === "repipetador" ? seringas : pontosCalibra;
      const seringasParaPDF =
        formData.tipoEquipamento === "repipetador" ? seringas : null;

      // Gerar o PDF usando o serviço
      const pdf = await PDFService.gerarCertificadoCalibracao(
        formData,
        cliente,
        dadosParaPDF,
        fatorZ,
        seringasParaPDF,
        padroesUtilizados,
      );

      // Criar nome do arquivo
      const nomeArquivo = `serie. ${formData.numeroPipeta || "SemSerie"}.pdf`;

      // Baixar o PDF
      PDFService.baixarPDF(pdf, nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar certificado PDF:", error);
      alert(
        "Erro ao gerar o certificado. Verifique se todos os dados estão preenchidos corretamente.",
      );
    }
  };
  // Função para visualizar o PDF antes de baixar
  const handleVisualizarCertificado = async () => {
    try {
      // Preparar dados específicos para repipetadores
      const dadosParaPDF =
        formData.tipoEquipamento === "repipetador" ? seringas : pontosCalibra;
      const seringasParaPDF =
        formData.tipoEquipamento === "repipetador" ? seringas : null;

      // Gerar o PDF usando o serviço
      const pdf = await PDFService.gerarCertificadoCalibracao(
        formData,
        cliente,
        dadosParaPDF,
        fatorZ,
        seringasParaPDF,
        padroesUtilizados,
      );

      // Abrir o PDF em uma nova aba para visualização
      PDFService.abrirPDF(pdf);
    } catch (error) {
      console.error("Erro ao gerar certificado PDF:", error);
      alert(
        "Erro ao gerar o certificado. Verifique se todos os dados estão preenchidos corretamente.",
      );
    }
  };

  // Função para disparar automação após preenchimento da IA
  const triggerAutomacaoParaIA = (pontosIA) => {
    setAutoPreenchimento({
      ativo: true,
      mensagem: `Preenchendo automaticamente outros canais com valores próximos...`,
    });

    setTimeout(() => {
      setPontosCalibra((prevPontos) => {
        return prevPontos.map((ponto) => {
          // Se não for Canal 1, propagar valores do Canal 1 correspondente
          if (ponto.canal !== 1) {
            // Encontrar o ponto correspondente no Canal 1
            const pontoCanalMestre = prevPontos.find(
              (p) => p.canal === 1 && p.pontoPosicao === ponto.pontoPosicao,
            );

            if (pontoCanalMestre && pontoCanalMestre.valoresTexto) {
              // Gerar valores próximos baseados no Canal Mestre
              const valoresArray = pontoCanalMestre.valoresTexto
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v && !isNaN(parseFloat(v)));

              if (valoresArray.length > 0) {
                const novosMedicoes = Array(10).fill("");
                const novosValoresTexto = [];

                valoresArray.forEach((valor, index) => {
                  if (index < 10) {
                    const valorProximo = gerarValoresProximos(valor);
                    novosMedicoes[index] = valorProximo;
                    if (valorProximo !== "") {
                      novosValoresTexto.push(valorProximo);
                    }
                  }
                });

                return {
                  ...ponto,
                  volumeNominal: pontoCanalMestre.volumeNominal, // Mesmo volume nominal
                  medicoes: novosMedicoes,
                  valoresTexto: novosValoresTexto.join(", "),
                };
              }
            }
          }
          return ponto;
        });
      });

      // Esconder notificação após 2 segundos
      setTimeout(() => {
        setAutoPreenchimento({ ativo: false, mensagem: "" });
      }, 2000);
    }, 100);
  };

  // Função para processar dados extraídos pela IA
  const handleDataExtracted = async (extractedData, originalText = "") => {
    // Se a animação estiver desabilitada, usar método antigo
    if (isAnimating) {
      stopAnimation();
      return;
    }

    // Impede o fluxo da IA sem número do certificado base preenchido
    const numeroCertificadoError = validateNumeroCertificado(
      formData.numeroCertificado,
      false,
    );
    const dataCalibracaoError = validateDataCalibracao(formData.dataCalibracao);
    if (numeroCertificadoError) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        numeroCertificado: numeroCertificadoError,
      }));

      alert(
        "Preencha corretamente o campo 'Número do Certificado' (ex: 1234.) antes de usar a IA para gerar o certificado.",
      );

      const inputElement = document.querySelector(
        'input[name="numeroCertificado"]',
      );
      if (inputElement) {
        inputElement.focus();
      }

      return;
    }

    if (dataCalibracaoError) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        dataCalibracao: dataCalibracaoError,
      }));

      alert(
        "Preencha corretamente o campo 'Data da Calibração' antes de usar a IA para gerar o certificado.",
      );

      const inputElement = document.querySelector(
        'input[name="dataCalibracao"]',
      );
      if (inputElement) {
        inputElement.focus();
      }

      return;
    }

    // Validar anotações para verificar se contêm unidades obrigatórias
    const annotationValidationErrors = validateNotionAnnotations(
      extractedData,
      originalText || extractedData.originalText || "",
    );

    // Se houver erros de anotação, mostrar e bloquear processo
    if (annotationValidationErrors.length > 0) {
      setAnnotationErrors(annotationValidationErrors);

      // Mostrar alerta detalhado com todos os erros
      alert(
        "❌ ERRO: Anotações do Notion incompletas!\n\n" +
          "As seguintes informações devem incluir unidades (ul ou ml):\n\n" +
          annotationValidationErrors.join("\n") +
          "\n\n📝 Formato correto:\n" +
          "VOLUME: 100ul\n" +
          "PONTOS DE INDICAÇÃO: 10-100ul\n" +
          "PONTOS CALIBRADOS: 10-100ul",
      );

      return; // Bloqueia o processamento
    }

    // Limpar erros de anotação se tudo estiver correto
    setAnnotationErrors([]);

    // Preparar dados para animação
    const fieldsToAnimate = [];

    // Concatenar número de ordenação ao número de certificado existente
    const numeroCertificadoFinal = extractedData.numeroCertificado
      ? `${formData.numeroCertificado}${extractedData.numeroCertificado}`
      : formData.numeroCertificado;

    // Mapear campos básicos para animação
    const fieldMappings = [
      {
        selector: 'select[name="tipoEquipamento"]',
        value: extractedData.tipoEquipamento,
        name: "Tipo de Equipamento",
      },
      {
        selector: 'select[name="tipoInstrumento"]',
        value: extractedData.tipoInstrumento,
        name: "Tipo de Instrumento",
      },
      {
        selector: 'input[name="marcaPipeta"]',
        value: extractedData.marcaPipeta,
        name: "Marca",
      },
      {
        selector: 'input[name="modeloPipeta"]',
        value: extractedData.modeloPipeta,
        name: "Modelo",
      },
      {
        selector: 'input[name="numeroPipeta"]',
        value: extractedData.numeroPipeta,
        name: "Número de Série",
      },
      {
        selector: 'input[name="numeroIdentificacao"]',
        value: extractedData.numeroIdentificacao,
        name: "Número de Identificação",
      },
      {
        selector: 'input[name="numeroCertificado"]',
        value: numeroCertificadoFinal,
        name: "Número do Certificado",
      },
      {
        selector: 'input[name="capacidade"]',
        value: extractedData.capacidade,
        name: "Capacidade",
      },
      {
        selector: 'select[name="unidadeCapacidade"]',
        value: extractedData.unidadeCapacidade,
        name: "Unidade da Capacidade",
      },
      {
        selector: 'input[name="faixaIndicacao"]',
        value: extractedData.faixaIndicacao,
        name: "Faixa de Indicação",
      },
      {
        selector: 'select[name="unidadeFaixaIndicacao"]',
        value: extractedData.unidadeFaixaIndicacao,
        name: "Unidade da Faixa de Indicação",
      },
      {
        selector: 'input[name="faixaCalibrada"]',
        value: extractedData.faixaCalibrada,
        name: "Faixa Calibrada",
      },
      {
        selector: 'select[name="unidadeFaixaCalibrada"]',
        value: extractedData.unidadeFaixaCalibrada,
        name: "Unidade da Faixa Calibrada",
      },
    ];

    // Filtrar apenas campos com valores válidos
    fieldMappings.forEach(({ selector, value, name }) => {
      if (value && value !== "N/A" && value.trim() !== "") {
        fieldsToAnimate.push({ selector, value, name });
      }
    });

    // Se for multicanal, adicionar quantidade de canais
    if (
      extractedData.tipoInstrumento === "multicanal" &&
      extractedData.quantidadeCanais
    ) {
      fieldsToAnimate.push({
        selector: 'select[name="quantidadeCanais"]',
        value: extractedData.quantidadeCanais.toString(),
        name: "Quantidade de Canais",
      });
    }

    try {
      // Executar animação de preenchimento
      await executeAnimationSequence(fieldsToAnimate);

      // Após a animação, atualizar o estado do React
      updateFormDataAfterAnimation(extractedData, numeroCertificadoFinal);
    } catch (error) {
      console.error("Erro durante animação:", error);
      // Em caso de erro, usar método direto
      updateFormDataDirectly(extractedData, numeroCertificadoFinal);
    }
  };

  // Função auxiliar para atualizar dados após animação
  const updateFormDataAfterAnimation = (
    extractedData,
    numeroCertificadoFinal,
  ) => {
    // Atualizar dados do formulário
    setFormData((prev) => ({
      ...prev,
      tipoEquipamento: extractedData.tipoEquipamento,
      tipoInstrumento: extractedData.tipoInstrumento,
      marcaPipeta: extractedData.marcaPipeta,
      modeloPipeta: extractedData.modeloPipeta,
      numeroPipeta: extractedData.numeroPipeta,
      numeroIdentificacao: extractedData.numeroIdentificacao,
      numeroCertificado: numeroCertificadoFinal,
      capacidade: extractedData.capacidade,
      unidadeCapacidade: extractedData.unidadeCapacidade,
      faixaIndicacao: extractedData.faixaIndicacao,
      unidadeFaixaIndicacao: extractedData.unidadeFaixaIndicacao,
      faixaCalibrada: extractedData.faixaCalibrada,
      unidadeFaixaCalibrada: extractedData.unidadeFaixaCalibrada,
      // Para multicanal, incluir também a quantidade de canais
      quantidadeCanais:
        extractedData.tipoInstrumento === "multicanal"
          ? extractedData.quantidadeCanais
          : prev.quantidadeCanais,
    }));

    handlePointsAndSpecialCases(extractedData);
  };

  // Função auxiliar para método direto (fallback)
  const updateFormDataDirectly = (extractedData, numeroCertificadoFinal) => {
    // Atualizar dados do formulário
    setFormData((prev) => ({
      ...prev,
      tipoEquipamento: extractedData.tipoEquipamento,
      tipoInstrumento: extractedData.tipoInstrumento,
      marcaPipeta: extractedData.marcaPipeta,
      modeloPipeta: extractedData.modeloPipeta,
      numeroPipeta: extractedData.numeroPipeta,
      numeroIdentificacao: extractedData.numeroIdentificacao,
      numeroCertificado: numeroCertificadoFinal,
      capacidade: extractedData.capacidade,
      unidadeCapacidade: extractedData.unidadeCapacidade,
      faixaIndicacao: extractedData.faixaIndicacao,
      unidadeFaixaIndicacao: extractedData.unidadeFaixaIndicacao,
      faixaCalibrada: extractedData.faixaCalibrada,
      unidadeFaixaCalibrada: extractedData.unidadeFaixaCalibrada,
      // Para multicanal, incluir também a quantidade de canais
      quantidadeCanais:
        extractedData.tipoInstrumento === "multicanal"
          ? extractedData.quantidadeCanais
          : prev.quantidadeCanais,
    }));

    handlePointsAndSpecialCases(extractedData);
  };

  // Função auxiliar para lidar com pontos e casos especiais
  const handlePointsAndSpecialCases = (extractedData) => {
    // Atualizar pontos de calibração
    setPontosCalibra(extractedData.pontosCalibra);

    // Para multicanal, atualizar número de canais e reorganizar pontos
    if (
      extractedData.tipoInstrumento === "multicanal" &&
      extractedData.quantidadeCanais
    ) {
      console.log(
        "🔧 IA detectou multicanal com canais:",
        extractedData.quantidadeCanais,
      );
      setNumeroCanais(extractedData.quantidadeCanais);
      setQuantidadeCanais(extractedData.quantidadeCanais); // Também atualizar a quantidade de canais disponível

      // Determinar número de pontos por canal baseado nos dados extraídos
      const numPontosExtraidos =
        extractedData.pontosCalibra && extractedData.pontosCalibra.length > 0
          ? extractedData.pontosCalibra.length
          : 3;

      console.log(
        "🔧 IA detectou",
        numPontosExtraidos,
        "pontos de calibração por canal",
      );

      // Aguardar um tick para garantir que o número de canais seja atualizado primeiro
      setTimeout(() => {
        // Reorganizar pontos para multicanal (cria estrutura para todos os canais)
        // Passamos explicitamente o número de pontos extraídos
        reorganizarPontosParaMulticanal(
          extractedData.quantidadeCanais,
          numPontosExtraidos,
        );

        // Depois aplicar os dados do Canal Mestre extraídos pela IA
        setTimeout(() => {
          console.log(
            "📊 Pontos criados para",
            extractedData.quantidadeCanais,
            "canais",
          );
          setPontosCalibra((prevPontos) => {
            const pontosAtualizados = prevPontos.map((ponto) => {
              // Encontrar ponto correspondente no Canal 1 (Canal Mestre)
              if (ponto.canal === 1) {
                const pontoIA = extractedData.pontosCalibra.find(
                  (p) =>
                    p.volumeNominal === ponto.volumeNominal ||
                    p.pontoPosicao === ponto.pontoPosicao,
                );
                if (pontoIA) {
                  return {
                    ...ponto,
                    volumeNominal: pontoIA.volumeNominal,
                    medicoes: pontoIA.medicoes,
                    valoresTexto: pontoIA.valoresTexto,
                  };
                }
              }
              return ponto;
            });
            return pontosAtualizados;
          });

          // Disparar automação para propagar dados do Canal Mestre para outros canais
          setTimeout(() => {
            if (automacaoHabilitada) {
              triggerAutomacaoParaIA(extractedData.pontosCalibra);
            }
          }, 150);
        }, 100);
      }, 50);
    }

    // Atualizar seringas para repipetador (se aplicável)
    if (extractedData.seringas && extractedData.seringas.length > 0) {
      setSeringas(extractedData.seringas);
    }

    // Mostrar notificação de sucesso
    let mensagem = `Dados extraídos com sucesso! ${extractedData.pontosCalibra.length} ponto(s) de calibração preenchido(s) automaticamente.`;

    if (extractedData.seringas && extractedData.seringas.length > 0) {
      mensagem += ` ${extractedData.seringas.length} seringa(s) adicionada(s).`;
    }

    setAutoPreenchimento({
      ativo: true,
      mensagem: mensagem,
    });

    // Esconder notificação após 3 segundos
    setTimeout(() => {
      setAutoPreenchimento({ ativo: false, mensagem: "" });
    }, 3000);

    // Aguardar um tempo para garantir que tudo foi preenchido e depois clicar no botão "Gerar Certificado"
    setTimeout(async () => {
      try {
        const buttonClicked = await animateButtonClick(
          'button[type="submit"]',
          "Gerar Certificado",
        );

        if (buttonClicked) {
          console.log(
            '🎉 IA clicou automaticamente no botão "Gerar Certificado"',
          );
        }
      } catch (error) {
        console.error("Erro ao clicar no botão automaticamente:", error);
      }
    }, 700);
  };

  // Função para limpar dados ao editar (mantém apenas campos específicos)
  const handleEditarDados = () => {
    // Limpar número do certificado mantendo apenas números antes do ponto + ponto
    let numeroCertificadoLimpo = formData.numeroCertificado;
    if (numeroCertificadoLimpo.includes(".")) {
      // Pega apenas a parte antes do ponto e adiciona o ponto
      const parteAntesPonto = numeroCertificadoLimpo.split(".")[0];
      numeroCertificadoLimpo = parteAntesPonto + ".";
    }

    // Preservar apenas: numeroCertificado (limpo), dataCalibracao, temperatura, umidadeRelativa
    const camposPreservados = {
      numeroCertificado: numeroCertificadoLimpo,
      dataCalibracao: formData.dataCalibracao,
      temperatura: formData.temperatura,
      umidadeRelativa: formData.umidadeRelativa,
    };

    // Resetar formData mantendo apenas os campos preservados
    setFormData({
      numeroCertificado: camposPreservados.numeroCertificado,
      dataCalibracao: camposPreservados.dataCalibracao,
      tipoEquipamento: "micropipeta",
      marcaPipeta: "",
      modeloPipeta: "",
      numeroPipeta: "",
      numeroIdentificacao: "",
      capacidade: "",
      unidadeCapacidade: "µL",
      faixaIndicacao: "",
      unidadeFaixaIndicacao: "µL",
      faixaCalibrada: "",
      unidadeFaixaCalibrada: "µL",
      tipoInstrumento: "monocanal",
      quantidadeCanais: 8,
      temperatura: camposPreservados.temperatura,
      umidadeRelativa: camposPreservados.umidadeRelativa,
      equipamentoReferencia: {
        balanca: "Mettler Toledo XS105",
        termometro: "Minipa MT-241",
        higrometro: "Minipa MT-241",
      },
      metodologia: "ISO 8655",
      validadeCalibracao: "12",
      condicoesAmbientaisControladas: true,
    });

    // Resetar pontos de calibração
    setPontosCalibra([
      {
        id: 1,
        volumeNominal: "",
        unidade: "µL",
        medicoes: Array(10).fill(""),
        valoresTexto: "",
        media: null,
        mediaMassa: null,
        inexatidao: null,
        inexatidaoPercentual: null,
        desvioPadrao: null,
      },
    ]);

    // Resetar seringas
    setSeringas([]);

    // Resetar outros estados
    setNumeroCanais(1);
    setQuantidadeCanais(8);
    setPontosPorCanal(3);

    // Voltar para o modo de edição
    setCertificadoGerado(false);
  };

  // Função para remover um ponto de calibração
  const removerPontoCalibracao = (id) => {
    if (formData.tipoInstrumento === "multicanal") {
      // Para multicanal, remover o canal inteiro
      const ponto = pontosCalibra.find((p) => p.id === id);
      if (ponto && numeroCanais > 1) {
        // Remove todos os pontos do canal
        const pontosRestantes = pontosCalibra.filter(
          (p) => p.canal !== ponto.canal,
        );
        setPontosCalibra(pontosRestantes);
        setNumeroCanais(numeroCanais - 1);
      } else if (numeroCanais === 1) {
        alert("É necessário manter pelo menos um canal de calibração.");
      }
    } else {
      // Para monocanal, remover ponto individual
      if (pontosCalibra.length <= 1) {
        alert("É necessário manter pelo menos um ponto de calibração.");
        return;
      }
      setPontosCalibra(pontosCalibra.filter((ponto) => ponto.id !== id));
    }
  };

  // Função para atualizar um ponto de calibração
  const atualizarPontoCalibracao = (id, campo, valor) => {
    setPontosCalibra(
      pontosCalibra.map((ponto) => {
        if (ponto.id === id) {
          return { ...ponto, [campo]: valor };
        }
        return ponto;
      }),
    );
  };

  // Função para atualizar uma medição específica de um ponto
  const atualizarMedicao = (pontoId, medicaoIndex, valor) => {
    setPontosCalibra(
      pontosCalibra.map((ponto) => {
        if (ponto.id === pontoId) {
          const novasMedicoes = [...ponto.medicoes];
          // Usa a função de formatação de números da pasta utils
          // Permite apenas números e pontos decimais (não vírgulas)
          const valorFormatado = formatNumberInput(valor);
          novasMedicoes[medicaoIndex] = valorFormatado;
          return { ...ponto, medicoes: novasMedicoes };
        }
        return ponto;
      }),
    );
  }; // Função para realizar os cálculos de calibração para todos os pontos
  const calcularResultados = () => {
    // Teste com valores específicos da planilha fornecida
    if (process.env.NODE_ENV !== "production") {
      console.log("--- Teste com valores da planilha fornecida ---");

      // Fator Z da planilha
      const testeFatorZ = 1.0043; // Z factor μl/mg da planilha
      console.log("Fator Z:", testeFatorZ);

      // Teste para volume 100,00 μL
      const valoresVol1 = [99.4, 99.5]; // Valores da coluna [mg]
      const volNominal1 = 100.0;
      const mediaMassaVol1 =
        valoresVol1.reduce((sum, val) => sum + val, 0) / valoresVol1.length;
      const mediaVolumeVol1 = mediaMassaVol1 * testeFatorZ;
      const accuracyVol1 = mediaVolumeVol1 - volNominal1;
      const accuracyPctVol1 = (accuracyVol1 / volNominal1) * 100;

      // Volumes individuais e desvio padrão para volume 100,00
      const volumesVol1 = valoresVol1.map((massa) => massa * testeFatorZ);
      const somaQuadradosVol1 = volumesVol1.reduce(
        (sum, vol) => sum + Math.pow(vol - mediaVolumeVol1, 2),
        0,
      );
      const precisaoVol1 = Math.sqrt(
        somaQuadradosVol1 / (volumesVol1.length - 1),
      );
      const precisaoPctVol1 = (precisaoVol1 / mediaVolumeVol1) * 100;

      console.log("\nVolume 1 (100,00 μL):");
      console.log(
        "Média massa:",
        mediaMassaVol1.toFixed(2),
        "mg (Planilha: 99,45)",
      );
      console.log(
        "Mean Volume:",
        mediaVolumeVol1.toFixed(2),
        "μL (Planilha: 99,88)",
      );
      console.log("Accuracy:", accuracyVol1.toFixed(2), "μL (Planilha: -0,12)");
      console.log(
        "Accuracy %:",
        accuracyPctVol1.toFixed(2),
        "% (Planilha: -0,12%)",
      );
      console.log(
        "Precision (SD):",
        precisaoVol1.toFixed(2),
        "μL (Planilha: 0,07)",
      );
      console.log(
        "Precision (CV):",
        precisaoPctVol1.toFixed(2),
        "% (Planilha: 0,07%)",
      );

      // Teste para volume 500,00 μL
      const valoresVol2 = [495.6, 495.7]; // Valores da coluna [mg]
      const volNominal2 = 500.0;
      const mediaMassaVol2 =
        valoresVol2.reduce((sum, val) => sum + val, 0) / valoresVol2.length;
      const mediaVolumeVol2 = mediaMassaVol2 * testeFatorZ;
      const accuracyVol2 = mediaVolumeVol2 - volNominal2;
      const accuracyPctVol2 = (accuracyVol2 / volNominal2) * 100;

      // Volumes individuais e desvio padrão para volume 500,00
      const volumesVol2 = valoresVol2.map((massa) => massa * testeFatorZ);
      const somaQuadradosVol2 = volumesVol2.reduce(
        (sum, vol) => sum + Math.pow(vol - mediaVolumeVol2, 2),
        0,
      );
      const precisaoVol2 = Math.sqrt(
        somaQuadradosVol2 / (volumesVol2.length - 1),
      );
      const precisaoPctVol2 = (precisaoVol2 / mediaVolumeVol2) * 100;

      console.log("\nVolume 2 (500,00 μL):");
      console.log(
        "Média massa:",
        mediaMassaVol2.toFixed(2),
        "mg (Planilha: 495,65)",
      );
      console.log(
        "Mean Volume:",
        mediaVolumeVol2.toFixed(2),
        "μL (Planilha: 497,78)",
      );
      console.log("Accuracy:", accuracyVol2.toFixed(2), "μL (Planilha: -2,22)");
      console.log(
        "Accuracy %:",
        accuracyPctVol2.toFixed(2),
        "% (Planilha: -0,44%)",
      );
      console.log(
        "Precision (SD):",
        precisaoVol2.toFixed(2),
        "μL (Planilha: 0,07)",
      );
      console.log(
        "Precision (CV):",
        precisaoPctVol2.toFixed(2),
        "% (Planilha: 0,01%)",
      );

      // Teste para volume 1000,00 μL
      const valoresVol3 = [995.5, 995.3]; // Valores da coluna [mg]
      const volNominal3 = 1000.0;
      const mediaMassaVol3 =
        valoresVol3.reduce((sum, val) => sum + val, 0) / valoresVol3.length;
      const mediaVolumeVol3 = mediaMassaVol3 * testeFatorZ;
      const accuracyVol3 = mediaVolumeVol3 - volNominal3;
      const accuracyPctVol3 = (accuracyVol3 / volNominal3) * 100;

      // Volumes individuais e desvio padrão para volume 1000,00
      const volumesVol3 = valoresVol3.map((massa) => massa * testeFatorZ);
      const somaQuadradosVol3 = volumesVol3.reduce(
        (sum, vol) => sum + Math.pow(vol - mediaVolumeVol3, 2),
        0,
      );
      const precisaoVol3 = Math.sqrt(
        somaQuadradosVol3 / (volumesVol3.length - 1),
      );
      const precisaoPctVol3 = (precisaoVol3 / mediaVolumeVol3) * 100;

      console.log("\nVolume 3 (1000,00 μL):");
      console.log(
        "Média massa:",
        mediaMassaVol3.toFixed(2),
        "mg (Planilha: 995,40)",
      );
      console.log(
        "Mean Volume:",
        mediaVolumeVol3.toFixed(2),
        "μL (Planilha: 999,68)",
      );
      console.log("Accuracy:", accuracyVol3.toFixed(2), "μL (Planilha: -0,32)");
      console.log(
        "Accuracy %:",
        accuracyPctVol3.toFixed(2),
        "% (Planilha: -0,03%)",
      );
      console.log(
        "Precision (SD):",
        precisaoVol3.toFixed(2),
        "μL (Planilha: 0,14)",
      );
      console.log(
        "Precision (CV):",
        precisaoPctVol3.toFixed(2),
        "% (Planilha: 0,01%)",
      );

      console.log("------------------------------------------");
    }

    setPontosCalibra(
      pontosCalibra.map((ponto) => {
        // Filtra as medições válidas (não vazias e convertidas para número)
        const medicoesValidas = ponto.medicoes
          .map((m) => parseFloat(m.trim()))
          .filter((m) => !isNaN(m));

        // Verifica se há medições válidas para calcular
        if (medicoesValidas.length === 0) {
          return {
            ...ponto,
            media: null,
            mediaMassa: null,
            inexatidao: null,
            inexatidaoPercentual: null,
            desvioPadrao: null,
            coeficienteVariacao: null,
          };
        }

        // Converte o volume nominal para número
        const volumeNominalNum = parseFloat(ponto.volumeNominal);
        if (isNaN(volumeNominalNum)) return ponto;

        // 1. Calcular a média das massas (mg)
        const mediaMassa =
          medicoesValidas.reduce((sum, val) => sum + val, 0) /
          medicoesValidas.length;

        // 2. Converter cada medição individual de massa (mg) para volume (µL)
        const volumesIndividuais = medicoesValidas.map(
          (massa) => massa * fatorZ,
        );

        // 3. Calcular a média dos volumes convertidos
        const mediaVolume =
          volumesIndividuais.reduce((sum, vol) => sum + vol, 0) /
          volumesIndividuais.length;

        // 4. Calcular exatidão (accuracy)
        const inexatidao = mediaVolume - volumeNominalNum;
        const inexatidaoPercentual = (inexatidao / volumeNominalNum) * 100;

        // 5. Calcular precisão (desvio padrão - SD) diretamente nos volumes convertidos
        const somaDosQuadradosDasDiferencas = volumesIndividuais.reduce(
          (sum, vol) => sum + Math.pow(vol - mediaVolume, 2),
          0,
        );

        const desvioPadrao = Math.sqrt(
          somaDosQuadradosDasDiferencas / (volumesIndividuais.length - 1),
        );

        // 6. Cálculo do CV (Coeficiente de Variação)
        const coeficienteVariacao =
          mediaVolume !== 0 ? (desvioPadrao / mediaVolume) * 100 : 0; // Arredonda para duas casas decimais antes de armazenar
        return {
          ...ponto,
          media: parseFloat(mediaVolume.toFixed(2)),
          mediaMassa: parseFloat(mediaMassa.toFixed(2)),
          inexatidao: parseFloat(inexatidao.toFixed(2)),
          inexatidaoPercentual: parseFloat(inexatidaoPercentual.toFixed(2)),
          desvioPadrao: parseFloat(desvioPadrao.toFixed(2)),
          coeficienteVariacao: parseFloat(coeficienteVariacao.toFixed(2)),
        };
      }),
    );
  };

  // Recalcular automaticamente quando as medições ou o fator Z mudam
  useEffect(() => {
    calcularResultados();
  }, [pontosCalibra.map((p) => p.medicoes.join()).join(), fatorZ]);

  // Função para calcular a média das medições, com opção de conversão
  const calcularMedia = (medicoes, fatorConversao = null) => {
    const valoresNumericos = medicoes
      .filter((med) => med !== "")
      .map((med) => {
        const valor = parseFloat(med);
        // Se um fator de conversão for fornecido, aplicar a cada valor
        return !isNaN(valor)
          ? fatorConversao
            ? valor * fatorConversao
            : valor
          : null;
      })
      .filter((val) => val !== null);

    if (valoresNumericos.length === 0) return null;

    const soma = valoresNumericos.reduce((acc, val) => acc + val, 0);
    return soma / valoresNumericos.length;
  };

  // Função para calcular o desvio padrão
  const calcularDesvioPadrao = (medicoes, media, fatorConversao = null) => {
    if (media === null) return null;

    const valoresNumericos = medicoes
      .filter((med) => med !== "")
      .map((med) => {
        const valor = parseFloat(med);
        // Se um fator de conversão for fornecido, aplicar a cada valor
        return !isNaN(valor)
          ? fatorConversao
            ? valor * fatorConversao
            : valor
          : null;
      })
      .filter((val) => val !== null);

    if (valoresNumericos.length <= 1) return 0;

    const somaDosQuadradosDasDiferencas = valoresNumericos.reduce(
      (acc, val) => acc + Math.pow(val - media, 2),
      0,
    );
    return Math.sqrt(
      somaDosQuadradosDasDiferencas / (valoresNumericos.length - 1),
    );
  };

  // Função para calcular resultados das seringas do repipetador
  const calcularResultadosSeringas = () => {
    if (formData.tipoEquipamento !== "repipetador") return;

    setSeringas((seringasAnterior) =>
      seringasAnterior.map((seringa) => ({
        ...seringa,
        pontosCalibra: seringa.pontosCalibra.map((ponto) => {
          // Verificar se há medições válidas
          const medicoesValidas = ponto.medicoes.filter(
            (med) => med !== "" && !isNaN(parseFloat(med)),
          );

          if (medicoesValidas.length === 0) {
            return {
              ...ponto,
              media: null,
              mediaMassa: null,
              inexatidao: null,
              inexatidaoPercentual: null,
              desvioPadrao: null,
              coeficienteVariacao: null,
            };
          }

          // Calcular média das massas
          const mediaMassa = calcularMedia(ponto.medicoes);

          // Calcular média dos volumes (massa × fator Z)
          const mediaVolume = calcularMedia(ponto.medicoes, fatorZ);

          // Calcular inexatidão (accuracy)
          const volumeNominal = parseFloat(ponto.volumeNominal) || 0;
          const inexatidao = mediaVolume - volumeNominal;
          const inexatidaoPercentual = (inexatidao / volumeNominal) * 100;

          // Calcular desvio padrão (precision)
          const desvioPadrao = calcularDesvioPadrao(
            ponto.medicoes,
            mediaVolume,
            fatorZ,
          );

          // Calcular coeficiente de variação
          const coeficienteVariacao =
            mediaVolume > 0 ? (desvioPadrao / mediaVolume) * 100 : 0;

          return {
            ...ponto,
            media: mediaVolume,
            mediaMassa: mediaMassa,
            inexatidao: inexatidao,
            inexatidaoPercentual: inexatidaoPercentual,
            desvioPadrao: desvioPadrao,
            coeficienteVariacao: coeficienteVariacao,
          };
        }),
      })),
    );
  };

  // Recalcular automaticamente quando as medições das seringas ou o fator Z mudam
  useEffect(() => {
    calcularResultadosSeringas();
  }, [
    seringas
      .map((s) => s.pontosCalibra.map((p) => p.medicoes.join()).join())
      .join(),
    fatorZ,
  ]);

  // Função para adicionar novo ponto de calibração
  const adicionarPonto = () => {
    setPontosCalibra([
      ...pontosCalibra,
      {
        id: Date.now(),
        volumeNominal: "",
        unidade: "µL",
        medicoes: Array(10).fill(""),
        valoresTexto: "",
        media: null,
        mediaMassa: null,
        inexatidao: null,
        inexatidaoPercentual: null,
        desvioPadrao: null,
      },
    ]);
  };

  // Função para remover ponto diretamente (sem confirmação)
  const removerPontoDiretamente = (id, numeroPonto, isCanal = false) => {
    if (formData.tipoInstrumento === "multicanal" && isCanal) {
      if (numeroCanais <= 1) {
        return; // Não remove se é o último canal
      }
      // Remove todos os pontos do canal
      const pontosDoCanal = pontosCalibra.filter(
        (p) => p.canal === numeroPonto,
      );
      pontosDoCanal.forEach((ponto) => {
        removerPontoCalibracao(ponto.id);
      });
    } else {
      if (pontosCalibra.length <= 1) {
        return; // Não remove se é o último ponto
      }
      removerPontoCalibracao(id);
    }
  };

  // Função para remover seringa diretamente (sem confirmação)
  const removerSeringaDiretamente = (seringaId, numeroSeringa) => {
    if (seringas.length <= 1) {
      return; // Não remove se é a última seringa
    }
    removerSeringa(seringaId);
  }; // Função para gerar valores próximos ao valor base para outros canais (multicanal)
  const gerarValoresProximos = (valorBase, variacao = 0.15) => {
    const numeroValor = parseFloat(valorBase);
    if (isNaN(numeroValor)) return valorBase;

    // Gera uma variação aleatória entre -variacao e +variacao
    // Para valores maiores, usa uma variação percentual menor para manter a precisão
    const variacaoAbsoluta =
      numeroValor > 100 ? variacao * (numeroValor / 200) : variacao;
    const variacaoAleatoria = (Math.random() - 0.5) * 2 * variacaoAbsoluta;
    const novoValor = numeroValor + variacaoAleatoria;

    // Mantém o mesmo número de casas decimais que o valor original
    const casasDecimais = valorBase.includes(".")
      ? valorBase.split(".")[1].length
      : 1;
    return Math.max(0, novoValor).toFixed(casasDecimais); // Garante que não seja negativo
  };

  // Função para gerar valores semelhantes sem repetições (baseada no código Python do usuário)
  const gerarValoresSemelhantesMonocanal = (
    valores,
    numValores = 5,
    limite = 0.03,
  ) => {
    const valoresSemelhantes = [];
    const valoresOriginais = valores.map((v) => parseFloat(v));

    // Para cada valor original, gerar valores semelhantes
    for (const valor of valoresOriginais) {
      const valoresToGerar = Math.ceil(numValores / valoresOriginais.length);

      for (let i = 0; i < valoresToGerar; i++) {
        let tentativas = 0;
        let novoValor;

        do {
          // Gera variação aleatória dentro do limite especificado
          const variacao = (Math.random() - 0.5) * 2 * limite;
          novoValor = parseFloat((valor + variacao).toFixed(2));
          tentativas++;

          // Evita loop infinito se não conseguir gerar valor único
          if (tentativas > 50) break;
        } while (
          valoresSemelhantes.includes(novoValor) ||
          valoresOriginais.includes(novoValor) ||
          novoValor <= 0
        );

        if (novoValor > 0) {
          valoresSemelhantes.push(novoValor);
        }

        // Para quando atingir o número desejado
        if (valoresSemelhantes.length >= numValores) break;
      }

      if (valoresSemelhantes.length >= numValores) break;
    }

    return valoresSemelhantes.slice(0, numValores);
  }; // Função para processar valores separados por vírgula em um único input
  const handleValoresChange = (pontoId, valores) => {
    // Processa a string de valores separados por vírgula
    const valoresArray = valores
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "");

    // Verifica se o ponto atual é do Canal 1 e se é multicanal
    const pontoAtual = pontosCalibra.find((p) => p.id === pontoId);
    const isCanal1 = pontoAtual && pontoAtual.canal === 1;
    const isMulticanal = formData.tipoInstrumento === "multicanal";
    const isMonocanal = formData.tipoInstrumento === "monocanal";

    // Preenche um array de 10 posições com os valores ou strings vazias
    let medicoesPadrao = Array(10).fill("");

    // Para monocanais: se exatamente 5 valores foram inseridos, a string termina com vírgula
    // e a automação está ativa, gera os outros 5 valores automaticamente
    const terminaComVirgula = valores.trimEnd().endsWith(",");
    if (
      isMonocanal &&
      valoresArray.length === 5 &&
      terminaComVirgula &&
      automacaoHabilitada
    ) {
      // Preenche os primeiros 5 valores
      valoresArray.forEach((valor, index) => {
        medicoesPadrao[index] = valor;
      });

      // Gera os próximos 5 valores similares usando a função baseada no código Python
      const valoresSemelhantes = gerarValoresSemelhantesMonocanal(
        valoresArray,
        5,
      );
      valoresSemelhantes.forEach((valor, index) => {
        medicoesPadrao[index + 5] = valor.toString();
      }); // Mostrar notificação de automação para monocanal
      setAutoPreenchimento({
        ativo: true,
        mensagem: `Gerando automaticamente os 5 valores restantes com base nos valores inseridos...`,
      });

      // Criar o texto atualizado com todos os 10 valores (sem vírgula no final)
      const todosValores = medicoesPadrao.filter((v) => v !== "").join(", ");

      setPontosCalibra(
        pontosCalibra.map((ponto) => {
          if (ponto.id === pontoId) {
            return {
              ...ponto,
              medicoes: medicoesPadrao,
              valoresTexto: todosValores, // Mantém o texto com todos os valores gerados
            };
          }
          return ponto;
        }),
      );

      // Esconder notificação após 2 segundos
      setTimeout(() => {
        setAutoPreenchimento({ ativo: false, mensagem: "" });
      }, 2000);

      return; // Sai da função para não executar o código padrão
    } else {
      // Comportamento padrão: preenche os valores como inseridos
      valoresArray.forEach((valor, index) => {
        if (index < 10) {
          medicoesPadrao[index] = valor;
        }
      });
    }

    setPontosCalibra(
      pontosCalibra.map((ponto) => {
        if (ponto.id === pontoId) {
          return {
            ...ponto,
            medicoes: medicoesPadrao,
            valoresTexto: valores, // Mantém o texto original para exibição
          };
        }
        return ponto;
      }),
    ); // Automatização: Se for Canal 1 e multicanal, propagar valores similares aos outros canais
    if (
      isCanal1 &&
      isMulticanal &&
      valoresArray.length > 0 &&
      automacaoHabilitada
    ) {
      // Mostrar notificação de automação
      setAutoPreenchimento({
        ativo: true,
        mensagem: `Preenchendo automaticamente outros canais com valores próximos...`,
      });

      setTimeout(() => {
        setPontosCalibra((prevPontos) => {
          return prevPontos.map((ponto) => {
            // Se não for Canal 1 e tiver a mesma posição do ponto que está sendo alterado
            if (
              ponto.canal !== 1 &&
              ponto.pontoPosicao === pontoAtual.pontoPosicao
            ) {
              // Gera valores próximos aos do Canal 1
              const novosMedicoes = Array(10).fill("");
              const novosValoresTexto = [];

              valoresArray.forEach((valor, index) => {
                if (index < 10) {
                  const valorProximo = gerarValoresProximos(valor);
                  novosMedicoes[index] = valorProximo;
                  if (valorProximo !== "") {
                    novosValoresTexto.push(valorProximo);
                  }
                }
              });

              return {
                ...ponto,
                medicoes: novosMedicoes,
                valoresTexto: novosValoresTexto.join(", "),
              };
            }
            return ponto;
          });
        });

        // Esconder notificação após 2 segundos
        setTimeout(() => {
          setAutoPreenchimento({ ativo: false, mensagem: "" });
        }, 2000);
      }, 100); // Pequeno delay para garantir que o estado seja atualizado
    }
  }; // Função para atualizar o volume nominal de um ponto
  const handleVolumeNominalChange = (pontoId, valor) => {
    // Usa a função de formatação de números da pasta utils
    const valorFormatado = formatNumberInput(valor);

    // Encontrar o ponto que está sendo modificado
    const pontoAtual = pontosCalibra.find((p) => p.id === pontoId);
    const isCanal1 = pontoAtual && pontoAtual.canal === 1;
    const isMulticanal = formData.tipoInstrumento === "multicanal";

    setPontosCalibra(
      pontosCalibra.map((ponto) => {
        // Atualizar o ponto atual
        if (ponto.id === pontoId) {
          // Filtrar medições válidas
          const medicoesValidas = ponto.medicoes
            .map((m) => parseFloat(m))
            .filter((m) => !isNaN(m));

          // Calcular média de massa
          const mediaMassa =
            medicoesValidas.length > 0
              ? medicoesValidas.reduce((sum, val) => sum + val, 0) /
                medicoesValidas.length
              : null;

          // Converter cada medição para volume e calcular média
          let media = null;
          let volumesIndividuais = [];

          if (mediaMassa !== null) {
            // Converter cada medição individual de massa para volume
            volumesIndividuais = medicoesValidas.map((massa) => massa * fatorZ);

            // Calcular a média dos volumes
            media =
              volumesIndividuais.reduce((sum, vol) => sum + vol, 0) /
              volumesIndividuais.length;
          }

          // Calcular inexatidão baseada no novo volume nominal
          let inexatidao = null;
          let inexatidaoPercentual = null;

          if (media !== null && valorFormatado !== "") {
            const volumeNominal = parseFloat(valorFormatado);
            inexatidao = media - volumeNominal;
            inexatidaoPercentual = (inexatidao / volumeNominal) * 100;
          }

          // Calcular a precisão (desvio padrão) diretamente dos volumes individuais
          let desvioPadrao = null;
          let coeficienteVariacao = null;

          if (volumesIndividuais.length > 1 && media !== null) {
            const somaDosQuadradosDasDiferencas = volumesIndividuais.reduce(
              (sum, vol) => sum + Math.pow(vol - media, 2),
              0,
            );

            desvioPadrao = Math.sqrt(
              somaDosQuadradosDasDiferencas / (volumesIndividuais.length - 1),
            );

            // Cálculo do CV (Coeficiente de Variação) - presente na planilha como Precision (CV)
            coeficienteVariacao =
              media !== null && media !== 0 ? (desvioPadrao / media) * 100 : 0;
          }

          return {
            ...ponto,
            volumeNominal: valorFormatado,
            media: media !== null ? parseFloat(media.toFixed(2)) : null,
            mediaMassa:
              mediaMassa !== null ? parseFloat(mediaMassa.toFixed(2)) : null,
            inexatidao:
              inexatidao !== null ? parseFloat(inexatidao.toFixed(2)) : null,
            inexatidaoPercentual:
              inexatidaoPercentual !== null
                ? parseFloat(inexatidaoPercentual.toFixed(2))
                : null,
            desvioPadrao:
              desvioPadrao !== null
                ? parseFloat(desvioPadrao.toFixed(2))
                : null,
            coeficienteVariacao:
              coeficienteVariacao !== null
                ? parseFloat(coeficienteVariacao.toFixed(2))
                : null,
          };
        }

        // Se for multicanal e estamos alterando o canal 1, sincronizar com outros canais
        else if (
          isMulticanal &&
          isCanal1 &&
          ponto.canal !== 1 &&
          ponto.pontoPosicao === pontoAtual.pontoPosicao
        ) {
          return {
            ...ponto,
            volumeNominal: valorFormatado,
            // Recalcular este ponto também se tiver medições
            ...(ponto.medicoes.some((m) => m !== "")
              ? (() => {
                  const medicoesValidas = ponto.medicoes
                    .map((m) => parseFloat(m))
                    .filter((m) => !isNaN(m));

                  if (medicoesValidas.length === 0) return {};

                  const mediaMassa =
                    medicoesValidas.reduce((sum, val) => sum + val, 0) /
                    medicoesValidas.length;
                  const volumesIndividuais = medicoesValidas.map(
                    (massa) => massa * fatorZ,
                  );
                  const media =
                    volumesIndividuais.reduce((sum, vol) => sum + vol, 0) /
                    volumesIndividuais.length;

                  let inexatidao = null;
                  let inexatidaoPercentual = null;
                  if (valorFormatado !== "") {
                    const volumeNominal = parseFloat(valorFormatado);
                    inexatidao = media - volumeNominal;
                    inexatidaoPercentual = (inexatidao / volumeNominal) * 100;
                  }

                  let desvioPadrao = null;
                  let coeficienteVariacao = null;
                  if (volumesIndividuais.length > 1) {
                    const somaDosQuadrados = volumesIndividuais.reduce(
                      (sum, vol) => sum + Math.pow(vol - media, 2),
                      0,
                    );
                    desvioPadrao = Math.sqrt(
                      somaDosQuadrados / (volumesIndividuais.length - 1),
                    );
                    coeficienteVariacao =
                      media !== 0 ? (desvioPadrao / media) * 100 : 0;
                  }

                  return {
                    media: parseFloat(media.toFixed(2)),
                    mediaMassa: parseFloat(mediaMassa.toFixed(2)),
                    inexatidao:
                      inexatidao !== null
                        ? parseFloat(inexatidao.toFixed(2))
                        : null,
                    inexatidaoPercentual:
                      inexatidaoPercentual !== null
                        ? parseFloat(inexatidaoPercentual.toFixed(2))
                        : null,
                    desvioPadrao:
                      desvioPadrao !== null
                        ? parseFloat(desvioPadrao.toFixed(2))
                        : null,
                    coeficienteVariacao:
                      coeficienteVariacao !== null
                        ? parseFloat(coeficienteVariacao.toFixed(2))
                        : null,
                  };
                })()
              : {}),
          };
        }

        return ponto;
      }),
    );
  };
  if (loading) {
    return (
      <div
        className="min-h-screen w-full p-6"
        style={{
          backgroundColor: "rgb(249, 250, 251)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div
          className="p-6 max-w-4xl mx-auto"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            boxShadow:
              "0 20px 40px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div className="text-center p-4">
            <div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto"
              style={{
                borderTopColor: "rgb(144, 199, 45)",
                borderBottomColor: "rgb(144, 199, 45)",
              }}
            ></div>
            <p className="mt-3" style={{ color: "rgb(75, 85, 99)" }}>
              Carregando dados do cliente...
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="min-h-screen w-full p-6"
        style={{
          backgroundColor: "rgb(249, 250, 251)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div
          className="w-full max-w-4xl mx-auto"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            boxShadow:
              "0 20px 40px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
          <button
            className="flex items-center hover:opacity-80"
            style={{ color: "rgb(144, 199, 45)" }}
            onClick={() => navigate("/selecionar-cliente")}
          >
            <ArrowLeft className="mr-2" /> Voltar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen w-full p-6"
      style={{
        backgroundColor: "rgb(249, 250, 251)",
        paddingTop: "2rem",
        paddingBottom: "2rem",
      }}
    >
      <div
        className="w-full max-w-6xl mx-auto"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header apenas para formulário de emissão */}
        {!certificadoGerado && (
          <div className="relative mb-6">
            <button
              className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center hover:opacity-80"
              style={{ color: "rgb(144, 199, 45)" }}
              onClick={() => navigate("/selecionar-cliente")}
            >
              <ArrowLeft className="mr-2" /> Voltar
            </button>
            <h1
              className="text-2xl font-bold text-center py-2 px-4 rounded-lg"
              style={{
                color: "rgb(144, 199, 45)",
              }}
            >
              Emissão de Certificado
            </h1>
          </div>
        )}
        {/* Notificação de automação */}
        {autoPreenchimento.ativo && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center animate-pulse">
            <Calculator className="mr-2" />
            {autoPreenchimento.mensagem}
          </div>
        )}
        {certificadoGerado ? (
          <CertificadoCard
            cliente={cliente}
            formData={formData}
            fatorZ={fatorZ}
            onVisualizar={handleVisualizarCertificado}
            onDownload={handleDownloadCertificado}
            onNovoCertificado={handleEditarDados}
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="space-y-6"
            ref={formRef}
          >
            {/* Seção de Erros de Anotação */}
            {annotationErrors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ❌ Anotações do Notion Incompletas
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p className="mb-2">
                        As seguintes informações devem incluir unidades (ul ou
                        ml):
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {annotationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                      <div className="mt-3 p-2 bg-red-100 rounded text-xs">
                        <strong>📝 Formato correto:</strong>
                        <br />
                        VOLUME: 100ul
                        <br />
                        PONTOS DE INDICAÇÃO: 10-100ul
                        <br />
                        PONTOS CALIBRADOS: 10-100ul
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}{" "}
            <SectionCard title="Dados do Certificado" variant="default">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Número do Certificado"
                  name="numeroCertificado"
                  value={formData.numeroCertificado}
                  onChange={handleChange}
                  onBlur={() => {
                    const erro = validateNumeroCertificado(
                      formData.numeroCertificado,
                      false,
                    );
                    setValidationErrors((prevErrors) => ({
                      ...prevErrors,
                      numeroCertificado: erro,
                    }));
                  }}
                  placeholder="Ex: 1234."
                  title="Digite um ponto após o número da OS"
                  required
                  error={validationErrors.numeroCertificado}
                />
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "rgb(75, 85, 99)" }}
                  >
                    Data da Calibração
                  </label>{" "}
                  <input
                    type="date"
                    name="dataCalibracao"
                    value={formData.dataCalibracao}
                    onChange={handleChange}
                    placeholder="Selecione a data da calibração"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md transition-colors duration-200 ease-in-out focus:border-green-500 focus:outline-none"
                    style={{
                      borderColor: validationErrors.dataCalibracao
                        ? "#ef4444"
                        : "#d1d5db",
                      color: "rgb(75, 85, 99)",
                    }}
                    onFocus={(e) => {
                      if (!validationErrors.dataCalibracao) {
                        e.target.style.borderColor = "rgb(144, 199, 45)";
                      }
                    }}
                    onBlur={(e) => {
                      const erro = validateDataCalibracao(
                        formData.dataCalibracao,
                      );
                      setValidationErrors((prevErrors) => ({
                        ...prevErrors,
                        dataCalibracao: erro,
                      }));
                      e.target.style.borderColor = erro ? "#ef4444" : "#d1d5db";
                    }}
                    required
                  />
                  {validationErrors.dataCalibracao && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.dataCalibracao}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>{" "}
            <SectionCard title="Condições Ambientais" variant="default">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="flex text-sm font-medium mb-1 items-center"
                    style={{ color: "rgb(75, 85, 99)" }}
                  >
                    <Thermometer className="mr-2 text-red-500" />
                    Temperatura (°C)
                  </label>{" "}
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => alterarTemperatura(-0.5)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-l-md border border-gray-300"
                    >
                      -
                    </button>{" "}
                    <input
                      type="number"
                      name="temperatura"
                      value={formData.temperatura}
                      onChange={handleChange}
                      onBlur={(e) => {
                        const ajustado = ajustarTemperatura(e.target.value);
                        setFormData({ ...formData, temperatura: ajustado });
                      }}
                      className="w-full px-3 py-2 border-y border-gray-300 text-center transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                      style={{
                        borderColor: "#d1d5db",
                        color: "rgb(75, 85, 99)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgb(144, 199, 45)";
                      }}
                      step="0.5"
                      min="15.0"
                      max="30.0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => alterarTemperatura(0.5)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-md border border-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <InfoBanner variant="warning" className="mt-2 text-sm">
                    <div className="font-medium">
                      Fator Z atual:{" "}
                      <span className="text-green-600">
                        {fatorZ.toFixed(4)}
                      </span>
                    </div>
                  </InfoBanner>
                </div>
                <div>
                  <label
                    className="flex text-sm font-medium mb-1 items-center"
                    style={{ color: "rgb(75, 85, 99)" }}
                  >
                    <Droplet className="mr-2 text-blue-500" />
                    Umidade Relativa do Ar (%)
                  </label>{" "}
                  <input
                    type="number"
                    name="umidadeRelativa"
                    value={formData.umidadeRelativa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                    style={{
                      borderColor: "#d1d5db",
                      color: "rgb(75, 85, 99)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgb(144, 199, 45)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                    }}
                    min="30"
                    max="90"
                    required
                  />
                </div>
              </div>{" "}
            </SectionCard>{" "}
            <div className="p-4 rounded-md border border-gray-200">
              {" "}
              <h3
                className="text-lg font-semibold mb-3 py-2 px-3 relative"
                style={{
                  color: "rgb(75, 85, 99)",
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgb(144, 199, 45), rgb(120, 170, 35))",
                  }}
                />
                Dados{" "}
                {formData.tipoEquipamento === "micropipeta"
                  ? "da Micropipeta"
                  : formData.tipoEquipamento === "bureta"
                    ? "da Bureta"
                    : "do Repipetador"}
              </h3>{" "}
              {/* Seletor de tipo de equipamento */}
              <RadioGroup
                name="tipoEquipamento"
                value={formData.tipoEquipamento}
                onChange={handleChange}
                label="Tipo de Equipamento"
                required
                variant="equipamento"
                options={[
                  {
                    value: "micropipeta",
                    label: "Micropipeta",
                  },
                  {
                    value: "bureta",
                    label: "Bureta",
                  },
                  {
                    value: "repipetador",
                    label: "Repipetador",
                  },
                ]}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {" "}
                <FormInput
                  label={`Marca ${
                    formData.tipoEquipamento === "micropipeta"
                      ? "da Pipeta"
                      : formData.tipoEquipamento === "bureta"
                        ? "da Bureta"
                        : "do Repipetador"
                  }`}
                  name="marcaPipeta"
                  value={formData.marcaPipeta}
                  onChange={handleChange}
                  placeholder={
                    formData.tipoEquipamento === "micropipeta"
                      ? "Ex: Eppendorf, Gilson, HTL, etc."
                      : "Ex: Eppendorf, Brand, Rainin, etc."
                  }
                />{" "}
                <FormInput
                  label={`Modelo ${
                    formData.tipoEquipamento === "micropipeta"
                      ? "da Pipeta"
                      : "do Repipetador"
                  }`}
                  name="modeloPipeta"
                  value={formData.modeloPipeta}
                  onChange={handleChange}
                  placeholder={
                    formData.tipoEquipamento === "micropipeta"
                      ? "Ex: P1000, Research Plus, etc."
                      : formData.tipoEquipamento === "bureta"
                        ? "Ex: B25, B50, Bureta Digital, etc."
                        : "Ex: Multipette E3x, Repeater M4, etc."
                  }
                />{" "}
                <FormInput
                  label={`Número/Série ${
                    formData.tipoEquipamento === "micropipeta"
                      ? "da Pipeta"
                      : formData.tipoEquipamento === "bureta"
                        ? "da Bureta"
                        : "do Repipetador"
                  }`}
                  name="numeroPipeta"
                  value={formData.numeroPipeta}
                  onChange={handleChange}
                  placeholder="Ex: AJ12345"
                />
                <FormInput
                  label="Nº de Identificação"
                  name="numeroIdentificacao"
                  value={formData.numeroIdentificacao}
                  onChange={handleChange}
                  placeholder="Ex: ID001, BIO123, etc. (opcional)"
                />{" "}
                {/* Campo Volume - apenas para micropipetas e buretas */}
                {(formData.tipoEquipamento === "micropipeta" ||
                  formData.tipoEquipamento === "bureta") && (
                  <VolumeInput
                    label="Volume"
                    volumeName="capacidade"
                    unitName="unidadeCapacidade"
                    volumeValue={formData.capacidade}
                    unitValue={formData.unidadeCapacidade}
                    onChange={handleChange}
                    placeholder="Ex: 1000"
                    required
                  />
                )}{" "}
                {/* Tipo de Instrumento - só aparece para micropipetas */}
                {formData.tipoEquipamento === "micropipeta" && (
                  <div className="space-y-4">
                    {" "}
                    <RadioGroup
                      name="tipoInstrumento"
                      value={formData.tipoInstrumento}
                      onChange={handleChange}
                      label="Tipo de Instrumento"
                      required
                      variant="inline"
                      options={[
                        {
                          value: "monocanal",
                          label: "Monocanal",
                        },
                        {
                          value: "multicanal",
                          label: "Multicanal",
                        },
                      ]}
                    />
                    {/* Seleção de quantidade de canais - só aparece quando multicanal está selecionado */}
                    {formData.tipoInstrumento === "multicanal" && (
                      <div className="mt-3 space-y-4">
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "rgb(75, 85, 99)" }}
                          >
                            Quantidade de Canais
                          </label>
                          <RadioGroup
                            name="quantidadeCanais"
                            value={quantidadeCanais.toString()}
                            onChange={(e) =>
                              handleQuantidadeCanaisChange(
                                parseInt(e.target.value),
                              )
                            }
                            variant="canais"
                            options={[
                              {
                                value: "8",
                                label: "8 Canais",
                              },
                              {
                                value: "12",
                                label: "12 Canais",
                              },
                            ]}
                          />
                        </div>

                        {/* Configuração de pontos por canal */}
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label
                              className="block text-sm font-medium"
                              style={{ color: "rgb(75, 85, 99)" }}
                            >
                              Pontos de Calibração por Canal
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() =>
                                handlePontosPorCanalChange(
                                  Math.max(1, pontosPorCanal - 1),
                                )
                              }
                              className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                              disabled={pontosPorCanal <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-3 py-1 bg-white border border-gray-300 rounded-md text-center font-medium min-w-[3rem]">
                              {pontosPorCanal}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handlePontosPorCanalChange(
                                  Math.min(10, pontosPorCanal + 1),
                                )
                              }
                              className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                              disabled={pontosPorCanal >= 10}
                            >
                              <Plus size={16} />
                            </button>
                            <span className="text-sm text-gray-600">
                              pontos por canal
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            Cada canal terá {pontosPorCanal} ponto
                            {pontosPorCanal !== 1 ? "s" : ""} de calibração
                            inicialmente.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}{" "}
                {/* Campos Faixa de Indicação e Faixa Calibrada - apenas para micropipetas e buretas */}
                {(formData.tipoEquipamento === "micropipeta" ||
                  formData.tipoEquipamento === "bureta") && (
                  <>
                    <VolumeInput
                      label="Faixa de Indicação"
                      volumeName="faixaIndicacao"
                      unitName="unidadeFaixaIndicacao"
                      volumeValue={formData.faixaIndicacao}
                      unitValue={formData.unidadeFaixaIndicacao}
                      onChange={handleChange}
                      placeholder="Ex: 100-1000"
                    />
                    <VolumeInput
                      label="Faixa Calibrada"
                      volumeName="faixaCalibrada"
                      unitName="unidadeFaixaCalibrada"
                      volumeValue={formData.faixaCalibrada}
                      unitValue={formData.unidadeFaixaCalibrada}
                      onChange={handleChange}
                      placeholder="Ex: 100-1000"
                    />
                  </>
                )}{" "}
              </div>
            </div>
            <div className="p-4 rounded-md border border-gray-200">
              {" "}
              <div className="flex justify-between items-center mb-3">
                {" "}
                <h3
                  className="text-lg font-semibold flex items-center py-2 px-3 relative"
                  style={{
                    color: "rgb(75, 85, 99)",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgb(144, 199, 45), rgb(120, 170, 35))",
                    }}
                  />
                  <TrendingUp
                    className="mr-2"
                    style={{ color: "rgb(144, 199, 45)" }}
                  />{" "}
                  Pontos de Calibração
                  {formData.tipoEquipamento === "repipetador" && (
                    <span className="ml-2 text-sm px-2 py-1 bg-green-100 text-green-800 rounded-md">
                      {seringas.length} Seringa
                      {seringas.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {formData.tipoInstrumento === "multicanal" && (
                    <span className="ml-2 text-sm px-2 py-1 bg-green-100 text-green-800 rounded-md">
                      {quantidadeCanais} Canais
                    </span>
                  )}
                </h3>
                <div className="flex space-x-2">
                  {" "}
                  <ActionButton
                    onClick={() => setMostrarNotaCalculos(!mostrarNotaCalculos)}
                    variant={mostrarNotaCalculos ? "success" : "outline-green"}
                    size="sm"
                    icon={mostrarNotaCalculos ? EyeOff : Info}
                  >
                    {mostrarNotaCalculos
                      ? "Ocultar Ajuda"
                      : "Como os cálculos são feitos?"}
                  </ActionButton>{" "}
                  {/* Controles específicos para cada tipo de equipamento */}{" "}
                  {formData.tipoEquipamento === "repipetador" ? (
                    <ActionButton
                      onClick={adicionarSeringa}
                      variant="outline-small"
                      icon={Plus}
                      title="Adicionar nova seringa"
                    >
                      Adicionar Seringa
                    </ActionButton>
                  ) : formData.tipoInstrumento === "multicanal" ? (
                    <ActionButton
                      onClick={() =>
                        setAutomacaoHabilitada(!automacaoHabilitada)
                      }
                      variant={
                        automacaoHabilitada
                          ? "automation-active"
                          : "automation-inactive"
                      }
                      title={
                        automacaoHabilitada
                          ? "Desativar automação de valores próximos"
                          : "Ativar automação de valores próximos"
                      }
                    >
                      <span className="relative z-10">
                        Automação: {automacaoHabilitada ? "Ativa" : "Inativa"}
                      </span>
                    </ActionButton>
                  ) : (
                    <div className="flex space-x-2">
                      {" "}
                      <ActionButton
                        onClick={adicionarPonto}
                        variant="outline-small"
                        icon={Plus}
                        title="Adicionar novo ponto de calibração"
                      >
                        Adicionar Ponto
                      </ActionButton>
                      <ActionButton
                        onClick={() =>
                          setAutomacaoHabilitada(!automacaoHabilitada)
                        }
                        variant={
                          automacaoHabilitada
                            ? "automation-active"
                            : "automation-inactive"
                        }
                        title={
                          automacaoHabilitada
                            ? "Desativar automação: insira 5 valores seguidos de vírgula para gerar os outros 5 automaticamente"
                            : "Ativar automação: insira 5 valores seguidos de vírgula para gerar os outros 5 automaticamente"
                        }
                      >
                        <span className="relative z-10">
                          Automação: {automacaoHabilitada ? "Ativa" : "Inativa"}
                        </span>
                      </ActionButton>
                    </div>
                  )}
                </div>
              </div>{" "}
              {mostrarNotaCalculos && (
                <InfoBanner
                  variant="success"
                  onClose={() => setMostrarNotaCalculos(false)}
                  closable={true}
                  icon={Calculator}
                  className="mb-4 animate-fade-in shadow-sm"
                >
                  <div>
                    <p className="font-bold text-green-800 mb-2">
                      Nota sobre os cálculos:
                    </p>{" "}
                    <p className="mb-2">
                      Cole os valores das medições em{" "}
                      <strong>massa (mg)</strong> separados por vírgulas. Os
                      valores serão automaticamente convertidos para{" "}
                      <strong>volume (µL)</strong> usando o fator Z, que varia
                      de acordo com a temperatura do ambiente.
                    </p>
                    <p className="mb-2">
                      <strong>Exemplo de entrada:</strong> 99.2, 99.12, 99.17,
                      99.16, 99.26{" "}
                    </p>
                    <p className="mb-3">
                      Fórmula: Volume (µL) = Massa (mg) × Fator Z
                    </p>
                    <div className="border-t border-green-200 pt-2">
                      <p className="font-bold text-green-800 mb-1">
                        Cálculos realizados:
                      </p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>
                          <strong>Mean Volume:</strong> Média dos volumes
                          individuais em <strong>µL</strong> (cada massa × Fator
                          Z)
                        </li>
                        <li>
                          <strong>Accuracy:</strong> Mean Volume - Volume
                          Nominal
                        </li>
                        <li>
                          <strong>Accuracy %:</strong> (Accuracy ÷ Volume
                          Nominal) × 100
                        </li>
                        <li>
                          <strong>Precision (SD):</strong> Desvio padrão dos
                          volumes individuais
                        </li>
                        <li>
                          <strong>Precision (CV):</strong> (SD ÷ Mean Volume) ×
                          100%
                        </li>
                      </ul>
                    </div>
                  </div>
                </InfoBanner>
              )}{" "}
              <div className="space-y-6">
                {formData.tipoEquipamento === "repipetador" ? ( // Layout para repipetador - agrupado por seringa
                  seringas.map((seringa, seringaIndex) => (
                    <div
                      key={seringa.id}
                      className="border border-gray-300 rounded-md p-3 bg-white"
                    >
                      {/* Cabeçalho da seringa */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-green-800 flex items-center">
                          <TestTube className="mr-2" />
                          Seringa {seringaIndex + 1}
                        </h4>
                        <div className="flex items-center gap-2">
                          {seringas.length > 1 && (
                            <button
                              type="button"
                              className="flex items-center px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-colors"
                              onClick={() =>
                                removerSeringaDiretamente(
                                  seringa.id,
                                  seringaIndex + 1,
                                )
                              }
                              title={`Remover seringa ${seringaIndex + 1}`}
                            >
                              <Trash2 className="mr-1" size={14} />
                              <span className="text-xs">Remover Seringa</span>
                            </button>
                          )}
                        </div>
                      </div>{" "}
                      {/* Configuração do volume nominal da seringa */}
                      <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: "rgb(75, 85, 99)" }}
                        >
                          Volume Nominal da Seringa
                        </label>
                        <div className="flex max-w-xs">
                          {" "}
                          <input
                            type="text"
                            value={seringa.volumeNominal}
                            onChange={(e) =>
                              atualizarSeringa(
                                seringa.id,
                                "volumeNominal",
                                formatNumberInput(e.target.value),
                              )
                            }
                            placeholder="Volume nominal"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                            style={{
                              borderColor: "#d1d5db",
                              color: "rgb(75, 85, 99)",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "rgb(144, 199, 45)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#d1d5db";
                            }}
                            required
                          />{" "}
                          <select
                            value={seringa.unidade}
                            onChange={(e) =>
                              atualizarSeringa(
                                seringa.id,
                                "unidade",
                                e.target.value,
                              )
                            }
                            className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                            style={{
                              borderColor: "#d1d5db",
                              color: "rgb(75, 85, 99)",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "rgb(144, 199, 45)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#d1d5db";
                            }}
                          >
                            {" "}
                            <option value="µL">µL</option>
                            <option value="mL">mL</option>
                          </select>
                        </div>
                      </div>
                      {/* Container dos 3 pontos de calibração da seringa */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {seringa.pontosCalibra.map((ponto, pontoIndex) => (
                          <div
                            key={ponto.id}
                            className="border border-gray-300 rounded-md p-3 bg-white relative"
                          >
                            <div className="mb-3">
                              {" "}
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Ponto {pontoIndex + 1}
                                </span>
                              </div>{" "}
                              <VolumeInputPoint
                                label="Volume Nominal"
                                volumeValue={ponto.volumeNominal}
                                unitValue={ponto.unidade}
                                onVolumeChange={(e) =>
                                  atualizarPontoSeringa(
                                    seringa.id,
                                    ponto.id,
                                    "volumeNominal",
                                    formatNumberInput(e.target.value),
                                  )
                                }
                                onUnitChange={(e) =>
                                  atualizarPontoSeringa(
                                    seringa.id,
                                    ponto.id,
                                    "unidade",
                                    e.target.value,
                                  )
                                }
                                placeholder="Volume nominal"
                                required
                              />
                            </div>

                            <div className="mb-3">
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: "rgb(75, 85, 99)" }}
                              >
                                Medições (mg)
                              </label>
                              <div className="space-y-2">
                                {" "}
                                <textarea
                                  value={ponto.valoresTexto || ""}
                                  onChange={(e) =>
                                    handleValoresChangeSeringa(
                                      seringa.id,
                                      ponto.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Cole os valores separados por vírgula"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                                  style={{
                                    borderColor: "#d1d5db",
                                    color: "rgb(75, 85, 99)",
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor =
                                      "rgb(144, 199, 45)";
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = "#d1d5db";
                                  }}
                                  rows="2"
                                />
                                {/* Mostrar os valores processados */}
                                {ponto.medicoes.some((m) => m !== "") && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Valores detectados:
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      {ponto.medicoes
                                        .slice(0, 6)
                                        .map((medicao, index) => (
                                          <div
                                            key={index}
                                            className={`px-1 py-1 text-xs rounded text-center ${
                                              medicao !== ""
                                                ? "bg-green-100 text-green-800 border border-green-200"
                                                : "bg-gray-100 text-gray-400 border border-gray-200"
                                            }`}
                                          >
                                            {medicao !== ""
                                              ? medicao
                                              : `M${index + 1}`}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Resultados dos cálculos */}
                            {ponto.media !== null && (
                              <div className="bg-gray-50 p-2 rounded-md">
                                <h5 className="font-medium mb-2 text-xs text-gray-700">
                                  Resultados
                                </h5>
                                <div className="space-y-2 text-xs">
                                  <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Mean Volume
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        {ponto.mediaMassa?.toFixed(2)} mg
                                      </span>
                                      <span className="text-green-600 font-medium">
                                        {ponto.media?.toFixed(2)} µL
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Accuracy
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        {ponto.inexatidao?.toFixed(2)} µL
                                      </span>
                                      <span
                                        className={
                                          Math.abs(ponto.inexatidaoPercentual) >
                                          5
                                            ? "text-red-600 font-medium"
                                            : "text-green-600 font-medium"
                                        }
                                      >
                                        {ponto.inexatidaoPercentual?.toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Precision
                                    </div>
                                    <div className="flex justify-between">
                                      {" "}
                                      <span className="font-medium">
                                        SD: {ponto.desvioPadrao?.toFixed(2)}
                                      </span>
                                      <span className="text-green-600 font-medium">
                                        CV:{" "}
                                        {ponto.coeficienteVariacao?.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : formData.tipoInstrumento === "multicanal" ? (
                  // Layout para micropipeta multicanal - agrupado por canal
                  Array.from({ length: numeroCanais }, (_, canalIndex) => {
                    const canalNum = canalIndex + 1;
                    const pontosDoCanalAtual = pontosCalibra.filter(
                      (p) => p.canal === canalNum,
                    );
                    return (
                      <div
                        key={`canal-${canalNum}`}
                        className="border border-gray-300 rounded-md p-3 bg-white"
                      >
                        {" "}
                        {/* Cabeçalho do canal */}
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-green-800 flex items-center">
                            <TestTube className="mr-2" />
                            Canal {canalNum}{" "}
                            {canalNum === 1 && <CanalMestreBadge />}
                          </h4>
                          <div className="flex items-center gap-2">
                            {numeroCanais > 1 && canalNum !== 1 && (
                              <button
                                type="button"
                                className="flex items-center px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-colors"
                                onClick={() => {
                                  const primeiroPontoDoCanal =
                                    pontosDoCanalAtual[0];
                                  if (primeiroPontoDoCanal) {
                                    removerPontoDiretamente(
                                      primeiroPontoDoCanal.id,
                                      canalNum,
                                      true,
                                    );
                                  }
                                }}
                                title={`Remover canal ${canalNum} completo`}
                              >
                                <Trash2 className="mr-1" size={14} />
                                <span className="text-xs">Remover Canal</span>
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Container dos pontos do canal */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {pontosDoCanalAtual.map((ponto, pontoIndex) => (
                            <div
                              key={ponto.id}
                              className="border border-gray-300 rounded-md p-3 bg-white relative"
                            >
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-600">
                                    Ponto {ponto.pontoPosicao}
                                  </span>
                                </div>

                                <VolumeInputPoint
                                  label="Volume Nominal"
                                  volumeValue={ponto.volumeNominal}
                                  unitValue={ponto.unidade}
                                  onVolumeChange={(e) =>
                                    handleVolumeNominalChange(
                                      ponto.id,
                                      e.target.value,
                                    )
                                  }
                                  onUnitChange={(e) =>
                                    atualizarPontoCalibracao(
                                      ponto.id,
                                      "unidade",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Volume nominal"
                                  required
                                />
                              </div>

                              <div className="mb-3">
                                <label
                                  className="block text-sm font-medium mb-1"
                                  style={{ color: "rgb(75, 85, 99)" }}
                                >
                                  Medições (mg)
                                </label>
                                <div className="space-y-2">
                                  {" "}
                                  <textarea
                                    value={ponto.valoresTexto || ""}
                                    onChange={(e) =>
                                      handleValoresChange(
                                        ponto.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Cole os valores separados por vírgula"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                                    style={{
                                      borderColor: "#d1d5db",
                                      color: "rgb(75, 85, 99)",
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor =
                                        "rgb(144, 199, 45)";
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = "#d1d5db";
                                    }}
                                    rows="2"
                                  />
                                  {/* Mostrar os valores processados */}
                                  {ponto.medicoes.some((m) => m !== "") && (
                                    <div className="mt-2">
                                      <div className="text-xs text-gray-500 mb-1">
                                        Valores detectados:
                                      </div>
                                      <div className="grid grid-cols-3 gap-1">
                                        {ponto.medicoes
                                          .slice(0, 6)
                                          .map((medicao, index) => (
                                            <div
                                              key={index}
                                              className={`px-1 py-1 text-xs rounded text-center ${
                                                medicao !== ""
                                                  ? "bg-green-100 text-green-800 border border-green-200"
                                                  : "bg-gray-100 text-gray-400 border border-gray-200"
                                              }`}
                                            >
                                              {medicao !== ""
                                                ? medicao
                                                : `M${index + 1}`}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Resultados dos cálculos */}
                              {ponto.media !== null && (
                                <div className="bg-gray-50 p-2 rounded-md">
                                  <h5 className="font-medium mb-2 text-xs text-gray-700">
                                    Resultados
                                  </h5>
                                  <div className="space-y-2 text-xs">
                                    <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                      <div className="text-xs text-gray-500 mb-1">
                                        Mean Volume
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">
                                          {ponto.mediaMassa?.toFixed(2)} mg
                                        </span>
                                        <span className="text-green-600 font-medium">
                                          {ponto.media?.toFixed(2)} µL
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                      <div className="text-xs text-gray-500 mb-1">
                                        Accuracy
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">
                                          {ponto.inexatidao?.toFixed(2)} µL
                                        </span>
                                        <span
                                          className={
                                            Math.abs(
                                              ponto.inexatidaoPercentual,
                                            ) > 5
                                              ? "text-red-600 font-medium"
                                              : "text-green-600 font-medium"
                                          }
                                        >
                                          {ponto.inexatidaoPercentual?.toFixed(
                                            2,
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                      <div className="text-xs text-gray-500 mb-1">
                                        Precision
                                      </div>
                                      <div className="flex justify-between">
                                        {" "}
                                        <span className="font-medium">
                                          SD: {ponto.desvioPadrao?.toFixed(2)}
                                        </span>
                                        <span className="text-green-600 font-medium">
                                          CV:{" "}
                                          {ponto.coeficienteVariacao?.toFixed(
                                            2,
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>{" "}
                      </div>
                    );
                  }) // Layout para micropipeta monocanal - layout em grid similar às multicanais
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pontosCalibra.map((ponto, pontoIndex) => (
                      <div
                        key={ponto.id}
                        className="border border-gray-300 rounded-md p-3 bg-white"
                      >
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Ponto {pontoIndex + 1}
                            </span>
                            {pontosCalibra.length > 1 && (
                              <button
                                type="button"
                                className="flex items-center px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-colors text-xs"
                                onClick={() =>
                                  removerPontoDiretamente(
                                    ponto.id,
                                    pontoIndex + 1,
                                  )
                                }
                                title="Remover ponto de calibração"
                              >
                                <Trash2 className="mr-1" size={12} />
                                Remover
                              </button>
                            )}{" "}
                          </div>

                          <VolumeInputPoint
                            label="Volume Nominal"
                            volumeValue={ponto.volumeNominal}
                            unitValue={ponto.unidade}
                            onVolumeChange={(e) =>
                              handleVolumeNominalChange(
                                ponto.id,
                                e.target.value,
                              )
                            }
                            onUnitChange={(e) =>
                              atualizarPontoCalibracao(
                                ponto.id,
                                "unidade",
                                e.target.value,
                              )
                            }
                            placeholder="Volume nominal"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label
                            className="block text-sm font-medium mb-1"
                            style={{ color: "rgb(75, 85, 99)" }}
                          >
                            Medições (mg)
                          </label>
                          <div className="space-y-2">
                            {" "}
                            <textarea
                              value={ponto.valoresTexto || ""}
                              onChange={(e) =>
                                handleValoresChange(ponto.id, e.target.value)
                              }
                              placeholder="Cole os valores separados por vírgula"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none transition-colors duration-200 ease-in-out focus:outline-none focus:border-green-500"
                              style={{
                                borderColor: "#d1d5db",
                                color: "rgb(75, 85, 99)",
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor =
                                  "rgb(144, 199, 45)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = "#d1d5db";
                              }}
                              rows="2"
                            />
                            {/* Mostrar os valores processados */}
                            {ponto.medicoes.some((m) => m !== "") && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">
                                  Valores detectados:
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {ponto.medicoes
                                    .slice(0, 6)
                                    .map((medicao, index) => (
                                      <div
                                        key={index}
                                        className={`px-1 py-1 text-xs rounded text-center ${
                                          medicao !== ""
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-gray-100 text-gray-400 border border-gray-200"
                                        }`}
                                      >
                                        {medicao !== ""
                                          ? medicao
                                          : `M${index + 1}`}
                                      </div>
                                    ))}
                                </div>
                                {/* Mostrar mais valores se houver */}
                                {ponto.medicoes.filter((m) => m !== "").length >
                                  6 && (
                                  <div className="mt-1 text-xs text-gray-500 text-center">
                                    +
                                    {ponto.medicoes.filter((m) => m !== "")
                                      .length - 6}{" "}
                                    valores adicionais
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Resultados dos cálculos */}
                        {ponto.media !== null && (
                          <div className="bg-gray-50 p-2 rounded-md">
                            <h5 className="font-medium mb-2 text-xs text-gray-700">
                              Resultados
                            </h5>
                            <div className="space-y-2 text-xs">
                              <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">
                                  Mean Volume
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {ponto.mediaMassa?.toFixed(2)} mg
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    {ponto.media?.toFixed(2)} µL
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">
                                  Accuracy
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {ponto.inexatidao?.toFixed(2)} µL
                                  </span>
                                  <span
                                    className={
                                      Math.abs(ponto.inexatidaoPercentual) > 5
                                        ? "text-red-600 font-medium"
                                        : "text-green-600 font-medium"
                                    }
                                  >
                                    {ponto.inexatidaoPercentual?.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 bg-white rounded shadow-sm border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">
                                  Precision
                                </div>
                                <div className="flex justify-between">
                                  {" "}
                                  <span className="font-medium">
                                    SD: {ponto.desvioPadrao?.toFixed(2)}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    CV: {ponto.coeficienteVariacao?.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}{" "}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>{" "}
            <div className="flex justify-end">
              <ActionButton
                type="submit"
                variant="secondary"
                disabled={
                  !!validateNumeroCertificado(
                    formData.numeroCertificado,
                    true,
                  ) || !!validateDataCalibracao(formData.dataCalibracao)
                }
                title={
                  validateNumeroCertificado(formData.numeroCertificado, true) ||
                  validateDataCalibracao(formData.dataCalibracao)
                    ? "Preencha número do certificado e data da calibração para habilitar a geração."
                    : ""
                }
              >
                Gerar Certificado{" "}
                <Sparkles className="ml-2" size={20} aria-hidden="true" />
              </ActionButton>
            </div>
          </form>
        )}
        {/* Componente de IA para extração de dados */}
        {/* Controles de animação da IA movidos para dentro do chat */}

        {/* Assistente IA Chat - apenas na tela de preenchimento */}
        <AIChatAssistant
          onDataExtracted={handleDataExtracted}
          showInCurrentPage={!certificadoGerado}
          animationSpeed={animationSpeed}
          setAnimationSpeed={setAnimationSpeed}
          isAnimating={isAnimating}
          stopAnimation={stopAnimation}
          progress={animationProgress}
          currentField={currentField}
        />
      </div>
    </div>
  );
};

export default EmitirCertificadoPage;
