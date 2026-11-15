/**
 * Feature 4 — Driver Management
 * Spec: features/feature-4-driver-management.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

const judah = {
  name: "Judah",
  lastName: "Campbell",
  driverID: "CMSC-1113-01",
  licenseState: "Oklahoma",
  licenseExp: "2028-01-01",
  approvedDate: "2004-09-23",
  area: "Athletics",
  status: "Approved",
};

async function createUser(suffix, role = "admin") {
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

async function createDriver(token, overrides = {}) {
  return request(app).post("/driverapi/drivers").set(authed(token)).send({ ...judah, ...overrides });
}

async function updateDriver(token, id, overrides = {}) {
  return request(app).put(`/driverapi/drivers/${id}`).set(authed(token)).send({ ...judah, ...overrides });
}

async function expectRejectedEdit(suffix, overrides, message) {
  const { token } = await createUser(suffix);
  const created = await createDriver(token);
  const response = await updateDriver(token, created.body.id, overrides);
  const stored = await db.driver.findByPk(created.body.id);

  expect(response.status).toBe(400);
  expect(response.body).toEqual({ message });
  expect(stored.name).toBe("Judah");
  expect(stored.status).toBe("Approved");
}

describe("Feature 4 — Driver Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.1 — Add a catalogue driver", () => {
    it("User creates a new driver", async () => {
      const { token } = await createUser("creator");
      const response = await createDriver(token);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: expect.any(Number), ...judah });
    });

    it("User creates a driver with a name that is too long", async () => {
      const { token } = await createUser("long-name");
      const response = await createDriver(token, { name: "J".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver name must be 100 characters or fewer." });
    });

    it("User creates a driver with a last name that is too long", async () => {
      const { token } = await createUser("long-last");
      const response = await createDriver(token, { lastName: "C".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver last name must be 100 characters or fewer." });
    });

    it("User creates a driver with a license state that is too long", async () => {
      const { token } = await createUser("long-state");
      const response = await createDriver(token, { licenseState: "O".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver license state must be 100 characters or fewer." });
    });

    it("User creates a driver with a status that is too long", async () => {
      const { token } = await createUser("long-status");
      const response = await createDriver(token, { status: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver status must be 100 characters or fewer." });
    });

    it("User creates a driver with a driver ID that is too long", async () => {
      const { token } = await createUser("long-driver-id");
      const response = await createDriver(token, { driverID: "D".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver ID must be 100 characters or fewer." });
      expect(await db.driver.count()).toBe(0);
    });

    it("stores a driver ID with letters and dashes as text", async () => {
      const { token } = await createUser("text-driver-id");
      const response = await createDriver(token, { driverID: "  OK-0042  " });

      expect(response.status).toBe(201);
      expect(response.body.driverID).toBe("OK-0042");
    });

    it("User creates a driver with a license expiration that is not a valid date", async () => {
      const { token } = await createUser("bad-exp");
      const response = await createDriver(token, { licenseExp: "2028-02-30" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver license expiration must be a valid date." });
    });

    it("User creates a driver with an approved date that is not a valid date", async () => {
      const { token } = await createUser("bad-approved");
      const response = await createDriver(token, { approvedDate: "not a date" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver approved date must be a valid date." });
    });

    it("rejects whitespace-only required text fields", async () => {
      const { token } = await createUser("blank-fields");
      const cases = [
        ["name", "driver name is required."],
        ["lastName", "driver last name is required."],
        ["driverID", "driver ID is required."],
        ["licenseState", "driver license state is required."],
        ["area", "driver area is required."],
        ["status", "driver status is required."],
      ];

      for (const [field, message] of cases) {
        const response = await createDriver(token, { [field]: "   " });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message });
      }

      expect(await db.driver.count()).toBe(0);
    });

    it("Non-admin cannot create a driver", async () => {
      const { token } = await createUser("member", "user");
      const response = await createDriver(token);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(await db.driver.count()).toBe(0);
    });

    it("rejects a create with no token", async () => {
      const response = await request(app).post("/driverapi/drivers").send(judah);

      expect(response.status).toBe(401);
      expect(await db.driver.count()).toBe(0);
    });
  });

  describe("US-4.2 — Browse the driver List", () => {
    it("User views existing drivers", async () => {
      const admin = await createUser("lister");
      const member = await createUser("viewer", "user");
      await createDriver(admin.token, { name: "Zoe", lastName: "Young", driverID: "CMSC-1113-02" });
      await createDriver(admin.token);
      await createDriver(admin.token, { name: "Amy", lastName: "Adams", driverID: "CMSC-1113-03" });

      const response = await request(app).get("/driverapi/drivers").set(authed(member.token));

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.lastName)).toEqual(["Adams", "Campbell", "Young"]);
    });

    it("returns an empty list when there are no drivers", async () => {
      const { token } = await createUser("empty-list", "user");
      const response = await request(app).get("/driverapi/drivers").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("rejects a list request with no token", async () => {
      const response = await request(app).get("/driverapi/drivers");

      expect(response.status).toBe(401);
    });
  });

  describe("US-4.3 — Correct a driver's name, last name, driver ID, license state, license expiration, approved date, or status", () => {
    it("User edits a driver's information", async () => {
      const { token } = await createUser("editor");
      const created = await createDriver(token);
      const response = await updateDriver(token, created.body.id, { status: "Suspended", driverID: "CMSC-2000-01" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "driver was updated successfully." });

      const listed = await request(app).get("/driverapi/drivers").set(authed(token));
      expect(listed.body[0]).toMatchObject({ status: "Suspended", driverID: "CMSC-2000-01" });
    });

    it("User creates a driver with a name that is too long", async () => {
      await expectRejectedEdit("edit-name", { name: "J".repeat(101) }, "driver name must be 100 characters or fewer.");
    });

    it("User creates a driver with a last name that is too long", async () => {
      await expectRejectedEdit("edit-last", { lastName: "C".repeat(101) }, "driver last name must be 100 characters or fewer.");
    });

    it("User creates a driver with a license state that is too long", async () => {
      await expectRejectedEdit("edit-state", { licenseState: "O".repeat(101) }, "driver license state must be 100 characters or fewer.");
    });

    it("User creates a driver with a status that is too long", async () => {
      await expectRejectedEdit("edit-status", { status: "A".repeat(101) }, "driver status must be 100 characters or fewer.");
    });

    it("User creates a driver with a non-numeric driver ID", async () => {
      const { token } = await createUser("bad-id");
      const created = await createDriver(token);
      const response = await updateDriver(token, "abc", { status: "Suspended" });
      const stored = await db.driver.findByPk(created.body.id);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver id must be a number." });
      expect(stored.status).toBe("Approved");
    });

    it("User creates a driver with a license expiration that is not a valid date", async () => {
      await expectRejectedEdit("edit-exp", { licenseExp: "13/40/28" }, "driver license expiration must be a valid date.");
    });

    it("User creates a driver with an approved date that is not a valid date", async () => {
      await expectRejectedEdit("edit-approved", { approvedDate: "2004-02-30" }, "driver approved date must be a valid date.");
    });

    it("rejects an edit that clears a required field", async () => {
      await expectRejectedEdit("edit-blank", { name: "  " }, "driver name is required.");
    });

    it("User updates a driver that does not exist", async () => {
      const { token } = await createUser("missing");
      await createDriver(token);
      const response = await updateDriver(token, 99999, { status: "Suspended" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "driver not found." });
      expect((await db.driver.findOne()).status).toBe("Approved");
    });

    it("Non-admin cannot edit a driver", async () => {
      const admin = await createUser("edit-admin");
      const member = await createUser("edit-member", "user");
      const created = await createDriver(admin.token);
      const response = await updateDriver(member.token, created.body.id, { status: "Suspended" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect((await db.driver.findByPk(created.body.id)).status).toBe("Approved");
    });
  });

  describe("US-4.4 Remove a driver", () => {
    it("User removes a driver", async () => {
      const { token } = await createUser("deleter");
      const created = await createDriver(token);
      const response = await request(app).delete(`/driverapi/drivers/${created.body.id}`).set(authed(token));
      const listed = await request(app).get("/driverapi/drivers").set(authed(token));

      expect(response.status).toBe(204);
      expect(listed.body).toEqual([]);
    });

    it("User deletes a driver with a non-numeric id", async () => {
      const { token } = await createUser("delete-bad-id");
      await createDriver(token);
      const response = await request(app).delete("/driverapi/drivers/abc").set(authed(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "driver id must be a number." });
      expect(await db.driver.count()).toBe(1);
    });

    it("User deletes a driver that does not exist", async () => {
      const { token } = await createUser("delete-missing");
      await createDriver(token);
      const response = await request(app).delete("/driverapi/drivers/99999").set(authed(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "driver not found." });
      expect(await db.driver.count()).toBe(1);
    });

    it("Non-admin cannot remove a driver", async () => {
      const admin = await createUser("delete-admin");
      const member = await createUser("delete-member", "user");
      const created = await createDriver(admin.token);
      const response = await request(app).delete(`/driverapi/drivers/${created.body.id}`).set(authed(member.token));
      const listed = await request(app).get("/driverapi/drivers").set(authed(member.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(listed.body.map((row) => `${row.name} ${row.lastName}`)).toEqual(["Judah Campbell"]);
    });
  });
});
