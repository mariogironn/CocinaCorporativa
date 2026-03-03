import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState(null);
  // A) Nuevo estado para mostrar/ocultar contraseña
  const [verContrasena, setVerContrasena] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "Validando credenciales...", tipo: "info" });

    try {
      const resp = await fetch("https://localhost:7042/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario: usuario, Contrasena: contrasena }),
      });

      if (!resp.ok) {
        setMensaje({ texto: "Usuario o contraseña incorrectos.", tipo: "error" });
        return;
      }

      await resp.json();
      setMensaje({ texto: "Acceso correcto.", tipo: "ok" });
      setTimeout(() => navigate("/dashboard"), 400);
    } catch {
      setMensaje({ texto: "Error de conexión con el servidor.", tipo: "error" });
    }
  };

  return (
    <div className="si-bg">
      <div className="si-wrap">
        {/* LOGO (SI fino + barra + COCINA) */}
        <div className="si-logo">
          <div className="si-monogram" aria-label="SI Cocina">
            <span className="si-letter si-s">S</span>
            <span className="si-letter si-i">I</span>
            <span className="si-bar" aria-hidden="true"></span>
          </div>
          <div className="si-cocina">COCINA</div>
        </div>

        <div className="si-card">
          <h1 className="si-title">Bienvenido</h1>
          <p className="si-subtitle">Ingresa a tu cuenta</p>

          <form onSubmit={handleLogin} className="si-form">
            <div className="si-field">
              <label className="si-label">Usuario</label>
              <div className="si-input">
                <span className="si-icon">👤</span>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* B) Nuevo bloque de contraseña con botón ojo */}
            <div className="si-field">
              <label className="si-label">Contraseña</label>
              <div className="si-input si-input-pass">
                <span className="si-icon">🔒</span>

                <input
                  type={verContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="si-eye"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={verContrasena ? "Ocultar" : "Mostrar"}
                >
                  {verContrasena ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="si-row">
              <label className="si-check">
                <input type="checkbox" />
                <span>Recordar mi usuario</span>
              </label>

              <a className="si-link" href="#">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="si-btn">
              Iniciar Sesión
            </button>

            <div className="si-bottom">
              <span>¿No tienes cuenta?</span>
              <a className="si-link" href="#">
                Solicitar acceso
              </a>
            </div>

            {mensaje && (
              <div className={`si-msg ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}
          </form>
        </div>

        <div className="si-footer">
          © 2026 SI Cocina - Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}