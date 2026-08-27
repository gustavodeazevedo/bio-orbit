import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  UserRound,
  Lock,
  Mail,
  Building,
  UsersRound,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthFormSkeleton } from "../components/SkeletonLoader";
import "../styles/Auth.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cargo: "",
    setor: "",
    corporateToken: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Limpar erro específico quando o usuário começa a digitar
    if (formErrors[id]) {
      setFormErrors({ ...formErrors, [id]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome) errors.nome = "Nome é obrigatório";
    if (!formData.email) errors.email = "Email é obrigatório";
    if (!formData.senha) errors.senha = "Senha é obrigatória";
    if (!formData.confirmarSenha)
      errors.confirmarSenha = "Confirmação de senha é obrigatória";
    if (!formData.cargo) errors.cargo = "Cargo é obrigatório";
    if (!formData.setor) errors.setor = "Setor é obrigatório";
    if (!formData.corporateToken)
      errors.corporateToken = "Token corporativo é obrigatório";

    // Validação de email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    // Validação de senha
    if (formData.senha && formData.senha.length < 6) {
      errors.senha = "A senha deve ter pelo menos 6 caracteres";
    }

    // Validação de confirmação de senha
    if (
      formData.senha &&
      formData.confirmarSenha &&
      formData.senha !== formData.confirmarSenha
    ) {
      errors.confirmarSenha = "As senhas não coincidem";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Remover confirmarSenha antes de enviar para a API
      const { confirmarSenha, ...userData } = formData;
      await register(userData);
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro no cadastro:", err);
    }
  };
  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-logo">
          <img
            src="/images/bioorbit-logo.png"
            alt="BioOrbit Logo"
            className="logo-image"
          />
        </div>
        <h2 className="form-title">BioResearch - BioOrbit</h2>
        <p className="form-description">
          Complete suas informações para criar sua conta
        </p>
        {error && <div className="error-message">{error}</div>}{" "}
        {loading ? (
          <AuthFormSkeleton
            fields={6}
            note="Preparando seu cadastro enquanto o servidor responde."
          />
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className="input-group">
              <div className="input-wrapper">
                <UserRound className="input-icon" />
                <input
                  type="text"
                  placeholder="NOME COMPLETO"
                  id="nome"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.1s" }}
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
                {formErrors.nome && (
                  <div className="error-message">{formErrors.nome}</div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="E-MAIL"
                  id="email"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.2s" }}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {formErrors.email && (
                  <div className="error-message">{formErrors.email}</div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <Building className="input-icon" />
                <input
                  type="text"
                  placeholder="CARGO"
                  id="cargo"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.3s" }}
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                />
                {formErrors.cargo && (
                  <div className="error-message">{formErrors.cargo}</div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <UsersRound className="input-icon" />
                <input
                  type="text"
                  placeholder="SETOR"
                  id="setor"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.4s" }}
                  value={formData.setor}
                  onChange={handleChange}
                  required
                />
                {formErrors.setor && (
                  <div className="error-message">{formErrors.setor}</div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="SENHA"
                  id="senha"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.5s" }}
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />{" "}
                {formData.senha && (
                  <div
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </div>
                )}
                {formErrors.senha && (
                  <div className="error-message">{formErrors.senha}</div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="CONFIRMAR SENHA"
                  id="confirmarSenha"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.6s" }}
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                />
                {formData.confirmarSenha && (
                  <div
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </div>
                )}
                {formErrors.confirmarSenha && (
                  <div className="error-message">
                    {formErrors.confirmarSenha}
                  </div>
                )}
              </div>
            </div>
            <div className="input-group">
              <div className="input-wrapper">
                <Key className="input-icon" />
                <input
                  type={showToken ? "text" : "password"}
                  placeholder="TOKEN CORPORATIVO"
                  id="corporateToken"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.7s" }}
                  value={formData.corporateToken}
                  onChange={handleChange}
                  required
                />
                {formData.corporateToken && (
                  <div
                    className="toggle-password"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff /> : <Eye />}
                  </div>
                )}
                {formErrors.corporateToken && (
                  <div className="error-message">
                    {formErrors.corporateToken}
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              CADASTRAR
            </button>
            <div className="links-container">
              <Link to="/login" className="forgot-password">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
