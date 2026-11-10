/**
 * Feature 3 — Vehicle Management
 * Spec: features/feature-3-vehicle-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import VehicleList from "../src/views/VehicleList.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import vehicleServices from "../src/services/vehicleServices.js";
import authServices from "../src/services/authServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/vehicleServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

const nissan = {
  id: 1,
  make: "Nissan",
  model: "Pathfinder",
  year: "2014",
  vin: "1M2AR13Y8HM088054",
  purchaseDate: "07/11/24",
  color: "White",
  passengerCapacity: 6,
  licensePlateNo: "DWD947",
  licensePlateExp: "2026-8-14",
  area: "Athletics",
};

const jane = {
  userId: 1,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "user",
  token: "session-token",
};

const mounted = [];

async function mountVehicles() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/vehicles", name: "vehicles", component: VehicleList },
    ],
  });

  await router.push("/vehicles");
  await router.isReady();

  const wrapper = mount(VehicleList, { attachTo: document.body, global: { plugins: [vuetify, router] } });
  mounted.push(wrapper);
  await flushPromises();

  return wrapper;
}

function textInputs() {
  return [...document.querySelectorAll("input")]
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

async function fillNissan(overrides = {}) {
  const values = { ...nissan, passengerCapacity: "6", ...overrides };
  const order = ["make", "model", "year", "vin", "color", "passengerCapacity", "licensePlateNo", "area"];
  const inputs = textInputs().filter((input) => !input.element.closest(".v-date-input"));

  for (let index = 0; index < order.length; index += 1) {
    await inputs[index].setValue(String(values[order[index]] ?? ""));
  }

  const form = mounted.at(-1).vm.form;
  form.purchaseDate = String(overrides.purchaseDate ?? "2024-07-11").trim();
  form.licensePlateExp = String(overrides.licensePlateExp ?? "2026-08-14").trim();
}

describe("Feature 3 — Vehicle Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleServices.getAll.mockReset();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    vehicleServices.getAll.mockResolvedValue({ data: [] });
    authServices.logoutUser.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    while (mounted.length > 0) {
      mounted.pop().unmount();
    }
    document.body.innerHTML = "";
  });

  describe("US-3.1: — Browse the vehicle list", () => {
    it("User views existing vehicles", async () => {
      vehicleServices.getAll.mockResolvedValue({
        data: [nissan, { ...nissan, id: 2, model: "Rogue" }],
      });
      const wrapper = await mountVehicles();

      expect(wrapper.text()).toContain("1");
      expect(wrapper.text()).toContain("Pathfinder");
      expect(wrapper.text().indexOf("Pathfinder")).toBeLessThan(wrapper.text().indexOf("Rogue"));
    });

    it("User has no existing vehicles", async () => {
      const wrapper = await mountVehicles();

      expect(wrapper.find("tbody").exists()).toBe(false);
      expect(wrapper.text()).toContain("No vehicles yet. Create your first vehicle.");
    });

    it("shows an error when the list request fails", async () => {
      vehicleServices.getAll.mockRejectedValue({ response: { data: { message: "Failed to fetch vehicles." } } });
      const wrapper = await mountVehicles();

      expect(wrapper.text()).toContain("Failed to fetch vehicles.");
    });
  });

  describe("US-3.4 — Add a vehicle", () => {
    it("User creates a new vehicle", async () => {
      vehicleServices.getAll.mockResolvedValueOnce({ data: [] }).mockResolvedValue({ data: [nissan] });
      vehicleServices.create.mockResolvedValue({ data: nissan });
      const wrapper = await mountVehicles();

      await wrapper.get("button").trigger("click");
      await flushPromises();
      await fillNissan();
      await buttonByText("Create").trigger("click");
      await flushPromises();

      expect(vehicleServices.create).toHaveBeenCalledWith(expect.objectContaining({
        make: "Nissan",
        model: "Pathfinder",
        year: "2014",
        area: "Athletics",
        passengerCapacity: 6,
      }));
      expect(document.body.textContent).toContain("2014 Nissan Pathfinder");
      expect(dialogIsOpen("Add Vehicle")).toBe(false);
    });

    it("User creates a vehicle with an empty make", async () => {
      const wrapper = await mountVehicles();
      await wrapper.get("button").trigger("click");
      await flushPromises();
      await fillNissan({ make: "   " });
      await buttonByText("Create").trigger("click");

      expect(document.body.textContent).toContain("vehicle make is required.");
      expect(vehicleServices.create).not.toHaveBeenCalled();
    });

    it("User creates a vehicle with an empty area", async () => {
      const wrapper = await mountVehicles();
      await wrapper.get("button").trigger("click");
      await flushPromises();
      await fillNissan({ area: "" });
      await buttonByText("Create").trigger("click");

      expect(document.body.textContent).toContain("vehicle area is required.");
      expect(vehicleServices.create).not.toHaveBeenCalled();
    });

    it("User creates an vehicle with a make that is too long", async () => {
      vehicleServices.create.mockRejectedValue({
        response: { data: { message: "vehicle make must be 100 characters or fewer." } },
      });
      const wrapper = await mountVehicles();
      await wrapper.get("button").trigger("click");
      await flushPromises();
      await fillNissan({ make: "N".repeat(101) });
      await buttonByText("Create").trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("vehicle make must be 100 characters or fewer.");
    });

    it("closes the add dialog without a request when cancelled", async () => {
      const wrapper = await mountVehicles();
      await wrapper.get("button").trigger("click");
      await flushPromises();
      await buttonByText("Cancel").trigger("click");

      expect(vehicleServices.create).not.toHaveBeenCalled();
      expect(dialogIsOpen("Add Vehicle")).toBe(false);
    });
  });

  describe("US-3.2: — Correct a vehicle's information", () => {
    it("User edits a vehicle's information", async () => {
      vehicleServices.getAll.mockResolvedValue({ data: [nissan] });
      vehicleServices.update.mockResolvedValue({ data: { message: "vehicle was updated successfully." } });
      const wrapper = await mountVehicles();

      await wrapper.get("[aria-label='Edit vehicle']").trigger("click");
      await flushPromises();
      await textInputs()[5].setValue("Black");
      await buttonByText("Save Vehicle").trigger("click");
      await flushPromises();

      expect(vehicleServices.update).toHaveBeenCalledWith(1, expect.objectContaining({ color: "Black" }));
      expect(dialogIsOpen("Edit Vehicle")).toBe(false);
    });

    it("User edits a vehicle with any empty information area", async () => {
      vehicleServices.getAll.mockResolvedValue({ data: [nissan] });
      const wrapper = await mountVehicles();

      await wrapper.get("[aria-label='Edit vehicle']").trigger("click");
      await flushPromises();
      await textInputs()[5].setValue("   ");
      await buttonByText("Save Vehicle").trigger("click");

      expect(document.body.textContent).toContain("All fields must be filled.");
      expect(vehicleServices.update).not.toHaveBeenCalled();
    });

    it("User edits a vehicle with a color that is too long", async () => {
      vehicleServices.getAll.mockResolvedValue({ data: [nissan] });
      vehicleServices.update.mockRejectedValue({
        response: { data: { message: "vehicle color must be 100 characters or fewer." } },
      });
      const wrapper = await mountVehicles();

      await wrapper.get("[aria-label='Edit vehicle']").trigger("click");
      await flushPromises();
      await textInputs()[5].setValue("C".repeat(101));
      await buttonByText("Save Vehicle").trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("vehicle color must be 100 characters or fewer.");
    });
  });

  describe("US-3.3: Remove a vehicle", () => {
    it("User removes an vehicle", async () => {
      vehicleServices.getAll.mockResolvedValueOnce({ data: [nissan] }).mockResolvedValue({ data: [] });
      vehicleServices.remove.mockResolvedValue({ status: 204 });
      const wrapper = await mountVehicles();

      await wrapper.get("[aria-label='Delete vehicle']").trigger("click");
      await flushPromises();
      await buttonByText("Delete Vehicle").trigger("click");
      await flushPromises();

      expect(vehicleServices.remove).toHaveBeenCalledWith(1);
      expect(document.body.textContent).not.toContain("2014 Nissan Pathfinder");
    });

    it("leaves the vehicle in place when delete is cancelled", async () => {
      vehicleServices.getAll.mockResolvedValue({ data: [nissan] });
      const wrapper = await mountVehicles();

      await wrapper.get("[aria-label='Delete vehicle']").trigger("click");
      await flushPromises();
      await buttonByText("Cancel").trigger("click");

      expect(vehicleServices.remove).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("2014 Nissan Pathfinder");
    });
  });
});

describe("Vehicles menu", () => {
  beforeEach(() => {
    localStorage.clear();
    authServices.logoutUser.mockResolvedValue({ data: {} });
  });

  it("shows Vehicles to a signed-in user and hides it after sign-out", async () => {
    Utils.setStore("user", { ...jane });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
        { path: "/vehicles", name: "vehicles", component: { template: "<div>Vehicles</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();
    const Shell = { components: { MenuBar }, template: "<v-app><MenuBar /></v-app>" };
    const wrapper = mount(Shell, { global: { plugins: [vuetify, router] } });

    expect(wrapper.text()).toContain("Vehicles");

    Utils.removeItem("user");
    window.dispatchEvent(new Event("user-logged-out"));
    await flushPromises();

    expect(wrapper.text()).not.toContain("Vehicles");
  });
});
