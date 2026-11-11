import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { kitVehicleFields } from "./helpers.js";

export const ISSUES_BASE = "/vehicleapi/issues";

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export function tokenFor(user) {
  const id = user.user_id ?? user.id ?? user.userId;
  return jwt.sign({ id, role: user.role }, authConfig.secret, {
    expiresIn: 86400,
  });
}

export async function sessionTokenFor(user) {
  const token = tokenFor(user);

  if (db.session) {
    await db.session.create({
      token,
      email: user.email,
      userId: user.user_id ?? user.id ?? user.userId,
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  return token;
}

async function persist(modelName, values) {
  const model = db[modelName];

  if (!model) {
    throw new Error(
      `Feature 13 tests need the ${modelName} model registered in app/models/index.js.`
    );
  }

  return model.create(values);
}

export async function createUser(overrides = {}) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const role = overrides.role || "requestor";

  return persist("user", {
    googleId: `google-sub-${suffix}`,
    email: `user-${suffix}@example.com`,
    fName: "Test",
    lName: "User",
    role,
    area_id: role === "area_admin" ? 1 : null,
    ...overrides,
  });
}

export async function createVehicle(overrides = {}) {
  return persist("vehicle", kitVehicleFields(overrides));
}

export async function createReservation(overrides = {}) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const driverId =
    overrides.driverId ??
    (await persist("driver", { name: `Driver ${suffix}`, status: "approved" })).id;
  const destinationId =
    overrides.destinationId ??
    (await persist("destination", { name: `City ${suffix}` })).id;

  return persist("reservation", {
    status: "reserved",
    driverId,
    destinationId,
    startAt: new Date("2026-11-17T09:00:00.000Z"),
    endAt: new Date("2026-11-17T12:00:00.000Z"),
    passengerCount: 2,
    ...overrides,
  });
}

export async function createIssue(overrides = {}) {
  return persist("vehicleIssue", {
    issue_type: "Low Gas",
    description: "The vehicle has less than one-quarter tank of gas.",
    status: "Open",
    reported_date: new Date(),
    ...overrides,
  });
}

export function issuesList(body) {
  if (Array.isArray(body)) {
    return body;
  }

  return body?.issues || [];
}

export function postIssue(app, token, payload) {
  return request(app).post(ISSUES_BASE).set(authHeader(token)).send(payload);
}

export function getIssues(app, token) {
  return request(app).get(ISSUES_BASE).set(authHeader(token));
}

export function getIssue(app, token, id) {
  return request(app).get(`${ISSUES_BASE}/${id}`).set(authHeader(token));
}

export function patchIssue(app, token, id, payload) {
  return request(app).patch(`${ISSUES_BASE}/${id}`).set(authHeader(token)).send(payload);
}

export function patchIssueStatus(app, token, id, status) {
  return request(app)
    .patch(`${ISSUES_BASE}/${id}/status`)
    .set(authHeader(token))
    .send({ status });
}

export function deleteIssue(app, token, id) {
  return request(app).delete(`${ISSUES_BASE}/${id}`).set(authHeader(token));
}

export function getVehicleIssues(app, token, vehicleId) {
  return request(app)
    .get(`/vehicleapi/vehicles/${vehicleId}/issues`)
    .set(authHeader(token));
}
