/**
 * Feature 1 — Google Authentication
 * Spec: features/feature-1-google-auth.md
 */
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { authenticate, requireAdmin } from "../app/authorization/authorization.js";
import { syncTestDatabase } from "./helpers.js";

const probe = express();
probe.get("/protected", authenticate, (req, res) => {
  res.status(200).send({ id: req.user.id, role: req.user.role });
});
probe.get("/admin", authenticate, requireAdmin, (req, res) => {
  res.status(200).send({ id: req.user.id, role: req.user.role });
});

let sequence = 0;

async function createUserWithSession({ role, expired = false }) {
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
    expirationDate: new Date(Date.now() + (expired ? -1000 : 24 * 60 * 60 * 1000)),
    userId: user.id,
  });

  return { user, token };
}

describe("Feature 1 — Google Authentication", () => {
  beforeEach(async () => {
    sequence = 0;
    await syncTestDatabase();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const { user, token } = await createUserWithSession({ role: "user" });

      const response = await request(probe)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: user.id, role: "user" });
    });

    it("Expired or invalid session token", async () => {
      const { token } = await createUserWithSession({ role: "user", expired: true });

      const response = await request(probe)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Protected API request without a token", async () => {
      const response = await request(probe).get("/protected");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No token provided." });
    });
  });

  describe("US-1.6 — Distinguish admins from users", () => {
    it("User is rejected by the admin guard", async () => {
      const { token } = await createUserWithSession({ role: "user" });

      const response = await request(probe).get("/admin").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Forbidden! Admin access required." });
    });

    it("Admin passes the admin guard", async () => {
      const { token } = await createUserWithSession({ role: "admin" });

      const response = await request(probe).get("/admin").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});
