import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  House,
  UtensilsCrossed,
  Package,
  History,
  Users,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import "./layout/styles/dashboard.css";
import { hasPermission } from "./security/roles";

const API = "https://localhost:7042";
const LAST_ACTIVITY_KEY = "last_activity_at";
const SESSION_NOTICE_KEY = "session_expired_notice";

const EMPTY_USER = {
  usuarioId: "",
  username: "",
  nombreCompleto: "Usuario",
  rol: "Sin rol",
  sedeNombre: "",
  areaTrabajo: "",
  telefono: "",
  correo: "",
  avatarUrl: "",
  permisos: null,
  permissions: null,
};

const DEFAULT_SETTINGS = {
  companyName: "COCINA",
  companyTagline: "Corporativa",
  primaryColor: "#0d47a1",
  compactTables: false,
  sessionTimeout: "30",
};

const hexToRgb = (hex) => {
  const value = String(hex || "").replace("#", "").trim();
  if (value.length !== 6) return "13, 71, 161";

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  if (trimmed.startsWith("/")) {
    return `${API}${trimmed}${trimmed.includes("?") ? "" : `?v=${Date.now()}`}`;
  }

  return `${API}/${trimmed}${trimmed.includes("?") ? "" : `?v=${Date.now()}`}`;
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return EMPTY_USER;

    const parsed = JSON.parse(raw);

    return {
      usuarioId: parsed?.usuarioId ?? "",
      username: parsed?.username ?? "",
      nombreCompleto: parsed?.nombreCompleto || parsed?.username || "Usuario",
      rol: parsed?.rol || "Sin rol",
      sedeNombre: parsed?.sedeNombre || parsed?.sede || "",
      areaTrabajo: parsed?.areaTrabajo || parsed?.area || "",
      telefono: parsed?.telefono || "",
      correo: parsed?.correo || parsed?.email || "",
      avatarUrl: parsed?.avatarUrl || parsed?.fotoPerfilUrl || parsed?.fotoUrl || "",
      permisos: parsed?.permisos || null,
      permissions: parsed?.permissions || null,
    };
  } catch {
    return EMPTY_USER;
  }
};

