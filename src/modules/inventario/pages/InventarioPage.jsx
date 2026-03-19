import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  Power,
  CircleDollarSign,
  ClipboardList,
  Package,
  Pencil,
  FileDown,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { getCurrentUser, hasPermission } from "../../../security/roles";
import "../styles/inventario.css";

const API = "https://localhost:7042";
const pick = (obj, keys, fallback = "") => keys.find((key) => obj?.[key] !== undefined && obj?.[key] !== null) ? obj[keys.find((key) => obj?.[key] !== undefined && obj?.[key] !== null)] : fallback;
const money = (v) => new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(Number(v || 0));
const number = (v) => new Intl.NumberFormat("es-GT", { maximumFractionDigits: 2 }).format(Number(v || 0));
const stamp = (v) => (v ? new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)) : "Sin registro");
const today = () => new Date().toISOString().slice(0, 10);

const emptyResumen = { totalItems: 0, stockBajo: 0, entradasHoy: 0, salidasHoy: 0, valorInventario: 0 };
const emptyCatalogos = { sedes: [], productos: [], proveedores: [], tiposMovimiento: [], tiposProducto: [], unidadesMedida: [] };
const emptyInv = { inventarioId: null, sedeId: "", productoId: "", stockActual: "", stockMinimo: "", costoPromedio: "", estado: "1" };
const emptyMov = { inventarioId: "", tipoMovimientoId: "", proveedorId: "", cantidad: "", costoUnitario: "", fecha: today(), referencia: "" };
const emptyProduct = { productoId: null, codigo: "", nombre: "", tipoProductoId: "", unidadMedidaId: "", estado: "1", estadoOriginal: "1" };
const emptyProvider = { proveedorId: null, nombre: "", nombreContacto: "", telefono: "", email: "", direccion: "", estado: "1", estadoOriginal: "1" };
const emptyCategory = { tipoProductoId: null, nombre: "", estado: "1" };
const emptyUnit = { unidadMedidaId: null, nombre: "", abreviatura: "", estado: "1" };

async function readError(resp, fallback) {
  try {
    const text = await resp.text();
    return text?.trim() ? `${fallback}: ${text}` : fallback;
  } catch {
    return fallback;
  }
}

