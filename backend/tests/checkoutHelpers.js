import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { kitVehicleFields } from "./helpers.js";

export const CHECKOUT_BASE = "/vehicleapi/reservations";

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
  const role = overrides.role || "requestor";

  return db.user.create({
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
  return db.vehicle.create(kitVehicleFields(overrides));
}

export async function createReservation(overrides = {}) {
  const driverId =
    overrides.driverId ??
    (await db.driver.create({ name: `Checkout driver ${Date.now()}`, status: "approved" })).id;
  const destinationId =
    overrides.destinationId ??
    (await db.destination.create({ name: `Checkout dest ${Date.now()}` })).id;

  return db.reservation.create({
    status: "Assigned",
    startAt: new Date("2026-11-05T09:00:00"),
    endAt: new Date("2026-11-05T17:00:00"),
    passengerCount: 2,
    driverId,
    destinationId,
    ...overrides,
  });
}

export function getCheckoutReturn(app, token, id) {
  return request(app)
    .get(`${CHECKOUT_BASE}/${id}/checkout-return`)
    .set(authHeader(token));
}

export function postCheckout(app, token, id) {
  return request(app).post(`${CHECKOUT_BASE}/${id}/checkout`).set(authHeader(token));
}

export function postReturn(app, token, id) {
  return request(app).post(`${CHECKOUT_BASE}/${id}/return`).set(authHeader(token));
}

export function getCheckoutStatus(app, token) {
  return request(app)
    .get(`${CHECKOUT_BASE}/checkout-status`)
    .set(authHeader(token));
}
