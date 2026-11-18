/**
 * Feature 6 — Area Management
 * Spec: features/feature-6-area-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import AreaList from "../src/views/areaList.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import areaServices from "../src/services/areaServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/areaServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const athletics = { id: 1, name: "Athletics" };

const jane = {
  userId: 1,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "admin",
  token: "session-token",
};

const mounted = [];

async function mountAreas() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/areas", name: "areas", component: AreaList },
    ],
  });

  await router.push("/areas");
  await router.isReady();

  const wrapper = mount(AreaList, { attachTo: document.body, global: { plugins: [vuetify, router] } });
  mounted.push(wrapper);
  await flushPromises();

  return wrapper;
}

function plainTextInputs() {
  return [...document.querySelectorAll(".v-overlay--active input")]
    .filter((input) => input.type !== "hidden")
    .map((input) => new DOMWrapper(input));
}

function dialogIsOpen(title) {
  return [...document.querySelectorAll(".v-overlay--active .v-card-title")]
    .some((node) => node.textContent.includes(title));
}

function buttonByText(label) {
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === label);

  return button ? new DOMWrapper(button) : undefined;
}

async function openAddDialog() {
  await buttonByText("+ New area").trigger("click");
  await flushPromises();
}

async function fillArea(name = "Athletics") {
  const inputs = plainTextInputs();
  await inputs[0].setValue(String(name ?? ""));
}

async function submitAdd(name = "Athletics") {
  const wrapper = await mountAreas();
  await openAddDialog();
  await fillArea(name);
  await buttonByText("Create").trigger("click");
  await flushPromises();

  return wrapper;
}

describe("Feature 6 — Area Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    areaServices.getAll.mockReset();
    areaServices.create.mockReset();
    areaServices.update.mockReset();
    areaServices.remove.mockReset();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    areaServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    while (mounted.length > 0) {
      mounted.pop().unmount();
    }
    document.body.innerHTML = "";
  });

  describe("US-6.1 — Add a catalogue area", () => {
    it("User creates a new area", async () => {
      areaServices.getAll.mockResolvedValueOnce({ data: [] }).mockResolvedValue({ data: [athletics] });
      areaServices.create.mockResolvedValue({ data: athletics });
      await submitAdd("Athletics");

      expect(areaServices.create).toHaveBeenCalledWith({ name: "Athletics" });
      expect(document.body.textContent).toContain("Athletics");
      expect(dialogIsOpen("Add area")).toBe(false);
    });

    it("User creates an area with an empty name", async () => {
      await submitAdd("   ");

      expect(document.body.textContent).toContain("Area name is required.");
      expect(areaServices.create).not.toHaveBeenCalled();
      expect(dialogIsOpen("Add area")).toBe(true);
    });

    it("User creates an area with an existing name", async () => {
      areaServices.getAll.mockResolvedValue({ data: [athletics] });
      await submitAdd("Athletics");

      expect(document.body.textContent).toContain("Area name is in use. Enter a different area name.");
      expect(areaServices.create).not.toHaveBeenCalled();
    });

    it("User creates an area with a name that is too long", async () => {
      areaServices.create.mockRejectedValue({
        response: { data: { message: "Area name must be 100 characters or fewer." } },
      });
      await submitAdd("A".repeat(101));

      expect(areaServices.create).toHaveBeenCalled();
      expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(
        "Area name must be 100 characters or fewer.",
      );
    });
  });

  describe("US-6.2 — Browse the area List", () => {
    it("User views existing areas", async () => {
      areaServices.getAll.mockResolvedValue({
        data: [
          { id: 1, name: "Athletics" },
          { id: 2, name: "Campus Life" },
        ],
      });
      const wrapper = await mountAreas();

      expect(wrapper.text()).toContain("Athletics");
      expect(wrapper.text().indexOf("Athletics")).toBeLessThan(wrapper.text().indexOf("Campus Life"));
    });

    it("There are no existing areas", async () => {
      const wrapper = await mountAreas();

      expect(wrapper.find("tbody").exists()).toBe(false);
    });
  });

  describe("US-6.3 — Correct an area's name", () => {
    it("User edits an area's information", async () => {
      areaServices.getAll.mockResolvedValue({ data: [athletics] });
      areaServices.update.mockResolvedValue({ data: { message: "Area was updated successfully." } });
      const wrapper = await mountAreas();

      await wrapper.get("[aria-label='Edit area']").trigger("click");
      await flushPromises();
      await fillArea("Campus Life");
      await buttonByText("Save area").trigger("click");
      await flushPromises();

      expect(areaServices.update).toHaveBeenCalledWith(1, { name: "Campus Life" });
      expect(dialogIsOpen("Edit area")).toBe(false);
    });

    it("User edits an area with an empty name", async () => {
      areaServices.getAll.mockResolvedValue({ data: [athletics] });
      const wrapper = await mountAreas();

      await wrapper.get("[aria-label='Edit area']").trigger("click");
      await flushPromises();
      await fillArea("   ");
      await buttonByText("Save area").trigger("click");

      expect(document.body.textContent).toContain("Area name is required.");
      expect(areaServices.update).not.toHaveBeenCalled();
    });

    it("User edits an area with an existing name", async () => {
      areaServices.getAll.mockResolvedValue({
        data: [athletics, { id: 2, name: "Campus Life" }],
      });
      const wrapper = await mountAreas();

      await wrapper.get("[aria-label='Edit area']").trigger("click");
      await flushPromises();
      await fillArea("Campus Life");
      await buttonByText("Save area").trigger("click");

      expect(document.body.textContent).toContain("Area name is in use. Enter a different area name.");
      expect(areaServices.update).not.toHaveBeenCalled();
    });

    it("User edits an area with a name that is too long", async () => {
      areaServices.getAll.mockResolvedValue({ data: [athletics] });
      areaServices.update.mockRejectedValue({
        response: { data: { message: "Area name must be 100 characters or fewer." } },
      });
      const wrapper = await mountAreas();

      await wrapper.get("[aria-label='Edit area']").trigger("click");
      await flushPromises();
      await fillArea("A".repeat(101));
      await buttonByText("Save area").trigger("click");
      await flushPromises();

      expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(
        "Area name must be 100 characters or fewer.",
      );
    });
  });

  describe("US-6.4 Remove an area", () => {
    it("User removes an area", async () => {
      areaServices.getAll.mockResolvedValueOnce({ data: [athletics] }).mockResolvedValue({ data: [] });
      areaServices.remove.mockResolvedValue({ status: 204 });
      const wrapper = await mountAreas();

      await wrapper.get("[aria-label='Delete area']").trigger("click");
      await flushPromises();
      await buttonByText("Delete area").trigger("click");
      await flushPromises();

      expect(areaServices.remove).toHaveBeenCalledWith(1);
      expect(document.body.textContent).not.toContain("Athletics");
    });
  });
});

describe("Areas menu", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens areas from the management menu", async () => {
    Utils.setStore("user", { ...jane });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
        { path: "/requests", name: "requests", component: { template: "<div>Requests</div>" } },
        { path: "/checkout-return", name: "checkoutReturn", component: { template: "<div>Checkout</div>" } },
        { path: "/request-servicing", name: "requestServicing", component: { template: "<div>Need</div>" } },
        { path: "/calendar", name: "calendar", component: { template: "<div>Calendar</div>" } },
        { path: "/drivers", name: "drivers", component: { template: "<div>Drivers</div>" } },
        { path: "/areas", name: "areas", component: { template: "<div>Areas</div>" } },
        { path: "/vehicles", name: "vehicles", component: { template: "<div>Vehicles</div>" } },
        { path: "/destinations", name: "destinations", component: { template: "<div>Destinations</div>" } },
        { path: "/users", name: "users", component: { template: "<div>Users</div>" } },
        { path: "/issues", name: "vehicleIssueReporting", component: { template: "<div>Issues</div>" } },
        { path: "/maintenance", name: "vehicleMaintenance", component: { template: "<div>Maintenance</div>" } },
        { path: "/mileage-service", name: "vehicleMileageService", component: { template: "<div>Mileage</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();
    const Shell = { components: { MenuBar }, template: "<v-app><MenuBar /></v-app>" };
    const wrapper = mount(Shell, { attachTo: document.body, global: { plugins: [vuetify, router] } });

    await wrapper.get("[aria-label='Open management menu']").trigger("click");
    await flushPromises();

    const managementLabels = [...document.querySelectorAll(".v-overlay--active a")]
      .map((item) => item.textContent.trim())
      .filter((label) => ["Drivers", "Areas", "Vehicles", "Destinations", "Users"].includes(label));

    expect(managementLabels).toEqual(["Drivers", "Areas", "Vehicles", "Destinations", "Users"]);
    wrapper.unmount();
    document.body.innerHTML = "";
  });
});
