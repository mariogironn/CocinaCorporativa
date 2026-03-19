import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCog } from "lucide-react";
import "../styles/profile.css";
import { ROLE_OPTIONS, getCurrentUser, hasPermission } from "../../../security/roles";

// ============================================================
// CONFIGURACIÓN DE LA API Y ENDPOINTS
// ============================================================

const API = "https://localhost:7042";

// Endpoints para obtener el perfil (GET)
const PROFILE_GET_ENDPOINTS = ["/api/Usuarios/me", "/api/Usuario/perfil", "/api/Auth/me"];

// Endpoints para guardar el perfil (PUT)
const PROFILE_SAVE_ENDPOINTS = ["/api/Usuarios/me", "/api/Usuario/perfil"];

// Endpoints para subir avatar (POST)
const AVATAR_UPLOAD_ENDPOINTS = ["/api/Usuarios/me/avatar", "/api/Usuario/avatar"];

// ============================================================
// OBJETO USUARIO VACÍO (VALORES POR DEFECTO)
// ============================================================
const EMPTY_USER = {
  usuarioId: "",
  username: "",
  nombreCompleto: "",
  rol: "",
  sedeNombre: "",
  areaTrabajo: "",
  telefono: "",
  correo: "",
  avatarUrl: "",
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Elimina campos sensibles (contraseñas) de un objeto.
 * @param {Object} obj - Objeto original
 * @returns {Object} Copia sin campos de contraseña
 */
const stripSensitive = (obj) => {
  const cloneObj = { ...(obj || {}) };
  delete cloneObj.contrasenaActual;
  delete cloneObj.ContrasenaActual;
  delete cloneObj.nuevaContrasena;
  delete cloneObj.NuevaContrasena;
  delete cloneObj.confirmarContrasena;
  delete cloneObj.ConfirmarContrasena;
  return cloneObj;
};

/**
 * Obtiene el primer valor existente de una lista de claves.
 * @param {Object} obj - Objeto a inspeccionar
 * @param {string[]} keys - Lista de claves posibles
 * @returns {any|null} Valor encontrado o null
 */
const getFirst = (obj, keys) => {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
};

/**
 * Normaliza un objeto usuario (viene con distintas nomenclaturas).
 * @param {Object} raw - Objeto crudo desde API/localStorage
 * @param {Object} fallback - Valores por defecto (opcional)
 * @returns {Object} Usuario normalizado con claves consistentes
 */
const normalizeUser = (raw, fallback = EMPTY_USER) => {
  if (!raw || typeof raw !== "object") return { ...fallback };

  return {
    usuarioId: getFirst(raw, ["usuarioId", "UsuarioId", "id", "Id"]) ?? fallback.usuarioId,
    username: getFirst(raw, ["username", "Username", "usuario", "Usuario"]) ?? fallback.username,
    nombreCompleto: getFirst(raw, ["nombreCompleto", "NombreCompleto", "nombre", "Nombre"]) ?? fallback.nombreCompleto,
    rol: getFirst(raw, ["rol", "Rol"]) ?? fallback.rol,
    sedeNombre: getFirst(raw, ["sedeNombre", "SedeNombre", "sede", "Sede"]) ?? fallback.sedeNombre,
    areaTrabajo: getFirst(raw, ["areaTrabajo", "AreaTrabajo", "area", "Area", "departamento", "Departamento"]) ?? fallback.areaTrabajo,
    telefono: getFirst(raw, ["telefono", "Telefono", "celular", "Celular"]) ?? fallback.telefono,
    correo: getFirst(raw, ["correo", "Correo", "email", "Email"]) ?? fallback.correo,
    avatarUrl: getFirst(raw, ["avatarUrl", "AvatarUrl", "fotoPerfilUrl", "FotoPerfilUrl", "fotoUrl", "FotoUrl", "imagenUrl", "ImagenUrl"]) ?? fallback.avatarUrl,
  };
};

/**
 * Carga el usuario desde localStorage.
 * @returns {Object} Usuario normalizado
 */
const loadUser = () => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return EMPTY_USER;
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    return EMPTY_USER;
  }
};

