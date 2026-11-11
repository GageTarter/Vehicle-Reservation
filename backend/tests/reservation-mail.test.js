/**
 * Feature 10 — Reservation Status Management
 * Spec: features/feature-10-reservation-status-management.md
 */
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const send = jest.fn(async (payload) => payload);

jest.unstable_mockModule("../app/services/mailer.js", () => ({
  send,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../server.js");
const db = (await import("../app/models/index.js")).default;
const authConfig = (await import("../app/config/auth.config.js")).default;
const { kitVehicleFields, syncTestDatabase } = await import("./helpers.js");

let sequence = 0;

async function createUserWithSession(role, email) {
  sequence += 1;
  const user = await db.user.create({
    googleId: `google-sub-${role}-${sequence}`,
    email: email || `${role}-${sequence}@example.com`,
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

function tripBody(driverId, destinationId, overrides = {}) {
  return {
    driverId,
    destinationId,
    startAt: "2026-11-20T14:00:00.000Z",
    endAt: "2026-11-22T18:00:00.000Z",
    passengerCount: 4,
    ...overrides,
  };
}

describe("Feature 10 — Reservation Status Management", () => {
  beforeEach(async () => {
    sequence = 0;
    send.mockClear();
    await syncTestDatabase();
  });

  describe("US-10.1 — Email on status change", () => {
    it("Creating a request emails requested status", async () => {
      const { token } = await createUserWithSession("user", "jane@example.com");
      const driver = await createDriver();
      const destination = await createDestination();

      const response = await request(app)
        .post("/vehicles/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(tripBody(driver.id, destination.id));

      expect(response.status).toBe(201);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0].to).toBe("jane@example.com");
      expect(send.mock.calls[0][0].subject).toBe("Reservation status updated");
      expect(send.mock.calls[0][0].body).toContain("requested");
    });

    it("Assigning a vehicle emails reserved status", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user", "rider@example.com");
      const driver = await createDriver();
      const destination = await createDestination();
      const reservation = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: requestor.user.id,
        status: "requested",
      });
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van A" }));
      send.mockClear();

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(200);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Reservation status updated",
          body: expect.stringContaining("reserved"),
        }),
      );
    });

    it("Marking awaiting vehicle emails that status", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const reservation = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: requestor.user.id,
        status: "requested",
      });
      send.mockClear();

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: null });

      expect(response.status).toBe(200);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("awaiting_vehicle"),
        }),
      );
    });
  });

  describe("US-10.2 — Day-before pickup instructions", () => {
    it("Admin sends pre-trip notices the day before a reserved trip", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user", "rider@example.com");
      const driver = await createDriver();
      const destination = await createDestination();
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van B" }));
      const reservation = await db.reservation.create({
        ...tripBody(driver.id, destination.id, {
          startAt: "2026-11-20T14:00:00.000Z",
          endAt: "2026-11-20T18:00:00.000Z",
        }),
        requestorUserId: requestor.user.id,
        status: "reserved",
        vehicleId: vehicle.id,
        preTripEmailSentAt: null,
      });
      send.mockClear();

      const response = await request(app)
        .post("/vehicles/reservations/pre-trip-notices")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ now: "2026-11-19T12:00:00.000Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sent: 1 });
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "rider@example.com",
          subject: "Vehicle pickup instructions",
        }),
      );
      await reservation.reload();
      expect(reservation.preTripEmailSentAt).not.toBeNull();
    });

    it("Pre-trip notice is not sent twice", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      await db.reservation.create({
        ...tripBody(driver.id, destination.id, {
          startAt: "2026-11-20T14:00:00.000Z",
          endAt: "2026-11-20T18:00:00.000Z",
        }),
        requestorUserId: requestor.user.id,
        status: "reserved",
        preTripEmailSentAt: new Date("2026-11-19T08:00:00.000Z"),
      });
      send.mockClear();

      const response = await request(app)
        .post("/vehicles/reservations/pre-trip-notices")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ now: "2026-11-19T12:00:00.000Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sent: 0 });
      expect(send).not.toHaveBeenCalled();
    });

    it("Requestor cannot send pre-trip notices", async () => {
      const requestor = await createUserWithSession("user");

      const response = await request(app)
        .post("/vehicles/reservations/pre-trip-notices")
        .set("Authorization", `Bearer ${requestor.token}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe("US-10.3 — Do not email when status is unchanged", () => {
    it("Re-assigning the same reserved vehicle does not send a second status email", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const vehicle = await db.vehicle.create(kitVehicleFields({ userId: admin.user.id, name: "Van 7" }));
      const reservation = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: requestor.user.id,
        status: "reserved",
        vehicleId: vehicle.id,
      });
      send.mockClear();

      const response = await request(app)
        .put(`/vehicles/reservations/${reservation.id}/assignment`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ vehicleId: vehicle.id });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("reserved");
      expect(send).not.toHaveBeenCalled();
    });
  });
});
