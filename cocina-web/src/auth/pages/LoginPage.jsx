import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

/**
 * LoginPage (UI + llamada al backend)
 * -------------------------------------------------------
 * - Diseñado para combinar con el dashboard (tema azul ERP).
 * - Llama al endpoint: https://localhost:7042/api/Auth/login
 * - Maneja mensajes (info / ok / error).
 * - Incluye "ojo" para mostrar/ocultar contraseña.
 *
 * Nota: En esta etapa no se guarda JWT ni sesión; eso se integra después
 * cuando el backend emita token (JWT) y el frontend lo persista.
 */
export default function LoginPage() {
  // Estado de campos del formulario
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Mensajes de estado para el usuario (feedback)
  const [mensaje, setMensaje] = useState(null);

  // Mostrar/ocultar contraseña
  const [verContrasena, setVerContrasena] = useState(false);

  const navigate = useNavigate();

  /**
   * Envía las credenciales al backend.
   * - Si el backend responde OK, redirige a /dashboard.
   * - Si falla, muestra mensaje controlado.
   */
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

      // Leemos la respuesta por compatibilidad (luego aquí guardaremos token)
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
        {/* Logo (monograma SI + COCINA). Mantiene identidad y combina con tema claro */}
        <div className="si-logo" aria-label="SI Cocina">
          <div className="si-monogram">
            <span className="si-letter si-s">S</span>
            <span className="si-letter si-i">I</span>
            <span className="si-bar" aria-hidden="true" />
          </div>
          <div className="si-cocina">COCINA</div>
        </div>

        {/* Card del login */}
        <div className="si-card">
          <h1 className="si-title">BIENVENIDO</h1>
          <p className="si-subtitle">Ingresa a tu cuenta</p>

          <form onSubmit={handleLogin} className="si-form">
            {/* Usuario */}
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

            {/* Contraseña + ojo */}
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

            {/* Recordar + link */}
            <div className="si-row">
              <label className="si-check">
                <input type="checkbox" />
                <span>Recordar mi usuario</span>
              </label>

              <a className="si-link" href="#">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón principal */}
            <button type="submit" className="si-btn">
              Iniciar Sesión
            </button>

            {/* Enlace inferior */}
            <div className="si-bottom">
              <span>¿No tienes cuenta?</span>
              <a className="si-link" href="#">
                Solicitar acceso
              </a>
            </div>

            {/* Mensajes */}
            {mensaje && <div className={`si-msg ${mensaje.tipo}`}>{mensaje.texto}</div>}
          </form>
        </div>

        {/* Footer */}
        <div className="si-footer">© 2026 SI Cocina - Todos los derechos reservados</div>
      </div>
    </div>
  );
}