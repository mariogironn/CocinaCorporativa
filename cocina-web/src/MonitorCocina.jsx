import { useState } from 'react';
import { Clock, CheckCircle, Flame, AlertCircle } from 'lucide-react';
import './App.css'; // Usamos los mismos estilos globales

const MonitorCocina = () => {
  // Datos de prueba (luego vendrán de tu API .NET)
  const [pedidos, setPedidos] = useState([
    {
      id: 101,
      cliente: "Mesa 4 - Juan P.",
      hora: "12:30 PM",
      estado: "pendiente", // pendiente, preparando, listo
      items: [
        { cant: 2, plato: "Hamburguesa Clásica", nota: "Sin cebolla" },
        { cant: 1, plato: "Papas Fritas", nota: "" },
        { cant: 1, plato: "Coca Cola", nota: "" }
      ]
    },
    {
      id: 102,
      cliente: "Para Llevar - Ana",
      hora: "12:35 PM",
      estado: "preparando",
      items: [
        { cant: 1, plato: "Ensalada César", nota: "Aderezo aparte" },
        { cant: 1, plato: "Sopa del día", nota: "" }
      ]
    },
    {
      id: 103,
      cliente: "Mesa 2 - Corporativo",
      hora: "12:40 PM",
      estado: "pendiente",
      items: [
        { cant: 4, plato: "Tacos de Asada", nota: "Con todo" },
        { cant: 2, plato: "Limonada", nota: "" }
      ]
    }
  ]);

  // Función para cambiar el estado del pedido (Simulación)
  const cambiarEstado = (id, nuevoEstado) => {
    setPedidos(pedidos.map(p => 
      p.id === id ? { ...p, estado: nuevoEstado } : p
    ));
  };

  // Función para obtener el color según el estado
  const getColorEstado = (estado) => {
    switch(estado) {
      case 'pendiente': return { border: '#e57373', bg: '#2c1f1f', icon: <AlertCircle size={18}/> }; // Rojo suave
      case 'preparando': return { border: '#ffb74d', bg: '#2d261a', icon: <Flame size={18}/> };      // Naranja
      case 'listo': return { border: '#81c784', bg: '#1e2621', icon: <CheckCircle size={18}/> };    // Verde
      default: return { border: '#555', bg: '#222' };
    }
  };

  return (
    <div className="kds-container">
      <div className="kds-header">
        <h2>MONITOR DE COMANDAS</h2>
        <div className="kds-legend">
          <span className="dot red"></span> Pendiente
          <span className="dot orange"></span> Preparando
          <span className="dot green"></span> Listo
        </div>
      </div>

      <div className="orders-grid">
        {pedidos.map((pedido) => {
          const estilo = getColorEstado(pedido.estado);
          
          return (
            <div key={pedido.id} className="order-card" style={{ borderColor: estilo.border }}>
              {/* Encabezado de la Tarjeta */}
              <div className="card-header" style={{ backgroundColor: estilo.bg, borderBottomColor: estilo.border }}>
                <div className="order-info">
                  <span className="order-id">#{pedido.id}</span>
                  <span className="order-time"><Clock size={14}/> {pedido.hora}</span>
                </div>
                <span className="status-badge" style={{ color: estilo.border, borderColor: estilo.border }}>
                  {estilo.icon} {pedido.estado.toUpperCase()}
                </span>
              </div>

              {/* Cuerpo del Pedido */}
              <div className="card-body">
                <h4 className="client-name">{pedido.cliente}</h4>
                <ul className="items-list">
                  {pedido.items.map((item, index) => (
                    <li key={index}>
                      <span className="qty">{item.cant}x</span>
                      <div className="item-details">
                        <span className="dish-name">{item.plato}</span>
                        {item.nota && <span className="dish-note">📝 {item.nota}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className="card-actions">
                {pedido.estado === 'pendiente' && (
                  <button 
                    className="btn-action btn-cook"
                    onClick={() => cambiarEstado(pedido.id, 'preparando')}
                  >
                    🔥 COCINAR
                  </button>
                )}
                
                {pedido.estado === 'preparando' && (
                  <button 
                    className="btn-action btn-ready"
                    onClick={() => cambiarEstado(pedido.id, 'listo')}
                  >
                    ✅ TERMINAR
                  </button>
                )}

                {pedido.estado === 'listo' && (
                  <button className="btn-action btn-archive">
                    📦 ARCHIVAR
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonitorCocina;