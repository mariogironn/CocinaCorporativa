import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  Eye,
  FileDown,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";
import "../../user/styles/usersAdmin.css";
import "../styles/auditoria.css";
import { getCurrentUser, hasPermission } from "../../../security/roles";

const API = "https://localhost:7042";
const PAGE_SIZE = 20;

const EMPTY_FILTERS = {
  q: "",
  modulo: "",
  accion: "",
  usuarioActorId: "",
  usuarioObjetivoId: "",
  fechaDesde: "",
  fechaHasta: "",
};

const GT_DATE_TIME = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

const GT_DATE = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const GT_TIME = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

const ZONED_DATE_REGEX = /[zZ]$|[+-]\d{2}:\d{2}$/;
const ISO_LOCAL_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateParts = (value) => {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(ISO_LOCAL_REGEX);
  if (!match) return null;

  const [, y, m, d, hh = "00", mm = "00", ss = "00"] = match;

  return {
    year: Number(y),
    month: Number(m),
    day: Number(d),
    hour: Number(hh),
    minute: Number(mm),
    second: Number(ss),
  };
};

const formatPartsDate = (parts) => {
  if (!parts) return "-";
  return `${parts.day}/${parts.month}/${parts.year}`;
};

const formatPartsTime = (parts) => {
  if (!parts) return "-";

  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const period = parts.hour >= 12 ? "p. m." : "a. m.";
  return `${hour12}:${pad2(parts.minute)}:${pad2(parts.second)} ${period}`;
};

const formatPartsDateTime = (parts) => {
  if (!parts) return "-";
  return `${formatPartsDate(parts)}, ${formatPartsTime(parts)}`;
};

const parseAuditDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return { type: "date", value };

  const text = String(value).trim();
  if (!text) return null;

  if (ZONED_DATE_REGEX.test(text)) {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return null;
    return { type: "date", value: date };
  }

  const parts = parseDateParts(text);
  if (parts) {
    return { type: "local-gt", value: parts };
  }

  const fallback = new Date(text);
  if (!Number.isNaN(fallback.getTime())) {
    return { type: "date", value: fallback };
  }

  return null;
};

