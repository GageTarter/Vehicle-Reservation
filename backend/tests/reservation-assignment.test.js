/**
 * Feature 9 — Vehicle Assignment and Availability
 * Spec: features/feature-9-vehicle-assignment-and-availability.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { kitVehicleFields, syncTestDatabase } from "./helpers.js";

let sequence = 0;

async function createUserWithSession(role) {
  sequence += 1;
  const user = await db.user.create({
    googleId: `google-sub-${role}-${sequence}`,
    email: `${role}-${sequence}@example.com`,
    fName: "Test",
    lName: "User",
    role,
  });
  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await db.session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    userId: user.id,
  });

  return { user, token };
}

async function createDriver() {
  sequence += 1;
  return db.driver.create({ name: `Driver ${sequence}`, status: "approved" });
}

async function createDestination() {
  sequence += 1;
  return db.destination.create({ name: `City ${sequence}` });
}

async function createReservation(requestorUserId, overrides = {}) {
  const driver = await createDriver();
  const destination = await createDestination();
  return db.reservation.create({
    requestorUserId,
    driverId: driver.id,
    destinationId: destination.id,
    startAt: "2026-11-17T09:00:00.000Z",
    endAt: "2026-11-17T12:00:00.000Z",
    passengerCount: 4,
    status: "requested",
    vehicleId: null,
    ...overrides,
  });
}

describe("Feature 9 — Vehicle Assignment and Availability", () => {
  beforeEach(async () => {
    sequence = 0;
    await syncTestDatabase();
  });

  describe("US-9.1 — Assign an available vehicle", () => {
    it("Admin assigns a free vehicle", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const reservation = await createReservation(requestor.user.id);
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van 1" }));

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("reserved");
      expect(response.body.vehicleId).toBe(vehicle.id);
    });

    it("Requestor cannot assign a vehicle", async () => {
      const requestor = await createUserWithSession("user");
      const reservation = await createReservation(requestor.user.id);
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: requestor.user.id, name: "Van 2" }));

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${requestor.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(403);
    });
  });

  describe("US-9.2 — Reject overlapping assignment", () => {
    it("Admin cannot double-book a reserved vehicle", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van 7" }));
      await createReservation(requestor.user.id, {
        startAt: "2026-11-17T09:00:00.000Z",
        endAt: "2026-11-17T12:00:00.000Z",
        status: "reserved",
        vehicleId: vehicle.id,
      });
      const second = await createReservation(requestor.user.id, {
        startAt: "2026-11-17T11:00:00.000Z",
        endAt: "2026-11-17T13:00:00.000Z",
        status: "requested",
        vehicleId: null,
      });

      const response = await request(app)
        .put(`/vehicles/reservations/${second.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: "Vehicle is not available for this time." });
      const stored = await db.reservation.findByPk(second.id);
      expect(stored.status).toBe("requested");
      expect(stored.vehicleId).toBeNull();
    });

    it("Back-to-back trips are allowed", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van 8" }));
      await createReservation(requestor.user.id, {
        startAt: "2026-11-17T09:00:00.000Z",
        endAt: "2026-11-17T12:00:00.000Z",
        status: "reserved",
        vehicleId: vehicle.id,
      });
      const second = await createReservation(requestor.user.id, {
        startAt: "2026-11-17T12:00:00.000Z",
        endAt: "2026-11-17T15:00:00.000Z",
        status: "requested",
        vehicleId: null,
      });

      const response = await request(app)
        .put(`/vehicles/reservations/${second.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("reserved");
      expect(response.body.vehicleId).toBe(vehicle.id);
    });
  });

  describe("US-9.3 — Mark awaiting vehicle", () => {
    it("Admin marks a request awaiting vehicle", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const reservation = await createReservation(requestor.user.id);

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: null });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("awaiting_vehicle");
      expect(response.body.vehicleId).toBeNull();
    });
  });

  describe("US-9.4 — Need-vehicle queue", () => {
    it("Admin lists requests that need a vehicle", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const awaiting = await createReservation(requestor.user.id, { status: "awaiting_vehicle" });
      await createReservation(requestor.user.id, {
        startAt: "2026-11-18T09:00:00.000Z",
        endAt: "2026-11-18T12:00:00.000Z",
        status: "requested",
      });

      const response = await request(app)
        .get("/vehicles/reservations?status=awaiting_vehicle")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(awaiting.id);
      expect(response.body[0].status).toBe("awaiting_vehicle");
    });
  });
});
