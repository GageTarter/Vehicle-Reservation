/**
 * Feature 1 — Google Authentication
 * Spec: features/feature-1-google-auth.md
 */
import { jest } from "@jest/globals";

const verifyGoogleIdToken = jest.fn();

jest.unstable_mockModule("../app/authorization/googleToken.js", () => ({
  verifyGoogleIdToken,
}));

const { default: app } = await import("../server.js");
const { default: request } = await import("supertest");
const { syncTestDatabase } = await import("./helpers.js");
const db = (await import("../app/models/index.js")).default;
const { seedAdmin } = await import("../app/scripts/seed-admin.js");

const janePayload = {
  sub: "google-sub-jane",
  email: "jane@example.com",
  email_verified: true,
  given_name: "Jane",
  family_name: "Doe",
  iss: "https://accounts.google.com",
};

async function postGoogle(idToken, extra = {}) {
  return request(app)
    .post("/vehicles/auth/google")
    .send({ idToken, ...extra });
}

describe("Feature 1 — Google Authentication", () => {
  beforeEach(async () => {
    verifyGoogleIdToken.mockReset();
    await syncTestDatabase();
  });

  describe("US-1.1 — Sign in with Google (new account)", () => {
    it("New Google user signs in", async () => {
      verifyGoogleIdToken.mockResolvedValue(janePayload);

      const response = await postGoogle("jane-token");
      const stored = await db.user.findOne({ where: { googleId: "google-sub-jane" } });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(stored.id);
      expect(response.body.email).toBe("jane@example.com");
      expect(response.body.fName).toBe("Jane");
      expect(response.body.lName).toBe("Doe");
      expect(response.body.role).toBe("user");
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.password).toBeUndefined();
      expect(stored.toJSON()).not.toHaveProperty("password");
      expect(await db.session.count({ where: { userId: stored.id } })).toBe(1);
    });

    it("First sign-in ignores a role supplied in the request body", async () => {
      verifyGoogleIdToken.mockResolvedValue({
        sub: "google-sub-sneaky",
        email: "sneaky@example.com",
        email_verified: true,
        given_name: "Sneaky",
        family_name: "User",
        iss: "https://accounts.google.com",
      });

      const response = await postGoogle("sneaky-token", { role: "admin" });
      const stored = await db.user.findOne({ where: { googleId: "google-sub-sneaky" } });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe("user");
      expect(stored.role).toBe("user");
    });

    it("Unverified Google email is rejected", async () => {
      verifyGoogleIdToken.mockResolvedValue({
        sub: "google-sub-unverified",
        email: "unverified@example.com",
        email_verified: false,
        given_name: "No",
        family_name: "Verify",
        iss: "https://accounts.google.com",
      });

      const response = await postGoogle("unverified-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Google sign-in failed." });
      expect(await db.user.count()).toBe(0);
    });
  });

  describe("US-1.2 — Sign in with Google (existing account)", () => {
    it("Returning user signs in with Google", async () => {
      verifyGoogleIdToken.mockResolvedValue(janePayload);
      const created = await postGoogle("jane-token");
      const again = await postGoogle("jane-token-again");

      expect(created.status).toBe(201);
      expect(again.status).toBe(200);
      expect(again.body.userId).toBe(created.body.userId);
      expect(again.body.email).toBe("jane@example.com");
      expect(again.body.role).toBe("user");
      expect(again.body.token).toBe(created.body.token);
      expect(await db.session.count()).toBe(1);
    });

    it("Invalid Google ID token is rejected", async () => {
      verifyGoogleIdToken.mockRejectedValue(new Error("Invalid token"));

      const response = await postGoogle("not-a-google-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Google sign-in failed." });
      expect(await db.user.count()).toBe(0);
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      verifyGoogleIdToken.mockResolvedValue(janePayload);
      const signedIn = await postGoogle("jane-token");

      const response = await request(app)
        .post("/vehicles/logout")
        .set("Authorization", `Bearer ${signedIn.body.token}`);

      expect(response.status).toBe(200);
      expect(await db.session.findOne({ where: { token: signedIn.body.token } })).toBeNull();
    });

    it("Reusing a token after sign out fails", async () => {
      verifyGoogleIdToken.mockResolvedValue(janePayload);
      const signedIn = await postGoogle("jane-token");
      const token = signedIn.body.token;

      await request(app).post("/vehicles/logout").set("Authorization", `Bearer ${token}`);
      const replay = await request(app).post("/vehicles/logout").set("Authorization", `Bearer ${token}`);

      expect(replay.status).toBe(401);
    });
  });

  describe("US-1.6 — Distinguish admins from users", () => {
    it("Seeded admin signs in with Google and receives the admin role", async () => {
      await seedAdmin({
        googleId: "google-sub-admin",
        email: "admin@example.com",
        fName: "Ada",
        lName: "Min",
      });
      verifyGoogleIdToken.mockResolvedValue({
        sub: "google-sub-admin",
        email: "admin@example.com",
        email_verified: true,
        given_name: "Ada",
        family_name: "Min",
        iss: "https://accounts.google.com",
      });

      const response = await postGoogle("admin-token");

      expect(response.status).toBe(200);
      expect(response.body.role).toBe("admin");
    });
  });
});
