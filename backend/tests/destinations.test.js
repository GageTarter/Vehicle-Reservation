/**
 * Feature 5 — Destination Management
 * Spec: features/feature-5-destination-management.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

const oc = {
  name: "Oklahoma Christian University",
  addressLine1: "2501 East Memorial Road",
  addressLine2: null,
  city: "Edmond",
  state: "Oklahoma",
  zip: "73013",
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

async function createDestination(token, overrides = {}) {
  return request(app)
    .post("/destinationapi/destinations")
    .set(authed(token))
    .send({ ...oc, addressLine2: "", ...overrides });
}

async function updateDestination(token, id, overrides = {}) {
  return request(app)
    .put(`/destinationapi/destinations/${id}`)
    .set(authed(token))
    .send({ ...oc, addressLine2: "", ...overrides });
}

async function expectRejectedEdit(suffix, overrides, message) {
  const { token } = await createUser(suffix);
  const created = await createDestination(token);
  const response = await updateDestination(token, created.body.id, overrides);
  const stored = await db.destination.findByPk(created.body.id);

  expect(response.status).toBe(400);
  expect(response.body).toEqual({ message });
  expect(stored.zip).toBe("73013");
}

describe("Feature 5 — Destination Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-5.1 — Add a catalogue destination", () => {
    it("User creates a new destination", async () => {
      const { token } = await createUser("creator");
      const response = await createDestination(token);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: expect.any(Number), ...oc });
      expect(response.body.addressLine2).toBeNull();
    });

    it("User creates a destination without an address line 2", async () => {
      const { token } = await createUser("no-line-2");
      const response = await createDestination(token, { addressLine2: "   " });

      expect(response.status).toBe(201);
      expect(response.body.addressLine2).toBeNull();
      expect(response.body.name).toBe(oc.name);
    });

    it("User creates a destination with a name that is too long", async () => {
      const { token } = await createUser("long-name");
      const response = await createDestination(token, { name: "N".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination name must be 100 characters or fewer." });
    });

    it("User creates a destination with an address line 1 that is too long", async () => {
      const { token } = await createUser("long-line1");
      const response = await createDestination(token, { addressLine1: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination address line 1 must be 100 characters or fewer." });
    });

    it("User creates a destination with an address line 2 that is too long", async () => {
      const { token } = await createUser("long-line2");
      const response = await createDestination(token, { addressLine2: "B".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination address line 2 must be 100 characters or fewer." });
    });

    it("User creates a destination with a city that is too long", async () => {
      const { token } = await createUser("long-city");
      const response = await createDestination(token, { city: "C".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination city must be 100 characters or fewer." });
    });

    it("User creates a destination with a state that is too long", async () => {
      const { token } = await createUser("long-state");
      const response = await createDestination(token, { state: "S".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination state must be 100 characters or fewer." });
    });

    it("User creates a destination with an invalid zip", async () => {
      const { token } = await createUser("bad-zip");

      for (const zip of ["7301", "730133", "73O13"]) {
        const response = await createDestination(token, { zip });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "destination zip must be exactly 5 digits." });
      }

      expect(await db.destination.count()).toBe(0);
    });

    it("rejects whitespace-only required text fields", async () => {
      const { token } = await createUser("blank-fields");
      const cases = [
        ["name", "destination name is required."],
        ["addressLine1", "destination address line 1 is required."],
        ["city", "destination city is required."],
        ["state", "destination state is required."],
        ["zip", "destination zip is required."],
      ];

      for (const [field, message] of cases) {
        const response = await createDestination(token, { [field]: "   " });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message });
      }

      expect(await db.destination.count()).toBe(0);
    });

    it("Non-admin cannot create a destination", async () => {
      const { token } = await createUser("member", "user");
      const response = await createDestination(token);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(await db.destination.count()).toBe(0);
    });
  });

  describe("US-5.2 — Browse the destination List", () => {
    it("User views existing destinations", async () => {
      const admin = await createUser("lister");
      const member = await createUser("viewer", "user");
      await createDestination(admin.token, { name: "Zoo Hall" });
      await createDestination(admin.token);
      await createDestination(admin.token, { name: "Alpha Center", zip: "73014" });

      const response = await request(app).get("/destinationapi/destinations").set(authed(member.token));

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.name)).toEqual([
        "Alpha Center",
        "Oklahoma Christian University",
        "Zoo Hall",
      ]);
    });
  });

  describe("US-5.3 — Correct a destination's name, address line 1, address line 2, city, state, or zip", () => {
    it("User edits a destination's information", async () => {
      const { token } = await createUser("editor");
      const created = await createDestination(token);
      const response = await updateDestination(token, created.body.id, {
        city: "Oklahoma City",
        zip: "73102",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "destination was updated successfully." });

      const listed = await request(app).get("/destinationapi/destinations").set(authed(token));
      expect(listed.body[0]).toMatchObject({ city: "Oklahoma City", zip: "73102" });
    });

    it("User clears a destination's address line 2", async () => {
      const { token } = await createUser("clear-line2");
      const created = await createDestination(token, { addressLine2: "Suite 100" });
      const response = await updateDestination(token, created.body.id, { addressLine2: "  " });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "destination was updated successfully." });
      expect((await db.destination.findByPk(created.body.id)).addressLine2).toBeNull();
    });

    it("User edits a destination with a name that is too long", async () => {
      await expectRejectedEdit("edit-name", { name: "N".repeat(101) }, "destination name must be 100 characters or fewer.");
    });

    it("User edits a destination with an address line 1 that is too long", async () => {
      await expectRejectedEdit("edit-line1", { addressLine1: "A".repeat(101) }, "destination address line 1 must be 100 characters or fewer.");
    });

    it("User edits a destination with an address line 2 that is too long", async () => {
      await expectRejectedEdit("edit-line2", { addressLine2: "B".repeat(101) }, "destination address line 2 must be 100 characters or fewer.");
    });

    it("User edits a destination with a city that is too long", async () => {
      await expectRejectedEdit("edit-city", { city: "C".repeat(101) }, "destination city must be 100 characters or fewer.");
    });

    it("User edits a destination with a state that is too long", async () => {
      await expectRejectedEdit("edit-state", { state: "S".repeat(101) }, "destination state must be 100 characters or fewer.");
    });

    it("User edits a destination with an invalid zip", async () => {
      await expectRejectedEdit("edit-zip", { zip: "73O13" }, "destination zip must be exactly 5 digits.");
    });

    it("User updates a destination with a non-numeric id", async () => {
      const { token } = await createUser("bad-id");
      const created = await createDestination(token);
      const response = await updateDestination(token, "abc", { city: "Tulsa" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination id must be a number." });
      expect((await db.destination.findByPk(created.body.id)).city).toBe("Edmond");
    });

    it("User updates a destination that does not exist", async () => {
      const { token } = await createUser("missing");
      await createDestination(token);
      const response = await updateDestination(token, 99999, { city: "Tulsa" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "destination not found." });
    });

    it("Non-admin cannot edit a destination", async () => {
      const admin = await createUser("edit-admin");
      const member = await createUser("edit-member", "user");
      const created = await createDestination(admin.token);
      const response = await updateDestination(member.token, created.body.id, { city: "Tulsa" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect((await db.destination.findByPk(created.body.id)).city).toBe("Edmond");
    });
  });

  describe("US-5.4 Remove a destination", () => {
    it("User removes a destination", async () => {
      const { token } = await createUser("deleter");
      const created = await createDestination(token);
      const response = await request(app).delete(`/destinationapi/destinations/${created.body.id}`).set(authed(token));
      const listed = await request(app).get("/destinationapi/destinations").set(authed(token));

      expect(response.status).toBe(204);
      expect(listed.body).toEqual([]);
    });

    it("User deletes a destination with a non-numeric id", async () => {
      const { token } = await createUser("delete-bad-id");
      await createDestination(token);
      const response = await request(app).delete("/destinationapi/destinations/abc").set(authed(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "destination id must be a number." });
      expect(await db.destination.count()).toBe(1);
    });

    it("User deletes a destination that does not exist", async () => {
      const { token } = await createUser("delete-missing");
      await createDestination(token);
      const response = await request(app).delete("/destinationapi/destinations/99999").set(authed(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "destination not found." });
      expect(await db.destination.count()).toBe(1);
    });

    it("Non-admin cannot remove a destination", async () => {
      const admin = await createUser("delete-admin");
      const member = await createUser("delete-member", "user");
      const created = await createDestination(admin.token);
      const response = await request(app).delete(`/destinationapi/destinations/${created.body.id}`).set(authed(member.token));
      const listed = await request(app).get("/destinationapi/destinations").set(authed(member.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(listed.body.map((row) => row.name)).toEqual([oc.name]);
    });
  });
});
