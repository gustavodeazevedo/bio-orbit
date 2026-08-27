import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthFormSkeleton } from "../components/SkeletonLoader";
import "../styles/Auth.css";

const RecuperarSenhaPage = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { requestPasswordReset, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setEmailError(null);
  };

  const validateForm = () => {
    let isValid = true;

    if (!email) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email inválido");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error("Erro ao solicitar recuperação de senha:", err);
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

        <h2 className="form-title">Recuperação de Senha</h2>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <AuthFormSkeleton
            fields={1}
            note="Enviando a solicitação de recuperação e acordando o serviço."
          />
        ) : success ? (
          <div>
            <div className="success-message">
              Um email com instruções para redefinir sua senha foi enviado para{" "}
              {email}.
            </div>
            <p className="form-description">
              Verifique sua caixa de entrada e siga as instruções no email.
            </p>
            <button className="login-button" onClick={() => navigate("/login")}>
              VOLTAR PARA LOGIN
            </button>
          </div>
        ) : (
          <>
            <p className="form-description">
              Digite seu email abaixo e enviaremos instruções para redefinir sua
              senha.
            </p>

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <div className="input-group">
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    placeholder="E-MAIL"
                    id="email"
                    className="login-input with-icon"
                    style={{ animationDelay: "0.1s" }}
                    value={email}
                    onChange={handleChange}
                    required
                  />
                  {emailError && (
                    <div className="error-message">{emailError}</div>
                  )}
                </div>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                ENVIAR INSTRUÇÕES
              </button>
            </form>

            <div className="links-container">
              <Link to="/login" className="forgot-password">
                Lembrou sua senha? Voltar para Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecuperarSenhaPage;
