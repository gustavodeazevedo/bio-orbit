import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, Key, Eye, EyeOff } from "lucide-react";
import { AuthFormSkeleton } from "../components/SkeletonLoader";
import "../styles/Auth.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    corporateToken: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    if (formErrors[id]) {
      setFormErrors({ ...formErrors, [id]: null });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) errors.email = "Email é obrigatório";
    if (!formData.senha) errors.senha = "Senha é obrigatória";
    if (!formData.corporateToken) {
      errors.corporateToken = "Token corporativo é obrigatório";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData.email, formData.senha, formData.corporateToken);
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro no login:", err);
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
          Sistema de Calibração de Micropipetas
        </p>
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <AuthFormSkeleton
            fields={3}
            note="Validando credenciais e acordando o painel antes do acesso."
          />
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className="input-group">
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="E-MAIL"
                  id="email"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.1s" }}
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
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="SENHA"
                  id="senha"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.2s" }}
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
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
                <Key className="input-icon" />
                <input
                  type={showToken ? "text" : "password"}
                  placeholder="TOKEN CORPORATIVO"
                  id="corporateToken"
                  className="login-input with-icon"
                  style={{ animationDelay: "0.3s" }}
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
              ENTRAR
            </button>

            <div className="links-container">
              <Link to="/recuperar-senha" className="forgot-password">
                Esqueci minha senha
              </Link>
              <Link to="/registro" className="forgot-password">
                Não tem uma conta? Cadastre-se
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
