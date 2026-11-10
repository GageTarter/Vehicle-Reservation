/**
 * Feature 2 — User Management
 * Spec: features/feature-2-user-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Home from "../src/views/Home.vue";
import Account from "../src/views/Account.vue";
import Utils from "../src/config/utils.js";
import accountServices from "../src/services/accountServices.js";
import authServices from "../src/services/authServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/accountServices.js", () => ({
  default: {
    getAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    googleSignIn: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const jane = {
  userId: 1,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "user",
  token: "session-token",
};

const Shell = { template: "<router-view />" };

function textInputs(wrapper) {
  return wrapper.findAll("input").filter((input) => input.attributes("type") !== "hidden");
}

function button(wrapper, label) {
  return wrapper.findAll("button").filter((item) => item.text() === label);
}

async function mountShell(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Home },
      { path: "/account", name: "account", component: Account },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
    ],
  });

  await router.push(path);
  await router.isReady();

  const wrapper = mount(Shell, {
    global: { plugins: [vuetify, router] },
  });
  await flushPromises();

  return { wrapper, router };
}

describe("Feature 2 — User Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    accountServices.getAccount.mockResolvedValue({ data: { ...jane } });
  });

  describe("US-2.1 — View my account", () => {
    it("User views account", async () => {
      const { wrapper } = await mountShell("/");

      await button(wrapper, "My account")[0].trigger("click");
      await flushPromises();

      expect(accountServices.getAccount).toHaveBeenCalled();
      expect(wrapper.text()).toContain("jane@example.com");
      expect(wrapper.text()).toContain("Jane");
      expect(wrapper.text()).toContain("Doe");
      expect(wrapper.text()).toContain("user");
    });
  });

  describe("US-2.2 — Edit my name", () => {
    it("User saves a new name", async () => {
      accountServices.updateAccount.mockResolvedValue({
        data: { ...jane, fName: "Janet", lName: "Doe" },
      });
      const { wrapper } = await mountShell("/account");

      await button(wrapper, "Edit")[0].trigger("click");
      const inputs = textInputs(wrapper);
      await inputs[0].setValue("Janet");
      await inputs[1].setValue("Doe");
      await button(wrapper, "Save")[0].trigger("click");
      await flushPromises();

      expect(accountServices.updateAccount).toHaveBeenCalledWith({ fName: "Janet", lName: "Doe" });
      expect(Utils.getStore("user").fName).toBe("Janet");
      expect(Utils.getStore("user").lName).toBe("Doe");
      expect(wrapper.text()).toContain("Janet");
    });

    it("User cancels edit", async () => {
      const { wrapper } = await mountShell("/account");

      await button(wrapper, "Edit")[0].trigger("click");
      await textInputs(wrapper)[0].setValue("Janet");
      await button(wrapper, "Cancel")[0].trigger("click");

      expect(accountServices.updateAccount).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Jane");
      expect(wrapper.text()).not.toContain("Janet");
    });
  });

  describe("US-2.3 — Delete my account", () => {
    it("User deletes their account", async () => {
      accountServices.deleteAccount.mockResolvedValue({ data: { message: "Account deleted." } });
      const { wrapper, router } = await mountShell("/account");

      await button(wrapper, "Delete account")[0].trigger("click");
      const confirms = button(wrapper, "Delete account");
      await confirms[confirms.length - 1].trigger("click");
      await flushPromises();

      expect(accountServices.deleteAccount).toHaveBeenCalled();
      expect(localStorage.getItem("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User cancels delete", async () => {
      const { wrapper, router } = await mountShell("/account");

      await button(wrapper, "Delete account")[0].trigger("click");
      await button(wrapper, "Cancel")[0].trigger("click");

      expect(accountServices.deleteAccount).not.toHaveBeenCalled();
      expect(router.currentRoute.value.name).toBe("account");
      expect(Utils.getStore("user").email).toBe("jane@example.com");
    });
  });

  describe("US-2.4 — Sign out", () => {
    it("User signs out", async () => {
      authServices.logoutUser.mockResolvedValue({ data: { message: "Signed out." } });
      const { wrapper, router } = await mountShell("/account");

      await button(wrapper, "Sign out")[0].trigger("click");
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
      expect(localStorage.getItem("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
