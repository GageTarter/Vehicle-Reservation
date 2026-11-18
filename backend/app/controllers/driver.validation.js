import { isValidDate } from "./vehicle.validation.js";

const REQUIRED = {
  name: "driver name is required.",
  lastName: "driver last name is required.",
  driverID: "driver ID is required.",
  licenseState: "driver license state is required.",
  licenseExp: "driver license expiration is required.",
  approvedDate: "driver approved date is required.",
  area: "driver area is required.",
  status: "driver status is required.",
};

const MAX_LENGTH = {
  name: "driver name must be 100 characters or fewer.",
  lastName: "driver last name must be 100 characters or fewer.",
  driverID: "driver ID must be 100 characters or fewer.",
  licenseState: "driver license state must be 100 characters or fewer.",
  status: "driver status must be 100 characters or fewer.",
};

function trimmed(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function toIsoDate(value) {
  const text = String(value).trim();
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const dashed = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const [year, month, day] = slash
    ? [Number(slash[3]) < 100 ? Number(slash[3]) + 2000 : Number(slash[3]), slash[1], slash[2]]
    : [dashed[1], dashed[2], dashed[3]];

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function validateDriver(body) {
  const values = {
    name: trimmed(body?.name),
    lastName: trimmed(body?.lastName),
    driverID: trimmed(body?.driverID),
    licenseState: trimmed(body?.licenseState),
    licenseExp: trimmed(body?.licenseExp),
    approvedDate: trimmed(body?.approvedDate),
    area: trimmed(body?.area),
    status: trimmed(body?.status),
  };

  for (const key of Object.keys(REQUIRED)) {
    if (isBlank(values[key])) {
      return { message: REQUIRED[key] };
    }
  }

  for (const key of Object.keys(MAX_LENGTH)) {
    if (String(values[key]).length > 100) {
      return { message: MAX_LENGTH[key] };
    }
  }

  if (!isValidDate(values.licenseExp)) {
    return { message: "driver license expiration must be a valid date." };
  }

  if (!isValidDate(values.approvedDate)) {
    return { message: "driver approved date must be a valid date." };
  }

  return {
    value: {
      ...values,
      driverID: String(values.driverID),
      licenseExp: toIsoDate(values.licenseExp),
      approvedDate: toIsoDate(values.approvedDate),
    },
  };
}

export function toDriverJson(row) {
  return {
    id: row.id,
    name: row.name,
    lastName: row.lastName,
    driverID: row.driverID,
    licenseState: row.licenseState,
    licenseExp: row.licenseExp,
    approvedDate: row.approvedDate,
    area: row.area,
    status: row.status,
  };
}