/**
 * Convierte un archivo a DataURL (para previsualización o fallback).
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} DataURL
 */
const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Convierte el formulario interno a un payload apto para API (con múltiples variantes de clave).
 * @param {Object} form - Estado del formulario
 * @returns {Object} Payload con claves duplicadas para compatibilidad
 */
const toPayload = (form) => ({
  usuarioId: form.usuarioId || null,
  UsuarioId: form.usuarioId || null,
  username: form.username,
  Username: form.username,
  nombreCompleto: form.nombreCompleto,
  NombreCompleto: form.nombreCompleto,
  rol: form.rol,
  Rol: form.rol,
  sedeNombre: form.sedeNombre,
  SedeNombre: form.sedeNombre,
  areaTrabajo: form.areaTrabajo,
  AreaTrabajo: form.areaTrabajo,
  telefono: form.telefono,
  Telefono: form.telefono,
  correo: form.correo,
  Correo: form.correo,
  avatarUrl: form.avatarUrl,
  AvatarUrl: form.avatarUrl,
  contrasenaActual: form.contrasenaActual || "",
  ContrasenaActual: form.contrasenaActual || "",
  nuevaContrasena: form.nuevaContrasena || "",
  NuevaContrasena: form.nuevaContrasena || "",
  confirmarContrasena: form.confirmarContrasena || "",
  ConfirmarContrasena: form.confirmarContrasena || "",
});

/**
 * Resuelve la URL completa del avatar (absoluta si es relativa).
 * @param {string} url - URL parcial o completa
 * @returns {string} URL absoluta o vacío
 */
const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  if (trimmed.startsWith("/")) {
    return `${API}${trimmed}`;
  }

  return `${API}/${trimmed}`;
};

/**
 * Intenta ejecutar una petición a la API probando múltiples endpoints.
 * @param {string} method - Método HTTP (GET, PUT, POST)
 * @param {string[]} endpoints - Lista de endpoints a probar
 * @param {string} token - Token JWT
 * @param {Object} options - Opciones adicionales (body, isForm)
 * @returns {Promise<Object>} Resultado con ok, endpoint, data o error
 */
async function tryApi(method, endpoints, token, options = {}) {
  const { body, isForm = false } = options;
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (!isForm) headers["Content-Type"] = "application/json";

      const resp = await fetch(`${API}${endpoint}`, {
        method,
        headers,
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
      });

      if (resp.ok) {
        const text = await resp.text();
        let data = null;
        if (text?.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { raw: text };
          }
        }
        return { ok: true, endpoint, data };
      }

      if (resp.status === 404) continue; // Endpoint no encontrado, probar siguiente

      const errText = await resp.text();
      lastError = `${resp.status} ${resp.statusText}${errText ? ` - ${errText.slice(0, 180)}` : ""}`;
    } catch (error) {
      lastError = error.message;
    }
  }

  return { ok: false, error: lastError || "No se encontró endpoint de perfil." };
}

