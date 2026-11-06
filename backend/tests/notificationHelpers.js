import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { setMailTransport, resetMailTransport } from "../app/services/mailer.js";

export const sentMail = [];

export function useCapturingMailer() {
  sentMail.length = 0;
  setMailTransport(async (message) => {
    sentMail.push(message);
  });
}

export function useFailingMailer() {
  sentMail.length = 0;
  setMailTransport(async () => {
    throw new Error("Email provider rejected the message.");
  });
}

export function restoreMailer() {
  sentMail.length = 0;
  resetMailTransport();
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function sessionTokenFor(user) {
  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });

  await db.session.create({
    token,
    email: user.email || "session@example.com",
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
    area_id: ["area_admin", "maintenance"].includes(role) ? 1 : null,
    ...overrides,
  });
}

export async function createArea(overrides = {}) {
  return db.area.create({
    name: `Area ${Date.now()}`,
    ...overrides,
  });
}

export async function createVehicle(overrides = {}) {
  return db.vehicle.create({
    name: `Van ${Date.now()}`,
    area_id: 1,
    ...overrides,
  });
}

export async function createReservation(overrides = {}) {
  return db.reservation.create({
    status: "Assigned",
    start_datetime: new Date("2026-11-08T15:00:00.000Z"),
    end_datetime: new Date("2026-11-08T18:00:00.000Z"),
    destination: "Athletics event",
    ...overrides,
  });
}

export async function createInstructions(overrides = {}) {
  return db.areaInstruction.create({
    pickup_instructions: "Pick up the vehicle from the Athletics parking area.",
    return_instructions: "Return the vehicle to the designated parking space.",
    contact_information: "Contact the Athletics office for assistance.",
    ...overrides,
  });
}

export function patchStatus(app, token, reservationId, status) {
  return request(app)
    .patch(`/vehicleapi/reservations/${reservationId}/status`)
    .set(authHeader(token))
    .send({ status });
}

export function getNotifications(app, token, reservationId) {
  return request(app)
    .get(`/vehicleapi/reservations/${reservationId}/notifications`)
    .set(authHeader(token));
}

export function getInstructions(app, token, areaId) {
  return request(app)
    .get(`/vehicleapi/areas/${areaId}/instructions`)
    .set(authHeader(token));
}

export function putInstructions(app, token, areaId, payload) {
  return request(app)
    .put(`/vehicleapi/areas/${areaId}/instructions`)
    .set(authHeader(token))
    .send(payload);
}

export function runDayBefore(app, token, now) {
  return request(app)
    .post("/vehicleapi/notifications/day-before")
    .set(authHeader(token))
    .send({ now });
}