const parseAuditPayload = (value) => {
  if (!value) return null;

  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

const formatDateTimeGT = (value) => {
  if (!value) return "-";

  const parsed = parseAuditDate(value);
  if (!parsed) return "-";

  if (parsed.type === "local-gt") {
    return formatPartsDateTime(parsed.value);
  }

  return GT_DATE_TIME.format(parsed.value);
};

const formatDateGT = (value) => {
  if (!value) return "-";

  const parsed = parseAuditDate(value);
  if (!parsed) return "-";

  if (parsed.type === "local-gt") {
    return formatPartsDate(parsed.value);
  }

  return GT_DATE.format(parsed.value);
};

const formatTimeGT = (value) => {
  if (!value) return "-";

  const parsed = parseAuditDate(value);
  if (!parsed) return "-";

  if (parsed.type === "local-gt") {
    return formatPartsTime(parsed.value);
  }

  return GT_TIME.format(parsed.value);
};

const humanizeKey = (key) => {
  const map = {
    UsuarioId: "Usuario ID",
    Username: "Usuario",
    NombreCompleto: "Nombre completo",
    RolId: "Rol ID",
    SedeId: "Sede ID",
    SedeNombre: "Sede",
    AreaTrabajo: "Area de trabajo",
    Telefono: "Telefono",
    Correo: "Correo",
    AvatarUrl: "Avatar",
    Estado: "Estado",
    FechaBaja: "Fecha baja",
    FechaActualiza: "Fecha actualizacion",
    FechaCrea: "Fecha creacion",
    FechaEvento: "Fecha evento",
  };

  return map[key] || key;
};

const VISIBLE_CHANGE_FIELDS = new Set([
  "Estado",
  "FechaBaja",
  "Rol",
  "RolActor",
  "SedeNombre",
  "AreaTrabajo",
  "Correo",
  "Telefono",
]);

const normalizeChangeValue = (value) => {
  if (value === null || value === undefined || value === "") return "Sin valor";
  if (typeof value === "boolean") return value ? "Si" : "No";
  return String(value);
};

const isDateLikeField = (field) => {
  const normalized = String(field || "").toLowerCase();
  return normalized.includes("fecha");
};

const getFriendlyValue = (field, value) => {
  if (field === "Estado") {
    if (String(value) === "1") return "Activo";
    if (String(value) === "0") return "Inactivo";
  }

  if (isDateLikeField(field)) {
    if (value === null || value === undefined || value === "" || value === "Sin valor") {
      return "Sin registro";
    }
    return formatDateTimeGT(value);
  }

  return normalizeChangeValue(value);
};

const buildChangeRows = (item) => {
  const before = parseAuditPayload(item.datosAntes);
  const after = parseAuditPayload(item.datosDespues);

  if (!before && !after) return [];

  const keys = Array.from(
    new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  );

  return keys
    .filter((key) => VISIBLE_CHANGE_FIELDS.has(key))
    .filter((key) => (before?.[key] ?? null) !== (after?.[key] ?? null))
    .map((key) => ({
      field: humanizeKey(key),
      before: normalizeChangeValue(before?.[key]),
      after: normalizeChangeValue(after?.[key]),
    }));
};

const getActionTone = (action) => {
  const value = String(action || "").toLowerCase();

  if (value.includes("crear")) return "success";
  if (value.includes("editar")) return "info";
  if (value.includes("eliminar")) return "danger";
  if (value.includes("reset")) return "warn";
  if (value.includes("cambiar_estado")) return "neutral";
  if (value.includes("avatar")) return "violet";
  return "neutral";
};

const getRoleTone = (role) => {
  const value = String(role || "").toUpperCase();
  if (value === "ADMIN") return "danger";
  if (value === "COCINA") return "success";
  if (value === "AUDITOR") return "violet";
  return "neutral";
};

const getModuleTone = (modulo) => {
  const value = String(modulo || "").toLowerCase();
  if (value === "usuarios") return "info";
  if (value === "historial") return "violet";
  if (value === "gestion_menu") return "warn";
  if (value === "monitor_cocina") return "success";
  if (value === "perfil") return "violet";
  return "neutral";
};

const buildFriendlySummary = (item) => {
  const changes = buildChangeRows(item);
  if (!changes.length) return [];

  return changes.slice(0, 10).map((change) => ({
    label: change.field,
    before: getFriendlyValue(change.field, change.before),
    after: getFriendlyValue(change.field, change.after),
  }));
};

const getDeviceSummary = (item) => {
  const after = parseAuditPayload(item.datosDespues);
  if (!after || typeof after !== "object") return "";

  const explicitSummary =
    after.Equipo ||
    after.equipo ||
    after.Device ||
    after.device ||
    "";

  if (explicitSummary) return String(explicitSummary);

  const sistemaOperativo =
    after.SistemaOperativo ||
    after.sistemaOperativo ||
    after.OS ||
    after.os ||
    "";

  const navegador =
    after.Navegador ||
    after.navegador ||
    after.Browser ||
    after.browser ||
    "";

  const dispositivo =
    after.Dispositivo ||
    after.dispositivo ||
    after.DeviceType ||
    after.deviceType ||
    "";

  return [sistemaOperativo, navegador, dispositivo].filter(Boolean).join(" · ");
};

const getDeviceDisplay = (item) => getDeviceSummary(item) || "No registrado";

function DetailModal({ item, onClose }) {
  if (!item) return null;

  const summaryRows = buildFriendlySummary(item);
  const deviceSummary = getDeviceDisplay(item);

  const exportDetailPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const lines = [
      ["Fecha y hora", formatDateTimeGT(item.fechaEvento)],
      ["Usuario actor", `${item.usuarioActor || "Sin dato"}${item.rolActor ? ` · ${item.rolActor}` : ""}`],
      ["Usuario objetivo", item.usuarioObjetivo || "Sin dato"],
      ["Modulo", item.modulo || "Sin dato"],
      ["Accion", item.accion || "Sin dato"],
    ];

    lines.push(["Equipo", deviceSummary]);

    doc.setFontSize(16);
    doc.text("Detalle de auditoria", 14, 16);
    doc.setFontSize(10);

    let y = 28;
    lines.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 54, y);
      y += 8;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Resumen del evento:", 14, y + 4);
    doc.setFont("helvetica", "normal");
    const summaryText = doc.splitTextToSize(item.descripcion || "Sin descripcion", 180);
    doc.text(summaryText, 14, y + 11);
    y += 11 + summaryText.length * 6;

    if (summaryRows.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Cambios realizados:", 14, y + 4);
      y += 11;
      summaryRows.forEach((row) => {
        const text = `${row.label}: Antes ${row.before} | Despues ${row.after}`;
        const wrapped = doc.splitTextToSize(text, 176);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${wrapped[0]}`, 14, y);
        if (wrapped.length > 1) {
          doc.text(wrapped.slice(1), 19, y + 6);
        }
        y += wrapped.length * 6 + 4;
      });
    }

    doc.save(`auditoria-${item.auditoriaSistemaId}.pdf`);
  };

  return (
    <div className="ua-modal-overlay" onMouseDown={onClose}>
      <div className="ua-modal au-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="ua-modal-head">
          <h3>Detalle de auditoria</h3>
          <div className="au-detail-actions">
            <button className="ua-btn" type="button" onClick={exportDetailPdf}>
              <FileDown size={16} />
              Exportar detalle
            </button>
            <button className="ua-close" onClick={onClose} type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="au-detail-grid">
          <article className="au-detail-card">
            <span className="au-detail-label">Fecha y hora</span>
            <div className="au-detail-inline">
              <Clock3 size={16} />
              <strong>{formatDateTimeGT(item.fechaEvento)}</strong>
            </div>
          </article>

          <article className="au-detail-card">
            <span className="au-detail-label">Usuario actor</span>
            <strong>{item.usuarioActor || "Sin dato"}</strong>
            <small className={`au-detail-role tone-${getRoleTone(item.rolActor)}`}>
              {item.rolActor || "Sin rol"}
            </small>
          </article>

          <article className="au-detail-card">
            <span className="au-detail-label">Usuario objetivo</span>
            <strong>{item.usuarioObjetivo || "Sin dato"}</strong>
          </article>

          <article className="au-detail-card">
            <span className="au-detail-label">Modulo / accion</span>
            <div className="au-inline-badges">
              <span className={`au-badge ${getModuleTone(item.modulo)}`}>{item.modulo}</span>
              <span className={`au-badge ${getActionTone(item.accion)}`}>{item.accion}</span>
            </div>
          </article>

          <article className="au-detail-card au-detail-card-wide">
            <span className="au-detail-label">Equipo</span>
            <strong>{deviceSummary}</strong>
          </article>
        </div>

        <div className="au-detail-stack">
          <section className="au-detail-panel">
            <span className="au-detail-label">Resumen del evento</span>
            <p>{item.descripcion || "Sin descripcion"}</p>
          </section>

          {!!summaryRows.length && (
            <section className="au-detail-panel">
              <span className="au-detail-label">Cambios realizados</span>
              <div className="au-friendly-list">
                {summaryRows.map((row) => (
                  <article className="au-friendly-item" key={`${item.auditoriaSistemaId}-${row.label}`}>
                    <span className="au-friendly-dot" />
                    <div>
                      <strong>{row.label}</strong>
                      <div className="au-change-pills">
                        <span
                          className={`au-change-pill before ${
                            row.label === "Estado" && row.before === "Activo" ? "active" : ""
                          }`}
                        >
                          Antes: {row.before}
                        </span>
                        <span
                          className={`au-change-pill after ${
                            row.label === "Estado" && row.after === "Inactivo" ? "inactive" : ""
                          }`}
                        >
                          Despues: {row.after}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditoriaPage() {
  const location = useLocation();
  const currentUser = useMemo(() => getCurrentUser() || {}, []);
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const canView =
    hasPermission(currentUser, "historial.view") || hasPermission(currentUser, "*");

  const [catalogs, setCatalogs] = useState({
    modulos: [],
    acciones: [],
    usuarios: [],
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState({
    data: [],
    total: 0,
    totalPages: 1,
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const authHeaders = useMemo(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const fetchJson = async (url) => {
    const response = await fetch(url, { headers: authHeaders });
    const text = await response.text();

    let data = null;
    if (text?.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const message =
        data?.message || data?.error || data?.raw || `${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return data;
  };

  const loadCatalogs = async () => {
    const data = await fetchJson(`${API}/api/Auditoria/catalogos`);
    setCatalogs({
      modulos: Array.isArray(data?.modulos) ? data.modulos : [],
      acciones: Array.isArray(data?.acciones) ? data.acciones : [],
      usuarios: Array.isArray(data?.usuarios) ? data.usuarios : [],
    });
  };

  const loadAuditoria = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.modulo) params.set("modulo", filters.modulo);
      if (filters.accion) params.set("accion", filters.accion);
      if (filters.usuarioActorId) params.set("usuarioActorId", filters.usuarioActorId);
      if (filters.usuarioObjetivoId) params.set("usuarioObjetivoId", filters.usuarioObjetivoId);
      if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde);
      if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const data = await fetchJson(`${API}/api/Auditoria?${params.toString()}`);
      setResult({
        data: Array.isArray(data?.data) ? data.data : [],
        total: Number(data?.total || 0),
        totalPages: Math.max(1, Number(data?.totalPages || 1)),
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la auditoria.");
      setResult({ data: [], total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView || !token) {
      setLoading(false);
      return;
    }

    loadCatalogs().catch((err) => {
      setError(err.message || "No se pudieron cargar los catalogos.");
      setLoading(false);
    });
  }, [canView, token]);

  useEffect(() => {
    if (!canView || !token) return;
    loadAuditoria();
  }, [canView, token, page, filters]);

  useEffect(() => {
    const stateFilters = location.state?.initialFilters;
    const stateResetToken = location.state?.resetToken;

    if (!stateFilters || !stateResetToken) return;

    setFilters((prev) => ({
      ...prev,
      ...EMPTY_FILTERS,
      ...stateFilters,
    }));
    setPage(1);
  }, [location.state]);

  const summary = useMemo(() => {
    const byModulo = {};
    const byAccion = {};

    for (const row of result.data) {
      byModulo[row.modulo] = (byModulo[row.modulo] || 0) + 1;
      byAccion[row.accion] = (byAccion[row.accion] || 0) + 1;
    }

    const topModulo =
      Object.entries(byModulo).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";
    const topAccion =
      Object.entries(byAccion).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";

    return {
      total: result.total,
      visible: result.data.length,
      topModulo,
      topAccion,
    };
  }, [result]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const exportarPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Actividad del Sistema", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${formatDateTimeGT(new Date().toISOString())}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Fecha", "Hora", "Actor", "Objetivo", "Equipo", "Modulo", "Accion", "Descripcion"]],
      body: result.data.map((row) => [
        formatDateGT(row.fechaEvento),
        formatTimeGT(row.fechaEvento),
        row.usuarioActor || "-",
        row.usuarioObjetivo || "-",
        getDeviceDisplay(row),
        row.modulo || "-",
        row.accion || "-",
        row.descripcion || "-",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [13, 71, 161],
      },
      columnStyles: {
        4: { cellWidth: 42 },
        7: { cellWidth: 72 },
      },
    });

    doc.save("actividad-sistema.pdf");
  };

  if (!canView) {
    return (
      <div className="au-page">
        <div className="ua-no-access">No tienes permiso para ver el modulo de auditoria.</div>
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="au-shell">
        <div className="au-header">
          <div>
            <h2 className="ua-title">Actividad del Sistema</h2>
            <p className="au-subcopy">
              Consulta quien hizo cambios, sobre que modulo y en que momento.
            </p>
          </div>

          <div className="au-header-actions">
            <button className="ua-btn" type="button" onClick={exportarPdf}>
              <FileDown size={16} />
              Exportar PDF
            </button>
            <button className="ua-btn" type="button" onClick={loadAuditoria}>
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>
        </div>

        <section className="au-summary-grid">
          <article className="au-summary-card">
            <span className="au-summary-icon blue">
              <Activity size={18} />
            </span>
            <div>
              <strong>{summary.total}</strong>
              <span>Registros encontrados</span>
            </div>
          </article>

          <article className="au-summary-card">
            <span className="au-summary-icon gold">
              <Filter size={18} />
            </span>
            <div>
              <strong>{summary.visible}</strong>
              <span>Visibles en pagina</span>
            </div>
          </article>

          <article className="au-summary-card">
            <span className="au-summary-icon teal">
              <ShieldAlert size={18} />
            </span>
            <div>
              <strong>{summary.topModulo}</strong>
              <span>Modulo mas activo</span>
            </div>
          </article>

          <article className="au-summary-card">
            <span className="au-summary-icon slate">
              <UserRound size={18} />
            </span>
            <div>
              <strong>{summary.topAccion}</strong>
              <span>Accion mas frecuente</span>
            </div>
          </article>
        </section>

        <section className="ua-card">
          <div className="ua-card-head">
            <h3>
              <Activity size={18} /> TRAZA DE EVENTOS
            </h3>
          </div>

          <div className="au-filters">
            <label className="ua-search au-filter-search">
              <Search size={16} />
              <input
                value={filters.q}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, q: event.target.value }));
                  setPage(1);
                }}
                placeholder="Buscar por descripcion, modulo, accion o usuario..."
              />
            </label>

            <select
              className="ua-filter"
              value={filters.modulo}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, modulo: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">Todos los modulos</option>
              {catalogs.modulos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="ua-filter"
              value={filters.accion}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, accion: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">Todas las acciones</option>
              {catalogs.acciones.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="ua-filter"
              value={filters.usuarioActorId}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, usuarioActorId: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">Todos los usuarios</option>
              {catalogs.usuarios.map((item) => (
                <option key={item.usuarioId} value={item.usuarioId}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <select
              className="ua-filter"
              value={filters.usuarioObjetivoId}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, usuarioObjetivoId: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">Todos los objetivos</option>
              {catalogs.usuarios.map((item) => (
                <option key={`target-${item.usuarioId}`} value={item.usuarioId}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <label className="au-date-field">
              <CalendarDays size={16} />
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }));
                  setPage(1);
                }}
              />
            </label>

            <label className="au-date-field">
              <CalendarDays size={16} />
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }));
                  setPage(1);
                }}
              />
            </label>

            <button className="ua-btn" type="button" onClick={resetFilters}>
              Limpiar filtros
            </button>
          </div>

          {error && <div className="inicio-state error">{error}</div>}

          {loading ? (
            <div className="ua-empty">Cargando registros de auditoria...</div>
          ) : (
            <>
              <div className="ua-table-wrap">
                <table className="ua-table au-table">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Usuario actor</th>
                      <th>Usuario objetivo</th>
                      <th>Rol</th>
                      <th>Equipo</th>
                      <th>Modulo</th>
                      <th>Accion</th>
                      <th>Descripcion</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!result.data.length && (
                      <tr>
                        <td colSpan={9} className="ua-empty">
                          No hay eventos de auditoria para los filtros seleccionados.
                        </td>
                      </tr>
                    )}

                    {result.data.map((row) => (
                      <tr key={row.auditoriaSistemaId}>
                        <td className="au-time-cell">
                          <strong>{formatDateGT(row.fechaEvento)}</strong>
                          <span>{formatTimeGT(row.fechaEvento)}</span>
                        </td>
                        <td>{row.usuarioActor || "-"}</td>
                        <td>{row.usuarioObjetivo || "-"}</td>
                        <td>
                          <span className={`au-role-placeholder tone-${getRoleTone(row.rolActor)}`}>
                            {row.rolActor || "-"}
                          </span>
                        </td>
                        <td className="au-device-cell">{getDeviceDisplay(row)}</td>
                        <td>
                          <span className={`au-badge ${getModuleTone(row.modulo)}`}>{row.modulo}</span>
                        </td>
                        <td>
                          <span className={`au-badge ${getActionTone(row.accion)}`}>{row.accion}</span>
                        </td>
                        <td className="au-description">{row.descripcion}</td>
                        <td>
                          <button
                            className="ua-icon-btn"
                            type="button"
                            title="Ver detalle"
                            onClick={() => setSelectedItem(row)}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ua-pagination">
                <span>
                  {result.total
                    ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, result.total)}`
                    : "0-0"}{" "}
                  de {result.total}
                </span>

                <div className="ua-pagination-actions">
                  <button
                    className="ua-icon-btn"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    className="ua-icon-btn"
                    type="button"
                    disabled={page >= result.totalPages}
                    onClick={() => setPage((value) => Math.min(result.totalPages, value + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
