/**
 * Feature 4 — Driver Management
 * Spec: features/feature-4-driver-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import DriverList from "../src/views/driverList.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import driverServices from "../src/services/driverServices.js";
import areaServices from "../src/services/areaServices.js";
import authServices from "../src/services/authServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/driverServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../src/services/areaServices.js", () => ({
  default: {
    getAll: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

const judah = {
  id: 1,
  name: "Judah",
  lastName: "Campbell",
  driverID: "CMSC-1113-01",
  licenseState: "Oklahoma",
  licenseExp: "2028-01-01",
  approvedDate: "2004-09-23",
  area: "Athletics",
  status: "Approved",
};

const jane = {
  userId: 1,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "admin",
  token: "session-token",
};

const textFields = ["name", "lastName", "driverID", "licenseState", "status"];
const mounted = [];

async function mountDrivers() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/drivers", name: "drivers", component: DriverList },
    ],
  });

  await router.push("/drivers");
  await router.isReady();

  const wrapper = mount(DriverList, { attachTo: document.body, global: { plugins: [vuetify, router] } });
  mounted.push(wrapper);
  await flushPromises();

  return wrapper;
}

function plainTextInputs() {
  return [...document.querySelectorAll(".v-overlay--active input")]
    .filter((input) => input.type !== "hidden")
    .filter((input) => !input.closest(".v-date-input") && !input.closest(".v-combobox"))
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

async function openAddDialog(wrapper) {
  await buttonByText("+ New driver").trigger("click");
  await flushPromises();
}

async function fillDriver(overrides = {}) {
  const values = { ...judah, ...overrides };
  const inputs = plainTextInputs();

  for (let index = 0; index < textFields.length; index += 1) {
    await inputs[index].setValue(String(values[textFields[index]] ?? ""));
  }

  const form = mounted.at(-1).vm.form;
  form.licenseExp = values.licenseExp;
  form.approvedDate = values.approvedDate;
  form.area = values.area;
}

async function submitAdd(overrides) {
  const wrapper = await mountDrivers();
  await openAddDialog(wrapper);
  await fillDriver(overrides);
  await buttonByText("Create").trigger("click");
  await flushPromises();

  return wrapper;
}

async function expectInlineBlock(overrides, message) {
  await submitAdd(overrides);

  expect(document.body.textContent).toContain(message);
  expect(driverServices.create).not.toHaveBeenCalled();
  expect(dialogIsOpen("Add driver")).toBe(true);
}

async function expectServerErrorOnAdd(overrides, message) {
  driverServices.create.mockRejectedValue({ response: { data: { message } } });
  await submitAdd(overrides);

  expect(driverServices.create).toHaveBeenCalled();
  expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(message);
}

async function expectServerErrorOnEdit(overrides, message) {
  driverServices.getAll.mockResolvedValue({ data: [judah] });
  driverServices.update.mockRejectedValue({ response: { data: { message } } });
  const wrapper = await mountDrivers();

  await wrapper.get("[aria-label='Edit driver']").trigger("click");
  await flushPromises();
  await fillDriver(overrides);
  await buttonByText("Save driver").trigger("click");
  await flushPromises();

  expect(driverServices.update).toHaveBeenCalledWith(1, expect.any(Object));
  expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(message);
  expect(dialogIsOpen("Edit driver")).toBe(true);
}

describe("Feature 4 — Driver Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    driverServices.getAll.mockReset();
    driverServices.create.mockReset();
    driverServices.update.mockReset();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    driverServices.getAll.mockResolvedValue({ data: [] });
    areaServices.getAll.mockResolvedValue({ data: [{ id: 1, name: "Athletics" }] });
    authServices.logoutUser.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    while (mounted.length > 0) {
      mounted.pop().unmount();
    }
    document.body.innerHTML = "";
  });

  describe("US-4.1 — Add a catalogue driver", () => {
    it("User creates a new driver", async () => {
      driverServices.getAll.mockResolvedValueOnce({ data: [] }).mockResolvedValue({ data: [judah] });
      driverServices.create.mockResolvedValue({ data: judah });
      await submitAdd();

      expect(driverServices.create).toHaveBeenCalledWith({
        name: "Judah",
        lastName: "Campbell",
        driverID: "CMSC-1113-01",
        licenseState: "Oklahoma",
        licenseExp: "2028-01-01",
        approvedDate: "2004-09-23",
        area: "Athletics",
        status: "Approved",
      });
      expect(document.body.textContent).toContain("Campbell, Judah");
      expect(dialogIsOpen("Add driver")).toBe(false);
    });

    it("User creates a driver with an empty name", async () => {
      await expectInlineBlock({ name: "   " }, "driver name is required.");
    });

    it("User creates a driver with an empty last name", async () => {
      await expectInlineBlock({ lastName: "" }, "driver last name is required.");
    });

    it("User creates a driver with an empty driver ID", async () => {
      await expectInlineBlock({ driverID: "  " }, "driver ID is required.");
    });

    it("User creates a driver with an empty license state", async () => {
      await expectInlineBlock({ licenseState: "" }, "driver license state is required.");
    });

    it("User creates a driver with an empty license expiration", async () => {
      await expectInlineBlock({ licenseExp: "" }, "driver license expiration is required.");
    });

    it("User creates a driver with an empty approved date", async () => {
      await expectInlineBlock({ approvedDate: "" }, "driver approved date is required.");
    });

    it("User creates a driver with an empty area", async () => {
      await expectInlineBlock({ area: "  " }, "driver area is required.");
    });

    it("User creates a driver with an empty status", async () => {
      await expectInlineBlock({ status: "" }, "driver status is required.");
    });

    it("User creates a driver with an existing driver id", async () => {
      driverServices.getAll.mockResolvedValue({ data: [{ ...judah, driverID: "OK-42" }] });
      await expectInlineBlock({ name: "Amy", lastName: "Adams", driverID: " OK-42 " }, "driver id is in use. Enter a different driver id.");
    });

    it("User creates a driver with a name that is too long", async () => {
      await expectServerErrorOnAdd({ name: "J".repeat(101) }, "driver name must be 100 characters or fewer.");
    });

    it("User creates a driver with a last name that is too long", async () => {
      await expectServerErrorOnAdd({ lastName: "C".repeat(101) }, "driver last name must be 100 characters or fewer.");
    });

    it("User creates a driver with a license state that is too long", async () => {
      await expectServerErrorOnAdd({ licenseState: "O".repeat(101) }, "driver license state must be 100 characters or fewer.");
    });

    it("User creates a driver with a status that is too long", async () => {
      await expectServerErrorOnAdd({ status: "A".repeat(101) }, "driver status must be 100 characters or fewer.");
    });

    it("User creates a driver with a driver ID that is too long", async () => {
      await expectServerErrorOnAdd({ driverID: "D".repeat(101) }, "driver ID must be 100 characters or fewer.");
    });

    it("User creates a driver with a license expiration that is not a valid date", async () => {
      await expectServerErrorOnAdd({ licenseExp: "2028-02-30" }, "driver license expiration must be a valid date.");
    });

    it("User creates a driver with an approved date that is not a valid date", async () => {
      await expectServerErrorOnAdd({ approvedDate: "2004-02-30" }, "driver approved date must be a valid date.");
    });

    it("offers areas from the areas list in the area dropdown", async () => {
      const wrapper = await mountDrivers();
      await openAddDialog(wrapper);

      expect(areaServices.getAll).toHaveBeenCalled();
      expect(wrapper.findComponent({ name: "DriverForm" }).props("areas")).toEqual(["Athletics"]);
    });
  });

  describe("US-4.2 — Browse the driver List", () => {
    it("User views existing drivers", async () => {
      Utils.setStore("user", { ...jane, role: "user" });
      driverServices.getAll.mockResolvedValue({
        data: [{ ...judah, id: 2, name: "Amy", lastName: "Adams" }, judah],
      });
      const wrapper = await mountDrivers();
      const text = wrapper.text();

      expect(text.indexOf("Adams, Amy")).toBeGreaterThan(-1);
      expect(text.indexOf("Adams, Amy")).toBeLessThan(text.indexOf("Campbell, Judah"));
      expect(text).toContain("Oklahoma");
      expect(text).toContain("Approved");
    });

    it("There are no existing drivers", async () => {
      const wrapper = await mountDrivers();

      expect(wrapper.find("tbody").exists()).toBe(false);
      expect(wrapper.text()).toContain("No drivers yet.");
    });

    it("shows an error when the list request fails", async () => {
      driverServices.getAll.mockRejectedValue({ response: { data: { message: "Failed to fetch drivers." } } });
      const wrapper = await mountDrivers();

      expect(wrapper.find(".v-alert").text()).toContain("Failed to fetch drivers.");
    });

    it("hides create, edit, and delete from a signed-in user who is not an admin", async () => {
      Utils.setStore("user", { ...jane, role: "user" });
      driverServices.getAll.mockResolvedValue({ data: [judah] });
      const wrapper = await mountDrivers();

      expect(wrapper.text()).toContain("Campbell, Judah");
      expect(wrapper.text()).not.toContain("+ New driver");
      expect(wrapper.find("[aria-label='Edit driver']").exists()).toBe(false);
      expect(wrapper.find("[aria-label='Delete driver']").exists()).toBe(false);
    });
  });

  describe("US-4.3 — Correct a driver's name, last name, driver ID, license state, license expiration, approved date, or status", () => {
    it("User edits a driver's information", async () => {
      driverServices.getAll
        .mockResolvedValueOnce({ data: [judah] })
        .mockResolvedValue({ data: [{ ...judah, status: "Suspended" }] });
      driverServices.update.mockResolvedValue({ data: { message: "driver was updated successfully." } });
      const wrapper = await mountDrivers();

      await wrapper.get("[aria-label='Edit driver']").trigger("click");
      await flushPromises();
      await plainTextInputs()[4].setValue("Suspended");
      await buttonByText("Save driver").trigger("click");
      await flushPromises();

      expect(driverServices.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "Suspended", driverID: "CMSC-1113-01" }));
      expect(wrapper.text()).toContain("Suspended");
      expect(dialogIsOpen("Edit driver")).toBe(false);
    });

    it("User creates a driver with a name that is too long", async () => {
      await expectServerErrorOnEdit({ name: "J".repeat(101) }, "driver name must be 100 characters or fewer.");
    });

    it("User creates a driver with a last name that is too long", async () => {
      await expectServerErrorOnEdit({ lastName: "C".repeat(101) }, "driver last name must be 100 characters or fewer.");
    });

    it("User creates a driver with a license state that is too long", async () => {
      await expectServerErrorOnEdit({ licenseState: "O".repeat(101) }, "driver license state must be 100 characters or fewer.");
    });

    it("User creates a driver with a status that is too long", async () => {
      await expectServerErrorOnEdit({ status: "A".repeat(101) }, "driver status must be 100 characters or fewer.");
    });

    it("User creates a driver with a license expiration that is not a valid date", async () => {
      await expectServerErrorOnEdit({ licenseExp: "2028-02-30" }, "driver license expiration must be a valid date.");
    });

    it("User creates a driver with an approved date that is not a valid date", async () => {
      await expectServerErrorOnEdit({ approvedDate: "2004-02-30" }, "driver approved date must be a valid date.");
    });

    it("blocks an edit that clears a required field", async () => {
      driverServices.getAll.mockResolvedValue({ data: [judah] });
      const wrapper = await mountDrivers();

      await wrapper.get("[aria-label='Edit driver']").trigger("click");
      await flushPromises();
      await plainTextInputs()[0].setValue(" ");
      await buttonByText("Save driver").trigger("click");

      expect(document.body.textContent).toContain("driver name is required.");
      expect(driverServices.update).not.toHaveBeenCalled();
    });
  });

  describe("US-4.4 Remove a driver", () => {
    it("User removes a driver", async () => {
      driverServices.getAll.mockResolvedValueOnce({ data: [judah] }).mockResolvedValue({ data: [] });
      driverServices.remove.mockResolvedValue({ status: 204 });
      const wrapper = await mountDrivers();

      await wrapper.get("[aria-label='Delete driver']").trigger("click");
      await flushPromises();
      await buttonByText("Delete driver").trigger("click");
      await flushPromises();

      expect(driverServices.remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Campbell, Judah");
    });

    it("leaves the driver in place when delete is cancelled", async () => {
      driverServices.getAll.mockResolvedValue({ data: [judah] });
      const wrapper = await mountDrivers();

      await wrapper.get("[aria-label='Delete driver']").trigger("click");
      await flushPromises();
      await buttonByText("Cancel").trigger("click");

      expect(driverServices.remove).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Campbell, Judah");
    });
  });
});

describe("Drivers menu", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens the drivers view from the management menu", async () => {
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
        { path: "/drivers", name: "drivers", component: { template: "<div>Drivers page</div>" } },
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

    const link = [...document.querySelectorAll("a")].find((item) => item.textContent.trim() === "Drivers");

    expect(link.getAttribute("href")).toBe("/drivers");
  });

  it("hides Management from a signed-in user who is not an admin", async () => {
    Utils.setStore("user", { ...jane, role: "user" });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
        { path: "/requests", name: "requests", component: { template: "<div>Requests</div>" } },
        { path: "/vehicles", name: "vehicles", component: { template: "<div>Vehicles</div>" } },
        { path: "/drivers", name: "drivers", component: { template: "<div>Drivers</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();
    const Shell = { components: { MenuBar }, template: "<v-app><MenuBar /></v-app>" };
    const wrapper = mount(Shell, { global: { plugins: [vuetify, router] } });

    expect(wrapper.text()).not.toContain("Management");
    expect(wrapper.find("[aria-label='Open management menu']").exists()).toBe(false);
  });
});
