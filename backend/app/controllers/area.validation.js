function trimmed(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function validateArea(body) {
  const name = trimmed(body?.name);

  if (isBlank(name)) {
    return { message: "Area name is required." };
  }

  if (String(name).length > 100) {
    return { message: "Area name must be 100 characters or fewer." };
  }

  return { value: { name } };
}

export function toAreaJson(row) {
  return {
    id: row.id,
    name: row.name,
  };
}
