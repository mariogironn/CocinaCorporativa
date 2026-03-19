import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ShoppingCart,
  CheckCircle2,
  SunMedium,
  CloudSun,
  Utensils,
  Leaf,
  ArrowRightCircle,
  Printer,
  SquarePen,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/inicio.css";

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

const timeToMinutes = (value) => {
  if (!value || !value.includes(":")) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export default function InicioPage() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const sedeId = 1;
  const tiempoComidaId = 2;

  const [kpisData, setKpisData] = useState(null);
  const [menuHoy, setMenuHoy] = useState({ Normal: null, Dieta: null });

  const [loadingKPIs, setLoadingKPIs] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [errorKPIs, setErrorKPIs] = useState(null);
  const [errorMenu, setErrorMenu] = useState(null);

  const [horaCorte, setHoraCorte] = useState(() => ({
    desayuno: localStorage.getItem(CORTE_STORAGE_KEY_DESAYUNO) || "10:15",
    almuerzo: localStorage.getItem(CORTE_STORAGE_KEY_ALMUERZO) || "15:00",
  }));

  const [ahora, setAhora] = useState(() => new Date());

  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const imprimirMenu = () => {
    const normalFoto = toAbsolutePhotoUrl(normal?.FotoUrl);
    const dietaFoto = toAbsolutePhotoUrl(dieta?.FotoUrl);

    const renderMenu = (titulo, data, foto) => {
      if (!data) {
        return `
          <article class="print-menu-card">
            <h3>${titulo}</h3>
            <p class="print-empty">No hay menu cargado aun.</p>
          </article>
        `;
      }

      return `
        <article class="print-menu-card">
          <h3>${titulo}</h3>
          <div class="print-menu-body">
            ${foto ? `<img src="${foto}" alt="${titulo}" class="print-menu-photo" />` : ""}
            <div class="print-menu-copy">
              <h4>${data.Nombre || "Sin nombre"}</h4>
              <div class="print-copy-block">
                <span class="print-copy-label">Descripcion</span>
                <p>${data.Descripcion || "Sin descripcion"}</p>
              </div>
              <div class="print-copy-block">
                <span class="print-copy-label">Guarniciones</span>
                <p>${data.Guarniciones || "-"}</p>
              </div>
            </div>
          </div>
        </article>
      `;
    };

    const printWindow = window.open("", "_blank", "width=980,height=720");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Menu del dia</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; color: #1f2d3d; }
            h1 { margin: 0 0 6px; font-size: 26px; }
            .print-meta { margin-bottom: 18px; color: #5f6b76; font-size: 14px; }
            .print-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
            .print-menu-card { border: 1px solid #d9dee5; border-radius: 10px; padding: 14px; break-inside: avoid; }
            .print-menu-card h3 { margin: 0 0 12px; font-size: 17px; }
            .print-menu-body { display: grid; grid-template-columns: 88px 1fr; gap: 14px; align-items: start; }
            .print-menu-photo { width: 88px; height: 88px; object-fit: cover; border-radius: 10px; border: 1px solid #d9dee5; }
            .print-menu-copy h4 { margin: 0 0 10px; font-size: 18px; line-height: 1.25; }
            .print-copy-block { margin-bottom: 10px; padding: 9px 10px; background: #f8fafc; border-radius: 8px; }
            .print-copy-label { display: block; margin-bottom: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0d47a1; letter-spacing: .04em; }
            .print-copy-block p { margin: 0; line-height: 1.4; font-size: 13px; }
            .print-empty { margin: 0; color: #6c757d; }
          </style>
        </head>
        <body>
          <h1>Menu del dia</h1>
          <div class="print-meta">Desayuno: ${horaCorte.desayuno} | Almuerzo: ${horaCorte.almuerzo}</div>
          <section class="print-grid">
            ${renderMenu("Menu normal", normal, normalFoto)}
            ${renderMenu("Menu dieta", dieta, dietaFoto)}
          </section>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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

  const cargarKPIs = async () => {
    const resp = await fetch(`${API}/api/Dashboard/resumen`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const body = await safeText(resp);
      throw new Error(`KPIs: ${resp.status}. ${body?.slice(0, 180) || "(vacia)"}`);
    }

    setKpisData(await fetchJSONorNull(resp));
  };

  const cargarMenu = async () => {
    const url = `${API}/api/MenuDiario/hoy?tiempoComidaId=${tiempoComidaId}&sedeId=${sedeId}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok && resp.status !== 204) {
      const body = await safeText(resp);
      throw new Error(`MenuHoy: ${resp.status}. ${body?.slice(0, 180) || "(vacia)"}`);
    }

    const raw = await fetchJSONorNull(resp);
    setMenuHoy(normalizeMenu(raw));
  };

  useEffect(() => {
    if (!requireTokenOrRedirect()) return;

    (async () => {
      try {
        setErrorKPIs(null);
        setLoadingKPIs(true);
        await cargarKPIs();
      } catch (e) {
        setErrorKPIs(e.message);
      } finally {
        setLoadingKPIs(false);
      }

      try {
        setErrorMenu(null);
        setLoadingMenu(true);
        await cargarMenu();
      } catch (e) {
        setErrorMenu(e.message);
      } finally {
        setLoadingMenu(false);
      }
    })();
  }, []);

  useEffect(() => {
    const updateCorte = () =>
      setHoraCorte({
        desayuno: localStorage.getItem(CORTE_STORAGE_KEY_DESAYUNO) || "10:15",
        almuerzo: localStorage.getItem(CORTE_STORAGE_KEY_ALMUERZO) || "15:00",
      });

    const tick = setInterval(() => setAhora(new Date()), 60000);

    window.addEventListener("storage", updateCorte);
    window.addEventListener("menu-corte-updated", updateCorte);

    return () => {
      clearInterval(tick);
      window.removeEventListener("storage", updateCorte);
      window.removeEventListener("menu-corte-updated", updateCorte);
    };
  }, []);

  const dashboardNumbers = useMemo(() => {
    const d = kpisData || {};
    return {
      menusHoy: d.menusHoy ?? 0,
      platosHoy: d.platosHoy ?? 0,
      auditoriasHoy: d.eventosHoy ?? 0,
      loginsHoy: d.loginsHoy ?? 0,
    };
  }, [kpisData]);

  const kpis = [
    {
      cls: "kpi-info",
      value: dashboardNumbers.menusHoy,
      title: "Menus de Hoy",
      icon: <Utensils size={40} />,
      onDetail: () => navigate("/dashboard/menu"),
    },
    {
      cls: "kpi-success",
      value: dashboardNumbers.platosHoy,
      title: "Platos Cargados",
      icon: <CheckCircle2 size={40} />,
      onDetail: () => navigate("/dashboard/menu"),
    },
    {
      cls: "kpi-warning",
      value: dashboardNumbers.auditoriasHoy,
      title: "Auditorias Hoy",
      icon: <Activity size={40} />,
      onDetail: () =>
        navigate("/dashboard/historial", {
          state: {
            initialFilters: {
              modulo: "",
              accion: "",
              usuarioActorId: "",
              usuarioObjetivoId: "",
              fechaDesde: "",
              fechaHasta: "",
              q: "",
            },
            resetToken: Date.now(),
          },
        }),
    },
    {
      cls: "kpi-danger",
      value: dashboardNumbers.loginsHoy,
      title: "Logins Hoy",
      icon: <Activity size={40} />,
      onDetail: () =>
        navigate("/dashboard/historial", {
          state: {
            initialFilters: {
              modulo: "auth",
              accion: "login",
              usuarioActorId: "",
              usuarioObjetivoId: "",
              fechaDesde: "",
              fechaHasta: "",
              q: "",
            },
            resetToken: Date.now(),
          },
        }),
    },
  ];

  const normal = menuHoy?.Normal || null;
  const dieta = menuHoy?.Dieta || null;

  const nowMinutes = ahora.getHours() * 60 + ahora.getMinutes();
  const turnoActual = ahora.getHours() < 12 ? "desayuno" : "almuerzo";
  const corteActivo = turnoActual === "desayuno" ? horaCorte.desayuno : horaCorte.almuerzo;
  const corteMinutes = timeToMinutes(corteActivo);
  const pedidosCerrados = corteMinutes !== null ? nowMinutes >= corteMinutes : false;

  return (
    <div className="inicio-shell">
      <div className="inicio-header">
        <h2 className="inicio-title">Inicio</h2>
      </div>

      <div className="inicio-kpi-grid">
        {kpis.map((kpi, idx) => (
          <article key={idx} className={`inicio-kpi-card ${kpi.cls}`}>
            <div className="inicio-kpi-body">
              <div>
                <div className="inicio-kpi-value">{kpi.value}</div>
                <div className="inicio-kpi-label">{kpi.title}</div>
              </div>
              <div className="inicio-kpi-icon">{kpi.icon}</div>
            </div>

            <button type="button" className="inicio-kpi-link" onClick={kpi.onDetail}>
              Ver detalle <ArrowRightCircle size={15} />
            </button>
          </article>
        ))}
      </div>

      {loadingKPIs && <div className="inicio-state">Cargando indicadores...</div>}
      {errorKPIs && <div className="inicio-state error">No se pudieron cargar los KPIs: {errorKPIs}</div>}

      <section className="inicio-card inicio-card-menu">
        <div className="inicio-card-header">
          <h3>MENÚ DE HOY</h3>
          <div className="inicio-card-actions">
            <button
              type="button"
              className="menu-edit-btn"
              onClick={() => navigate("/dashboard/menu")}
            >
              <SquarePen size={15} />
              Editar
            </button>
            <button type="button" className="menu-print-btn" onClick={imprimirMenu}>
              <Printer size={15} />
              Imprimir
            </button>
            <button
              type="button"
              className="card-collapse-btn"
              onClick={() => setMenuCollapsed((v) => !v)}
              aria-label="Colapsar menú"
            >
              {menuCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {!menuCollapsed && (
          <>
            <div className="inicio-info-box-grid">
              <div className="inicio-info-box">
                <div className="inicio-info-box-icon blue">
                  <SunMedium size={24} />
                </div>
                <div className="inicio-info-box-content">
                  <div className="inicio-info-box-title">Desayuno</div>
                  <div className="inicio-info-box-value">Cierre: {horaCorte.desayuno}</div>
                  <div className="inicio-info-box-subtext">
                    {turnoActual === "desayuno" && pedidosCerrados ? "Pedidos cerrados" : "Turno configurado"}
                  </div>
                </div>
              </div>

              <div className="inicio-info-box">
                <div className="inicio-info-box-icon yellow">
                  <CloudSun size={24} />
                </div>
                <div className="inicio-info-box-content">
                  <div className="inicio-info-box-title">Almuerzo</div>
                  <div className="inicio-info-box-value">Cierre: {horaCorte.almuerzo}</div>
                  <div className="inicio-info-box-subtext">
                    {turnoActual === "almuerzo" && pedidosCerrados ? "Pedidos cerrados" : "Turno configurado"}
                  </div>
                </div>
              </div>
            </div>

            {errorMenu && <div className="inicio-state error">No se pudo cargar el menú: {errorMenu}</div>}
            {loadingMenu ? (
              <div className="inicio-state">Cargando menú del día...</div>
            ) : (
              <div className="inicio-menu-grid">
                <MenuCard
                  title="MENÚ NORMAL"
                  icon={<Utensils size={17} />}
                  data={normal}
                />

                <MenuCard
                  title="MENÚ DIETA"
                  icon={<Leaf size={17} />}
                  data={dieta}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MenuCard({ title, icon, data }) {
  const foto = toAbsolutePhotoUrl(data?.FotoUrl);

  return (
    <div className="menu-tile">
      <div className="menu-tile-title">
        {icon}
        <span>{title}</span>
      </div>

      {!data ? (
        <div className="menu-empty-text">No hay menú cargado aún.</div>
      ) : (
        <>
          <div className="menu-loaded-box">
            <div className="menu-thumb">
              {foto ? <img src={foto} alt={title} /> : <div className="menu-thumb-empty">Sin foto</div>}
            </div>

            <div className="menu-copy">
              <div className="menu-name">{data.Nombre || "Sin nombre"}</div>
              <div className="menu-copy-section">
                <div className="menu-copy-label">Descripción</div>
                <div className="menu-desc">{data.Descripcion || "Sin descripción"}</div>
              </div>
              <div className="menu-copy-section menu-copy-section-side">
                <div className="menu-copy-label">Guarniciones</div>
                <div className="menu-side">{data.Guarniciones || "-"}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
