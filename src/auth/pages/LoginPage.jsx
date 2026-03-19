import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import "../styles/login.css";

const API = "https://localhost:7042";
const SESSION_NOTICE_KEY = "session_expired_notice";

const getFirst = (obj, keys) => {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
};

const normalizeUser = (raw) => ({
  usuarioId: getFirst(raw, ["usuarioId", "UsuarioId", "id", "Id"]) ?? "",
  username: getFirst(raw, ["username", "Username", "usuario", "Usuario"]) ?? "",
  nombreCompleto: getFirst(raw, ["nombreCompleto", "NombreCompleto", "nombre", "Nombre"]) ?? "",
  rol: getFirst(raw, ["rol", "Rol"]) ?? "",
  sedeNombre: getFirst(raw, ["sedeNombre", "SedeNombre", "sede", "Sede"]) ?? "",
  areaTrabajo: getFirst(raw, ["areaTrabajo", "AreaTrabajo", "area", "Area"]) ?? "",
  telefono: getFirst(raw, ["telefono", "Telefono"]) ?? "",
  correo: getFirst(raw, ["correo", "Correo", "email", "Email"]) ?? "",
  avatarUrl: getFirst(raw, ["avatarUrl", "AvatarUrl", "fotoPerfilUrl", "FotoPerfilUrl", "fotoUrl", "FotoUrl"]) ?? "",
  permisos: getFirst(raw, ["permisos", "Permisos"]) ?? null,
  permissions: getFirst(raw, ["permissions", "Permissions"]) ?? null,
});

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [verContrasena, setVerContrasena] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const notice = localStorage.getItem(SESSION_NOTICE_KEY);
    if (!notice) return;

    setMensaje({ texto: notice, tipo: "info" });
    localStorage.removeItem(SESSION_NOTICE_KEY);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "Validando credenciales...", tipo: "info" });

    try {
      const resp = await fetch(`${API}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario: usuario, Contrasena: contrasena }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setMensaje({ texto: data.mensaje || "Usuario o contrasena incorrectos.", tipo: "error" });
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);

        let userData = normalizeUser(data);

        try {
          const meResp = await fetch(`${API}/api/Usuarios/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          });

          if (meResp.ok) {
            const meData = await meResp.json();
            userData = { ...userData, ...normalizeUser(meData) };
          }
        } catch {
          // Si falla la carga del perfil, dejamos la sesion iniciada con los datos del login.
        }

        localStorage.setItem("usuario", JSON.stringify(userData));
        window.dispatchEvent(new Event("usuario-updated"));
      } else {
        console.warn("La respuesta no contiene un token. Verifica el backend.");
      }

      setMensaje({ texto: "Acceso correcto. Redirigiendo...", tipo: "ok" });
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (error) {
      console.error("Error en login:", error);
      setMensaje({ texto: "Error de conexion con el servidor.", tipo: "error" });
    }
  };

  return (
    <div className="si-bg">
      <div className="si-scene" aria-hidden="true">
        <div className="si-ambient-glow si-ambient-glow-left" />
        <div className="si-ambient-glow si-ambient-glow-right" />
        <div className="si-window-glow" />
        <div className="si-kitchen-wall" />
        <div className="si-tile-grid" />

        <div className="si-shelf si-shelf-top">
          <span className="si-jar si-jar-oil" />
          <span className="si-jar si-jar-spice" />
          <span className="si-plant" />
        </div>

        <div className="si-utensil-rail">
          <span className="si-utensil si-utensil-spoon" />
          <span className="si-utensil si-utensil-whisk" />
          <span className="si-utensil si-utensil-ladle" />
        </div>

        <div className="si-shelf si-shelf-mid">
          <span className="si-plate-stack" />
          <span className="si-board" />
          <span className="si-bowl">
            <span className="si-bowl-fill" />
            <span className="si-bowl-steam si-bowl-steam-one" />
            <span className="si-bowl-steam si-bowl-steam-two" />
            <span className="si-bowl-steam si-bowl-steam-three" />
          </span>
        </div>

        <div className="si-counter" />
        <div className="si-counter-edge" />
        <div className="si-counter-shadow" />

        <div className="si-counter-decor si-counter-decor-left">
          <span className="si-fruit si-fruit-orange" />
          <span className="si-fruit si-fruit-red" />
          <span className="si-herbs" />
        </div>

        <div className="si-counter-decor si-counter-decor-right">
          <span className="si-pan" />
          <span className="si-towel" />
        </div>
      </div>

      <div className="si-wrap">
        <div className="si-brand" aria-label="SI Cocina">
          <div className="si-monogram">
            <span className="si-letter si-s">S</span>
            <span className="si-letter si-i">I</span>
            <span className="si-bar" aria-hidden="true" />
          </div>
          <div className="si-cocina">COCINA CORPORATIVA</div>
        </div>

        <div className="si-card">
          <div className="si-card-top">
            <h1 className="si-card-title">Bienvenido</h1>
            <div className="si-card-badge">SI</div>
          </div>

          <p className="si-card-text">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleLogin} className="si-form">
            <div className="si-field">
              <label className="si-label">Usuario</label>
              <div className="si-input">
                <span className="si-icon"><UserRound size={16} /></span>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="si-field">
              <label className="si-label">Contrasena</label>
              <div className="si-input si-input-pass">
                <span className="si-icon"><KeyRound size={16} /></span>
                <input
                  type={verContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contrasena"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="si-eye"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-label={verContrasena ? "Ocultar contrasena" : "Mostrar contrasena"}
                  title={verContrasena ? "Ocultar" : "Mostrar"}
                >
                  {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="si-row">
              <label className="si-check">
                <input type="checkbox" />
                <span>Recordar mi usuario</span>
              </label>

              <a className="si-link" href="#">
                Olvide mi contrasena
              </a>
            </div>

            <button type="submit" className="si-btn">
              Iniciar sesion
            </button>

            <div className="si-bottom">Acceso restringido para personal autorizado.</div>

            {mensaje && <div className={`si-msg ${mensaje.tipo}`}>{mensaje.texto}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
