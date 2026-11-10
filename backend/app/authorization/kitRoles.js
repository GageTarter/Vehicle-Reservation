export function isRequestor(user) {
  return ["requestor", "user", "approved_driver"].includes(user?.role);
}

export function isAreaAdmin(user) {
  return user?.role === "area_admin";
}

export function isSystemAdmin(user) {
  return user?.role === "system_admin" || user?.role === "admin";
}

export function isMaintenance(user) {
  return user?.role === "maintenance";
}

export function canReportIssue(user) {
  return isRequestor(user);
}

export function canDeleteOwnIssue(user, issue) {
  return isRequestor(user) && issue?.reported_by === user.id;
}

export function canEditOwnIssue(user, issue) {
  return canDeleteOwnIssue(user, issue);
}

export function canManageMaintenance(user) {
  return isMaintenance(user) || isAreaAdmin(user) || isSystemAdmin(user);
}

export function canMarkReturned(user) {
  return isSystemAdmin(user) || isAreaAdmin(user);
}

export function canAccessVehicle(user, vehicle) {
  if (!user || !vehicle) {
    return false;
  }

  if (isSystemAdmin(user)) {
    return true;
  }

  if (isAreaAdmin(user) || isMaintenance(user)) {
    return vehicle.area_id === user.area_id;
  }

  return false;
}