export default function InventarioPage() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(() => getCurrentUser() || {});
  const [resumen, setResumen] = useState(emptyResumen);
  const [catalogos, setCatalogos] = useState(emptyCatalogos);
  const [items, setItems] = useState([]);
  const [movs, setMovs] = useState([]);
  const [invFilters, setInvFilters] = useState({ q: "", sedeId: "", soloBajoMinimo: false });
  const [movFilters, setMovFilters] = useState({ q: "", tipoMovimientoId: "", fechaDesde: "", fechaHasta: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvModal, setShowInvModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [productActionModal, setProductActionModal] = useState(null);
  const [providerActionModal, setProviderActionModal] = useState(null);
  const [invForm, setInvForm] = useState(emptyInv);
  const [movForm, setMovForm] = useState(emptyMov);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [providerForm, setProviderForm] = useState(emptyProvider);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [saving, setSaving] = useState(false);

  const canView = hasPermission(user, "inventory.view");
  const canCreate = hasPermission(user, "inventory.create");
  const canEdit = hasPermission(user, "inventory.edit");
  const activeView = searchParams.get("view") || "stock";

  function setView(view) {
    const next = new URLSearchParams(searchParams);
    next.set("view", view);
    setSearchParams(next);
  }

  function exportPdf() {
    const printWindow = window.open("", "_blank", "width=1100,height=760");
    if (!printWindow) return;

    const titleMap = {
      stock: "Stock actual",
      movs: "Movimientos",
      productos: "Productos",
      proveedores: "Proveedores",
      categorias: "Categorias",
      unidades: "Unidades de medida",
    };

    const renderStockRows = () =>
      items
        .map(
          (item) => `
            <tr>
              <td>${item.codigoProducto}</td>
              <td>${item.nombreProducto}</td>
              <td>${item.sedeNombre}</td>
              <td>${item.categoria}</td>
              <td>${item.unidadMedida}</td>
              <td>${number(item.stockActual)}</td>
              <td>${number(item.stockMinimo)}</td>
              <td>${money(item.costoPromedio)}</td>
            </tr>
          `
        )
        .join("");

    const renderMovimientoRows = () =>
      movs
        .map(
          (item) => `
            <tr>
              <td>${stamp(item.fecha)}</td>
              <td>${item.nombreProducto}</td>
              <td>${item.tipoMovimiento}</td>
              <td>${number(item.cantidad)}</td>
              <td>${money(item.costoUnitario)}</td>
              <td>${item.proveedorNombre}</td>
              <td>${item.usuarioActor}</td>
            </tr>
          `
        )
        .join("");

    const renderProductoRows = () =>
      catalogos.productos
        .map(
          (item) => `
            <tr>
              <td>${pick(item, ["codigo", "Codigo"], "N/A")}</td>
              <td>${pick(item, ["nombre", "Nombre"], "Producto")}</td>
              <td>${pick(item, ["categoria", "Categoria", "tipoProducto", "TipoProducto"], "Sin categoria")}</td>
              <td>${pick(item, ["unidadMedida", "UnidadMedida"], "Unidad")}</td>
              <td>${Number(pick(item, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</td>
            </tr>
          `
        )
        .join("");

    const renderCatalogoBlocks = () => `
      <h3>Proveedores</h3>
      <table>
        <thead><tr><th>Proveedor</th><th>Contacto</th><th>Telefono</th><th>Estado</th></tr></thead>
        <tbody>
          ${catalogos.proveedores
            .map(
              (item) => `
                <tr>
                  <td>${pick(item, ["nombre", "Nombre"], "Proveedor")}</td>
                  <td>${pick(item, ["nombreContacto", "NombreContacto"], "Sin contacto")}</td>
                  <td>${pick(item, ["telefono", "Telefono"], "Sin telefono")}</td>
                  <td>${Number(pick(item, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      <h3>Categorias</h3>
      <table>
        <thead><tr><th>Categoria</th><th>Estado</th></tr></thead>
        <tbody>
          ${catalogos.tiposProducto
            .map(
              (item) => `
                <tr>
                  <td>${pick(item, ["nombre", "Nombre"], "Categoria")}</td>
                  <td>${Number(pick(item, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      <h3>Unidades de medida</h3>
      <table>
        <thead><tr><th>Unidad</th><th>Abreviatura</th><th>Estado</th></tr></thead>
        <tbody>
          ${catalogos.unidadesMedida
            .map(
              (item) => `
                <tr>
                  <td>${pick(item, ["nombre", "Nombre"], "Unidad")}</td>
                  <td>${pick(item, ["abreviatura", "Abreviatura"], "-")}</td>
                  <td>${Number(pick(item, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const body =
      activeView === "stock"
        ? `<table><thead><tr><th>Codigo</th><th>Producto</th><th>Sede</th><th>Categoria</th><th>Unidad</th><th>Stock</th><th>Minimo</th><th>Costo unitario</th></tr></thead><tbody>${renderStockRows()}</tbody></table>`
        : activeView === "movs"
          ? `<table><thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Cantidad</th><th>Costo</th><th>Proveedor</th><th>Usuario</th></tr></thead><tbody>${renderMovimientoRows()}</tbody></table>`
          : activeView === "productos"
            ? `<table><thead><tr><th>Codigo</th><th>Producto</th><th>Categoria</th><th>Unidad</th><th>Estado</th></tr></thead><tbody>${renderProductoRows()}</tbody></table>`
            : renderCatalogoBlocks();

    printWindow.document.write(`
      <html>
        <head>
          <title>Inventario - ${titleMap[activeView] || "Catalogos"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #1f2d3d; }
            h1 { margin: 0 0 8px; }
            h3 { margin-top: 24px; }
            .meta { margin-bottom: 18px; color: #5f6b76; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d9e2ec; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background: #edf4fb; }
          </style>
        </head>
        <body>
          <h1>Inventario</h1>
          <div class="meta">Seccion: ${titleMap[activeView] || "Catalogos"} | Generado: ${new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" }).format(new Date())}</div>
          ${body}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  useEffect(() => {
    const sync = () => setUser(getCurrentUser() || {});
    window.addEventListener("storage", sync);
    window.addEventListener("usuario-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("usuario-updated", sync);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    await Promise.all([loadResumen(), loadCatalogos(), loadStock(), loadMovs()]);
    setLoading(false);
  }

  async function loadResumen() {
    try {
      const resp = await fetch(`${API}/api/Inventario/resumen`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo cargar el resumen"));
      const data = await resp.json();
      setResumen({
        totalItems: pick(data, ["totalItems", "TotalItems", "inventariosActivos", "InventariosActivos"], 0),
        stockBajo: pick(data, ["stockBajo", "StockBajo"], 0),
        entradasHoy: pick(data, ["entradasHoy", "EntradasHoy"], 0),
        salidasHoy: pick(data, ["salidasHoy", "SalidasHoy"], 0),
        valorInventario: pick(data, ["valorInventario", "ValorInventario"], 0),
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadCatalogos() {
    try {
      const resp = await fetch(`${API}/api/Inventario/catalogos`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudieron cargar los catalogos"));
      const data = await resp.json();
      setCatalogos({
        sedes: pick(data, ["sedes", "Sedes"], []),
        productos: pick(data, ["productos", "Productos"], []),
        proveedores: pick(data, ["proveedores", "Proveedores"], []),
        tiposMovimiento: pick(data, ["tiposMovimiento", "TiposMovimiento"], []),
        tiposProducto: pick(data, ["tiposProducto", "TiposProducto"], []),
        unidadesMedida: pick(data, ["unidadesMedida", "UnidadesMedida"], []),
      });
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function loadStock() {
    try {
      const params = new URLSearchParams();
      if (invFilters.q.trim()) params.set("q", invFilters.q.trim());
      if (invFilters.sedeId) params.set("sedeId", invFilters.sedeId);
      if (invFilters.soloBajoMinimo) params.set("soloBajoMinimo", "true");
      const resp = await fetch(`${API}/api/Inventario?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo cargar el stock"));
      const data = await resp.json();
      const list = Array.isArray(data) ? data : pick(data, ["data", "Data"], []);
      setItems(list.map((item) => ({
        inventarioId: pick(item, ["inventarioId", "InventarioId", "id", "Id"], ""),
        sedeId: pick(item, ["sedeId", "SedeId"], ""),
        sedeNombre: pick(item, ["sedeNombre", "SedeNombre"], "Sin sede"),
        productoId: pick(item, ["productoId", "ProductoId"], ""),
        codigoProducto: pick(item, ["codigoProducto", "CodigoProducto", "codigo", "Codigo"], "N/A"),
        nombreProducto: pick(item, ["nombreProducto", "NombreProducto", "producto", "Producto"], "Producto"),
        categoria: pick(item, ["categoria", "Categoria", "tipoProducto", "TipoProducto"], "Sin categoria"),
        unidadMedida: pick(item, ["unidadMedida", "UnidadMedida"], "Unidad"),
        stockActual: Number(pick(item, ["stockActual", "StockActual"], 0)),
        stockMinimo: Number(pick(item, ["stockMinimo", "StockMinimo"], 0)),
        costoPromedio: Number(pick(item, ["costoPromedio", "CostoPromedio"], 0)),
        estado: Number(pick(item, ["estado", "Estado"], 1)),
        fechaCrea: pick(item, ["fechaCrea", "FechaCrea"], null),
        fechaActualiza: pick(item, ["fechaActualiza", "FechaActualiza", "ultimaActualizacion", "UltimaActualizacion"], null),
      })));
    } catch (e) {
      setError((prev) => prev || e.message);
      setItems([]);
    }
  }

  async function loadMovs() {
    try {
      const params = new URLSearchParams();
      if (movFilters.q.trim()) params.set("q", movFilters.q.trim());
      if (movFilters.tipoMovimientoId) params.set("tipoMovimientoId", movFilters.tipoMovimientoId);
      if (movFilters.fechaDesde) params.set("fechaDesde", movFilters.fechaDesde);
      if (movFilters.fechaHasta) params.set("fechaHasta", movFilters.fechaHasta);
      const resp = await fetch(`${API}/api/InventarioMovimientos?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudieron cargar los movimientos"));
      const data = await resp.json();
      const list = Array.isArray(data) ? data : pick(data, ["data", "Data"], []);
      setMovs(list.map((item) => ({
        inventarioMovimientoId: pick(item, ["inventarioMovimientoId", "InventarioMovimientoId", "id", "Id"], ""),
        nombreProducto: pick(item, ["nombreProducto", "NombreProducto", "producto", "Producto"], "Producto"),
        sedeNombre: pick(item, ["sedeNombre", "SedeNombre"], "Sin sede"),
        tipoMovimiento: pick(item, ["tipoMovimiento", "TipoMovimiento"], "Movimiento"),
        naturaleza: String(pick(item, ["naturaleza", "Naturaleza"], "")).toUpperCase(),
        proveedorNombre: pick(item, ["proveedorNombre", "ProveedorNombre"], "Sin proveedor"),
        cantidad: Number(pick(item, ["cantidad", "Cantidad"], 0)),
        costoUnitario: Number(pick(item, ["costoUnitario", "CostoUnitario"], 0)),
        fecha: pick(item, ["fecha", "Fecha"], null),
        referencia: pick(item, ["referencia", "Referencia"], ""),
        usuarioActor: pick(item, ["usuarioActor", "UsuarioActor"], "Sistema"),
      })));
    } catch (e) {
      setError((prev) => prev || e.message);
      setMovs([]);
    }
  }

  async function saveInventario(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = invForm.inventarioId ? `${API}/api/Inventario/${invForm.inventarioId}` : `${API}/api/Inventario`;
      const method = invForm.inventarioId ? "PUT" : "POST";
      const resp = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sedeId: Number(invForm.sedeId),
          productoId: Number(invForm.productoId),
          stockActual: Number(invForm.stockActual),
          stockMinimo: Number(invForm.stockMinimo),
          costoPromedio: Number(invForm.costoPromedio),
          estado: 1,
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo guardar el registro"));
      setShowInvModal(false);
      setInvForm(emptyInv);
      setSuccess("Inventario guardado correctamente.");
      await Promise.all([loadResumen(), loadStock()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveMovimiento(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`${API}/api/InventarioMovimientos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioId: Number(movForm.inventarioId),
          tipoMovimientoId: Number(movForm.tipoMovimientoId),
          proveedorId: movForm.proveedorId ? Number(movForm.proveedorId) : null,
          cantidad: Number(movForm.cantidad),
          costoUnitario: movForm.costoUnitario ? Number(movForm.costoUnitario) : null,
          fecha: movForm.fecha,
          referencia: movForm.referencia,
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo registrar el movimiento"));
      setShowMovModal(false);
      setMovForm(emptyMov);
      setSuccess("Movimiento registrado correctamente.");
      await Promise.all([loadResumen(), loadStock(), loadMovs()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (
      productForm.productoId &&
      String(productForm.estado) !== String(productForm.estadoOriginal)
    ) {
      setProductActionModal({
        kind: Number(productForm.estado) === 1 ? "activate" : "deactivate",
        product: { ...productForm },
      });
      return;
    }

    await persistProduct(productForm);
  }

  async function persistProduct(form) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = form.productoId
        ? `${API}/api/Inventario/productos/${form.productoId}`
        : `${API}/api/Inventario/productos`;
      const method = form.productoId ? "PUT" : "POST";
      const resp = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: form.codigo,
          nombre: form.nombre,
          tipoProductoId: Number(form.tipoProductoId),
          unidadMedidaId: Number(form.unidadMedidaId),
          estado: Number(form.estado),
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo guardar el producto"));
      setShowProductModal(false);
      setProductActionModal(null);
      setProductForm(emptyProduct);
      setSuccess(
        Number(form.estado) === 0 && form.productoId
          ? "Producto inactivado correctamente."
          : Number(form.estado) === 1 && form.productoId && String(form.estadoOriginal) === "0"
            ? "Producto activado correctamente."
            : "Producto guardado correctamente."
      );
      await Promise.all([loadCatalogos(), loadStock(), loadResumen()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`${API}/api/Inventario/productos/${product.productoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo eliminar el producto"));
      setProductActionModal(null);
      setSuccess("Producto eliminado correctamente.");
      await Promise.all([loadCatalogos(), loadStock(), loadResumen()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openStatusAction(product, nextState) {
    setProductActionModal({
      kind: Number(nextState) === 1 ? "activate" : "deactivate",
      product: {
        productoId: pick(product, ["productoId", "ProductoId", "id", "Id"], null),
        codigo: pick(product, ["codigo", "Codigo"], ""),
        nombre: pick(product, ["nombre", "Nombre"], ""),
        tipoProductoId: String(pick(product, ["tipoProductoId", "TipoProductoId"], "")),
        unidadMedidaId: String(pick(product, ["unidadMedidaId", "UnidadMedidaId"], "")),
        estado: String(nextState),
        estadoOriginal: String(pick(product, ["estado", "Estado"], 1)),
      },
    });
  }

  async function confirmProductAction() {
    if (!productActionModal) return;

    if (productActionModal.kind === "delete") {
      await deleteProduct(productActionModal.product);
      return;
    }

    await persistProduct(productActionModal.product);
  }

  async function saveProvider(e) {
    e.preventDefault();
    if (
      providerForm.proveedorId &&
      String(providerForm.estado) !== String(providerForm.estadoOriginal)
    ) {
      setProviderActionModal({
        kind: Number(providerForm.estado) === 1 ? "activate" : "deactivate",
        provider: { ...providerForm },
      });
      return;
    }

    await persistProvider(providerForm);
  }

  async function persistProvider(form) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = form.proveedorId
        ? `${API}/api/Inventario/proveedores/${form.proveedorId}`
        : `${API}/api/Inventario/proveedores`;
      const method = form.proveedorId ? "PUT" : "POST";
      const resp = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          nombreContacto: form.nombreContacto,
          telefono: form.telefono,
          email: form.email,
          direccion: form.direccion,
          estado: Number(form.estado),
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo guardar el proveedor"));
      setShowProviderModal(false);
      setProviderActionModal(null);
      setProviderForm(emptyProvider);
      setSuccess(
        Number(form.estado) === 0 && form.proveedorId
          ? "Proveedor inactivado correctamente."
          : Number(form.estado) === 1 && form.proveedorId && String(form.estadoOriginal) === "0"
            ? "Proveedor activado correctamente."
            : "Proveedor guardado correctamente."
      );
      await loadCatalogos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProvider(provider) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`${API}/api/Inventario/proveedores/${provider.proveedorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo eliminar el proveedor"));
      setProviderActionModal(null);
      setSuccess("Proveedor eliminado correctamente.");
      await loadCatalogos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openProviderStatusAction(provider, nextState) {
    setProviderActionModal({
      kind: Number(nextState) === 1 ? "activate" : "deactivate",
      provider: {
        proveedorId: pick(provider, ["proveedorId", "ProveedorId", "id", "Id"], null),
        nombre: pick(provider, ["nombre", "Nombre"], ""),
        nombreContacto: pick(provider, ["nombreContacto", "NombreContacto"], ""),
        telefono: pick(provider, ["telefono", "Telefono"], ""),
        email: pick(provider, ["email", "Email"], ""),
        direccion: pick(provider, ["direccion", "Direccion"], ""),
        estado: String(nextState),
        estadoOriginal: String(pick(provider, ["estado", "Estado"], 1)),
      },
    });
  }

  async function confirmProviderAction() {
    if (!providerActionModal) return;

    if (providerActionModal.kind === "delete") {
      await deleteProvider(providerActionModal.provider);
      return;
    }

    await persistProvider(providerActionModal.provider);
  }

  async function saveCategory(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = categoryForm.tipoProductoId
        ? `${API}/api/Inventario/tipos-producto/${categoryForm.tipoProductoId}`
        : `${API}/api/Inventario/tipos-producto`;
      const method = categoryForm.tipoProductoId ? "PUT" : "POST";
      const resp = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: categoryForm.nombre,
          estado: Number(categoryForm.estado),
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo guardar la categoria"));
      setShowCategoryModal(false);
      setCategoryForm(emptyCategory);
      setSuccess("Categoria guardada correctamente.");
      await loadCatalogos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveUnit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = unitForm.unidadMedidaId
        ? `${API}/api/Inventario/unidades-medida/${unitForm.unidadMedidaId}`
        : `${API}/api/Inventario/unidades-medida`;
      const method = unitForm.unidadMedidaId ? "PUT" : "POST";
      const resp = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: unitForm.nombre,
          abreviatura: unitForm.abreviatura,
          estado: Number(unitForm.estado),
        }),
      });
      if (!resp.ok) throw new Error(await readError(resp, "No se pudo guardar la unidad de medida"));
      setShowUnitModal(false);
      setUnitForm(emptyUnit);
      setSuccess("Unidad de medida guardada correctamente.");
      await loadCatalogos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return <div className="inv-state-card error">Tu rol no tiene acceso al modulo de Inventario.</div>;
  }

  return (
    <div className="inv-shell">
      <div className="inv-header">
        <div>
          <h2 className="inv-title">Inventario</h2>
          <p className="inv-subtitle">Controla stock actual, movimientos y productos asociados desde un solo lugar.</p>
        </div>
        <div className="inv-header-actions">
          <button type="button" className="inv-btn inv-btn-soft" onClick={loadAll}><RefreshCcw size={16} />Actualizar</button>
          <button type="button" className="inv-btn inv-btn-soft" onClick={exportPdf}><FileDown size={16} />Exportar PDF</button>
          <button type="button" className="inv-btn inv-btn-outline" onClick={() => setShowMovModal(true)} disabled={!canCreate}><ArrowLeftRight size={16} />Registrar movimiento</button>
          <button type="button" className="inv-btn inv-btn-primary" onClick={() => setShowInvModal(true)} disabled={!canCreate}><Plus size={16} />Nuevo registro</button>
        </div>
      </div>

      {error && <div className="inv-alert error">{error}</div>}
      {success && <div className="inv-alert success">{success}</div>}

      <section className="inv-kpi-grid">
        <article className="inv-kpi-card info"><span><Boxes size={20} /></span><strong>{loading ? "..." : resumen.totalItems}</strong><small>Registros activos</small></article>
        <article className="inv-kpi-card danger"><span><TriangleAlert size={20} /></span><strong>{loading ? "..." : resumen.stockBajo}</strong><small>Stock bajo</small></article>
        <article className="inv-kpi-card success"><span><ArrowLeftRight size={20} /></span><strong>{loading ? "..." : resumen.entradasHoy}</strong><small>Entradas hoy</small></article>
        <article className="inv-kpi-card warning"><span><CircleDollarSign size={20} /></span><strong>{loading ? "..." : money(resumen.valorInventario)}</strong><small>Valor total del inventario</small></article>
      </section>

      <section className="inv-card">
        <div className="inv-tabs">
          <button className={`inv-tab ${activeView === "stock" ? "active" : ""}`} onClick={() => setView("stock")}><Boxes size={16} />Stock actual</button>
          <button className={`inv-tab ${activeView === "movs" ? "active" : ""}`} onClick={() => setView("movs")}><ArrowLeftRight size={16} />Movimientos</button>
          <button className={`inv-tab ${activeView === "productos" ? "active" : ""}`} onClick={() => setView("productos")}><Package size={16} />Productos</button>
        </div>

        {activeView === "stock" && (
          <>
            <div className="inv-filters">
              <label className="inv-search"><Search size={16} /><input value={invFilters.q} onChange={(e) => setInvFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Buscar producto, codigo o categoria..." /></label>
              <select value={invFilters.sedeId} onChange={(e) => setInvFilters((prev) => ({ ...prev, sedeId: e.target.value }))}>
                <option value="">Todas las sedes</option>
                {catalogos.sedes.map((s) => <option key={pick(s, ["sedeId", "SedeId", "id", "Id"], "")} value={pick(s, ["sedeId", "SedeId", "id", "Id"], "")}>{pick(s, ["nombre", "Nombre"], "Sede")}</option>)}
              </select>
              <label className="inv-check"><input type="checkbox" checked={invFilters.soloBajoMinimo} onChange={(e) => setInvFilters((prev) => ({ ...prev, soloBajoMinimo: e.target.checked }))} />Solo stock bajo</label>
              <button type="button" className="inv-btn inv-btn-soft inv-btn-xs" onClick={loadStock}>Aplicar</button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead><tr><th>Codigo</th><th>Producto</th><th>Sede</th><th>Categoria</th><th>Unidad</th><th>Stock</th><th>Minimo</th><th>Costo unitario</th><th>Total valorizado</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan="11" className="inv-empty-cell">No hay registros de inventario todavia.</td></tr> : items.filter((item) => [item.codigoProducto, item.nombreProducto, item.categoria, item.sedeNombre].join(" ").toLowerCase().includes(invFilters.q.toLowerCase())).map((item) => {
                    const low = item.stockActual <= item.stockMinimo;
                    const totalValorizado = item.stockActual * item.costoPromedio;
                    return <tr key={item.inventarioId}><td>{item.codigoProducto}</td><td><div className="inv-cell-title">{item.nombreProducto}</div><div className="inv-cell-meta">{item.fechaActualiza ? `Actualizado: ${stamp(item.fechaActualiza)}` : item.fechaCrea ? `Creado: ${stamp(item.fechaCrea)}` : "Recien creado"}</div></td><td>{item.sedeNombre}</td><td>{item.categoria}</td><td>{item.unidadMedida}</td><td>{number(item.stockActual)}</td><td>{number(item.stockMinimo)}</td><td>{money(item.costoPromedio)}</td><td><div className="inv-cell-title">{money(totalValorizado)}</div><div className="inv-cell-meta">{number(item.stockActual)} x {money(item.costoPromedio)}</div></td><td><span className={`inv-badge ${low ? "danger" : "success"}`}>{low ? "Bajo minimo" : "Estable"}</span></td><td><div className="inv-actions"><button type="button" className="inv-icon-btn" disabled={!canEdit} onClick={() => { setInvForm({ inventarioId: item.inventarioId, sedeId: String(item.sedeId), productoId: String(item.productoId), stockActual: String(item.stockActual), stockMinimo: String(item.stockMinimo), costoPromedio: String(item.costoPromedio), estado: "1" }); setShowInvModal(true); }}><Pencil size={15} /></button><button type="button" className="inv-icon-btn" disabled={!canCreate} onClick={() => { setMovForm((prev) => ({ ...prev, inventarioId: String(item.inventarioId) })); setShowMovModal(true); }}><ArrowLeftRight size={15} /></button></div></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeView === "movs" && (
          <>
            <div className="inv-mini-grid">
              <article className="inv-mini-card"><span><ClipboardList size={18} /></span><div><strong>{catalogos.tiposMovimiento.length}</strong><small>Tipos de movimiento</small></div></article>
              <article className="inv-mini-card"><span><ArrowLeftRight size={18} /></span><div><strong>{movs.length}</strong><small>Movimientos cargados</small></div></article>
              <article className="inv-mini-card"><span><Building2 size={18} /></span><div><strong>{catalogos.proveedores.length}</strong><small>Proveedores disponibles</small></div></article>
            </div>
            <div className="inv-filters">
              <label className="inv-search"><Search size={16} /><input value={movFilters.q} onChange={(e) => setMovFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Buscar producto, proveedor o referencia..." /></label>
              <select value={movFilters.tipoMovimientoId} onChange={(e) => setMovFilters((prev) => ({ ...prev, tipoMovimientoId: e.target.value }))}>
                <option value="">Todos los movimientos</option>
                {catalogos.tiposMovimiento.map((t) => <option key={pick(t, ["tipoMovimientoId", "TipoMovimientoId", "id", "Id"], "")} value={pick(t, ["tipoMovimientoId", "TipoMovimientoId", "id", "Id"], "")}>{pick(t, ["nombre", "Nombre"], "Movimiento")}</option>)}
              </select>
              <input type="date" value={movFilters.fechaDesde} onChange={(e) => setMovFilters((prev) => ({ ...prev, fechaDesde: e.target.value }))} />
              <input type="date" value={movFilters.fechaHasta} onChange={(e) => setMovFilters((prev) => ({ ...prev, fechaHasta: e.target.value }))} />
              <button type="button" className="inv-btn inv-btn-soft inv-btn-xs" onClick={loadMovs}>Aplicar</button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Cantidad</th><th>Costo</th><th>Proveedor</th><th>Usuario</th><th>Referencia</th></tr></thead>
                <tbody>
                  {movs.length === 0 ? <tr><td colSpan="8" className="inv-empty-cell">Todavia no hay movimientos registrados.</td></tr> : movs.filter((m) => [m.nombreProducto, m.proveedorNombre, m.referencia, m.usuarioActor].join(" ").toLowerCase().includes(movFilters.q.toLowerCase())).map((m) => <tr key={m.inventarioMovimientoId}><td>{stamp(m.fecha)}</td><td><div className="inv-cell-title">{m.nombreProducto}</div><div className="inv-cell-meta">{m.sedeNombre}</div></td><td><span className={`inv-badge ${m.naturaleza.includes("SALIDA") ? "danger" : m.naturaleza.includes("AJUSTE") ? "warning" : "success"}`}>{m.tipoMovimiento}</span></td><td>{number(m.cantidad)}</td><td>{money(m.costoUnitario)}</td><td>{m.proveedorNombre}</td><td>{m.usuarioActor}</td><td>{m.referencia || "Sin referencia"}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeView === "productos" && (
          <>
            <div className="inv-products-toolbar">
              <div className="inv-products-copy">
                <h3>Catalogo de productos</h3>
                <p>Crea y edita los productos base del inventario. Luego apareceran en el combo de nuevo registro.</p>
              </div>
              <button
                type="button"
                className="inv-btn inv-btn-primary"
                disabled={!canCreate}
                onClick={() => {
                  setProductForm(emptyProduct);
                  setShowProductModal(true);
                }}
              >
                <Plus size={16} />
                Nuevo producto
              </button>
            </div>
            <div className="inv-mini-grid">
              <article className="inv-mini-card"><span><Package size={18} /></span><div><strong>{catalogos.productos.length}</strong><small>Productos registrados</small></div></article>
              <article className="inv-mini-card"><span><Building2 size={18} /></span><div><strong>{catalogos.proveedores.length}</strong><small>Proveedores registrados</small></div></article>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead><tr><th>Codigo</th><th>Producto</th><th>Categoria</th><th>Unidad</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {catalogos.productos.length === 0 ? <tr><td colSpan="6" className="inv-empty-cell">Cuando el backend publique el catalogo, los productos se veran aqui.</td></tr> : catalogos.productos.map((p) => {
                    const productId = pick(p, ["productoId", "ProductoId", "id", "Id"], null);
                    const currentState = Number(pick(p, ["estado", "Estado"], 1));
                    return <tr key={productId}><td>{pick(p, ["codigo", "Codigo"], "N/A")}</td><td>{pick(p, ["nombre", "Nombre"], "Producto")}</td><td>{pick(p, ["categoria", "Categoria", "tipoProducto", "TipoProducto"], "Sin categoria")}</td><td>{pick(p, ["unidadMedida", "UnidadMedida"], "Unidad")}</td><td><span className={`inv-badge ${currentState === 1 ? "success" : "neutral"}`}>{currentState === 1 ? "Activo" : "Inactivo"}</span></td><td><div className="inv-actions"><button type="button" className="inv-icon-btn" disabled={!canEdit} title="Editar producto" onClick={() => { setProductForm({ productoId: productId, codigo: pick(p, ["codigo", "Codigo"], ""), nombre: pick(p, ["nombre", "Nombre"], ""), tipoProductoId: String(pick(p, ["tipoProductoId", "TipoProductoId"], "")), unidadMedidaId: String(pick(p, ["unidadMedidaId", "UnidadMedidaId"], "")), estado: String(currentState), estadoOriginal: String(currentState) }); setShowProductModal(true); }}><Pencil size={15} /></button><button type="button" className={`inv-icon-btn ${currentState === 1 ? "warning" : "success"}`} disabled={!canEdit} title={currentState === 1 ? "Inactivar producto" : "Activar producto"} onClick={() => openStatusAction(p, currentState === 1 ? 0 : 1)}><Power size={15} /></button><button type="button" className="inv-icon-btn danger" disabled={!canEdit} title="Eliminar producto" onClick={() => setProductActionModal({ kind: "delete", product: { productoId: productId, codigo: pick(p, ["codigo", "Codigo"], ""), nombre: pick(p, ["nombre", "Nombre"], "") } })}><Trash2 size={15} /></button></div></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeView === "proveedores" && (
          <section className="inv-subprocess-card">
            <div className="inv-catalog-head">
              <div>
                <h3>Proveedores</h3>
                <p>Catalogo maestro para usar en movimientos de entrada.</p>
              </div>
              <button type="button" className="inv-btn inv-btn-primary inv-btn-xs" disabled={!canCreate} onClick={() => { setProviderForm(emptyProvider); setShowProviderModal(true); }}>
                <Plus size={14} />
                Nuevo proveedor
              </button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table inv-table-compact">
                <thead><tr><th>Proveedor</th><th>Contacto</th><th>Telefono</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {catalogos.proveedores.length === 0 ? <tr><td colSpan="5" className="inv-empty-cell">Aun no hay proveedores registrados.</td></tr> : catalogos.proveedores.map((p) => {
                    const providerId = pick(p, ["proveedorId", "ProveedorId", "id", "Id"], null);
                    const currentState = Number(pick(p, ["estado", "Estado"], 1));
                    return <tr key={providerId}><td>{pick(p, ["nombre", "Nombre"], "Proveedor")}</td><td>{pick(p, ["nombreContacto", "NombreContacto"], "Sin contacto")}</td><td>{pick(p, ["telefono", "Telefono"], "Sin telefono")}</td><td><span className={`inv-badge ${currentState === 1 ? "success" : "neutral"}`}>{currentState === 1 ? "Activo" : "Inactivo"}</span></td><td><div className="inv-actions"><button type="button" className="inv-icon-btn" disabled={!canEdit} title="Editar proveedor" onClick={() => { setProviderForm({ proveedorId: providerId, nombre: pick(p, ["nombre", "Nombre"], ""), nombreContacto: pick(p, ["nombreContacto", "NombreContacto"], ""), telefono: pick(p, ["telefono", "Telefono"], ""), email: pick(p, ["email", "Email"], ""), direccion: pick(p, ["direccion", "Direccion"], ""), estado: String(currentState), estadoOriginal: String(currentState) }); setShowProviderModal(true); }}><Pencil size={15} /></button><button type="button" className={`inv-icon-btn ${currentState === 1 ? "warning" : "success"}`} disabled={!canEdit} title={currentState === 1 ? "Inactivar proveedor" : "Activar proveedor"} onClick={() => openProviderStatusAction(p, currentState === 1 ? 0 : 1)}><Power size={15} /></button><button type="button" className="inv-icon-btn danger" disabled={!canEdit} title="Eliminar proveedor" onClick={() => setProviderActionModal({ kind: "delete", provider: { proveedorId: providerId, nombre: pick(p, ["nombre", "Nombre"], "") } })}><Trash2 size={15} /></button></div></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === "categorias" && (
          <section className="inv-subprocess-card">
            <div className="inv-catalog-head">
              <div>
                <h3>Categorias</h3>
                <p>Clasifica productos para mantener el inventario ordenado.</p>
              </div>
              <button type="button" className="inv-btn inv-btn-primary inv-btn-xs" disabled={!canCreate} onClick={() => { setCategoryForm(emptyCategory); setShowCategoryModal(true); }}>
                <Plus size={14} />
                Nueva categoria
              </button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table inv-table-compact">
                <thead><tr><th>Categoria</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {catalogos.tiposProducto.length === 0 ? <tr><td colSpan="3" className="inv-empty-cell">Aun no hay categorias registradas.</td></tr> : catalogos.tiposProducto.map((tipo) => <tr key={pick(tipo, ["tipoProductoId", "TipoProductoId", "id", "Id"], "")}><td>{pick(tipo, ["nombre", "Nombre"], "Categoria")}</td><td><span className={`inv-badge ${Number(pick(tipo, ["estado", "Estado"], 1)) === 1 ? "success" : "neutral"}`}>{Number(pick(tipo, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</span></td><td><button type="button" className="inv-icon-btn" disabled={!canEdit} onClick={() => { setCategoryForm({ tipoProductoId: pick(tipo, ["tipoProductoId", "TipoProductoId", "id", "Id"], null), nombre: pick(tipo, ["nombre", "Nombre"], ""), estado: String(pick(tipo, ["estado", "Estado"], 1)) }); setShowCategoryModal(true); }}><Pencil size={15} /></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === "unidades" && (
          <section className="inv-subprocess-card">
            <div className="inv-catalog-head">
              <div>
                <h3>Unidades de medida</h3>
                <p>Define abreviaturas limpias para productos e inventario.</p>
              </div>
              <button type="button" className="inv-btn inv-btn-primary inv-btn-xs" disabled={!canCreate} onClick={() => { setUnitForm(emptyUnit); setShowUnitModal(true); }}>
                <Plus size={14} />
                Nueva unidad
              </button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table inv-table-compact">
                <thead><tr><th>Unidad</th><th>Abreviatura</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {catalogos.unidadesMedida.length === 0 ? <tr><td colSpan="4" className="inv-empty-cell">Aun no hay unidades registradas.</td></tr> : catalogos.unidadesMedida.map((unidad) => <tr key={pick(unidad, ["unidadMedidaId", "UnidadMedidaId", "id", "Id"], "")}><td>{pick(unidad, ["nombre", "Nombre"], "Unidad")}</td><td>{pick(unidad, ["abreviatura", "Abreviatura"], "-")}</td><td><span className={`inv-badge ${Number(pick(unidad, ["estado", "Estado"], 1)) === 1 ? "success" : "neutral"}`}>{Number(pick(unidad, ["estado", "Estado"], 1)) === 1 ? "Activo" : "Inactivo"}</span></td><td><button type="button" className="inv-icon-btn" disabled={!canEdit} onClick={() => { setUnitForm({ unidadMedidaId: pick(unidad, ["unidadMedidaId", "UnidadMedidaId", "id", "Id"], null), nombre: pick(unidad, ["nombre", "Nombre"], ""), abreviatura: pick(unidad, ["abreviatura", "Abreviatura"], ""), estado: String(pick(unidad, ["estado", "Estado"], 1)) }); setShowUnitModal(true); }}><Pencil size={15} /></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {showInvModal && <Modal title={invForm.inventarioId ? "Editar inventario" : "Nuevo registro de inventario"} onClose={() => setShowInvModal(false)}><form className="inv-form" onSubmit={saveInventario}><label><span>Sede</span><select value={invForm.sedeId} onChange={(e) => setInvForm((prev) => ({ ...prev, sedeId: e.target.value }))} required><option value="">Selecciona una sede</option>{catalogos.sedes.map((s) => <option key={pick(s, ["sedeId", "SedeId", "id", "Id"], "")} value={pick(s, ["sedeId", "SedeId", "id", "Id"], "")}>{pick(s, ["nombre", "Nombre"], "Sede")}</option>)}</select></label><label><span>Producto</span><select value={invForm.productoId} onChange={(e) => setInvForm((prev) => ({ ...prev, productoId: e.target.value }))} required><option value="">Selecciona un producto</option>{catalogos.productos.map((p) => <option key={pick(p, ["productoId", "ProductoId", "id", "Id"], "")} value={pick(p, ["productoId", "ProductoId", "id", "Id"], "")}>{pick(p, ["codigo", "Codigo"], "N/A")} - {pick(p, ["nombre", "Nombre"], "Producto")}</option>)}</select></label><label><span>Stock actual</span><input type="number" min="0" step="0.01" value={invForm.stockActual} onChange={(e) => setInvForm((prev) => ({ ...prev, stockActual: e.target.value }))} required /></label><label><span>Stock minimo</span><input type="number" min="0" step="0.01" value={invForm.stockMinimo} onChange={(e) => setInvForm((prev) => ({ ...prev, stockMinimo: e.target.value }))} required /></label><label><span>Costo promedio</span><input type="number" min="0" step="0.0001" value={invForm.costoPromedio} onChange={(e) => setInvForm((prev) => ({ ...prev, costoPromedio: e.target.value }))} required /></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowInvModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
      {showMovModal && <Modal title="Registrar movimiento" onClose={() => setShowMovModal(false)}><form className="inv-form" onSubmit={saveMovimiento}><label><span>Inventario</span><select value={movForm.inventarioId} onChange={(e) => setMovForm((prev) => ({ ...prev, inventarioId: e.target.value }))} required><option value="">Selecciona un registro</option>{items.map((i) => <option key={i.inventarioId} value={i.inventarioId}>{i.codigoProducto} - {i.nombreProducto} ({i.sedeNombre})</option>)}</select></label><label><span>Tipo de movimiento</span><select value={movForm.tipoMovimientoId} onChange={(e) => setMovForm((prev) => ({ ...prev, tipoMovimientoId: e.target.value }))} required><option value="">Selecciona un tipo</option>{catalogos.tiposMovimiento.map((t) => <option key={pick(t, ["tipoMovimientoId", "TipoMovimientoId", "id", "Id"], "")} value={pick(t, ["tipoMovimientoId", "TipoMovimientoId", "id", "Id"], "")}>{pick(t, ["nombre", "Nombre"], "Movimiento")}</option>)}</select></label><label><span>Proveedor</span><select value={movForm.proveedorId} onChange={(e) => setMovForm((prev) => ({ ...prev, proveedorId: e.target.value }))}><option value="">Sin proveedor</option>{catalogos.proveedores.map((p) => <option key={pick(p, ["proveedorId", "ProveedorId", "id", "Id"], "")} value={pick(p, ["proveedorId", "ProveedorId", "id", "Id"], "")}>{pick(p, ["nombre", "Nombre"], "Proveedor")}</option>)}</select></label><label><span>Cantidad</span><input type="number" min="0.01" step="0.01" value={movForm.cantidad} onChange={(e) => setMovForm((prev) => ({ ...prev, cantidad: e.target.value }))} required /></label><label><span>Costo unitario</span><input type="number" min="0" step="0.0001" value={movForm.costoUnitario} onChange={(e) => setMovForm((prev) => ({ ...prev, costoUnitario: e.target.value }))} /></label><label><span>Fecha</span><input type="date" value={movForm.fecha} onChange={(e) => setMovForm((prev) => ({ ...prev, fecha: e.target.value }))} required /></label><label className="full"><span>Referencia</span><input value={movForm.referencia} onChange={(e) => setMovForm((prev) => ({ ...prev, referencia: e.target.value }))} placeholder="Compra semanal, ajuste, salida a cocina..." /></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowMovModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
      {productActionModal && <Modal title={productActionModal.kind === "delete" ? "Eliminar producto" : productActionModal.kind === "deactivate" ? "Inactivar producto" : "Activar producto"} onClose={() => setProductActionModal(null)}><div className="inv-confirm-body"><p className="inv-confirm-title">{productActionModal.kind === "delete" ? `Vas a eliminar ${productActionModal.product.codigo || "este producto"}.` : productActionModal.kind === "deactivate" ? `Vas a inactivar ${productActionModal.product.codigo || "este producto"}.` : `Vas a activar ${productActionModal.product.codigo || "este producto"}.`}</p><p className="inv-confirm-copy">{productActionModal.kind === "delete" ? "Esta accion solo deberia permitirse si el producto no tiene uso previo. Si el backend detecta inventario, movimientos o recetas asociadas, mostrara el motivo y no lo eliminara." : productActionModal.kind === "deactivate" ? "El producto seguira visible para consulta historica, pero la operacion deberia excluirlo de nuevos registros y del valor total activo del inventario." : "El producto volvera a estar disponible para operacion y deberia volver a contar en el inventario activo."}</p><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setProductActionModal(null)}><X size={15} />Cancelar</button><button type="button" className={`inv-btn ${productActionModal.kind === "delete" ? "inv-btn-danger" : "inv-btn-primary"}`} disabled={saving} onClick={confirmProductAction}>{productActionModal.kind === "delete" ? <Trash2 size={15} /> : <Power size={15} />}{saving ? "Procesando..." : productActionModal.kind === "delete" ? "Eliminar" : productActionModal.kind === "deactivate" ? "Inactivar" : "Activar"}</button></div></div></Modal>}
      {providerActionModal && <Modal title={providerActionModal.kind === "delete" ? "Eliminar proveedor" : providerActionModal.kind === "deactivate" ? "Inactivar proveedor" : "Activar proveedor"} onClose={() => setProviderActionModal(null)}><div className="inv-confirm-body"><p className="inv-confirm-title">{providerActionModal.kind === "delete" ? `Vas a eliminar ${providerActionModal.provider.nombre || "este proveedor"}.` : providerActionModal.kind === "deactivate" ? `Vas a inactivar ${providerActionModal.provider.nombre || "este proveedor"}.` : `Vas a activar ${providerActionModal.provider.nombre || "este proveedor"}.`}</p><p className="inv-confirm-copy">{providerActionModal.kind === "delete" ? "Esta accion solo deberia permitirse si el proveedor no tiene movimientos asociados. Si el backend detecta uso previo, mostrara el motivo y no lo eliminara." : providerActionModal.kind === "deactivate" ? "El proveedor dejara de estar disponible para nuevas entradas, pero seguira visible para consulta historica." : "El proveedor volvera a estar disponible para usarse en nuevos movimientos."}</p><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setProviderActionModal(null)}><X size={15} />Cancelar</button><button type="button" className={`inv-btn ${providerActionModal.kind === "delete" ? "inv-btn-danger" : "inv-btn-primary"}`} disabled={saving} onClick={confirmProviderAction}>{providerActionModal.kind === "delete" ? <Trash2 size={15} /> : <Power size={15} />}{saving ? "Procesando..." : providerActionModal.kind === "delete" ? "Eliminar" : providerActionModal.kind === "deactivate" ? "Inactivar" : "Activar"}</button></div></div></Modal>}
      {showProductModal && <Modal title={productForm.productoId ? "Editar producto" : "Nuevo producto"} onClose={() => setShowProductModal(false)}><form className="inv-form" onSubmit={saveProduct}><label><span>Codigo del producto</span><input value={productForm.codigo} onChange={(e) => setProductForm((prev) => ({ ...prev, codigo: e.target.value }))} placeholder="Ej: BEB-001" required /></label><label><span>Nombre del producto</span><input value={productForm.nombre} onChange={(e) => setProductForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Arroz, aceite, tomate..." required /></label><label><span>Categoria</span><select value={productForm.tipoProductoId} onChange={(e) => setProductForm((prev) => ({ ...prev, tipoProductoId: e.target.value }))} required><option value="">Selecciona una categoria</option>{catalogos.tiposProducto.map((tipo) => <option key={pick(tipo, ["tipoProductoId", "TipoProductoId", "id", "Id"], "")} value={pick(tipo, ["tipoProductoId", "TipoProductoId", "id", "Id"], "")}>{pick(tipo, ["nombre", "Nombre"], "Categoria")}</option>)}</select></label><label><span>Unidad de medida</span><select value={productForm.unidadMedidaId} onChange={(e) => setProductForm((prev) => ({ ...prev, unidadMedidaId: e.target.value }))} required><option value="">Selecciona una unidad</option>{catalogos.unidadesMedida.map((unidad) => <option key={pick(unidad, ["unidadMedidaId", "UnidadMedidaId", "id", "Id"], "")} value={pick(unidad, ["unidadMedidaId", "UnidadMedidaId", "id", "Id"], "")}>{pick(unidad, ["abreviatura", "Abreviatura"], "")} {pick(unidad, ["nombre", "Nombre"], "Unidad")}</option>)}</select></label><label><span>Estado</span><select value={productForm.estado} onChange={(e) => setProductForm((prev) => ({ ...prev, estado: e.target.value }))}><option value="1">Activo</option><option value="0">Inactivo</option></select></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowProductModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
      {showProviderModal && <Modal title={providerForm.proveedorId ? "Editar proveedor" : "Nuevo proveedor"} onClose={() => setShowProviderModal(false)}><form className="inv-form" onSubmit={saveProvider}><label><span>Nombre</span><input value={providerForm.nombre} onChange={(e) => setProviderForm((prev) => ({ ...prev, nombre: e.target.value }))} required /></label><label><span>Contacto</span><input value={providerForm.nombreContacto} onChange={(e) => setProviderForm((prev) => ({ ...prev, nombreContacto: e.target.value }))} /></label><label><span>Telefono</span><input value={providerForm.telefono} onChange={(e) => setProviderForm((prev) => ({ ...prev, telefono: e.target.value }))} /></label><label><span>Email</span><input type="email" value={providerForm.email} onChange={(e) => setProviderForm((prev) => ({ ...prev, email: e.target.value }))} /></label><label className="full"><span>Direccion</span><input value={providerForm.direccion} onChange={(e) => setProviderForm((prev) => ({ ...prev, direccion: e.target.value }))} /></label><label><span>Estado</span><select value={providerForm.estado} onChange={(e) => setProviderForm((prev) => ({ ...prev, estado: e.target.value }))}><option value="1">Activo</option><option value="0">Inactivo</option></select></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowProviderModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
      {showCategoryModal && <Modal title={categoryForm.tipoProductoId ? "Editar categoria" : "Nueva categoria"} onClose={() => setShowCategoryModal(false)}><form className="inv-form" onSubmit={saveCategory}><label className="full"><span>Nombre de la categoria</span><input value={categoryForm.nombre} onChange={(e) => setCategoryForm((prev) => ({ ...prev, nombre: e.target.value }))} required /></label><label><span>Estado</span><select value={categoryForm.estado} onChange={(e) => setCategoryForm((prev) => ({ ...prev, estado: e.target.value }))}><option value="1">Activo</option><option value="0">Inactivo</option></select></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowCategoryModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
      {showUnitModal && <Modal title={unitForm.unidadMedidaId ? "Editar unidad de medida" : "Nueva unidad de medida"} onClose={() => setShowUnitModal(false)}><form className="inv-form" onSubmit={saveUnit}><label><span>Nombre</span><input value={unitForm.nombre} onChange={(e) => setUnitForm((prev) => ({ ...prev, nombre: e.target.value }))} required /></label><label><span>Abreviatura</span><input value={unitForm.abreviatura} onChange={(e) => setUnitForm((prev) => ({ ...prev, abreviatura: e.target.value }))} required /></label><label><span>Estado</span><select value={unitForm.estado} onChange={(e) => setUnitForm((prev) => ({ ...prev, estado: e.target.value }))}><option value="1">Activo</option><option value="0">Inactivo</option></select></label><div className="inv-modal-actions"><button type="button" className="inv-btn inv-btn-soft" onClick={() => setShowUnitModal(false)}><X size={15} />Cancelar</button><button type="submit" className="inv-btn inv-btn-primary" disabled={saving}><Save size={15} />{saving ? "Guardando..." : "Guardar"}</button></div></form></Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="inv-modal-backdrop">
      <div className="inv-modal">
        <div className="inv-modal-head">
          <h3>{title}</h3>
          <button type="button" className="inv-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="inv-modal-body">{children}</div>
      </div>
    </div>
  );
}
