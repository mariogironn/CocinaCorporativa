import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, History, LogOut, Bell } from 'lucide-react';
import './App.css'; // Usamos tus estilos oscuros

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState("KDS");

  const handleLogout = () => {
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Cocina', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { id: 'menu', label: 'Gestión Menú', icon: <UtensilsCrossed size={20} />, path: '/dashboard/menu' },
    { id: 'history', label: 'Historial', icon: <History size={20} />, path: '/dashboard/historial' },
  ];

  return (
    <div className="layout-container">
      {/* SIDEBAR LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="chef-avatar">👨‍🍳</div>
          <div>
            <h3>CHEF MARIO</h3>
            <span className="status-dot">Online</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>Cerrar Turno</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <header className="top-bar">
          <h2>COCINA CORPORATIVA <span className="highlight">V1.0</span></h2>
          <div className="notifications">
            <Bell size={20} />
            <span className="badge">3</span>
          </div>
        </header>

        {/* AQUÍ SE CARGARÁN LOS MÓDULOS (Outlet) */}
        <div className="module-view">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;