const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem("system_settings");
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      companyName: parsed?.companyName?.trim() || DEFAULT_SETTINGS.companyName,
      companyTagline: parsed?.companyTagline?.trim() || DEFAULT_SETTINGS.companyTagline,
      primaryColor: parsed?.primaryColor || DEFAULT_SETTINGS.primaryColor,
      compactTables: Boolean(parsed?.compactTables),
      sessionTimeout: String(parsed?.sessionTimeout || DEFAULT_SETTINGS.sessionTimeout),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState(getStoredUser);
  const [settings, setSettings] = useState(getStoredSettings);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedMenuId, setExpandedMenuId] = useState(
    location.pathname.startsWith("/dashboard/inventario")
      ? "inventory"
      : location.pathname.startsWith("/dashboard/usuarios")
        ? "users"
        : null
  );
  const profileRef = useRef(null);
  const lastNonConfigRouteRef = useRef("/dashboard");
  const logoutInProgressRef = useRef(false);
  const lastActivityWriteRef = useRef(0);
  const inventoryView = useMemo(() => {
    if (!location.pathname.startsWith("/dashboard/inventario")) return "stock";
    return new URLSearchParams(location.search).get("view") || "stock";
  }, [location.pathname, location.search]);
  const usersView = useMemo(() => {
    if (!location.pathname.startsWith("/dashboard/usuarios")) return "listado";
    return new URLSearchParams(location.search).get("view") || "listado";
  }, [location.pathname, location.search]);

  const handleLogout = async (reason = "manual") => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    const token = localStorage.getItem("token");

    try {
      if (token) {
        const query = reason !== "manual" ? `?motivo=${encodeURIComponent(reason)}` : "";
        await fetch(`${API}/api/Auth/logout${query}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Si falla la auditoria de logout en backend, igual cerramos la sesion local.
    } finally {
      if (reason === "inactividad") {
        localStorage.setItem(SESSION_NOTICE_KEY, "Tu sesion finalizo por inactividad.");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      window.dispatchEvent(new Event("usuario-updated"));
      navigate("/");
      logoutInProgressRef.current = false;
    }
  };

  useEffect(() => {
    const syncUser = () => setUsuario(getStoredUser());
    const syncSettings = () => setSettings(getStoredSettings());
    window.addEventListener("storage", syncUser);
    window.addEventListener("usuario-updated", syncUser);
    window.addEventListener("storage", syncSettings);
    window.addEventListener("system-settings-updated", syncSettings);

    syncUser();
    syncSettings();

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("usuario-updated", syncUser);
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("system-settings-updated", syncSettings);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const color = settings.primaryColor || DEFAULT_SETTINGS.primaryColor;
    const rgb = hexToRgb(color);

    root.style.setProperty("--brand-primary", color);
    root.style.setProperty("--brand-primary-soft", `rgba(${rgb}, 0.10)`);
    root.style.setProperty("--brand-primary-soft-strong", `rgba(${rgb}, 0.18)`);
    root.style.setProperty("--brand-primary-border", `rgba(${rgb}, 0.28)`);
    root.style.setProperty("--brand-primary-rgb", rgb);

    document.body.classList.toggle("compact-tables", Boolean(settings.compactTables));
  }, [settings]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const timeoutMinutes = Math.max(1, Number(settings.sessionTimeout || DEFAULT_SETTINGS.sessionTimeout));
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const writeActivity = (force = false) => {
      const now = Date.now();
      if (!force && now - lastActivityWriteRef.current < 10000) return;
      lastActivityWriteRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };

    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - lastActivity >= timeoutMs) {
        handleLogout("inactividad");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    const onStorage = (event) => {
      if (event.key === "token" && !event.newValue) {
        navigate("/");
      }
    };

    writeActivity(true);

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((eventName) => window.addEventListener(eventName, writeActivity, { passive: true }));
    window.addEventListener("focus", checkInactivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const intervalId = window.setInterval(checkInactivity, 15000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, writeActivity));
      window.removeEventListener("focus", checkInactivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [settings.sessionTimeout, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/dashboard/configuracion") {
      lastNonConfigRouteRef.current = `${location.pathname}${location.search || ""}`;
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/inventario")) {
      setExpandedMenuId((prev) => prev ?? "inventory");
      return;
    }

    if (location.pathname.startsWith("/dashboard/usuarios")) {
      setExpandedMenuId((prev) => prev ?? "users");
      return;
    }

    setExpandedMenuId((prev) => (prev === "inventory" || prev === "users" ? null : prev));
  }, [location.pathname]);

  const menuSections = useMemo(() => {
    const sections = [
      {
        id: "operacion",
        title: "OPERACION",
        items: [
          { id: "inicio", label: "Inicio", icon: <House size={18} />, path: "/dashboard", perm: "dashboard.view" },
          { id: "menu", label: "Gestion Menú", icon: <UtensilsCrossed size={18} />, path: "/dashboard/menu", perm: "menu.view" },
          {
            id: "inventory",
            label: "Inventario",
            icon: <Package size={18} />,
            path: "/dashboard/inventario?view=stock",
            perm: "inventory.view",
            children: [
              { id: "inventory-stock", label: "Stock actual", path: "/dashboard/inventario?view=stock" },
              { id: "inventory-movs", label: "Movimientos", path: "/dashboard/inventario?view=movs" },
              { id: "inventory-products", label: "Productos", path: "/dashboard/inventario?view=productos" },
              { id: "inventory-providers", label: "Proveedores", path: "/dashboard/inventario?view=proveedores" },
              { id: "inventory-categories", label: "Categorias", path: "/dashboard/inventario?view=categorias" },
              { id: "inventory-units", label: "Unidades de medida", path: "/dashboard/inventario?view=unidades" },
            ],
          },
        ],
      },
      {
        id: "administracion",
        title: "ADMINISTRACION",
        items: [
          {
            id: "users",
            label: "Administrador de Usuarios",
            icon: <Users size={18} />,
            path: "/dashboard/usuarios?view=listado",
            perm: "users.view",
            children: [
              { id: "users-list", label: "Listado de Usuarios", path: "/dashboard/usuarios?view=listado" },
              { id: "users-permissions", label: "Permisos", path: "/dashboard/usuarios?view=permisos" },
            ],
          },
        ],
      },
      {
        id: "control",
        title: "CONTROL Y TRAZA",
        items: [
          { id: "hist", label: "Actividad del Sistema", icon: <History size={18} />, path: "/dashboard/historial", perm: "historial.view" },
        ],
      },
    ];

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasPermission(usuario, item.perm)),
      }))
      .filter((section) => section.items.length > 0);
  }, [usuario]);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/dashboard/menu") return "GESTION MENU";
    if (location.pathname === "/dashboard/inventario") return "INVENTARIO";
    if (location.pathname === "/dashboard/usuarios") return "ADMINISTRADOR DE USUARIOS";
    if (location.pathname === "/dashboard/historial") return "ACTIVIDAD DEL SISTEMA";
    if (location.pathname === "/dashboard/configuracion") return "CONFIGURACION";
    if (location.pathname === "/dashboard/perfil") return "PERFIL";
    return "INICIO";
  }, [location.pathname]);

  const initials = useMemo(() => {
    const text = (usuario?.nombreCompleto || usuario?.username || "U").trim();
    return text.slice(0, 2).toUpperCase();
  }, [usuario]);

  const avatarSrc = useMemo(() => resolveAvatarUrl(usuario.avatarUrl), [usuario.avatarUrl]);

  return (
    <div className={`layout-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-left">
            <div className="brand-badge">SI</div>

            {!collapsed && (
              <div className="brand-title">
                <strong>{settings.companyName}</strong>
                <span>{settings.companyTagline}</span>
              </div>
            )}
          </div>

          <button
            className="collapse-btn"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expandir menu lateral" : "Contraer menu lateral"}
            aria-label={collapsed ? "Expandir menu lateral" : "Contraer menu lateral"}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="nav">
          {menuSections.map((section) => (
            <div key={section.id} className="nav-section">
              {!collapsed && <div className="nav-section-title">{section.title}</div>}

              <div className="nav-section-items">
                {section.items.map((item) => {
                  const isInventory = item.id === "inventory";
                  const isUsers = item.id === "users";
                  const isActive =
                    item.path === "/dashboard"
                      ? location.pathname === "/dashboard"
                      : isInventory
                        ? location.pathname.startsWith("/dashboard/inventario")
                        : isUsers
                          ? location.pathname.startsWith("/dashboard/usuarios")
                        : location.pathname.startsWith(item.path);

                  return (
                    <div key={item.id} className="nav-item-group">
                      <button
                        type="button"
                        className={`nav-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          if (item.children?.length) {
                            if (isActive) {
                              setExpandedMenuId((prev) => (prev === item.id ? null : item.id));
                            } else {
                              setExpandedMenuId(item.id);
                              navigate(item.path);
                            }
                            return;
                          }

                          navigate(item.path);
                        }}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </button>

                      {!collapsed && item.children?.length && expandedMenuId === item.id && (
                        <div className="nav-submenu">
                          {item.children.map((child) => {
                            const childView = new URLSearchParams(child.path.split("?")[1]).get("view") || "";
                            const childActive = isInventory
                              ? inventoryView === childView
                              : isUsers
                                ? usersView === childView
                                : false;

                            return (
                              <button
                                key={child.id}
                                type="button"
                                className={`nav-subitem ${childActive ? "active" : ""}`}
                                onClick={() => navigate(child.path)}
                              >
                                <ChevronRight size={14} />
                                <span>{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      <section className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title">{pageTitle}</div>
          </div>

          <div className="topbar-right" ref={profileRef}>
            <button
              type="button"
              className="quick-access-btn"
              onClick={() => {
                if (location.pathname === "/dashboard/configuracion") {
                  navigate(lastNonConfigRouteRef.current || "/dashboard");
                  return;
                }

                navigate("/dashboard/configuracion");
              }}
              title="Configuracion"
              aria-label="Abrir configuracion"
            >
              <Settings size={17} />
            </button>

            <button
              type="button"
              className="profile profile-btn"
              onClick={() => setProfileMenuOpen((v) => !v)}
              title="Opciones de perfil"
            >
              <div className="avatar">
                {avatarSrc ? <img src={avatarSrc} alt="Avatar" /> : initials}
              </div>

              <div className="profile-info">
                <strong>{usuario.nombreCompleto || "Usuario"}</strong>
                <span>
                  {usuario.areaTrabajo
                    ? `${usuario.rol || "Sin rol"} • ${usuario.areaTrabajo}`
                    : usuario.rol || "Sin rol"}
                </span>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboard/perfil");
                  }}
                >
                  <User size={16} />
                  Mi Perfil
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <div className="content-card">
            <Outlet />
          </div>
        </main>
      </section>
    </div>
  );
}
