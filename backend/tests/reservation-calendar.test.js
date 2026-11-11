/**
 * Feature 11 — Weekly Reservation Calendar
 * Spec: features/feature-11-weekly-reservation-calendar.md
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

async function createDriver() {
  sequence += 1;
  return db.driver.create({ name: `Driver ${sequence}`, status: "approved" });
}

async function createDestination() {
  sequence += 1;
  return db.destination.create({ name: `City ${sequence}` });
}

describe("Feature 11 — Weekly Reservation Calendar", () => {
  beforeEach(async () => {
    sequence = 0;
    await syncTestDatabase();
  });

  describe("US-11.1 — View this week's schedule", () => {
    it("Admin loads a week with reservations", async () => {
      const admin = await createUserWithSession("admin");
      const requestor = await createUserWithSession("user");
      const driver = await createDriver();
      const destination = await createDestination();
      const reservation = await db.reservation.create({
        requestorUserId: requestor.user.id,
        partyName: "Soccer",
        driverId: driver.id,
        destinationId: destination.id,
        startAt: "2026-11-18T14:00:00.000Z",
        endAt: "2026-11-18T18:00:00.000Z",
        passengerCount: 4,
        status: "reserved",
        vehicleId: 7,
      });

      const response = await request(app)
        .get("/vehicles/reservations/calendar?weekStart=2026-11-16")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(reservation.id);
      expect(response.body[0].status).toBe("reserved");
      expect(response.body[0].vehicleId).toBe(7);
    });

    it("weekStart that is not Monday is rejected", async () => {
      const admin = await createUserWithSession("admin");

      const response = await request(app)
        .get("/vehicles/reservations/calendar?weekStart=2026-11-17")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "weekStart must be a Monday (YYYY-MM-DD)." });
    });
  });

  describe("US-11.3 — Requestors cannot open the calendar", () => {
    it("Requestor is forbidden from the calendar API", async () => {
      const requestor = await createUserWithSession("user");

      const response = await request(app)
        .get("/vehicles/reservations/calendar?weekStart=2026-11-16")
        .set("Authorization", `Bearer ${requestor.token}`);

      expect(response.status).toBe(403);
    });

    it("Unauthenticated calendar request", async () => {
      const response = await request(app).get(
        "/vehicles/reservations/calendar?weekStart=2026-11-16",
      );

      expect(response.status).toBe(401);
    });
  });
});