// ============================================================
// COMPONENTE PRINCIPAL: PerfilPage
// ============================================================
export default function PerfilPage() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  // Usuario actual desde el sistema de roles (para permisos)
  const [sessionUser, setSessionUser] = useState(() => getCurrentUser() || {});

  // Estado del formulario (datos del perfil)
  const [form, setForm] = useState(loadUser);

  // Mensajes para el usuario (éxito/error/info)
  const [msg, setMsg] = useState(null);

  // Indicadores de carga
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Archivo de avatar seleccionado (pendiente de subir)
  const [avatarFile, setAvatarFile] = useState(null);

  // Estado para el cambio de contraseña
  const [passwords, setPasswords] = useState({
    contrasenaActual: "",
    contrasenaNueva: "",
    contrasenaConfirmar: "",
  });

  // ============================================================
  // PERMISOS (basados en el sistema de roles original)
  // ============================================================
  // Permiso para editar el propio perfil (campos básicos)
  const canEditOwn = hasPermission(sessionUser, "profile.edit");
  // Permiso para asignar roles (cambiar el rol de un usuario)
  const canAssignRole = hasPermission(sessionUser, "users.role.assign");

  // ============================================================
  // DERIVADOS (MEMO)
  // ============================================================

  // Iniciales para el avatar por defecto (si no hay imagen)
  const initials = useMemo(() => {
    const text = (form.nombreCompleto || form.username || "U").trim();
    return text.slice(0, 2).toUpperCase();
  }, [form.nombreCompleto, form.username]);

  // Previsualización del avatar (archivo nuevo o URL existente)
  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return resolveAvatarUrl(form.avatarUrl);
  }, [avatarFile, form.avatarUrl]);

  // ============================================================
  // EFECTOS SECUNDARIOS
  // ============================================================

  // Sincronizar sessionUser cuando cambie en localStorage (eventos personalizados)
  useEffect(() => {
    const syncUser = () => setSessionUser(getCurrentUser() || {});
    window.addEventListener("storage", syncUser);
    window.addEventListener("usuario-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("usuario-updated", syncUser);
    };
  }, []);

  // Liberar objetos URL creados para previsualización de avatar
  useEffect(() => {
    if (!avatarPreview || !avatarPreview.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  // Cargar perfil desde el servidor al montar el componente (si hay token)
  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoading(true);
      const result = await tryApi("GET", PROFILE_GET_ENDPOINTS, token);
      if (!result.ok) {
        setLoading(false);
        return;
      }

      const normalized = normalizeUser(result.data, form);
      setForm((prev) => ({ ...prev, ...normalized }));

      // Actualizar localStorage con datos frescos
      const localMerged = { ...loadUser(), ...normalized };
      localStorage.setItem("usuario", JSON.stringify(localMerged));
      window.dispatchEvent(new Event("usuario-updated"));
      setLoading(false);
    })();
  }, [token]);

  // ============================================================
  // MANEJADORES DE EVENTOS
  // ============================================================

  /**
   * Actualiza un campo del formulario principal.
   * @param {string} key - Clave del campo
   * @param {any} value - Nuevo valor
   */
  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Actualiza un campo del formulario de contraseñas.
   * @param {string} key - Clave del campo
   * @param {string} value - Nuevo valor
   */
  const updatePasswordField = (key, value) => {
    setPasswords((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Sube el avatar si se seleccionó un archivo nuevo.
   * @returns {Promise<string>} URL del avatar (nueva o existente)
   */
  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile || !token) return form.avatarUrl || "";

    const fd = new FormData();
    fd.append("avatar", avatarFile);
    fd.append("Avatar", avatarFile);
    fd.append("foto", avatarFile);
    fd.append("Foto", avatarFile);

    const upload = await tryApi("POST", AVATAR_UPLOAD_ENDPOINTS, token, { body: fd, isForm: true });
    if (upload.ok) {
      const avatarFromApi = normalizeUser(upload.data, { avatarUrl: "" }).avatarUrl;
      if (avatarFromApi) return avatarFromApi;
    }

    // Fallback: convertir a DataURL si la API falla
    return toDataUrl(avatarFile);
  };

  /**
   * Guarda el perfil (envía a API y/o localStorage).
   */
  const saveProfile = async () => {
    // Verificar si el usuario tiene permiso para editar su perfil
    if (!canEditOwn) {
      setMsg({ type: "err", text: "Tu rol no tiene permiso para editar perfil." });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      // Preparar datos del formulario (limpiar espacios)
      const prepared = {
        ...form,
        nombreCompleto: (form.nombreCompleto || "").trim(),
        username: (form.username || "").trim(),
        // Si no puede asignar roles, se conserva el rol actual (desde localStorage o form)
        rol: canAssignRole ? (form.rol || "").trim() : (loadUser().rol || form.rol || "").trim(),
        sedeNombre: (form.sedeNombre || "").trim(),
        areaTrabajo: (form.areaTrabajo || "").trim(),
        telefono: (form.telefono || "").trim(),
        correo: (form.correo || "").trim(),
      };

      // Validar cambio de contraseña si se intenta
      const contrasenaActual = (passwords.contrasenaActual || "").trim();
      const nuevaContrasena = (passwords.contrasenaNueva || "").trim();
      const confirmarContrasena = (passwords.contrasenaConfirmar || "").trim();
      const wantsPasswordChange = Boolean(contrasenaActual || nuevaContrasena || confirmarContrasena);

      if (wantsPasswordChange) {
        if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
          setMsg({ type: "err", text: "Para cambiar contraseña completa los 3 campos: actual, nueva y confirmación." });
          setSaving(false);
          return;
        }

        if (nuevaContrasena.length < 6) {
          setMsg({ type: "err", text: "La nueva contraseña debe tener al menos 6 caracteres." });
          setSaving(false);
          return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
          setMsg({ type: "err", text: "La confirmación de contraseña no coincide." });
          setSaving(false);
          return;
        }
      }

      // Subir avatar si es necesario y obtener su URL
      const avatarUrl = await uploadAvatarIfNeeded();

      // Construir payload final
      const payload = {
        ...prepared,
        avatarUrl,
        contrasenaActual: wantsPasswordChange ? contrasenaActual : "",
        nuevaContrasena: wantsPasswordChange ? nuevaContrasena : "",
        confirmarContrasena: wantsPasswordChange ? confirmarContrasena : "",
      };

      let merged = stripSensitive(payload);

      // Intentar guardar en el servidor si hay token
      if (token) {
        const remote = await tryApi("PUT", PROFILE_SAVE_ENDPOINTS, token, { body: toPayload(payload) });
        if (remote.ok) {
          merged = stripSensitive({ ...payload, ...normalizeUser(remote.data, payload) });
          const tokenFromApi = remote.data?.token || remote.data?.Token;
          if (tokenFromApi) localStorage.setItem("token", tokenFromApi);
          setMsg({ type: "ok", text: "Perfil guardado en servidor y actualizado." });
        } else {
          setMsg({ type: "warn", text: `Guardado local (pendiente backend): ${remote.error}` });
        }
      } else {
        setMsg({ type: "warn", text: "Sin token: se guardó solo localmente." });
      }

      // Actualizar localStorage y estado local
      localStorage.setItem("usuario", JSON.stringify(merged));
      setForm(merged);
      setAvatarFile(null);
      setPasswords({ contrasenaActual: "", contrasenaNueva: "", contrasenaConfirmar: "" });
      window.dispatchEvent(new Event("usuario-updated"));
    } catch (error) {
      setMsg({ type: "err", text: error.message || "No se pudo guardar perfil." });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDERIZADO
  // ============================================================
  return (
    <div className="profile-shell">
      <div className="profile-page-title">Perfil de Usuario</div>

      <div className="profile-layout">
        {/* TARJETA DE RESUMEN (LATERAL) */}
        <aside className="profile-summary-card">
          <div className="profile-summary-avatar">
            {avatarPreview ? <img src={avatarPreview} alt="Foto de perfil" /> : initials}
          </div>

          <div className="profile-summary-name">{form.nombreCompleto || "Sin nombre"}</div>
          <div className="profile-summary-user">@{form.username || "usuario"}</div>

          <div className="profile-summary-list">
            <div className="profile-summary-row">
              <span>Rol</span>
              <strong>{form.rol || "Sin rol"}{form.areaTrabajo ? ` - ${form.areaTrabajo}` : ""}</strong>
            </div>
            <div className="profile-summary-row">
              <span>Sede</span>
              <strong>{form.sedeNombre || "Sin sede"}</strong>
            </div>
          </div>

          {/* Botón de cambio de avatar (deshabilitado si no tiene permiso de edición) */}
          <div className="profile-avatar-upload">
            <label className="profile-avatar-btn" htmlFor="avatar_file">Cambiar avatar</label>
            <input
              id="avatar_file"
              className="profile-avatar-input"
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              disabled={!canEditOwn}
            />
            <span className="profile-avatar-file">{avatarFile?.name || "Sin archivo seleccionado"}</span>
          </div>
        </aside>

        {/* TARJETA PRINCIPAL (FORMULARIO) */}
        <section className="profile-main-card">
          <div className="profile-main-header">
            <h2>
              <UserCog size={18} />
              Actualiza tus datos personales, acceso y datos de trabajo
            </h2>
          </div>

          <div className="profile-main-body">
            <div className="profile-grid">
              {/* Campos del formulario: deshabilitados si no tiene permiso de edición */}
              <label>
                Nombre completo
                <input
                  value={form.nombreCompleto}
                  onChange={(event) => updateField("nombreCompleto", event.target.value)}
                  disabled={!canEditOwn}
                />
              </label>

              <label>
                Correo
                <input
                  value={form.correo}
                  onChange={(event) => updateField("correo", event.target.value)}
                  placeholder="ejemplo@correo.com"
                  disabled={!canEditOwn}
                />
              </label>

              <label>
                Sede
                <input
                  value={form.sedeNombre}
                  onChange={(event) => updateField("sedeNombre", event.target.value)}
                  placeholder="Ej: Sede Central"
                  disabled={!canEditOwn}
                />
              </label>

              <label>
                Teléfono
                <input
                  value={form.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  placeholder="Ej: 5639300"
                  disabled={!canEditOwn}
                />
              </label>

              <label>
                Usuario
                <input
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  disabled={!canEditOwn}
                />
              </label>

              <label>
                Rol
                {/* Si tiene permiso para asignar roles, se muestra un select; si no, un input deshabilitado */}
                {canAssignRole ? (
                  <select value={form.rol || "EMPLEADO"} onChange={(event) => updateField("rol", event.target.value)}>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.rol} disabled />
                )}
              </label>
            </div>

            <div className="profile-divider" />

            {/* SECCIÓN DE CAMBIO DE CONTRASEÑA (siempre visible pero deshabilitada si no puede editar) */}
            <div className="profile-password-title">Cambiar contraseña</div>

            <div className="profile-password-grid">
              <label>
                Contraseña actual
                <input
                  type="password"
                  value={passwords.contrasenaActual}
                  onChange={(event) => updatePasswordField("contrasenaActual", event.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  disabled={!canEditOwn || saving}
                />
              </label>

              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={passwords.contrasenaNueva}
                  onChange={(event) => updatePasswordField("contrasenaNueva", event.target.value)}
                  placeholder="Nueva contraseña"
                  disabled={!canEditOwn || saving}
                />
              </label>

              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={passwords.contrasenaConfirmar}
                  onChange={(event) => updatePasswordField("contrasenaConfirmar", event.target.value)}
                  placeholder="Repite la nueva contraseña"
                  disabled={!canEditOwn || saving}
                />
              </label>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="profile-actions">
              <button type="button" className="profile-save" onClick={saveProfile} disabled={!canEditOwn || saving}>
                {saving ? "Guardando..." : "Guardar perfil"}
              </button>

              <button type="button" className="profile-back-btn" onClick={() => navigate("/dashboard")}>
                Volver a inicio
              </button>
            </div>

            {/* MENSAJES INFORMATIVOS */}
            {/* SOLO SE HA MODIFICADO ESTE MENSAJE: ahora dice "Solo el administrador puede editar el perfil." */}
            {!canAssignRole && <div className="profile-msg info">Solo el administrador puede editar el perfil.</div>}
            {loading && <div className="profile-msg info">Cargando perfil desde servidor...</div>}
            {msg && <div className={`profile-msg ${msg.type}`}>{msg.text}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}