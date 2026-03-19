import { useState, useRef } from 'react';
import './MenuFotoUploader.css';

const MenuFotoUploader = ({ detalleId, fotoActual, onFotoActualizada }) => {
  const [preview, setPreview] = useState(fotoActual || null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG, GIF o WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB.');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    subirFoto(file);
  };

  const subirFoto = async (file) => {
    setCargando(true);
    const formData = new FormData();
    formData.append('foto', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://localhost:7042/api/MenuDiario/detalle/${detalleId}/subir-foto`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al subir la foto');
      }

      const data = await response.json();
      onFotoActualizada(data.fotoUrl);
      setError('');
    } catch (err) {
      setError(err.message);
      setPreview(fotoActual);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async () => {
    if (!detalleId) return;
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://localhost:7042/api/MenuDiario/detalle/${detalleId}/eliminar-foto`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Error al eliminar la foto');

      setPreview(null);
      onFotoActualizada(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleClickSubir = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="menu-foto-uploader">
      <div className="foto-contenedor" onClick={handleClickSubir}>
        {preview ? (
          <img src={preview} alt="Plato del día" />
        ) : (
          <div className="foto-placeholder">
            <span>📸</span>
            <p>Subir foto del plato</p>
          </div>
        )}
        {cargando && <div className="cargando-spinner">⏳</div>}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSeleccionarArchivo}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
      />

      {preview && !cargando && (
        <button className="btn-eliminar" onClick={handleEliminar} title="Eliminar foto">
          🗑️
        </button>
      )}

      {error && <p className="error-mensaje">{error}</p>}
    </div>
  );
};

export default MenuFotoUploader;