import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import "./publicMenu.css";

const base64UrlToBase64 = (value) => {
  const fixed = (value || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = fixed.length % 4 === 0 ? "" : "=".repeat(4 - (fixed.length % 4));
  return fixed + pad;
};

const decodePayload = (encoded) => {
  try {
    const binary = atob(base64UrlToBase64(encoded));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

function MenuCard({ title, data }) {
  if (!data) {
    return (
      <article className="public-menu-card empty">
        <h3>{title}</h3>
        <p>No hay informacion cargada.</p>
      </article>
    );
  }

  return (
    <article className="public-menu-card">
      <h3>{title}</h3>
      {data.fotoUrl ? <img src={data.fotoUrl} alt={title} /> : <div className="public-photo-empty">Sin foto</div>}
      <h4>{data.nombre || data.n || "Sin nombre"}</h4>
      <p>{data.descripcion || data.d || "Sin descripcion"}</p>
      <p><strong>Guarniciones:</strong> {data.guarniciones || data.g || "-"}</p>
    </article>
  );
}

export default function PublicMenuPage() {
  const [search] = useSearchParams();

  const data = useMemo(() => {
    const encoded = search.get("d");
    if (!encoded) return null;
    return decodePayload(encoded);
  }, [search]);

  if (!data) {
    return (
      <div className="public-menu-shell">
        <div className="public-menu-box">
          <h2>Menu del dia</h2>
          <p>No se pudo leer el QR o el enlace no es valido.</p>
        </div>
      </div>
    );
  }

  const normal = data.normal || data.n || null;
  const dieta = data.dieta || data.t || null;
  const fecha = data.fecha || data.f || new Date().toISOString().slice(0, 10);
  const corteDesayuno = data?.corte?.desayuno || data?.cd || "10:00";
  const corteAlmuerzo = data?.corte?.almuerzo || data?.ca || "15:00";

  return (
    <div className="public-menu-shell">
      <div className="public-menu-box">
        <header className="public-menu-header">
          <h2>Menu del dia</h2>
          <p>Fecha: {fecha}</p>
          <p>Corte desayuno: {corteDesayuno} | Corte almuerzo: {corteAlmuerzo}</p>
        </header>

        <div className="public-menu-grid">
          <MenuCard title="Platillo normal" data={normal} />
          <MenuCard title="Platillo dieta" data={dieta} />
        </div>
      </div>
    </div>
  );
}
