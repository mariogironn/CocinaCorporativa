import { useEffect, useMemo, useState } from "react";
import { Camera, Save, Trash2, Utensils, Leaf, Clock3 } from "lucide-react";
import "./menuGestion.css";
import { getCurrentUser, hasPermission } from "../../../security/roles";

const API = "https://localhost:7042";
const CORTE_STORAGE_KEY_DESAYUNO = "menu_hora_corte_desayuno";
const CORTE_STORAGE_KEY_ALMUERZO = "menu_hora_corte_almuerzo";

const getFirst = (obj, keys) => {
  if (!obj) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
};

const normalizeDetalle = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const detalle = {
    MenuDiarioDetalleId: getFirst(raw, ["MenuDiarioDetalleId", "menuDiarioDetalleId", "DetalleId", "detalleId", "Id", "id"]),
    Nombre: getFirst(raw, ["Nombre", "nombre"]),
    Descripcion: getFirst(raw, ["Descripcion", "descripcion"]),
    Guarniciones: getFirst(raw, ["Guarniciones", "guarniciones"]),
    FotoUrl: getFirst(raw, ["FotoUrl", "fotoUrl", "UrlFoto", "urlFoto"]),
  };

  const hasData = Object.values(detalle).some((v) => v !== null && v !== "");
  return hasData ? detalle : null;
};

const normalizeMenu = (raw) => {
  if (!raw || typeof raw !== "object") return { Normal: null, Dieta: null };

  return {
    Normal: normalizeDetalle(
      getFirst(raw, ["Normal", "normal", "MenuNormal", "menuNormal", "PlatilloNormal", "platilloNormal"])
    ),
    Dieta: normalizeDetalle(
      getFirst(raw, ["Dieta", "dieta", "MenuDieta", "menuDieta", "PlatilloDieta", "platilloDieta"])
    ),
  };
};

const toAbsolutePhotoUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API}${url}`;
};

export default function MenuGestionPage() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser() || {});

  const sedeId = 1;
  const tiempoComidaId = 2;
  const usuarioId = 1;

  const [menuHoy, setMenuHoy] = useState({ Normal: null, Dieta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [normal, setNormal] = useState({ nombre: "", descripcion: "", guarniciones: "", foto: null });
  const [dieta, setDieta] = useState({ nombre: "", descripcion: "", guarniciones: "", foto: null });

  const [horaCorte, setHoraCorte] = useState(() => ({
    desayuno: localStorage.getItem(CORTE_STORAGE_KEY_DESAYUNO) || "10:15",
    almuerzo: localStorage.getItem(CORTE_STORAGE_KEY_ALMUERZO) || "15:00",
  }));

  const [msg, setMsg] = useState(null);
  const [savingNormal, setSavingNormal] = useState(false);
  const [savingDieta, setSavingDieta] = useState(false);

  const canViewMenu = hasPermission(currentUser, "menu.view");
  const canEditMenu = hasPermission(currentUser, "menu.edit");
  const canDeletePhoto = hasPermission(currentUser, "menu.delete_photo");
  const canEditCutoff = hasPermission(currentUser, "menu.cutoff.edit");

  const requireTokenOrRedirect = () => {
    if (!token) {
      window.location.href = "/";
      return false;
    }
    return true;
  };

  const safeText = async (resp) => {
    try {
      return await resp.text();
    } catch {
      return "";
    }
  };

  const fetchJSONorNull = async (resp) => {
    if (resp.status === 204) return null;
    const text = await safeText(resp);
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text);
  };

  const validarImagen = (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) return "La imagen no puede superar 5MB.";
    return null;
  };

  const cargarMenu = async (options = {}) => {
    const { silent = false } = options;
    setError(null);
    if (!silent) setLoading(true);

    const url = `${API}/api/MenuDiario/hoy?tiempoComidaId=${tiempoComidaId}&sedeId=${sedeId}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok && resp.status !== 204) {
      const body = await safeText(resp);
      throw new Error(`MenuHoy: ${resp.status}. ${body?.slice(0, 180) || "(vacia)"}`);
    }

    const raw = await fetchJSONorNull(resp);
    const normalized = normalizeMenu(raw);
    setMenuHoy(normalized);

    if (normalized.Normal) {
      setNormal({
        nombre: normalized.Normal.Nombre || "",
        descripcion: normalized.Normal.Descripcion || "",
        guarniciones: normalized.Normal.Guarniciones || "",
        foto: null,
      });
    }

    if (normalized.Dieta) {
      setDieta({
        nombre: normalized.Dieta.Nombre || "",
        descripcion: normalized.Dieta.Descripcion || "",
        guarniciones: normalized.Dieta.Guarniciones || "",
        foto: null,
      });
    }

    if (!silent) setLoading(false);
  };

  useEffect(() => {
    const syncUser = () => setCurrentUser(getCurrentUser() || {});
    window.addEventListener("storage", syncUser);
    window.addEventListener("usuario-updated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("usuario-updated", syncUser);
    };
  }, []);

  useEffect(() => {
    if (!requireTokenOrRedirect()) return;

    (async () => {
      try {
        await cargarMenu();
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    })();
  }, []);

  const guardarHoraCorte = () => {
    if (!canEditCutoff) {
      setMsg({ type: "err", text: "Tu rol no tiene permiso para editar horas de corte." });
      return;
    }

    localStorage.setItem(CORTE_STORAGE_KEY_DESAYUNO, horaCorte.desayuno);
    localStorage.setItem(CORTE_STORAGE_KEY_ALMUERZO, horaCorte.almuerzo);
    window.dispatchEvent(new Event("menu-corte-updated"));
    setMsg({
      type: "ok",
      text: `Horas guardadas. Desayuno: ${horaCorte.desayuno} | Almuerzo: ${horaCorte.almuerzo}`,
    });
  };

  const upsertMenu = async (tipo, payload, setSaving) => {
    try {
      setMsg(null);

      if (!canEditMenu) {
        setMsg({ type: "err", text: "Tu rol no tiene permiso para guardar menú." });
        return;
      }

      if (!payload.nombre || payload.nombre.trim().length === 0) {
        setMsg({ type: "err", text: `El nombre del platillo (${tipo}) es obligatorio.` });
        return;
      }

      const errFoto = validarImagen(payload.foto);
      if (errFoto) {
        setMsg({ type: "err", text: errFoto });
        return;
      }

      setSaving(true);

      const form = new FormData();
      form.append("SedeId", String(sedeId));
      form.append("TiempoComidaId", String(tiempoComidaId));
      form.append("Nombre", payload.nombre.trim());
      form.append("Descripcion", payload.descripcion?.trim() || "");
      form.append("Guarniciones", payload.guarniciones?.trim() || "");
      form.append("UsuarioId", String(usuarioId));
      if (payload.foto) form.append("Foto", payload.foto);

      const endpoint =
        tipo === "normal"
          ? `${API}/api/MenuDiario/hoy/normal`
          : `${API}/api/MenuDiario/hoy/dieta`;

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!resp.ok) {
        const body = await safeText(resp);
        throw new Error(`Guardar ${tipo}: ${resp.status}. ${body?.slice(0, 220) || ""}`);
      }

      setMsg({ type: "ok", text: `${tipo.toUpperCase()}: guardado correctamente.` });
      await cargarMenu({ silent: true });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const eliminarFoto = async (detalleId) => {
    try {
      setMsg(null);

      if (!canDeletePhoto) {
        setMsg({ type: "err", text: "Tu rol no tiene permiso para eliminar foto." });
        return;
      }

      if (!detalleId) {
        setMsg({ type: "err", text: "No hay detalleId para eliminar foto." });
        return;
      }

      const resp = await fetch(`${API}/api/MenuDiario/detalle/${detalleId}/eliminar-foto`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok && resp.status !== 204) {
        const body = await safeText(resp);
        throw new Error(`Eliminar foto: ${resp.status}. ${body?.slice(0, 180) || ""}`);
      }

      setMsg({ type: "ok", text: "Foto eliminada." });
      await cargarMenu({ silent: true });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    }
  };

  const normalDetalleId = menuHoy?.Normal?.MenuDiarioDetalleId || null;
  const dietaDetalleId = menuHoy?.Dieta?.MenuDiarioDetalleId || null;

  const normalFoto = toAbsolutePhotoUrl(menuHoy?.Normal?.FotoUrl);
  const dietaFoto = toAbsolutePhotoUrl(menuHoy?.Dieta?.FotoUrl);

  return (
    <div className="mg-shell">
      {!canViewMenu && <div className="mg-alert mg-alert-err">Tu rol no tiene acceso a Gestión de Menú.</div>}

      <div className="mg-head">
        <div>
          <h2 className="mg-title">Gestión de Menú</h2>
        </div>
      </div>

      {error && <div className="mg-alert mg-alert-err">Error: {error}</div>}
      {msg && <div className={`mg-alert ${msg.type === "ok" ? "mg-alert-ok" : "mg-alert-err"}`}>{msg.text}</div>}

      <section className="mg-card">
        <div className="mg-card-bar">
          <div className="mg-card-title">
            <Clock3 size={16} />
            <span>CONFIGURACIÓN GENERAL</span>
          </div>
        </div>

        <div className="mg-general-grid">
          <div className="mg-time-field">
            <label>Hora de corte Desayuno</label>
            <input
              type="time"
              value={horaCorte.desayuno}
              onChange={(e) => setHoraCorte((prev) => ({ ...prev, desayuno: e.target.value }))}
              disabled={!canEditCutoff}
            />
          </div>

          <div className="mg-time-field">
            <label>Hora de corte Almuerzo</label>
            <input
              type="time"
              value={horaCorte.almuerzo}
              onChange={(e) => setHoraCorte((prev) => ({ ...prev, almuerzo: e.target.value }))}
              disabled={!canEditCutoff}
            />
          </div>
        </div>

        <div className="mg-general-actions">
          <button
            type="button"
            className="mg-btn mg-btn-primary mg-btn-inline"
            onClick={guardarHoraCorte}
            disabled={!canEditCutoff}
          >
            <Save size={16} />
            Guardar horas de corte
          </button>
          <span className="mg-general-help">El personal puede modificar estas horas cuando la operación lo requiera.</span>
        </div>
      </section>

      <div className="mg-cols">
        <MenuFormCard
          headerClass="normal"
          title="PLATILLO NORMAL"
          icon={<Utensils size={16} />}
          fotoActual={normalFoto}
          detalleId={normalDetalleId}
          state={normal}
          setState={setNormal}
          loading={loading}
          canEditMenu={canEditMenu}
          canDeletePhoto={canDeletePhoto}
          onDeletePhoto={() => eliminarFoto(normalDetalleId)}
          onSave={() => upsertMenu("normal", normal, setSavingNormal)}
          saving={savingNormal}
          descripcionPlaceholder="Describe el platillo, preparación o acompañamiento principal..."
          guarnicionesPlaceholder="Ej: Arroz blanco, papa salteada, ensalada fresca"
        />

        <MenuFormCard
          headerClass="diet"
          title="PLATILLO DE DIETA"
          icon={<Leaf size={16} />}
          fotoActual={dietaFoto}
          detalleId={dietaDetalleId}
          state={dieta}
          setState={setDieta}
          loading={loading}
          canEditMenu={canEditMenu}
          canDeletePhoto={canDeletePhoto}
          onDeletePhoto={() => eliminarFoto(dietaDetalleId)}
          onSave={() => upsertMenu("dieta", dieta, setSavingDieta)}
          saving={savingDieta}
          descripcionPlaceholder="Describe el platillo dietético..."
          guarnicionesPlaceholder="Ej: Vegetales al vapor, puré de coliflor, ensalada verde"
        />
      </div>
    </div>
  );
}

function MenuFormCard({
  headerClass,
  title,
  icon,
  fotoActual,
  detalleId,
  state,
  setState,
  loading,
  canEditMenu,
  canDeletePhoto,
  onDeletePhoto,
  onSave,
  saving,
  descripcionPlaceholder,
  guarnicionesPlaceholder,
}) {
  return (
    <section className="mg-card mg-form-card">
      <div className={`mg-section-header ${headerClass}`}>
        <div className="mg-section-title">
          {icon}
          <span>{title}</span>
        </div>
      </div>

      <div className="mg-field">
        <label>Subir foto (max 5MB)</label>
        <div className="mg-file-input-wrap">
          <label className="mg-file-fake">
            <Camera size={15} />
            <span>{state.foto?.name || "Elegir archivo"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setState({ ...state, foto: e.target.files?.[0] || null })}
              disabled={!canEditMenu}
            />
          </label>
        </div>
        <small>{detalleId ? `DetalleId: ${detalleId}` : "Aún no existe. Guarda para crearlo."}</small>
      </div>

      <button
        type="button"
        className="mg-btn mg-btn-danger mg-btn-inline mg-delete-photo"
        onClick={onDeletePhoto}
        disabled={!canDeletePhoto || !detalleId || !fotoActual}
      >
        <Trash2 size={15} />
        Eliminar foto
      </button>

      <div className="mg-photo-preview">
        {fotoActual ? <img src={fotoActual} alt={title} /> : <div className="mg-photo-empty">Aún no existe. Guarda para crearlo.</div>}
      </div>

      <div className="mg-field">
        <label>Nombre del plato</label>
        <input
          value={state.nombre}
          onChange={(e) => setState({ ...state, nombre: e.target.value })}
          placeholder="Ej: Carne asada con guacamole"
          disabled={!canEditMenu}
        />
      </div>

      <div className="mg-field">
        <label>Descripción y guarniciones</label>
        <textarea
          value={state.descripcion}
          onChange={(e) => setState({ ...state, descripcion: e.target.value })}
          placeholder={descripcionPlaceholder}
          disabled={!canEditMenu}
        />
      </div>

      <div className="mg-field">
        <label>Guarniciones</label>
        <textarea
          value={state.guarniciones}
          onChange={(e) => setState({ ...state, guarniciones: e.target.value })}
          placeholder={guarnicionesPlaceholder}
          disabled={!canEditMenu}
        />
      </div>

      <button
        type="button"
        className="mg-btn mg-btn-primary"
        onClick={onSave}
        disabled={!canEditMenu || saving || loading}
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </section>
  );
}