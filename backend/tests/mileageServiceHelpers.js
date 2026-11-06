import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";

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
  return db.vehicle.create({
    name: `Vehicle ${Date.now()}`,
    area_id: 1,
    ...overrides,
  });
}

export async function createMileage(overrides = {}) {
  return db.mileageLog.create({
    date_recorded: "2026-11-05",
    current_mileage: 45200,
    ...overrides,
  });
}

export async function createService(overrides = {}) {
  return db.serviceLog.create({
    service_date: "2026-11-05",
    service_performed: "Oil change and tire rotation",
    ...overrides,
  });
}

export function getMileage(app, token, vehicleId) {
  return request(app)
    .get(`/vehicleapi/vehicles/${vehicleId}/mileage`)
    .set(authHeader(token));
}

export function postMileage(app, token, vehicleId, payload) {
  return request(app)
    .post(`/vehicleapi/vehicles/${vehicleId}/mileage`)
    .set(authHeader(token))
    .send(payload);
}

export function getService(app, token, vehicleId) {
  return request(app)
    .get(`/vehicleapi/vehicles/${vehicleId}/service-logs`)
    .set(authHeader(token));
}

export function postService(app, token, vehicleId, payload) {
  return request(app)
    .post(`/vehicleapi/vehicles/${vehicleId}/service-logs`)
    .set(authHeader(token))
    .send(payload);
}
