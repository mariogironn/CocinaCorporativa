import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  List,
  Plus,
  Search,
  SquarePen,
  Power,
  KeyRound,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Info,
  CircleHelp,
  TriangleAlert,
  Building2,
  Shield,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/usersAdmin.css";
import { getCurrentUser, hasPermission } from "../../../security/roles";

const API = "https://localhost:7042";
const PAGE_SIZE = 4;

const MODULES = [
  { key: "monitor_cocina", label: "Monitor Cocina" },
  { key: "gestion_menu", label: "Gestion Menu" },
  { key: "usuarios", label: "Usuarios" },
];

const EMPTY_FORM = {
  nombreCompleto: "",
  username: "",
  password: "",
  rol: "",
  sede: "",
  telefono: "",
  correo: "",
  areaTrabajo: "",
  activo: true,
  avatarUrl: "",
  avatarFile: null,
};

const EMPTY_ROLE_FORM = {
  nombre: "",
};

const EMPTY_SEDE_FORM = {
  nombre: "",
  ubicacion: "",
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const avatarFromName = (name, username) => {
  const source = (name || username || "U").trim();
  return source.slice(0, 2).toUpperCase();
};

const normalizeUser = (raw) => ({
  id: raw?.usuarioId ?? raw?.UsuarioId ?? raw?.id ?? raw?.Id ?? 0,
  nombreCompleto: raw?.nombreCompleto ?? raw?.NombreCompleto ?? "",
  username: raw?.username ?? raw?.Username ?? "",
  rol: raw?.rol ?? raw?.Rol ?? "",
  sede: raw?.sede ?? raw?.Sede ?? raw?.sedeNombre ?? raw?.SedeNombre ?? "",
  telefono: raw?.telefono ?? raw?.Telefono ?? "",
  correo: raw?.correo ?? raw?.Correo ?? "",
  areaTrabajo: raw?.areaTrabajo ?? raw?.AreaTrabajo ?? "",
  activo: raw?.activo ?? raw?.Activo ?? false,
  avatarUrl: raw?.avatarUrl ?? raw?.AvatarUrl ?? raw?.fotoUrl ?? raw?.FotoUrl ?? "",
  permisos: raw?.permisos ?? {},
});

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

function Modal({ open, onClose, maxWidth = 560, children }) {
  if (!open) return null;

  return (
    <div className="ua-modal-overlay" onMouseDown={onClose}>
      <div className="ua-modal" style={{ maxWidth }} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function UsuariosAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useMemo(() => getCurrentUser() || {}, []);
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const activeView = searchParams.get("view") || "listado";
  const selectedPermissionUserId = Number(searchParams.get("userId") || 0);

  const canView = hasPermission(currentUser, "users.view") || hasPermission(currentUser, "*");
  const canCreate = hasPermission(currentUser, "users.create") || hasPermission(currentUser, "*");
  const canEdit = hasPermission(currentUser, "users.edit") || hasPermission(currentUser, "*");
  const canDelete = hasPermission(currentUser, "users.delete") || hasPermission(currentUser, "*");
  const canToggle = hasPermission(currentUser, "users.toggle") || hasPermission(currentUser, "*");
  const canReset = hasPermission(currentUser, "users.reset_password") || hasPermission(currentUser, "*");
  const canPermissions = hasPermission(currentUser, "users.permissions") || hasPermission(currentUser, "*");

  const [users, setUsers] = useState([]);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [sedesCatalog, setSedesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [editor, setEditor] = useState({
    open: false,
    mode: "new",
    targetId: null,
    form: { ...EMPTY_FORM },
  });

  const [roleEditor, setRoleEditor] = useState({
    open: false,
    form: { ...EMPTY_ROLE_FORM },
  });

  const [sedeEditor, setSedeEditor] = useState({
    open: false,
    form: { ...EMPTY_SEDE_FORM },
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    user: null,
  });

  const [resultDialog, setResultDialog] = useState({
    open: false,
    title: "",
    text: "",
    tone: "info",
  });

  const [permissionsDialog, setPermissionsDialog] = useState({
    open: false,
    user: null,
    draft: {},
  });

  const authHeaders = useMemo(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const setView = (view, userId = null) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", view);

    if (userId) {
      next.set("userId", String(userId));
    } else {
      next.delete("userId");
    }

    setSearchParams(next);
  };

  const showResult = (title, text, tone = "info") => {
    setResultDialog({ open: true, title, text, tone });
  };

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const text = await response.text();

    let data = null;
    if (text?.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || data?.raw || `${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return data;
  };

  const uploadAdminAvatar = async (userId, file) => {
    if (!file || !userId) return "";

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("Avatar", file);

    const data = await fetchJson(`${API}/api/AdminUsuarios/${userId}/avatar`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return data?.avatarUrl || data?.AvatarUrl || "";
  };

  const loadCatalogos = async () => {
    const data = await fetchJson(`${API}/api/AdminUsuarios/catalogos`, {
      method: "GET",
      headers: authHeaders,
    });

    setRolesCatalog(Array.isArray(data?.roles) ? data.roles : []);
    setSedesCatalog(Array.isArray(data?.sedes) ? data.sedes : []);
  };

  const loadUsersFromApi = async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchJson(`${API}/api/AdminUsuarios`, {
        method: "GET",
        headers: authHeaders,
      });

      const normalized = Array.isArray(data) ? data.map(normalizeUser) : [];
      setUsers(normalized);
    } catch (error) {
      showResult("Error al cargar usuarios", error.message || "No se pudo consultar la API.", "warn");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await loadCatalogos();
        await loadUsersFromApi();
      } catch {
        setLoading(false);
      }
    })();
  }, [canView, token]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    return users.filter((user) => {
      const byRole = roleFilter === "ALL" || String(user.rol || "").toUpperCase() === roleFilter;
      if (!byRole) return false;
      if (!text) return true;

      const haystack = [
        user.nombreCompleto,
        user.username,
        user.correo,
        user.telefono,
        user.sede,
        user.areaTrabajo,
      ].join(" ").toLowerCase();

      return haystack.includes(text);
    });
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const roleFilterOptions = useMemo(() => {
    const fromUsers = Array.from(new Set(users.map((user) => String(user.rol || "").toUpperCase()))).filter(Boolean);
    const fromCatalog = rolesCatalog.map((r) => String(r.nombre || "").toUpperCase()).filter(Boolean);
    return ["ALL", ...Array.from(new Set([...fromCatalog, ...fromUsers]))];
  }, [users, rolesCatalog]);

  const openNew = () => {
    setEditor({
      open: true,
      mode: "new",
      targetId: null,
      form: {
        ...EMPTY_FORM,
        rol: rolesCatalog[0]?.nombre || "",
        sede: sedesCatalog[0]?.nombre || "",
      },
    });
  };

  const openEdit = (user) => {
    setEditor({
      open: true,
      mode: "edit",
      targetId: user.id,
      form: {
        nombreCompleto: user.nombreCompleto || "",
        username: user.username || "",
        password: "",
        rol: user.rol || "",
        sede: user.sede || "",
        telefono: user.telefono || "",
        correo: user.correo || "",
        areaTrabajo: user.areaTrabajo || "",
        activo: Boolean(user.activo),
        avatarUrl: user.avatarUrl || "",
        avatarFile: null,
      },
    });
  };

  const closeEditor = () => {
    setEditor({ open: false, mode: "new", targetId: null, form: { ...EMPTY_FORM } });
  };

  const exportarPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Listado de Usuarios", 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [[
        "Usuario",
        "Nombre completo",
        "Rol",
        "Sede",
        "Telefono",
        "Correo",
        "Area",
        "Estado",
      ]],
      body: filtered.map((u) => [
        u.username || "",
        u.nombreCompleto || "",
        u.rol || "",
        u.sede || "",
        u.telefono || "",
        u.correo || "",
        u.areaTrabajo || "",
        u.activo ? "Activo" : "Inactivo",
      ]),
    });

    doc.save("usuarios.pdf");
  };

  const upsertUser = async () => {
    const form = editor.form;

    if (!form.nombreCompleto.trim() || !form.username.trim()) {
      showResult("Campos requeridos", "Nombre completo y usuario son obligatorios.", "warn");
      return;
    }

    if (!form.rol.trim()) {
      showResult("Rol requerido", "Debes seleccionar un rol valido del catalogo.", "warn");
      return;
    }

    if (editor.mode === "new" && !form.password.trim()) {
      showResult("Contrasena requerida", "Para crear un usuario nuevo debes definir contrasena.", "warn");
      return;
    }

    try {
      const payload = {
        nombreCompleto: form.nombreCompleto.trim(),
        username: form.username.trim(),
        contrasena: form.password.trim(),
        rol: form.rol.trim(),
        sede: form.sede.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        areaTrabajo: form.areaTrabajo.trim(),
        activo: Boolean(form.activo),
      };

      if (editor.mode === "new") {
        const created = await fetchJson(`${API}/api/AdminUsuarios`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const createdUserId = created?.usuarioId ?? created?.UsuarioId ?? created?.id ?? created?.Id;
        if (form.avatarFile && createdUserId) {
          await uploadAdminAvatar(createdUserId, form.avatarFile);
        }

        closeEditor();
        await loadUsersFromApi();
        showResult(
          "Usuario creado",
          `Se creo el usuario ${form.nombreCompleto.trim()}${form.avatarFile ? " y se asigno su avatar." : "."}`,
          "ok"
        );
        return;
      }

      await fetchJson(`${API}/api/AdminUsuarios/${editor.targetId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let avatarUrl = form.avatarUrl || "";
      if (form.avatarFile && editor.targetId) {
        avatarUrl = await uploadAdminAvatar(editor.targetId, form.avatarFile);
      }

      try {
        const rawSession = localStorage.getItem("usuario");
        if (rawSession) {
          const parsedSession = JSON.parse(rawSession);
          const sessionUserId = parsedSession?.usuarioId ?? parsedSession?.UsuarioId ?? parsedSession?.id ?? parsedSession?.Id;

          if (String(sessionUserId || "") === String(editor.targetId || "") && avatarUrl) {
            const merged = { ...parsedSession, avatarUrl: avatarUrl.replace(/\?v=\d+$/, "") };
            localStorage.setItem("usuario", JSON.stringify(merged));
            window.dispatchEvent(new Event("usuario-updated"));
          }
        }
      } catch {
        // Si falla la sincronizacion local, igual mantenemos el cambio en servidor.
      }

      closeEditor();
      await loadUsersFromApi();
      showResult(
        "Usuario actualizado",
        `Los datos del usuario fueron guardados${form.avatarFile ? " y su avatar fue actualizado" : ""}.`,
        "ok"
      );
    } catch (error) {
      showResult("Error al guardar", error.message || "No se pudo guardar el usuario.", "warn");
    }
  };

  const guardarRol = async () => {
    const nombre = roleEditor.form.nombre.trim().toUpperCase();
    if (!nombre) {
      showResult("Rol requerido", "Debes ingresar el nombre del rol.", "warn");
      return;
    }

    try {
      await fetchJson(`${API}/api/Roles`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });

      setRoleEditor({ open: false, form: { ...EMPTY_ROLE_FORM } });
      await loadCatalogos();
      showResult("Rol creado", `Se creo el rol ${nombre}.`, "ok");
    } catch (error) {
      showResult("Error al crear rol", error.message || "No se pudo crear el rol.", "warn");
    }
  };

  const guardarSede = async () => {
    const nombre = sedeEditor.form.nombre.trim();
    if (!nombre) {
      showResult("Sede requerida", "Debes ingresar el nombre de la sede.", "warn");
      return;
    }

    try {
      await fetchJson(`${API}/api/Sedes`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          ubicacion: sedeEditor.form.ubicacion.trim(),
        }),
      });

      setSedeEditor({ open: false, form: { ...EMPTY_SEDE_FORM } });
      await loadCatalogos();
      showResult("Sede creada", `Se creo la sede ${nombre}.`, "ok");
    } catch (error) {
      showResult("Error al crear sede", error.message || "No se pudo crear la sede.", "warn");
    }
  };

  const openConfirm = (type, user) => {
    setConfirmDialog({ open: true, type, user });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, type: "", user: null });
  };

  const runConfirmAction = async () => {
    const { type, user } = confirmDialog;
    if (!user) return;

    try {
      if (type === "toggle") {
        await fetchJson(`${API}/api/AdminUsuarios/${user.id}/estado`, {
          method: "PATCH",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ activo: !user.activo }),
        });

        closeConfirm();
        await loadUsersFromApi();
        showResult("Estado actualizado", `El usuario ${user.nombreCompleto} fue actualizado.`, "info");
        return;
      }

      if (type === "reset") {
        const result = await fetchJson(`${API}/api/AdminUsuarios/${user.id}/reset-password`, {
          method: "POST",
          headers: authHeaders,
        });

        closeConfirm();
        showResult(
          "Contrasena restablecida",
          result?.temporalPassword
            ? `La nueva contrasena temporal es: ${result.temporalPassword}`
            : "La contrasena fue restablecida correctamente.",
          "ok"
        );
        return;
      }

      if (type === "delete") {
        await fetchJson(`${API}/api/AdminUsuarios/${user.id}`, {
          method: "DELETE",
          headers: authHeaders,
        });

        closeConfirm();
        await loadUsersFromApi();
        showResult("Usuario eliminado", `Se elimino a ${user.nombreCompleto}.`, "warn");
      }
    } catch (error) {
      closeConfirm();
      showResult("Operacion fallida", error.message || "No se pudo completar la operacion.", "warn");
    }
  };

  const confirmCopy = useMemo(() => {
    const user = confirmDialog.user;
    if (!user) return null;

    if (confirmDialog.type === "toggle") {
      const activating = !user.activo;
      return {
        icon: <Info size={58} />,
        iconClass: "ua-confirm-icon info",
        title: activating ? "Activar usuario" : "Inactivar usuario",
        text: `El usuario ${user.nombreCompleto} pasara a estado ${activating ? "activo" : "inactivo"}.`,
        confirmLabel: "Confirmar",
        confirmClass: "success",
        cancelLabel: "Cancelar",
      };
    }

    if (confirmDialog.type === "reset") {
      return {
        icon: <CircleHelp size={58} />,
        iconClass: "ua-confirm-icon info",
        title: "Restablecer contrasena",
        text: `Se restablecera la contrasena de ${user.nombreCompleto}. Deseas continuar?`,
        confirmLabel: "Si, restablecer",
        confirmClass: "success",
        cancelLabel: "Cancelar",
      };
    }

    return {
      icon: <TriangleAlert size={58} />,
      iconClass: "ua-confirm-icon warn",
      title: "Eliminar usuario?",
      text: `Se eliminara a ${user.nombreCompleto} (@${user.username}). Esta accion no se puede deshacer.`,
      confirmLabel: "Si, eliminar",
      confirmClass: "danger",
      cancelLabel: "Cancelar",
    };
  }, [confirmDialog]);

  const openPermissions = async (user) => {
    try {
      const data = await fetchJson(`${API}/api/AdminUsuarios/${user.id}/permisos`, {
        method: "GET",
        headers: authHeaders,
      });

      setPermissionsDialog({
        open: true,
        user,
        draft: clone(data?.permisos || {}),
      });
      setView("permisos", user.id);
    } catch (error) {
      showResult("Error al cargar permisos", error.message || "No se pudieron obtener los permisos.", "warn");
    }
  };

  const closePermissions = () => {
    setPermissionsDialog({ open: false, user: null, draft: {} });
    setView("listado");
  };

  const togglePermission = (moduleKey, actionKey) => {
    setPermissionsDialog((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        [moduleKey]: {
          ...prev.draft[moduleKey],
          [actionKey]: !prev.draft[moduleKey]?.[actionKey],
        },
      },
    }));
  };

  const savePermissions = async () => {
    if (!permissionsDialog.user) return;

    try {
      await fetchJson(`${API}/api/AdminUsuarios/${permissionsDialog.user.id}/permisos`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(permissionsDialog.draft),
      });

      closePermissions();
      showResult("Permisos guardados", "Los permisos fueron guardados correctamente.", "ok");
    } catch (error) {
      showResult("Error al guardar permisos", error.message || "No se pudieron guardar los permisos.", "warn");
    }
  };

  useEffect(() => {
    if (activeView !== "permisos" || !selectedPermissionUserId || permissionsDialog.user?.id === selectedPermissionUserId) return;

    const targetUser = users.find((user) => user.id === selectedPermissionUserId);
    if (!targetUser) return;

    openPermissions(targetUser);
  }, [activeView, selectedPermissionUserId, users]);

  useEffect(() => {
    if (activeView === "permisos" || !permissionsDialog.user) return;
    setPermissionsDialog((prev) => ({ ...prev, open: false }));
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "permisos" || selectedPermissionUserId || !permissionsDialog.user) return;
    setPermissionsDialog({ open: false, user: null, draft: {} });
  }, [activeView, selectedPermissionUserId]);

  const noAccess = !canView;
  const editorAvatarPreview = useMemo(() => {
    if (!editor.open) return "";
    if (editor.form.avatarFile) return URL.createObjectURL(editor.form.avatarFile);
    return resolveAvatarUrl(editor.form.avatarUrl);
  }, [editor.open, editor.form.avatarFile, editor.form.avatarUrl]);
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (!editorAvatarPreview || !editorAvatarPreview.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(editorAvatarPreview);
  }, [editorAvatarPreview]);

  return (
    <div className="ua-page">
      <div className="ua-shell">
        <h2 className="ua-title">Administrador de Usuarios</h2>

        {noAccess ? (
          <div className="ua-no-access">No tienes permiso para ver este modulo.</div>
        ) : (
          activeView === "permisos" ? (
            <section className="ua-card">
              <div className="ua-card-head">
                <h3><Shield size={18} /> PERMISOS</h3>
              </div>

              {!canPermissions ? (
                <div className="ua-empty">No tienes permiso para administrar permisos.</div>
              ) : (
                <>
                  <div className="ua-tools ua-tools-single">
                    <select
                      value={selectedPermissionUserId || ""}
                      onChange={(event) => {
                        const userId = Number(event.target.value || 0);
                        if (!userId) {
                          setPermissionsDialog({ open: false, user: null, draft: {} });
                          setView("permisos");
                          return;
                        }

                        const targetUser = users.find((user) => user.id === userId);
                        if (targetUser) {
                          openPermissions(targetUser);
                        }
                      }}
                      className="ua-filter"
                    >
                      <option value="">Selecciona un usuario</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nombreCompleto} (@{user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!permissionsDialog.user ? (
                    <div className="ua-empty">Selecciona un usuario para administrar sus permisos.</div>
                  ) : (
                    <>
                      <div className="ua-user-card">
                        <div className="ua-user-avatar">
                          {permissionsDialog.user.avatarUrl ? (
                            <img src={resolveAvatarUrl(permissionsDialog.user.avatarUrl)} alt="Avatar del usuario" />
                          ) : (
                            avatarFromName(permissionsDialog.user.nombreCompleto, permissionsDialog.user.username)
                          )}
                        </div>
                        <div className="ua-user-meta">
                          <strong>{permissionsDialog.user.nombreCompleto}</strong>
                          <span>@{permissionsDialog.user.username} | {permissionsDialog.user.rol} | {permissionsDialog.user.sede}</span>
                          <span>{permissionsDialog.user.telefono || "Sin telefono"} | {permissionsDialog.user.correo || "Sin correo"} | {permissionsDialog.user.areaTrabajo || "Sin area"}</span>
                        </div>
                      </div>

                      <h4 className="ua-subtitle">Permisos por modulo</h4>
                      <div className="ua-perm-wrap">
                        <table className="ua-table ua-perm-table">
                          <thead>
                            <tr>
                              <th>Modulo</th>
                              <th>Ver</th>
                              <th>Crear</th>
                              <th>Editar</th>
                              <th>Eliminar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {MODULES.map((module) => (
                              <tr key={module.key}>
                                <td>{module.label}</td>
                                {["ver", "crear", "editar", "eliminar"].map((actionKey) => (
                                  <td key={`${module.key}-${actionKey}`}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(permissionsDialog.draft?.[module.key]?.[actionKey])}
                                      onChange={() => togglePermission(module.key, actionKey)}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="ua-modal-actions">
                        <button className="ua-btn" onClick={() => setView("listado")}>Volver al listado</button>
                        <button className="ua-btn ua-btn-success" onClick={savePermissions}>Guardar permisos</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          ) : (
            <section className="ua-card">
              <div className="ua-card-head">
                <h3><List size={18} /> LISTADO DE USUARIOS</h3>

                <div className="ua-head-stack">
                  <div className="ua-head-top-action">
                    <span className="ua-head-selected-user">
                      {selectedUser ? `Seleccionado: ${selectedUser.nombreCompleto}` : "Selecciona un usuario para gestionar permisos"}
                    </span>
                    <button className="ua-btn ua-btn-soft" onClick={() => selectedUser && openPermissions(selectedUser)} disabled={!canPermissions || !selectedUser}>
                      <Shield size={16} /> Ir a permisos
                    </button>
                  </div>

                  <div className="ua-head-actions">
                    <button className="ua-btn" onClick={() => setRoleEditor({ open: true, form: { ...EMPTY_ROLE_FORM } })}>
                      <Shield size={16} /> Nuevo Rol
                    </button>

                    <button className="ua-btn" onClick={() => setSedeEditor({ open: true, form: { ...EMPTY_SEDE_FORM } })}>
                      <Building2 size={16} /> Nueva Sede
                    </button>

                    <button className="ua-btn" onClick={exportarPdf}>
                      <FileDown size={16} /> Exportar PDF
                    </button>

                    <button className="ua-btn ua-btn-success" onClick={openNew} disabled={!canCreate}>
                      <Plus size={16} /> Nuevo Usuario
                    </button>
                  </div>
                </div>
              </div>

              <div className="ua-tools">
                <label className="ua-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por nombre, usuario o correo..."
                  />
                </label>

                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setPage(1);
                  }}
                  className="ua-filter"
                >
                  {roleFilterOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "ALL" ? "Todos los roles" : role}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="ua-empty">Cargando usuarios...</div>
              ) : (
                <>
                  <div className="ua-table-wrap">
                    <table className="ua-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Nombre completo</th>
                          <th>Rol</th>
                          <th>Sede</th>
                          <th>Telefono</th>
                          <th>Correo</th>
                          <th>Area</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!pageRows.length && (
                          <tr>
                            <td colSpan={9} className="ua-empty">No hay usuarios para mostrar.</td>
                          </tr>
                        )}

                        {pageRows.map((user) => (
                          <tr key={user.id} className={selectedUserId === user.id ? "ua-row-selected" : ""} onClick={() => setSelectedUserId(user.id)}>
                            <td className="ua-strong">{user.username}</td>
                            <td>{user.nombreCompleto}</td>
                            <td>{user.rol}</td>
                            <td>{user.sede || "-"}</td>
                            <td>{user.telefono || "-"}</td>
                            <td>{user.correo || "-"}</td>
                            <td>{user.areaTrabajo || "-"}</td>
                            <td>
                              <span className={`ua-state ${user.activo ? "active" : "inactive"}`}>
                              {user.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="ua-actions">
                                <button className="ua-icon-btn" title="Editar usuario" onClick={() => openEdit(user)} disabled={!canEdit}>
                                  <SquarePen size={15} />
                                </button>
                                <button className="ua-icon-btn" title={user.activo ? "Inactivar" : "Activar"} onClick={() => openConfirm("toggle", user)} disabled={!canToggle}>
                                  <Power size={15} />
                                </button>
                                <button className="ua-icon-btn" title="Restablecer contrasena" onClick={() => openConfirm("reset", user)} disabled={!canReset}>
                                  <KeyRound size={15} />
                                </button>
                                <button className="ua-icon-btn danger" title="Eliminar usuario" onClick={() => openConfirm("delete", user)} disabled={!canDelete}>
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="ua-pagination">
                    <span>
                      {filtered.length ? `${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filtered.length)}` : "0-0"} de {filtered.length}
                    </span>

                    <div className="ua-pagination-actions">
                      <button className="ua-icon-btn" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>
                        <ChevronLeft size={16} />
                      </button>
                      <button className="ua-icon-btn" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )
        )}
      </div>

      <Modal open={editor.open} onClose={closeEditor} maxWidth={780}>
        <div className="ua-modal-head">
          <h3>{editor.mode === "new" ? "Nuevo Usuario" : "Editar Usuario"}</h3>
          <button className="ua-close" onClick={closeEditor}>
            <X size={16} />
          </button>
        </div>

        <div className="ua-form-grid">
          <div className="ua-grid-full ua-avatar-editor">
            <div className="ua-avatar-editor-preview">
              {editorAvatarPreview ? (
                <img src={editorAvatarPreview} alt="Avatar del usuario" />
              ) : (
                avatarFromName(editor.form.nombreCompleto, editor.form.username)
              )}
            </div>

            <div className="ua-avatar-editor-copy">
              <strong>Avatar del usuario</strong>
              <span>El administrador puede asignar o reemplazar la foto de perfil desde aqu�.</span>
            </div>

            <label className="ua-avatar-upload-btn">
              Elegir avatar
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    form: { ...prev.form, avatarFile: event.target.files?.[0] || null },
                  }))
                }
              />
            </label>
          </div>

          <label>
            Nombre completo
            <input value={editor.form.nombreCompleto} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, nombreCompleto: event.target.value } }))} />
          </label>

          <label>
            Usuario
            <input value={editor.form.username} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, username: event.target.value } }))} />
          </label>

          <label>
            Contrasena {editor.mode === "edit" ? "(dejar vacio para no cambiar)" : ""}
            <input type="password" value={editor.form.password} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, password: event.target.value } }))} />
          </label>

          <label>
            Rol
            <select value={editor.form.rol} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, rol: event.target.value } }))}>
              <option value="">Selecciona un rol</option>
              {rolesCatalog.map((role) => (
                <option key={role.rolId} value={role.nombre}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sede
            <select value={editor.form.sede} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, sede: event.target.value } }))}>
              <option value="">Selecciona una sede</option>
              {sedesCatalog.map((sede) => (
                <option key={sede.sedeId} value={sede.nombre}>
                  {sede.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Telefono
            <input value={editor.form.telefono} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, telefono: event.target.value } }))} />
          </label>

          <label>
            Correo
            <input value={editor.form.correo} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, correo: event.target.value } }))} />
          </label>

          <label className="ua-grid-full">
            Area de trabajo
            <input value={editor.form.areaTrabajo} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, areaTrabajo: event.target.value } }))} />
          </label>

          <label className="ua-check ua-grid-full">
            <input type="checkbox" checked={editor.form.activo} onChange={(event) => setEditor((prev) => ({ ...prev, form: { ...prev.form, activo: event.target.checked } }))} />
            Usuario activo
          </label>
        </div>

        <div className="ua-modal-actions">
          <button className="ua-btn" onClick={closeEditor}>Cancelar</button>
          <button className="ua-btn ua-btn-success" onClick={upsertUser}>
            <Save size={16} /> Guardar
          </button>
        </div>
      </Modal>

      <Modal open={roleEditor.open} onClose={() => setRoleEditor({ open: false, form: { ...EMPTY_ROLE_FORM } })} maxWidth={500}>
        <div className="ua-modal-head">
          <h3>Nuevo Rol</h3>
          <button className="ua-close" onClick={() => setRoleEditor({ open: false, form: { ...EMPTY_ROLE_FORM } })}>
            <X size={16} />
          </button>
        </div>

        <div className="ua-form-grid">
          <label className="ua-grid-full">
            Nombre del rol
            <input
              value={roleEditor.form.nombre}
              onChange={(event) => setRoleEditor((prev) => ({ ...prev, form: { ...prev.form, nombre: event.target.value } }))}
              placeholder="Ej: OPERADOR"
            />
          </label>
        </div>

        <div className="ua-modal-actions">
          <button className="ua-btn" onClick={() => setRoleEditor({ open: false, form: { ...EMPTY_ROLE_FORM } })}>Cancelar</button>
          <button className="ua-btn ua-btn-success" onClick={guardarRol}>
            <Save size={16} /> Guardar rol
          </button>
        </div>
      </Modal>

      <Modal open={sedeEditor.open} onClose={() => setSedeEditor({ open: false, form: { ...EMPTY_SEDE_FORM } })} maxWidth={560}>
        <div className="ua-modal-head">
          <h3>Nueva Sede</h3>
          <button className="ua-close" onClick={() => setSedeEditor({ open: false, form: { ...EMPTY_SEDE_FORM } })}>
            <X size={16} />
          </button>
        </div>

        <div className="ua-form-grid">
          <label>
            Nombre
            <input
              value={sedeEditor.form.nombre}
              onChange={(event) => setSedeEditor((prev) => ({ ...prev, form: { ...prev.form, nombre: event.target.value } }))}
              placeholder="Ej: Sede Zona 12"
            />
          </label>

          <label>
            Ubicacion
            <input
              value={sedeEditor.form.ubicacion}
              onChange={(event) => setSedeEditor((prev) => ({ ...prev, form: { ...prev.form, ubicacion: event.target.value } }))}
              placeholder="Ej: Ciudad de Guatemala"
            />
          </label>
        </div>

        <div className="ua-modal-actions">
          <button className="ua-btn" onClick={() => setSedeEditor({ open: false, form: { ...EMPTY_SEDE_FORM } })}>Cancelar</button>
          <button className="ua-btn ua-btn-success" onClick={guardarSede}>
            <Save size={16} /> Guardar sede
          </button>
        </div>
      </Modal>

      <Modal open={confirmDialog.open && Boolean(confirmCopy)} onClose={closeConfirm} maxWidth={520}>
        {confirmCopy && (
          <div className="ua-confirm-body">
            <div className={confirmCopy.iconClass}>{confirmCopy.icon}</div>
            <h3>{confirmCopy.title}</h3>
            <p>{confirmCopy.text}</p>
            <div className="ua-modal-actions centered">
              {confirmCopy.cancelLabel && <button className="ua-btn" onClick={closeConfirm}>{confirmCopy.cancelLabel}</button>}
              <button className={`ua-btn ${confirmCopy.confirmClass === "danger" ? "ua-btn-danger" : "ua-btn-success"}`} onClick={runConfirmAction}>
                {confirmCopy.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={resultDialog.open} onClose={() => setResultDialog({ open: false, title: "", text: "", tone: "info" })} maxWidth={520}>
        <div className="ua-confirm-body">
          <div className={`ua-confirm-icon ${resultDialog.tone === "warn" ? "warn" : "info"}`}>
            <Info size={58} />
          </div>
          <h3>{resultDialog.title}</h3>
          <p>{resultDialog.text}</p>
          <div className="ua-modal-actions centered">
            <button className="ua-btn ua-btn-success" onClick={() => setResultDialog({ open: false, title: "", text: "", tone: "info" })}>
              OK
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}


