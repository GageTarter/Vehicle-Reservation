function roleOf(user) {
  return user?.role || "";
}

export function isRequestor(user) {
  return ["requestor", "user", "approved_driver"].includes(roleOf(user));
}

export function isAreaAdmin(user) {
  return roleOf(user) === "area_admin";
}

export function isSystemAdmin(user) {
  return ["system_admin", "admin"].includes(roleOf(user));
}

export function isMaintenance(user) {
  return roleOf(user) === "maintenance";
}

export function canReportIssue(user) {
  return isRequestor(user);
}

export function canReviewIssues(user) {
  return isAreaAdmin(user) || isSystemAdmin(user);
}

export function canReturnVehicle(user) {
  return isAreaAdmin(user) || isSystemAdmin(user);
}

export function canManageMaintenance(user) {
  return isMaintenance(user) || isAreaAdmin(user) || isSystemAdmin(user);
}

export function canManageMileage(user) {
  return isMaintenance(user) || isAreaAdmin(user) || isSystemAdmin(user);
}

export function canManageAreaTools(user) {
  return isAreaAdmin(user) || isSystemAdmin(user);
}
