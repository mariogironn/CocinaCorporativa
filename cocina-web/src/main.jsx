import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import DashboardLayout from './DashboardLayout.jsx'
import MonitorCocina from './MonitorCocina.jsx' // <--- IMPORTANTE: Importar el nuevo archivo

// Componentes placeholder para las otras secciones (las haremos después)
const MenuGestion = () => <h1 style={{color:'white'}}>🚧 Gestión del Menú</h1>
const Historial = () => <h1 style={{color:'white'}}>🚧 Historial de Pedidos</h1>

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        
        {/* Rutas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Aquí cargamos el MonitorCocina por defecto (index) */}
          <Route index element={<MonitorCocina />} />
          <Route path="menu" element={<MenuGestion />} />
          <Route path="historial" element={<Historial />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)