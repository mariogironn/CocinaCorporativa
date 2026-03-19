import { useMemo, useState } from "react";
import { Building2, KeyRound, Mail, Phone, Save, Settings2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import "../styles/configuracion.css";

const STORAGE_KEY = "system_settings";

const DEFAULT_SETTINGS = {
  companyName: "COCINA",
  companyTagline: "Corporativa",
  supportEmail: "",
  supportPhone: "",
  primaryColor: "#0d47a1",
  currency: "GTQ",
  compactTables: false,
  sessionTimeout: "30",
  passwordRotationDays: "90",
  requireUppercase: true,
  lockAfterAttempts: true,
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export default function ConfiguracionPage() {
  const [form, setForm] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  const previewName = useMemo(() => form.companyName?.trim() || DEFAULT_SETTINGS.companyName, [form.companyName]);
  const previewTagline = useMemo(() => form.companyTagline?.trim() || DEFAULT_SETTINGS.companyTagline, [form.companyTagline]);

  const updateField = (key, value) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    window.dispatchEvent(new Event("system-settings-updated"));
    setSaved(true);
  };

  return (
    <div className="cfg-shell">
      <div className="cfg-header">
        <div>
          <h2 className="cfg-title">Configuracion</h2>
          <p className="cfg-subtitle">Ajusta la identidad basica del sistema y algunos parametros generales de uso.</p>
        </div>
        <button type="button" className="cfg-btn cfg-btn-primary" onClick={handleSave}>
          <Save size={16} />
          Guardar cambios
        </button>
      </div>

      {saved && <div className="cfg-alert">Configuracion guardada correctamente.</div>}

      <section className="cfg-grid">
        <article className="cfg-panel cfg-preview">
          <div className="cfg-preview-badge" style={{ background: form.primaryColor || DEFAULT_SETTINGS.primaryColor }}>
            <Settings2 size={22} />
          </div>
          <div className="cfg-preview-copy">
            <strong>{previewName}</strong>
            <span>{previewTagline}</span>
          </div>
          <div className="cfg-preview-meta">
            <div>
              <small>Moneda</small>
              <strong>{form.currency}</strong>
            </div>
            <div>
              <small>Tablas</small>
              <strong>{form.compactTables ? "Compactas" : "Normales"}</strong>
            </div>
          </div>
        </article>

        <article className="cfg-panel">
          <div className="cfg-section-head">
            <h3><Building2 size={18} /> Empresa</h3>
            <p>Esto afecta la marca visible del sistema en el panel lateral.</p>
          </div>
          <div className="cfg-form">
            <label>
              Nombre de la empresa
              <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} placeholder="Ej: Cocina Corporativa" />
            </label>
            <label>
              Descripcion corta
              <input value={form.companyTagline} onChange={(event) => updateField("companyTagline", event.target.value)} placeholder="Ej: Operacion central" />
            </label>
          </div>
        </article>

        <article className="cfg-panel">
          <div className="cfg-section-head">
            <h3><SlidersHorizontal size={18} /> Parametros</h3>
            <p>Valores generales para mantener una operacion consistente.</p>
          </div>
          <div className="cfg-form">
            <label>
              Moneda
              <select value={form.currency} onChange={(event) => updateField("currency", event.target.value)}>
                <option value="GTQ">GTQ - Quetzal</option>
                <option value="USD">USD - Dolar</option>
              </select>
            </label>
            <label>
              Color principal
              <div className="cfg-color-row">
                <input type="color" value={form.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
                <input value={form.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
              </div>
            </label>
            <label className="cfg-check">
              <input type="checkbox" checked={form.compactTables} onChange={(event) => updateField("compactTables", event.target.checked)} />
              Usar tablas compactas como preferencia visual
            </label>
          </div>
        </article>

        <article className="cfg-panel">
          <div className="cfg-section-head">
            <h3><Mail size={18} /> Soporte</h3>
            <p>Datos internos de contacto para administracion del sistema.</p>
          </div>
          <div className="cfg-form">
            <label>
              Correo de soporte
              <input type="email" value={form.supportEmail} onChange={(event) => updateField("supportEmail", event.target.value)} placeholder="soporte@empresa.com" />
            </label>
            <label>
              Telefono de soporte
              <div className="cfg-icon-input">
                <Phone size={16} />
                <input value={form.supportPhone} onChange={(event) => updateField("supportPhone", event.target.value)} placeholder="Ej: 5555-5555" />
              </div>
            </label>
          </div>
        </article>

        <article className="cfg-panel">
          <div className="cfg-section-head">
            <h3><ShieldCheck size={18} /> Seguridad</h3>
            <p>Parametros basicos para endurecer el acceso al sistema.</p>
          </div>
          <div className="cfg-form">
            <label>
              Tiempo de sesion
              <select value={form.sessionTimeout} onChange={(event) => updateField("sessionTimeout", event.target.value)}>
                <option value="1">1 minuto</option>
                <option value="5">5 minutos</option>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </label>
            <label>
              Rotacion de contrasena
              <div className="cfg-icon-input">
                <KeyRound size={16} />
                <select value={form.passwordRotationDays} onChange={(event) => updateField("passwordRotationDays", event.target.value)}>
                  <option value="30">Cada 30 dias</option>
                  <option value="60">Cada 60 dias</option>
                  <option value="90">Cada 90 dias</option>
                  <option value="180">Cada 180 dias</option>
                </select>
              </div>
            </label>
            <label className="cfg-check">
              <input type="checkbox" checked={form.requireUppercase} onChange={(event) => updateField("requireUppercase", event.target.checked)} />
              Exigir mayusculas en contrasenas nuevas
            </label>
            <label className="cfg-check">
              <input type="checkbox" checked={form.lockAfterAttempts} onChange={(event) => updateField("lockAfterAttempts", event.target.checked)} />
              Bloquear temporalmente tras varios intentos fallidos
            </label>
          </div>
        </article>
      </section>
    </div>
  );
}
