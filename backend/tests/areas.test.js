/**
 * Feature 6 — Area Management
 * Spec: features/feature-6-area-management.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

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

async function createArea(token, overrides = {}) {
  return request(app)
    .post("/areaapi/areas")
    .set(authed(token))
    .send({ name: "Athletics", ...overrides });
}

describe("Feature 6 — Area Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-6.1 — Add a catalogue area", () => {
    it("User creates a new area", async () => {
      const { token } = await createUser("creator");
      const response = await createArea(token);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: expect.any(Number), name: "Athletics" });
    });

    it("User creates an area with a name that is too long", async () => {
      const { token } = await createUser("long-name");
      const response = await createArea(token, { name: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Area name must be 100 characters or fewer." });
    });

    it("rejects whitespace-only required text fields", async () => {
      const { token } = await createUser("blank-name");
      const response = await createArea(token, { name: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Area name is required." });
    });

    it("Non-admin cannot create an area", async () => {
      const { token } = await createUser("requestor-create", "requestor");
      const response = await createArea(token);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(await db.area.count()).toBe(0);
    });
  });

  describe("US-6.2 — Browse the area List", () => {
    it("User views existing areas", async () => {
      const { token } = await createUser("lister");
      await createArea(token, { name: "Zebra" });
      await createArea(token, { name: "Athletics" });
      const response = await request(app).get("/areaapi/areas").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.name)).toEqual(["Athletics", "Zebra"]);
    });
  });

  describe("US-6.3 — Correct an area's name", () => {
    it("User edits an area's information", async () => {
      const { token } = await createUser("editor");
      const created = await createArea(token);
      const response = await request(app)
        .put(`/areaapi/areas/${created.body.id}`)
        .set(authed(token))
        .send({ name: "Campus Life" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Area was updated successfully." });
      const stored = await db.area.findByPk(created.body.id);
      expect(stored.name).toBe("Campus Life");
    });

    it("User edits an area with a name that is too long", async () => {
      const { token } = await createUser("edit-long");
      const created = await createArea(token);
      const response = await request(app)
        .put(`/areaapi/areas/${created.body.id}`)
        .set(authed(token))
        .send({ name: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Area name must be 100 characters or fewer." });
    });

    it("User updates an area that does not exist", async () => {
      const { token } = await createUser("missing-put");
      const response = await request(app)
        .put("/areaapi/areas/99999")
        .set(authed(token))
        .send({ name: "Campus Life" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Area not found." });
    });

    it("Non-admin cannot edit an area", async () => {
      const { token: adminToken } = await createUser("admin-edit");
      const created = await createArea(adminToken);
      const { token } = await createUser("requestor-edit", "requestor");
      const response = await request(app)
        .put(`/areaapi/areas/${created.body.id}`)
        .set(authed(token))
        .send({ name: "Hacked" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      const stored = await db.area.findByPk(created.body.id);
      expect(stored.name).toBe("Athletics");
    });
  });

  describe("US-6.4 Remove an area", () => {
    it("User removes an area", async () => {
      const { token } = await createUser("deleter");
      const created = await createArea(token);
      const response = await request(app)
        .delete(`/areaapi/areas/${created.body.id}`)
        .set(authed(token));

      expect([200, 204]).toContain(response.status);
      expect(await db.area.findByPk(created.body.id)).toBeNull();
    });

    it("User deletes an area with a non-numeric id", async () => {
      const { token } = await createUser("bad-id");
      const response = await request(app).delete("/areaapi/areas/abc").set(authed(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Area id must be a number." });
    });

    it("User deletes an area that does not exist", async () => {
      const { token } = await createUser("missing-delete");
      const response = await request(app).delete("/areaapi/areas/99999").set(authed(token));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Area not found." });
    });

    it("Non-admin cannot remove an area", async () => {
      const { token: adminToken } = await createUser("admin-delete");
      const created = await createArea(adminToken);
      const { token } = await createUser("requestor-delete", "requestor");
      const response = await request(app)
        .delete(`/areaapi/areas/${created.body.id}`)
        .set(authed(token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      expect(await db.area.findByPk(created.body.id)).not.toBeNull();
    });
  });
});
