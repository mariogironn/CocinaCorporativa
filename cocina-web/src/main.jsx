import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import DashboardLayout from './DashboardLayout.jsx'
import MonitorCocina from './MonitorCocina.jsx'

// Componentes placeholder para las otras secciones
const MenuGestion = () => <h1 style={{color:'white'}}>🚧 Gestión del Menú</h1>
const Historial = () => <h1 style={{color:'white'}}>🚧 Historial de Pedidos</h1>

// Nuevo componente Inicio para la ruta principal del dashboard
const Inicio = () => (
  <div style={{ padding: 8 }}>
    <h2 style={{ margin: 0 }}>Inicio</h2>
    <p style={{ marginTop: 8, color: "rgba(0,0,0,.55)" }}>
      Selecciona un módulo del menú.
    </p>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        
        {/* Rutas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Ahora el index muestra el componente Inicio en lugar de MonitorCocina */}
          <Route index element={<Inicio />} />
          <Route path="menu" element={<MenuGestion />} />
          <Route path="historial" element={<Historial />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)