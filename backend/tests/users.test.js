/**
 * Feature 2 — User Management
 * Spec: features/feature-2-user-management.md
 */
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase } from "./helpers.js";

async function createUser(fields) {
  const user = await db.user.create({
    googleId: `google-sub-${fields.email}`,
    fName: "Jane",
    lName: "Doe",
    role: "user",
    ...fields,
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

describe("Feature 2 — User Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.5 — View users", () => {
    it("Administrator views users", async () => {
      const { token } = await createUser({
        email: "admin@example.com",
        fName: "Ada",
        lName: "Admin",
        role: "admin",
      });
      const jane = await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app).get("/vehicles/users").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          userId: expect.any(Number),
          email: "admin@example.com",
          fName: "Ada",
          lName: "Admin",
          role: "admin",
        },
        {
          userId: jane.user.id,
          email: "jane@example.com",
          fName: "Jane",
          lName: "Doe",
          role: "user",
        },
      ]);
    });

    it("Area admin views users", async () => {
      const { token } = await createUser({ email: "area@example.com", role: "area_admin" });
      await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app).get("/vehicles/users").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.email)).toEqual(["area@example.com", "jane@example.com"]);
    });

    it("Requestor cannot view users", async () => {
      const { token } = await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app).get("/vehicles/users").set(authed(token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Forbidden! User management access required." });
    });

    it("User list request without a token", async () => {
      const response = await request(app).get("/vehicles/users");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No token provided." });
    });
  });

  describe("US-2.6 — Assign one role", () => {
    it("Administrator assigns a role", async () => {
      const { token } = await createUser({ email: "admin@example.com", role: "admin" });
      const { user } = await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app)
        .put(`/vehicles/users/${user.id}/role`)
        .set(authed(token))
        .send({ role: "maintenance", email: "other@example.com", fName: "Changed" });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe("maintenance");
      expect(stored.role).toBe("maintenance");
      expect(stored.email).toBe("jane@example.com");
      expect(stored.fName).toBe("Jane");
    });

    it("Area admin assigns a role", async () => {
      const { token } = await createUser({ email: "area@example.com", role: "area_admin" });
      const { user } = await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app)
        .put(`/vehicles/users/${user.id}/role`)
        .set(authed(token))
        .send({ role: "area_admin" });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(200);
      expect(stored.role).toBe("area_admin");
    });

    it("Requestor cannot assign a role", async () => {
      const { token } = await createUser({ email: "jane@example.com", role: "user" });
      const target = await createUser({ email: "other@example.com", role: "user" });

      const response = await request(app)
        .put(`/vehicles/users/${target.user.id}/role`)
        .set(authed(token))
        .send({ role: "admin" });
      const stored = await db.user.findByPk(target.user.id);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Forbidden! User management access required." });
      expect(stored.role).toBe("user");
    });

    it("Invalid role is rejected", async () => {
      const { token } = await createUser({ email: "admin@example.com", role: "admin" });
      const { user } = await createUser({ email: "jane@example.com", role: "user" });

      const response = await request(app)
        .put(`/vehicles/users/${user.id}/role`)
        .set(authed(token))
        .send({ role: "driver" });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Role must be user, admin, area_admin, or maintenance.",
      });
      expect(stored.role).toBe("user");
    });

    it("Role update for a missing user", async () => {
      const { token } = await createUser({ email: "admin@example.com", role: "admin" });

      const response = await request(app)
        .put("/vehicles/users/99999/role")
        .set(authed(token))
        .send({ role: "user" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "User with id=99999 not found." });
    });
  });
});
