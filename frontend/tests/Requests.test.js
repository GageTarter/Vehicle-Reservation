/**
 * Feature 8 — Vehicle Reservation Requests
 * Spec: features/feature-8-vehicle-reservation-requests.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Requests from "../src/views/Requests.vue";
import Utils from "../src/config/utils.js";
import reservationServices from "../src/services/reservationServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/reservationServices.js", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listDrivers: vi.fn(),
    listDestinations: vi.fn(),
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

const drivers = [{ id: 4, name: "Ada Lovelace", status: "approved" }];
const destinations = [{ id: 2, name: "Edmond" }];

function reservation(overrides = {}) {
  return {
    id: 1,
    requestorUserId: 1,
    partyName: "Women's Soccer",
    driverId: 4,
    destinationId: 2,
    startAt: "2026-11-20T14:00:00.000Z",
    endAt: "2026-11-22T18:00:00.000Z",
    passengerCount: 12,
    noteType: null,
    noteText: null,
    status: "requested",
    vehicleId: null,
    ...overrides,
  };
}

function button(label) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === label);
}

function setNativeValue(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function mountRequests() {
  const mounted = await mountWithPlugins(Requests, { attachTo: document.body });
  await flushPromises();
  return mounted.wrapper;
}

describe("Feature 8 — Vehicle Reservation Requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", { ...jane });
    reservationServices.list.mockResolvedValue({ data: [] });
    reservationServices.listDrivers.mockResolvedValue({ data: drivers });
    reservationServices.listDestinations.mockResolvedValue({ data: destinations });
  });

  describe("US-8.1 — Create a reservation request", () => {
    it("Requestor creates a reservation request", async () => {
      const created = reservation();
      reservationServices.create.mockResolvedValue({ data: created });
      const wrapper = await mountRequests();

      button("+ New Request").click();
      await flushPromises();
      const selects = wrapper.findAllComponents({ name: "VSelect" });
      await selects[0].setValue(4);
      await selects[1].setValue(2);
      const inputs = [...document.querySelectorAll("input")];
      const dateInputs = inputs.filter((input) => input.getAttribute("type") === "datetime-local");
      const passengers = inputs.find((input) => input.getAttribute("type") === "number");
      setNativeValue(dateInputs[0], "2026-11-20T08:00");
      setNativeValue(dateInputs[1], "2026-11-22T12:00");
      setNativeValue(passengers, "12");
      button("Submit").click();
      await flushPromises();

      expect(reservationServices.create).toHaveBeenCalledTimes(1);
      expect(document.body.textContent).toContain("Edmond");
      expect(document.body.textContent).toContain("Requested");
      wrapper.unmount();
    });

    it("Requestor omits the driver", async () => {
      const wrapper = await mountRequests();

      button("+ New Request").click();
      await flushPromises();
      button("Submit").click();
      await flushPromises();

      expect(document.body.textContent).toContain("Driver is required.");
      expect(reservationServices.create).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-8.2 — View my requests", () => {
    it("My Requests loads owned rows", async () => {
      reservationServices.list.mockResolvedValue({
        data: [
          reservation({ id: 1, partyName: "Work" }),
          reservation({ id: 2, partyName: "Personal", startAt: "2026-12-01T14:00:00.000Z" }),
        ],
      });
      const wrapper = await mountRequests();

      expect(document.body.textContent).toContain("Work");
      expect(document.body.textContent).toContain("Personal");
      expect(document.body.textContent).toContain("Edmond");
      expect(document.body.textContent).toContain("Requested");
      expect(document.querySelector("[aria-label='Edit request']")).not.toBeNull();
      wrapper.unmount();
    });

    it("User has no requests", async () => {
      const wrapper = await mountRequests();

      expect(document.body.textContent).toContain("No requests yet. Create your first request.");
      wrapper.unmount();
    });
  });

  describe("US-8.3 — Edit a pending request", () => {
    it("Requestor updates a requested reservation", async () => {
      reservationServices.list.mockResolvedValue({ data: [reservation()] });
      reservationServices.update.mockResolvedValue({ data: reservation({ passengerCount: 8 }) });
      const wrapper = await mountRequests();

      document.querySelector("[aria-label='Edit request']").click();
      await flushPromises();
      const passengers = [...document.querySelectorAll("input")].find(
        (input) => input.getAttribute("type") === "number",
      );
      setNativeValue(passengers, "8");
      button("Save").click();
      await flushPromises();

      expect(reservationServices.update).toHaveBeenCalledWith(1, expect.objectContaining({ passengerCount: 8 }));
      expect(document.body.textContent).toContain("8 people");
      wrapper.unmount();
    });
  });
});
