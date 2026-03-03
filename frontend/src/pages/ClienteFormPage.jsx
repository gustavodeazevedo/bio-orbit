import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Building2,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createCliente,
  getClienteById,
  updateCliente,
} from "../services/clienteService";

const ESTADOS_BRASIL = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const FormInput = ({
  label,
  name,
  value,
  placeholder,
  type = "text",
  required = false,
  onChange,
  error,
  maxLength,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 bg-background border rounded-lg transition-all outline-none ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

const FormSelect = ({
  label,
  name,
  value,
  options,
  required = false,
  onChange,
  error,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 bg-background border rounded-lg transition-all outline-none ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      >
        <option value="">Selecione um estado</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

const initialState = {
  nome: "",
  endereco: {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  },
};

const ClienteFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchCliente();
    }
  }, [id, isEditMode]);

  const fetchCliente = async () => {
    try {
      setLoading(true);
      const cliente = await getClienteById(id);
      setFormData(cliente);
    } catch (err) {
      setErrorMessage(
        "Erro ao carregar dados do cliente. Por favor, tente novamente."
      );
      console.error("Erro ao carregar cliente:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCEP = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.substring(0, 8);
    if (digits.length > 5) {
      return `${digits.substring(0, 5)}-${digits.substring(5)}`;
    }
    return digits;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "endereco.cep") {
      const formattedCep = formatCEP(value);
      setFormData((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: formattedCep,
        },
      }));
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Limpa erro do campo quando usuário começa a digitar
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }
    if (!formData.endereco?.rua?.trim()) {
      errors["endereco.rua"] = "Rua é obrigatória";
    }
    if (!formData.endereco?.numero?.trim()) {
      errors["endereco.numero"] = "Número é obrigatório";
    }
    if (!formData.endereco?.bairro?.trim()) {
      errors["endereco.bairro"] = "Bairro é obrigatório";
    }
    if (!formData.endereco?.cidade?.trim()) {
      errors["endereco.cidade"] = "Cidade é obrigatória";
    }
    if (!formData.endereco?.estado) {
      errors["endereco.estado"] = "Estado é obrigatório";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const dadosParaEnvio = {
        ...formData,
        endereco: {
          rua: formData.endereco?.rua || "",
          numero: formData.endereco?.numero || "",
          bairro: formData.endereco?.bairro || "",
          cidade: formData.endereco?.cidade || "",
          estado: formData.endereco?.estado || "",
          cep: formData.endereco?.cep || "",
        },
      };

      if (isEditMode) {
        await updateCliente(id, dadosParaEnvio);
      } else {
        await createCliente(dadosParaEnvio);
      }

      navigate("/clientes");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setErrorMessage(
        err.message || "Erro ao salvar cliente. Por favor, tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Carregando dados do cliente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/clientes")}
            disabled={saving}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </button>

          <h1 className="text-2xl font-bold text-foreground">
            {isEditMode ? "Editar Cliente" : "Novo Cliente"}
          </h1>

          <div className="w-20"></div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-700 dark:text-green-400">
                {successMessage}
              </p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
        >
          {/* Informações do Cliente */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Informações do Cliente
              </h2>
            </div>

            <FormInput
              label="Nome da Empresa"
              name="nome"
              value={formData.nome}
              placeholder="Digite o nome da empresa"
              required
              onChange={handleChange}
              error={validationErrors.nome}
            />
          </div>

          {/* Endereço */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Endereço
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Rua"
                name="endereco.rua"
                value={formData.endereco.rua}
                placeholder="Nome da rua"
                required
                onChange={handleChange}
                error={validationErrors["endereco.rua"]}
              />

              <FormInput
                label="Número"
                name="endereco.numero"
                value={formData.endereco.numero}
                placeholder="123"
                required
                onChange={handleChange}
                error={validationErrors["endereco.numero"]}
              />

              <FormInput
                label="Bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                placeholder="Nome do bairro"
                required
                onChange={handleChange}
                error={validationErrors["endereco.bairro"]}
              />

              <FormInput
                label="CEP"
                name="endereco.cep"
                value={formData.endereco.cep}
                placeholder="00000-000"
                onChange={handleChange}
                error={validationErrors["endereco.cep"]}
                maxLength={9}
              />

              <FormInput
                label="Cidade"
                name="endereco.cidade"
                value={formData.endereco.cidade}
                placeholder="Nome da cidade"
                required
                onChange={handleChange}
                error={validationErrors["endereco.cidade"]}
              />

              <FormSelect
                label="Estado"
                name="endereco.estado"
                value={formData.endereco.estado}
                options={ESTADOS_BRASIL}
                required
                onChange={handleChange}
                error={validationErrors["endereco.estado"]}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-muted/30 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/clientes")}
              disabled={saving}
              className="px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteFormPage;
