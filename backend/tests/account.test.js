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

async function createJane() {
  const user = await db.user.create({
    googleId: "google-sub-jane",
    email: "jane@example.com",
    fName: "Jane",
    lName: "Doe",
    role: "user",
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

  describe("US-2.1 — View my account", () => {
    it("User views account", async () => {
      const { user, token } = await createJane();

      const response = await request(app).get("/vehicles/me").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userId: user.id,
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "user",
      });
    });

    it("Account request without a token", async () => {
      const response = await request(app).get("/vehicles/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No token provided." });
    });
  });

  describe("US-2.2 — Edit my name", () => {
    it("User saves a new name", async () => {
      const { user, token } = await createJane();

      const response = await request(app)
        .put("/vehicles/me")
        .set(authed(token))
        .send({ fName: "Janet", lName: "Doe" });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(200);
      expect(response.body.fName).toBe("Janet");
      expect(response.body.lName).toBe("Doe");
      expect(stored.fName).toBe("Janet");
      expect(stored.lName).toBe("Doe");
      expect(stored.email).toBe("jane@example.com");
      expect(stored.role).toBe("user");
    });

    it("Name update ignores role and email", async () => {
      const { user, token } = await createJane();

      const response = await request(app).put("/vehicles/me").set(authed(token)).send({
        fName: "Janet",
        lName: "Doe",
        role: "admin",
        email: "other@example.com",
        googleId: "google-sub-other",
      });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(200);
      expect(stored.role).toBe("user");
      expect(stored.email).toBe("jane@example.com");
      expect(stored.googleId).toBe("google-sub-jane");
    });

    it("Non-text name is rejected", async () => {
      const { user, token } = await createJane();

      const response = await request(app)
        .put("/vehicles/me")
        .set(authed(token))
        .send({ fName: 1, lName: "Doe" });
      const stored = await db.user.findByPk(user.id);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "First and last name must be text." });
      expect(stored.fName).toBe("Jane");
      expect(stored.lName).toBe("Doe");
    });
  });

  describe("US-2.3 — Delete my account", () => {
    it("User deletes their account", async () => {
      const { user, token } = await createJane();

      const response = await request(app).delete("/vehicles/me").set(authed(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Account deleted." });
      expect(await db.user.findByPk(user.id)).toBeNull();
      expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    });

    it("Reusing a token after delete fails", async () => {
      const { token } = await createJane();

      await request(app).delete("/vehicles/me").set(authed(token));
      const replay = await request(app).get("/vehicles/me").set(authed(token));

      expect(replay.status).toBe(401);
    });
  });

  describe("US-2.4 — Sign out", () => {
    it("Reusing a token after sign out fails", async () => {
      const { token } = await createJane();

      await request(app).post("/vehicles/logout").set(authed(token));
      const replay = await request(app).get("/vehicles/me").set(authed(token));

      expect(replay.status).toBe(401);
    });
  });
});
