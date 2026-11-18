/**
 * Feature 5 — Destination Management
 * Spec: features/feature-5-destination-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import DestinationList from "../src/views/destinationList.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import destinationServices from "../src/services/destinationServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/destinationServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const oc = {
  id: 1,
  name: "Oklahoma Christian University",
  addressLine1: "2501 East Memorial Road",
  addressLine2: null,
  city: "Edmond",
  state: "Oklahoma",
  zip: "73013",
};

const jane = {
  userId: 1,
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "admin",
  token: "session-token",
};

const textFields = ["name", "addressLine1", "addressLine2", "city", "state", "zip"];
const mounted = [];

async function mountDestinations() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/destinations", name: "destinations", component: DestinationList },
    ],
  });

  await router.push("/destinations");
  await router.isReady();

  const wrapper = mount(DestinationList, { attachTo: document.body, global: { plugins: [vuetify, router] } });
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
  await buttonByText("+ New destination").trigger("click");
  await flushPromises();
}

async function fillDestination(overrides = {}) {
  const values = {
    ...oc,
    addressLine2: overrides.addressLine2 ?? "",
    ...overrides,
  };
  const inputs = plainTextInputs();

  for (let index = 0; index < textFields.length; index += 1) {
    await inputs[index].setValue(String(values[textFields[index]] ?? ""));
  }
}

async function submitAdd(overrides = {}) {
  const wrapper = await mountDestinations();
  await openAddDialog();
  await fillDestination(overrides);
  await buttonByText("Create").trigger("click");
  await flushPromises();

  return wrapper;
}

async function expectInlineBlock(overrides, message) {
  await submitAdd(overrides);

  expect(document.body.textContent).toContain(message);
  expect(destinationServices.create).not.toHaveBeenCalled();
  expect(dialogIsOpen("Add destination")).toBe(true);
}

async function expectServerErrorOnAdd(overrides, message) {
  destinationServices.create.mockRejectedValue({ response: { data: { message } } });
  await submitAdd(overrides);

  expect(destinationServices.create).toHaveBeenCalled();
  expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(message);
}

async function expectServerErrorOnEdit(overrides, message) {
  destinationServices.getAll.mockResolvedValue({ data: [oc] });
  destinationServices.update.mockRejectedValue({ response: { data: { message } } });
  const wrapper = await mountDestinations();

  await wrapper.get("[aria-label='Edit destination']").trigger("click");
  await flushPromises();
  await fillDestination(overrides);
  await buttonByText("Save destination").trigger("click");
  await flushPromises();

  expect(destinationServices.update).toHaveBeenCalledWith(1, expect.any(Object));
  expect(document.querySelector(".v-overlay--active .v-alert")?.textContent).toContain(message);
  expect(dialogIsOpen("Edit destination")).toBe(true);
}

describe("Feature 5 — Destination Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    destinationServices.getAll.mockReset();
    destinationServices.create.mockReset();
    destinationServices.update.mockReset();
    destinationServices.remove.mockReset();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    destinationServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    while (mounted.length > 0) {
      mounted.pop().unmount();
    }
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Add a catalogue destination", () => {
    it("User creates a new destination", async () => {
      destinationServices.getAll.mockResolvedValueOnce({ data: [] }).mockResolvedValue({ data: [oc] });
      destinationServices.create.mockResolvedValue({ data: oc });
      await submitAdd({ addressLine2: "" });

      expect(destinationServices.create).toHaveBeenCalledWith({
        name: "Oklahoma Christian University",
        addressLine1: "2501 East Memorial Road",
        addressLine2: "",
        city: "Edmond",
        state: "Oklahoma",
        zip: "73013",
      });
      expect(document.body.textContent).toContain("Oklahoma Christian University");
      expect(dialogIsOpen("Add destination")).toBe(false);
    });

    it("User creates a destination without an address line 2", async () => {
      destinationServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [{ ...oc, addressLine2: null }] });
      destinationServices.create.mockResolvedValue({ data: { ...oc, addressLine2: null } });
      await submitAdd({ addressLine2: "   " });

      expect(destinationServices.create).toHaveBeenCalledWith(expect.objectContaining({ addressLine2: "" }));
      expect(document.body.textContent).toContain("Oklahoma Christian University");
    });

    it("User creates a destination with an empty name", async () => {
      await expectInlineBlock({ name: "   " }, "destination name is required.");
    });

    it("User creates a destination with an empty address line 1", async () => {
      await expectInlineBlock({ addressLine1: "" }, "destination address line 1 is required.");
    });

    it("User creates a destination with an empty city", async () => {
      await expectInlineBlock({ city: "" }, "destination city is required.");
    });

    it("User creates a destination with an empty state", async () => {
      await expectInlineBlock({ state: "  " }, "destination state is required.");
    });

    it("User creates a destination with an empty zip", async () => {
      await expectInlineBlock({ zip: "" }, "destination zip is required.");
    });

    it("User creates a destination with an existing name", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      await expectInlineBlock(
        { name: " Oklahoma Christian University ", zip: "73014" },
        "destination name is in use. Enter a different destination name.",
      );
    });

    it("User creates a destination with a name that is too long", async () => {
      await expectServerErrorOnAdd({ name: "N".repeat(101) }, "destination name must be 100 characters or fewer.");
    });

    it("User creates a destination with an address line 1 that is too long", async () => {
      await expectServerErrorOnAdd(
        { addressLine1: "A".repeat(101) },
        "destination address line 1 must be 100 characters or fewer.",
      );
    });

    it("User creates a destination with an address line 2 that is too long", async () => {
      await expectServerErrorOnAdd(
        { addressLine2: "B".repeat(101) },
        "destination address line 2 must be 100 characters or fewer.",
      );
    });

    it("User creates a destination with a city that is too long", async () => {
      await expectServerErrorOnAdd({ city: "C".repeat(101) }, "destination city must be 100 characters or fewer.");
    });

    it("User creates a destination with a state that is too long", async () => {
      await expectServerErrorOnAdd({ state: "S".repeat(101) }, "destination state must be 100 characters or fewer.");
    });

    it("User creates a destination with an invalid zip", async () => {
      await expectServerErrorOnAdd({ zip: "73O13" }, "destination zip must be exactly 5 digits.");
    });
  });

  describe("US-5.2 — Browse the destination List", () => {
    it("User views existing destinations", async () => {
      Utils.setStore("user", { ...jane, role: "user" });
      destinationServices.getAll.mockResolvedValue({
        data: [
          { ...oc, id: 2, name: "Alpha Center" },
          oc,
        ],
      });
      const wrapper = await mountDestinations();
      const text = wrapper.text();

      expect(text.indexOf("Alpha Center")).toBeLessThan(text.indexOf("Oklahoma Christian University"));
      expect(text).toContain("2501 East Memorial Road");
      expect(text).toContain("73013");
    });

    it("There are no existing destinations", async () => {
      const wrapper = await mountDestinations();

      expect(wrapper.find("tbody").exists()).toBe(false);
      expect(wrapper.text()).toContain("No destinations yet.");
    });
  });

  describe("US-5.3 — Correct a destination's name, address line 1, address line 2, city, state, or zip", () => {
    it("User edits a destination's information", async () => {
      destinationServices.getAll
        .mockResolvedValueOnce({ data: [oc] })
        .mockResolvedValue({ data: [{ ...oc, city: "Oklahoma City", zip: "73102" }] });
      destinationServices.update.mockResolvedValue({
        data: { message: "destination was updated successfully." },
      });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[3].setValue("Oklahoma City");
      await plainTextInputs()[5].setValue("73102");
      await buttonByText("Save destination").trigger("click");
      await flushPromises();

      expect(destinationServices.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ city: "Oklahoma City", zip: "73102" }),
      );
      expect(wrapper.text()).toContain("Oklahoma City");
      expect(dialogIsOpen("Edit destination")).toBe(false);
    });

    it("User clears a destination's address line 2", async () => {
      destinationServices.getAll
        .mockResolvedValueOnce({ data: [{ ...oc, addressLine2: "Suite 100" }] })
        .mockResolvedValue({ data: [{ ...oc, addressLine2: null }] });
      destinationServices.update.mockResolvedValue({
        data: { message: "destination was updated successfully." },
      });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[2].setValue("  ");
      await buttonByText("Save destination").trigger("click");
      await flushPromises();

      expect(destinationServices.update).toHaveBeenCalledWith(1, expect.objectContaining({ addressLine2: "" }));
      expect(dialogIsOpen("Edit destination")).toBe(false);
    });

    it("User edits a destination with an empty name", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[0].setValue(" ");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination name is required.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with an empty address line 1", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[1].setValue("");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination address line 1 is required.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with an empty city", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[3].setValue("");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination city is required.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with an empty state", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[4].setValue("  ");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination state is required.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with an empty zip", async () => {
      destinationServices.getAll.mockResolvedValue({ data: [oc] });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[5].setValue("");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination zip is required.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with an existing name", async () => {
      destinationServices.getAll.mockResolvedValue({
        data: [oc, { ...oc, id: 2, name: "Alpha Center", zip: "73014" }],
      });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Edit destination']").trigger("click");
      await flushPromises();
      await plainTextInputs()[0].setValue("Alpha Center");
      await buttonByText("Save destination").trigger("click");

      expect(document.body.textContent).toContain("destination name is in use. Enter a different destination name.");
      expect(destinationServices.update).not.toHaveBeenCalled();
    });

    it("User edits a destination with a name that is too long", async () => {
      await expectServerErrorOnEdit({ name: "N".repeat(101) }, "destination name must be 100 characters or fewer.");
    });

    it("User edits a destination with an address line 1 that is too long", async () => {
      await expectServerErrorOnEdit(
        { addressLine1: "A".repeat(101) },
        "destination address line 1 must be 100 characters or fewer.",
      );
    });

    it("User edits a destination with an address line 2 that is too long", async () => {
      await expectServerErrorOnEdit(
        { addressLine2: "B".repeat(101) },
        "destination address line 2 must be 100 characters or fewer.",
      );
    });

    it("User edits a destination with a city that is too long", async () => {
      await expectServerErrorOnEdit({ city: "C".repeat(101) }, "destination city must be 100 characters or fewer.");
    });

    it("User edits a destination with a state that is too long", async () => {
      await expectServerErrorOnEdit({ state: "S".repeat(101) }, "destination state must be 100 characters or fewer.");
    });

    it("User edits a destination with an invalid zip", async () => {
      await expectServerErrorOnEdit({ zip: "73O13" }, "destination zip must be exactly 5 digits.");
    });
  });

  describe("US-5.4 Remove a destination", () => {
    it("User removes a destination", async () => {
      destinationServices.getAll.mockResolvedValueOnce({ data: [oc] }).mockResolvedValue({ data: [] });
      destinationServices.remove.mockResolvedValue({ status: 204 });
      const wrapper = await mountDestinations();

      await wrapper.get("[aria-label='Delete destination']").trigger("click");
      await flushPromises();
      await buttonByText("Delete destination").trigger("click");
      await flushPromises();

      expect(destinationServices.remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Oklahoma Christian University");
    });
  });
});

describe("Destinations menu", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens destinations from the management menu", async () => {
    Utils.setStore("user", { ...jane });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
        { path: "/requests", name: "requests", component: { template: "<div>Requests</div>" } },
        { path: "/request-servicing", name: "requestServicing", component: { template: "<div>Need</div>" } },
        { path: "/calendar", name: "calendar", component: { template: "<div>Calendar</div>" } },
        { path: "/vehicles", name: "vehicles", component: { template: "<div>Vehicles</div>" } },
        { path: "/drivers", name: "drivers", component: { template: "<div>Drivers</div>" } },
        { path: "/destinations", name: "destinations", component: { template: "<div>Destinations</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();
    const Shell = { components: { MenuBar }, template: "<v-app><MenuBar /></v-app>" };
    const wrapper = mount(Shell, { attachTo: document.body, global: { plugins: [vuetify, router] } });

    await wrapper.get("[aria-label='Open management menu']").trigger("click");
    await flushPromises();

    const managementLabels = [...document.querySelectorAll(".management-menu a")].map((item) =>
      item.textContent.trim(),
    );

    expect(managementLabels).toEqual(["Vehicles", "Drivers", "Destinations"]);
    expect(managementLabels.at(-1)).toBe("Destinations");
    wrapper.unmount();
    document.body.innerHTML = "";
  });
});
