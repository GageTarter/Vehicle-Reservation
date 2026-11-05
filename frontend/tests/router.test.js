/**
 * Feature 1 — Google Authentication
 * Spec: features/feature-1-google-auth.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("Feature 1 — Google Authentication", () => {
  beforeEach(async () => {
    localStorage.clear();

    if (router.currentRoute.value.name !== "login") {
      await router.push({ name: "login" });
    }
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "user",
        token: "session-token",
      });

      await router.push({ name: "home" });
      await router.push({ name: "login" });

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push({ name: "home" });

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
