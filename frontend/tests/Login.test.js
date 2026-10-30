/**
 * Feature 1 — Google Authentication
 * Spec: features/feature-1-google-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";
import { requestGoogleIdToken } from "../src/config/googleIdentity.js";
import authServices from "../src/services/authServices.js";

vi.mock("../src/config/googleIdentity.js", () => ({
  requestGoogleIdToken: vi.fn(),
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    googleSignIn: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

describe("Feature 1 — Google Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-1.1 — Sign in with Google (new account)", () => {
    it("User cancels the Google prompt", async () => {
      requestGoogleIdToken.mockRejectedValue(Object.assign(new Error("cancelled"), { code: "cancelled" }));
      const router = await createTestRouter("/login");
      const { wrapper } = await mountWithPlugins(Login, { router });

      await wrapper.get("button").trigger("click");
      await flushPromises();

      expect(authServices.googleSignIn).not.toHaveBeenCalled();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-1.2 — Sign in with Google (existing account)", () => {
    it("Invalid Google ID token is rejected", async () => {
      requestGoogleIdToken.mockResolvedValue("bad-token");
      authServices.googleSignIn.mockRejectedValue({
        response: { status: 401, data: { message: "Google sign-in failed." } },
      });
      const router = await createTestRouter("/login");
      const { wrapper } = await mountWithPlugins(Login, { router });

      await wrapper.get("button").trigger("click");
      await flushPromises();

      expect(authServices.googleSignIn).toHaveBeenCalledWith("bad-token");
      expect(wrapper.find(".v-alert").text()).toContain("Google sign-in failed.");
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
