const REQUIRED = {
  name: "destination name is required.",
  addressLine1: "destination address line 1 is required.",
  city: "destination city is required.",
  state: "destination state is required.",
  zip: "destination zip is required.",
};

const MAX_LENGTH = {
  name: "destination name must be 100 characters or fewer.",
  addressLine1: "destination address line 1 must be 100 characters or fewer.",
  city: "destination city must be 100 characters or fewer.",
  state: "destination state must be 100 characters or fewer.",
};

function trimmed(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function validateDestination(body) {
  const values = {
    name: trimmed(body?.name),
    addressLine1: trimmed(body?.addressLine1),
    addressLine2: trimmed(body?.addressLine2),
    city: trimmed(body?.city),
    state: trimmed(body?.state),
    zip: trimmed(body?.zip),
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

  if (!isBlank(values.addressLine2) && String(values.addressLine2).length > 100) {
    return { message: "destination address line 2 must be 100 characters or fewer." };
  }

  if (!/^\d{5}$/.test(String(values.zip))) {
    return { message: "destination zip must be exactly 5 digits." };
  }

  return {
    value: {
      name: values.name,
      addressLine1: values.addressLine1,
      addressLine2: isBlank(values.addressLine2) ? null : values.addressLine2,
      city: values.city,
      state: values.state,
      zip: String(values.zip),
    },
  };
}

export function toDestinationJson(row) {
  return {
    id: row.id,
    name: row.name,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    zip: row.zip,
  };
}
