/**
 * Feature 3 — Vehicle Management
 * Spec: features/feature-3-vehicle-management.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

const nissan = {
  make: "Nissan",
  model: "Pathfinder",
  year: "2014",
  vin: "1M2AR13Y8HM088054",
  purchaseDate: "07/11/24",
  color: "White",
  passengerCapacity: 6,
  licensePlateNo: "DWD947",
  licensePlateExp: "2026-8-14",
  area: "Athletics",
};

async function createUser(suffix, role = "user") {
  const user = await db.user.create({
    googleId: `google-${suffix}`,
    email: `${suffix}@example.com`,
    fName: "Jane",
    lName: "Doe",
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

function authed(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createVehicle(token, overrides = {}) {
  return request(app).post("/fleets/vehicles").set(authed(token)).send({ ...nissan, ...overrides });
}

describe("Feature 3 — Vehicle Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.4 — Add a vehicle", () => {
    it("User creates a new vehicle", async () => {
      const { token } = await createUser("creator");
      const response = await createVehicle(token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(nissan);
      expect(response.body.area).toBe("Athletics");
    });

    it("User creates a vehicle with an empty make", async () => {
      const { token } = await createUser("empty-make");
      const response = await createVehicle(token, { make: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle make is required." });
    });

    it("User creates a vehicle with an empty model", async () => {
      const { token } = await createUser("empty-model");
      const response = await createVehicle(token, { model: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle model is required." });
    });

    it("User creates a vehicle with an empty year", async () => {
      const { token } = await createUser("empty-year");
      const response = await createVehicle(token, { year: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle year is required." });
    });

    it("User creates a vehicle with an empty vin", async () => {
      const { token } = await createUser("empty-vin");
      const response = await createVehicle(token, { vin: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle vin is required." });
    });

    it("User creates a vehicle with an empty purchase date", async () => {
      const { token } = await createUser("empty-date");
      const response = await createVehicle(token, { purchaseDate: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle purchase date is required." });
    });

    it("User creates a vehicle with an empty color", async () => {
      const { token } = await createUser("empty-color");
      const response = await createVehicle(token, { color: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle color is required." });
    });

    it("User creates a vehicle with an empty passenger capacity", async () => {
      const { token } = await createUser("empty-capacity");
      const response = await createVehicle(token, { passengerCapacity: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle passenger capacity is required." });
    });

    it("User creates a vehicle with an empty license plate number", async () => {
      const { token } = await createUser("empty-plate");
      const response = await createVehicle(token, { licensePlateNo: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate number is required." });
    });

    it("User creates a vehicle with an empty license plate expiration", async () => {
      const { token } = await createUser("empty-exp");
      const response = await createVehicle(token, { licensePlateExp: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate expiration is required." });
    });

    it("User creates a vehicle with an empty area", async () => {
      const { token } = await createUser("empty-area");
      const response = await createVehicle(token, { area: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle area is required." });
    });

    it("User creates an vehicle with a make that is too long", async () => {
      const { token } = await createUser("long-make");
      const response = await createVehicle(token, { make: "N".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle make must be 100 characters or fewer." });
    });

    it("User creates an vehicle with a model that is too long", async () => {
      const { token } = await createUser("long-model");
      const response = await createVehicle(token, { model: "P".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle model must be 100 characters or fewer." });
    });

    it("User creates an vehicle with a year that is too long", async () => {
      const { token } = await createUser("long-year");
      const response = await createVehicle(token, { year: "20145" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle year must be 4 digits or fewer." });
    });

    it("User creates an vehicle with a vin that is too long", async () => {
      const { token } = await createUser("long-vin");
      const response = await createVehicle(token, { vin: `${nissan.vin}X` });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle vin must be 17 characters or fewer." });
    });

    it("User creates an vehicle with an invalid vin", async () => {
      const { token } = await createUser("bad-vin");
      const response = await createVehicle(token, { vin: "1M2AR13Y8HM088055" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle vin is invalid." });
    });

    it("User creates an vehicle with a purchase date that is not a valid date", async () => {
      const { token } = await createUser("bad-date");
      const response = await createVehicle(token, { purchaseDate: "13/40/24" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle purchase date must be a valid date." });
    });

    it("User creates an vehicle with a color that is too long", async () => {
      const { token } = await createUser("long-color");
      const response = await createVehicle(token, { color: "W".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle color must be 100 characters or fewer." });
    });

    it("User creates an vehicle with a passenger capacity that is too long", async () => {
      const { token } = await createUser("long-capacity");
      const response = await createVehicle(token, { passengerCapacity: 10000 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle passenger capacity must be 4 digits or fewer." });
    });

    it("User creates an vehicle with a license plate number that is too long", async () => {
      const { token } = await createUser("long-plate");
      const response = await createVehicle(token, { licensePlateNo: "DWD947XX" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate number must be 7 digits or fewer." });
    });

    it("User creates an vehicle with a license plate expiration that is not a valid date", async () => {
      const { token } = await createUser("bad-exp");
      const response = await createVehicle(token, { licensePlateExp: "2026-13-40" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate expiration must be a valid date." });
    });

    it("User creates an vehicle with an area that is too long", async () => {
      const { token } = await createUser("long-area");
      const response = await createVehicle(token, { area: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle area must be 100 characters or fewer." });
    });

    it("rejects a create with no token", async () => {
      const response = await request(app).post("/fleets/vehicles").send(nissan);

      expect(response.status).toBe(401);
    });
  });

  describe("US-3.1: — Browse the vehicle list", () => {
    it("User views existing vehicles", async () => {
      const { token } = await createUser("lister");
      await createVehicle(token);
      await createVehicle(token, { model: "Rogue" });

      const response = await request(app).get("/fleets/vehicles").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.model)).toEqual(["Pathfinder", "Rogue"]);
    });

    it("User has no existing vehicles", async () => {
      const { token } = await createUser("empty-list");
      const response = await request(app).get("/fleets/vehicles").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("hides another user's vehicles", async () => {
      const owner = await createUser("owner");
      const other = await createUser("other");
      await createVehicle(owner.token);

      const response = await request(app).get("/fleets/vehicles").set(authed(other.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("US-3.2: — Correct a vehicle's information", () => {
    it("User edits a vehicle's information", async () => {
      const { token } = await createUser("editor");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, color: "Black" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "vehicle was updated successfully." });

      const listed = await request(app).get("/fleets/vehicles").set(authed(token));
      expect(listed.body[0].color).toBe("Black");
    });

    it("User edits a vehicle with any empty information area", async () => {
      const { token } = await createUser("edit-empty");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, color: " " });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "All fields must be filled." });
    });

    it("User edits a vehicle with a name that is too long", async () => {
      const { token } = await createUser("edit-name");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, make: "N".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle make must be 100 characters or fewer." });
    });

    it("User edits a vehicle with a model that is too long", async () => {
      const { token } = await createUser("edit-model");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, model: "P".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle model must be 100 characters or fewer." });
    });

    it("User edits a vehicle with a year that is too long or too short", async () => {
      const { token } = await createUser("edit-year");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, year: "201" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle year must be 4 digits." });
    });

    it("User edits a vehicle with a vin that is too long or too short", async () => {
      const { token } = await createUser("edit-vin");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, vin: "1M2AR13Y8HM08805" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle vin must be 17 characters exactly." });
    });

    it("User edits a vehicle with a purchase date that is not a valid date", async () => {
      const { token } = await createUser("edit-date");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, purchaseDate: "nope" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle purchase date must be a valid date." });
    });

    it("User edits a vehicle with a color that is too long", async () => {
      const { token } = await createUser("edit-color");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, color: "C".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle color must be 100 characters or fewer." });
    });

    it("User edits a vehicle with a passenger capacity that is too long", async () => {
      const { token } = await createUser("edit-capacity");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, passengerCapacity: 12345 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle passenger capacity must be 4 digits or fewer." });
    });

    it("User edits a vehicle with a license plate number that is too long", async () => {
      const { token } = await createUser("edit-plate");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, licensePlateNo: "ABCDEFGH" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate number must be 7 digits or fewer." });
    });

    it("User edits a vehicle with a license plate expiration that is not a valid date", async () => {
      const { token } = await createUser("edit-exp");
      const created = await createVehicle(token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(token))
        .send({ ...nissan, licensePlateExp: "2026-02-31" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicle license plate expiration must be a valid date." });
    });

    it("returns 404 when the vehicle belongs to someone else", async () => {
      const owner = await createUser("edit-owner");
      const other = await createUser("edit-other");
      const created = await createVehicle(owner.token);
      const response = await request(app)
        .put(`/fleets/vehicles/${created.body.id}`)
        .set(authed(other.token))
        .send(nissan);

      expect(response.status).toBe(404);
    });

    it("returns 400 for a non-numeric vehicle id", async () => {
      const { token } = await createUser("bad-id");
      const response = await request(app).put("/fleets/vehicles/abc").set(authed(token)).send(nissan);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "vehicleId must be a number." });
    });
  });

  describe("US-3.3: Remove a vehicle", () => {
    it("User removes an vehicle", async () => {
      const { token } = await createUser("deleter");
      const created = await createVehicle(token);
      const response = await request(app).delete(`/fleets/vehicles/${created.body.id}`).set(authed(token));
      const listed = await request(app).get("/fleets/vehicles").set(authed(token));

      expect(response.status).toBe(204);
      expect(listed.body).toEqual([]);
    });

    it("returns 404 when deleting another user's vehicle", async () => {
      const owner = await createUser("delete-owner");
      const other = await createUser("delete-other");
      const created = await createVehicle(owner.token);
      const response = await request(app).delete(`/fleets/vehicles/${created.body.id}`).set(authed(other.token));

      expect(response.status).toBe(404);
    });
  });
});
