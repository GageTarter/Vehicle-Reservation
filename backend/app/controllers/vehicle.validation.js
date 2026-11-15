const VIN_VALUES = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const REQUIRED = {
  make: "vehicle make is required.",
  model: "vehicle model is required.",
  year: "vehicle year is required.",
  vin: "vehicle vin is required.",
  purchaseDate: "vehicle purchase date is required.",
  color: "vehicle color is required.",
  passengerCapacity: "vehicle passenger capacity is required.",
  licensePlateNo: "vehicle license plate number is required.",
  licensePlateExp: "vehicle license plate expiration is required.",
  area: "vehicle area is required.",
};

function trimmed(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function isValidVin(vin) {
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < vin.length; index += 1) {
    const character = vin[index];
    const value = /[0-9]/.test(character) ? Number(character) : VIN_VALUES[character];
    sum += value * VIN_WEIGHTS[index];
  }

  const remainder = sum % 11;
  const check = remainder === 10 ? "X" : String(remainder);

  return vin[8] === check;
}

export function isValidDate(value) {
  const text = String(value).trim();
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const dashed = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year;
  let month;
  let day;

  if (slash) {
    month = Number(slash[1]);
    day = Number(slash[2]);
    year = Number(slash[3]);
    if (year < 100) {
      year += 2000;
    }
  } else if (dashed) {
    year = Number(dashed[1]);
    month = Number(dashed[2]);
    day = Number(dashed[3]);
  } else {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateVehicle(body, mode) {
  const editing = mode === "edit";
  const make = trimmed(body?.make);
  const model = trimmed(body?.model);
  const year = trimmed(body?.year);
  const vin = trimmed(body?.vin);
  const purchaseDate = trimmed(body?.purchaseDate);
  const color = trimmed(body?.color);
  const licensePlateNo = trimmed(body?.licensePlateNo);
  const licensePlateExp = trimmed(body?.licensePlateExp);
  const area = trimmed(body?.area);
  const capacityBlank = isBlank(body?.passengerCapacity);
  const values = {
    make,
    model,
    year,
    vin,
    purchaseDate,
    color,
    passengerCapacity: body?.passengerCapacity,
    licensePlateNo,
    licensePlateExp,
    area,
  };

  if (editing && (Object.entries(values).some(([key, value]) => key !== "passengerCapacity" && isBlank(value)) || capacityBlank)) {
    return { message: "All fields must be filled." };
  }

  for (const key of Object.keys(REQUIRED)) {
    if (key === "passengerCapacity" ? capacityBlank : isBlank(values[key])) {
      return { message: REQUIRED[key] };
    }
  }

  if (make.length > 100) {
    return { message: "vehicle make must be 100 characters or fewer." };
  }

  if (model.length > 100) {
    return { message: "vehicle model must be 100 characters or fewer." };
  }

  if (!/^\d+$/.test(year) || year.length > 4 || (editing && year.length !== 4)) {
    return { message: editing ? "vehicle year must be 4 digits." : "vehicle year must be 4 digits or fewer." };
  }

  if (vin.length > 17) {
    return { message: "vehicle vin must be 17 characters or fewer." };
  }

  if (editing && vin.length !== 17) {
    return { message: "vehicle vin must be 17 characters exactly." };
  }

  if (!isValidVin(vin)) {
    return { message: "vehicle vin is invalid." };
  }

  if (!isValidDate(purchaseDate)) {
    return { message: "vehicle purchase date must be a valid date." };
  }

  if (color.length > 100) {
    return { message: "vehicle color must be 100 characters or fewer." };
  }

  const capacity = Number(body.passengerCapacity);

  if (!Number.isInteger(capacity) || capacity < 0 || String(capacity).length > 4) {
    return { message: "vehicle passenger capacity must be 4 digits or fewer." };
  }

  if (licensePlateNo.length > 7) {
    return { message: "vehicle license plate number must be 7 digits or fewer." };
  }

  if (!isValidDate(licensePlateExp)) {
    return { message: "vehicle license plate expiration must be a valid date." };
  }

  if (area.length > 100) {
    return { message: "vehicle area must be 100 characters or fewer." };
  }

  return {
    value: {
      make,
      model,
      year,
      vin,
      purchaseDate,
      color,
      passengerCapacity: capacity,
      licensePlateNo,
      licensePlateExp,
      area,
      name: `${year} ${make} ${model}`,
    },
  };
}

export function toVehicleJson(row) {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    purchaseDate: row.purchaseDate,
    color: row.color,
    passengerCapacity: row.passengerCapacity,
    licensePlateNo: row.licensePlateNo,
    licensePlateExp: row.licensePlateExp,
    area: row.area,
  };
}
