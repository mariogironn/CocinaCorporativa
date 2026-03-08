import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  History,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./layout/styles/dashboard.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => navigate("/");

  const menuItems = [
    { id: "kds", label: "Monitor Cocina", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { id: "menu", label: "Gestión Menú", icon: <UtensilsCrossed size={18} />, path: "/dashboard/menu" },
    { id: "hist", label: "Historial", icon: <History size={18} />, path: "/dashboard/historial" },
  ];

  const usuario = { nombre: "Nestor Camelo", rol: "Chef" };

  return (
    <div className={`layout-shell ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Header barra */}
        <div className="brand">
          <div className="brand-left">
            <div className="brand-badge">SI</div>

            {!collapsed && (
              <div className="brand-title">
                <strong>COCINA</strong>
                <span>Corporativa</span>
              </div>
            )}
          </div>

          <button
            className="collapse-btn"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navegación */}
        <nav className="nav">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <span className="icon">{item.icon}</span>
              {/* IMPORTANTE: el texto SIEMPRE se renderiza, el CSS decide cómo se ve */}
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout" title={collapsed ? "Cerrar turno" : undefined}>
            <LogOut size={18} />
            <span className="logout-label">Cerrar turno</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title">INICIO</div>
          </div>

          <div className="topbar-right">
            <div className="chip">
              <Bell size={18} />
              <span className="badge">3</span>
            </div>

            <div className="profile">
              <div className="avatar">👨‍🍳</div>
              <div className="profile-info">
                <strong>{usuario.nombre}</strong>
                <span>{usuario.rol}</span>
              </div>
            </div>
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