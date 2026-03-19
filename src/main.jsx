import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import DashboardLayout from "./DashboardLayout.jsx";
import InicioPage from "./modules/dashboard/pages/InicioPage.jsx";
import ConfiguracionPage from "./modules/dashboard/pages/ConfiguracionPage.jsx";
import MenuGestionPage from "./modules/menu/pages/MenuGestionPage.jsx";
import PublicMenuPage from "./modules/menu/pages/PublicMenuPage.jsx";
import AuditoriaPage from "./modules/auditoria/pages/AuditoriaPage.jsx";
import InventarioPage from "./modules/inventario/pages/InventarioPage.jsx";
import PerfilPage from "./modules/user/pages/PerfilPage.jsx";
import UsuariosAdminPage from "./modules/user/pages/UsuariosAdminPage.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/menu-del-dia" element={<PublicMenuPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="menu" element={<MenuGestionPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="historial" element={<AuditoriaPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="usuarios" element={<UsuariosAdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
