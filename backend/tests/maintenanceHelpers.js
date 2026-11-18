import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { kitVehicleFields } from "./helpers.js";

export const MAINTENANCE_BASE = "/vehicleapi/maintenance-requests";

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function sessionTokenFor(user) {
  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });

  await db.session.create({
    token,
    email: user.email,
    userId: user.id,
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return token;
}

export async function createUser(overrides = {}) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const role = overrides.role || "maintenance";

  return db.user.create({
    googleId: `google-sub-${suffix}`,
    email: `user-${suffix}@example.com`,
    fName: "Test",
    lName: "User",
    role,
    area_id: ["maintenance", "area_admin"].includes(role) ? 1 : null,
    ...overrides,
  });
}

export async function createVehicle(overrides = {}) {
  return db.vehicle.create(kitVehicleFields(overrides));
}

export async function createIssue(overrides = {}) {
  return db.vehicleIssue.create({
    issue_type: "Maintenance Needed",
    description: "Engine warning light.",
    status: "Open",
    reported_by: overrides.reported_by ?? 1,
    reported_date: new Date(),
    ...overrides,
  });
}

export async function createMaintenanceRequest(overrides = {}) {
  return db.maintenanceRequest.create({
    description: "Needs inspection.",
    status: "Open",
    ...overrides,
  });
}

export function getRequests(app, token) {
  return request(app).get(MAINTENANCE_BASE).set(authHeader(token));
}

export function postRequest(app, token, payload) {
  return request(app).post(MAINTENANCE_BASE).set(authHeader(token)).send(payload);
}

export function patchStatus(app, token, id, status) {
  return request(app)
    .patch(`${MAINTENANCE_BASE}/${id}/status`)
    .set(authHeader(token))
    .send({ status });
}

export function getVehicleMaintenance(app, token, vehicleId) {
  return request(app)
    .get(`/vehicleapi/vehicles/${vehicleId}/maintenance`)
    .set(authHeader(token));
}
