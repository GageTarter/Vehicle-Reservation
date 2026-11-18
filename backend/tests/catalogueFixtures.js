/** Shared catalogue rows for Feature 8+ tests after Features 4 and 5 expanded the tables. */

export function approvedDriverFields(overrides = {}) {
  const { stamp: stampOverride, ...rest } = overrides;
  const stamp = stampOverride ?? `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    name: "Test",
    lastName: "Driver",
    driverID: `DRV-${stamp}`,
    licenseState: "Oklahoma",
    licenseExp: "2028-01-01",
    approvedDate: "2020-01-01",
    area: "Athletics",
    status: "Approved",
    ...rest,
  };
}

export function destinationFields(overrides = {}) {
  const { stamp: stampOverride, ...rest } = overrides;
  const stamp = stampOverride ?? `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    name: `City ${stamp}`,
    addressLine1: "2501 East Memorial Road",
    addressLine2: null,
    city: "Edmond",
    state: "Oklahoma",
    zip: "73013",
    ...rest,
  };
}
