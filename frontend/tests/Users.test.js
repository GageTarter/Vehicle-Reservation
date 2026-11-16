/**
 * Feature 2 — User Management
 * Spec: features/feature-2-user-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Users from "../src/views/Users.vue";
import Utils from "../src/config/utils.js";
import accountServices from "../src/services/accountServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/accountServices.js", () => ({
  default: {
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

const admin = {
  userId: 1,
  email: "admin@example.com",
  fName: "Ada",
  lName: "Admin",
  role: "admin",
  token: "session-token",
};

const jane = {
  userId: 2,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "user",
  token: "jane-token",
};

async function mountUsers(path = "/users") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/users", name: "users", component: Users },
    ],
  });

  router.beforeEach((to) => {
    const user = Utils.getStore("user");

    if (!user && to.name !== "login") {
      return { name: "login" };
    }

    if (to.name === "users" && user?.role !== "admin" && user?.role !== "area_admin") {
      return { name: "home" };
    }

    return true;
  });

  await router.push(path);
  await router.isReady();

  const wrapper = mount({ template: "<router-view />" }, { global: { plugins: [vuetify, router] } });
  await flushPromises();

  return { wrapper, router };
}

describe("Feature 2 — User Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    accountServices.getUsers.mockResolvedValue({ data: [admin, jane] });
  });

  describe("US-2.5 — View users", () => {
    it("Administrator views users", async () => {
      Utils.setStore("user", { ...admin });

      const { wrapper } = await mountUsers();

      expect(accountServices.getUsers).toHaveBeenCalled();
      expect(wrapper.text()).toContain("jane@example.com");
      expect(wrapper.text()).toContain("Jane Doe");
      expect(wrapper.text()).toContain("user");
    });

    it("Requestor cannot view users", async () => {
      Utils.setStore("user", { ...jane });

      const { wrapper, router } = await mountUsers();

      expect(router.currentRoute.value.name).toBe("home");
      expect(wrapper.text()).toContain("Home");
      expect(accountServices.getUsers).not.toHaveBeenCalled();
    });
  });

  describe("US-2.6 — Assign one role", () => {
    it("Administrator assigns a role", async () => {
      Utils.setStore("user", { ...admin });
      accountServices.updateUserRole.mockResolvedValue({
        data: { ...jane, role: "maintenance" },
      });

      const { wrapper } = await mountUsers();
      const janeRow = wrapper.findAll("tr").find((row) => row.text().includes("jane@example.com"));
      const select = janeRow.findComponent({ name: "VSelect" });

      await select.setValue("maintenance");
      await janeRow.find("button").trigger("click");
      await flushPromises();

      expect(accountServices.updateUserRole).toHaveBeenCalledWith(jane.userId, { role: "maintenance" });
      expect(janeRow.text()).toContain("maintenance");
    });
  });
});
