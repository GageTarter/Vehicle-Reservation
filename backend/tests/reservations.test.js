/**
 * Feature 8 — Vehicle Reservation Requests
 * Spec: features/feature-8-vehicle-reservation-requests.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

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

async function createDriver(status = "approved") {
  sequence += 1;
  return db.driver.create({ name: `Driver ${sequence}`, status });
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
    passengerCount: 12,
    ...overrides,
  };
}

describe("Feature 8 — Vehicle Reservation Requests", () => {
  beforeEach(async () => {
    sequence = 0;
    await syncTestDatabase();
  });

  describe("US-8.1 — Create a reservation request", () => {
    it("Requestor creates a reservation request", async () => {
      const { user, token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();

      const response = await request(app)
        .post("/vehicles/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(tripBody(driver.id, destination.id));

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("requested");
      expect(response.body.vehicleId).toBeNull();
      expect(response.body.requestorUserId).toBe(user.id);
      expect(response.body.passengerCount).toBe(12);
    });

    it("Client cannot set status or owner on create", async () => {
      const { user, token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();

      const response = await request(app)
        .post("/vehicles/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...tripBody(driver.id, destination.id),
          status: "reserved",
          requestorUserId: 999,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("requested");
      expect(response.body.requestorUserId).toBe(user.id);
    });

    it("Unapproved driver is rejected", async () => {
      const { token } = await createUserWithSession("user");
      const driver = await createDriver("pending");
      const destination = await createDestination();

      const response = await request(app)
        .post("/vehicles/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(tripBody(driver.id, destination.id));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Driver must be on the approved drivers list." });
    });

    it("Approved drivers and destinations are listed", async () => {
      const { token } = await createUserWithSession("user");
      const approved = await createDriver("approved");
      await createDriver("pending");
      const destination = await createDestination();

      const drivers = await request(app).get("/vehicles/drivers").set("Authorization", `Bearer ${token}`);
      const destinations = await request(app)
        .get("/vehicles/destinations")
        .set("Authorization", `Bearer ${token}`);

      expect(drivers.status).toBe(200);
      expect(drivers.body).toEqual([{ id: approved.id, name: approved.name, status: "approved" }]);
      expect(destinations.status).toBe(200);
      expect(destinations.body).toEqual([{ id: destination.id, name: destination.name }]);
    });

    it("End is not after start", async () => {
      const { token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();

      const response = await request(app)
        .post("/vehicles/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(
          tripBody(driver.id, destination.id, {
            startAt: "2026-11-22T18:00:00.000Z",
            endAt: "2026-11-20T14:00:00.000Z",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "End must be after start." });
    });
  });

  describe("US-8.2 — View my requests", () => {
    it("My Requests loads owned rows", async () => {
      const { user, token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: user.id,
        status: "requested",
      });
      await db.reservation.create({
        ...tripBody(driver.id, destination.id, { startAt: "2026-12-01T14:00:00.000Z", endAt: "2026-12-02T18:00:00.000Z" }),
        requestorUserId: user.id,
        status: "requested",
      });

      const response = await request(app).get("/vehicles/reservations").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].startAt < response.body[1].startAt).toBe(true);
    });

    it("Requestor cannot see another user's requests", async () => {
      const userA = await createUserWithSession("user");
      const userB = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const hidden = await db.reservation.create({
        ...tripBody(driver.id, destination.id, { partyName: "Secret trip" }),
        requestorUserId: userB.user.id,
        status: "requested",
      });

      const response = await request(app)
        .get("/vehicles/reservations")
        .set("Authorization", `Bearer ${userA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.find((row) => row.id === hidden.id)).toBeUndefined();
    });

    it("Unauthenticated API request to reservations", async () => {
      const response = await request(app).get("/vehicles/reservations");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No token provided." });
    });
  });

  describe("US-8.3 — Edit a pending request", () => {
    it("Requestor updates a requested reservation", async () => {
      const { user, token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const row = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: user.id,
        status: "requested",
      });

      const response = await request(app)
        .put(`/vehicles/reservations/${row.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(tripBody(driver.id, destination.id, { passengerCount: 8 }));

      expect(response.status).toBe(200);
      expect(response.body.passengerCount).toBe(8);
    });

    it("Requestor cannot update another user's reservation", async () => {
      const userA = await createUserWithSession("user");
      const userB = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const row = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: userB.user.id,
        status: "requested",
      });

      const response = await request(app)
        .put(`/vehicles/reservations/${row.id}`)
        .set("Authorization", `Bearer ${userA.token}`)
        .send(tripBody(driver.id, destination.id, { passengerCount: 3 }));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: `Reservation with id=${row.id} not found.` });
      const stored = await db.reservation.findByPk(row.id);
      expect(stored.passengerCount).toBe(12);
    });

    it("Requestor cannot update after status leaves requested", async () => {
      const { user, token } = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const row = await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: user.id,
        status: "reserved",
        vehicleId: 7,
      });

      const response = await request(app)
        .put(`/vehicles/reservations/${row.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(tripBody(driver.id, destination.id, { passengerCount: 4 }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Only requested reservations can be updated." });
    });
  });

  describe("US-8.4 — Admin can list every request", () => {
    it("Admin lists all reservations", async () => {
      const admin = await createUserWithSession("admin");
      const userA = await createUserWithSession("user");
      const userB = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      await db.reservation.create({
        ...tripBody(driver.id, destination.id),
        requestorUserId: userA.user.id,
        status: "requested",
      });
      await db.reservation.create({
        ...tripBody(driver.id, destination.id, { startAt: "2026-12-01T14:00:00.000Z", endAt: "2026-12-02T18:00:00.000Z" }),
        requestorUserId: userB.user.id,
        status: "requested",
      });

      const response = await request(app)
        .get("/vehicles/reservations")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });
});
