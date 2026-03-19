const DEFAULT_ROLE_MATRIX = {
  ADMIN: ["*"],
  COCINA: [
    "dashboard.view",
    "menu.view",
    "menu.edit",
    "menu.delete_photo",
    "menu.cutoff.edit",
    "inventory.view",
    "profile.view",
  ],
  AUDITOR: [
    "dashboard.view",
    "menu.view",
    "historial.view",
    "inventory.view",
    "profile.view",
  ],
};

const ROLE_OPTIONS = ["ADMIN", "COCINA", "AUDITOR"];

const normalizeRole = (value) => String(value || "AUDITOR").trim().toUpperCase();

const normalizePermissionsFromApi = (permisos) => {
  if (!permisos || typeof permisos !== "object") return [];

  const map = {
    monitor_cocina: "dashboard",
    gestion_menu: "menu",
    inventario: "inventory",
    historial: "historial",
    usuarios: "users",
  };

  const out = [];

  Object.entries(permisos).forEach(([moduleKey, actions]) => {
    const prefix = map[moduleKey] || moduleKey;
    if (!actions || typeof actions !== "object") return;

    if (actions.ver) out.push(`${prefix}.view`);
    if (actions.crear) out.push(`${prefix}.create`);
    if (actions.editar) out.push(`${prefix}.edit`);
    if (actions.eliminar) out.push(`${prefix}.delete`);

    if (prefix === "menu" && actions.editar) out.push("menu.cutoff.edit");
    if (prefix === "menu" && actions.eliminar) out.push("menu.delete_photo");

    if (prefix === "users" && actions.ver) out.push("users.view");
    if (prefix === "users" && actions.crear) out.push("users.create");
    if (prefix === "users" && actions.editar) {
      out.push("users.edit");
      out.push("users.permissions");
      out.push("users.role.assign");
      out.push("users.toggle");
      out.push("users.reset_password");
      out.push("users.avatar.edit");
    }
    if (prefix === "users" && actions.eliminar) out.push("users.delete");
  });

  out.push("profile.view");

  return Array.from(new Set(out));
};

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getRolePermissions = (role) =>
  DEFAULT_ROLE_MATRIX[normalizeRole(role)] || DEFAULT_ROLE_MATRIX.AUDITOR;

const getUserPermissions = (user) => {
  if (!user) return [];
  if (Array.isArray(user.permissions) && user.permissions.length) return user.permissions;
  if (user.permisos && typeof user.permisos === "object") return normalizePermissionsFromApi(user.permisos);
  return getRolePermissions(user.rol);
};

const hasPermission = (user, permission) => {
  const permissions = getUserPermissions(user);
  return permissions.includes("*") || permissions.includes(permission);
};

export {
  ROLE_OPTIONS,
  normalizeRole,
  normalizePermissionsFromApi,
  getCurrentUser,
  getRolePermissions,
  getUserPermissions,
  hasPermission,
};
