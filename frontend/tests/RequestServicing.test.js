/**
 * Feature 9 — Vehicle Assignment and Availability
 * Spec: features/feature-9-vehicle-assignment-and-availability.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import RequestServicing from "../src/views/RequestServicing.vue";
import Utils from "../src/config/utils.js";
import reservationServices from "../src/services/reservationServices.js";
import vehicleServices from "../src/services/vehicleServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/reservationServices.js", () => ({
  default: {
    list: vi.fn(),
    assign: vi.fn(),
  },
}));

vi.mock("../src/services/vehicleServices.js", () => ({
  default: {
    getAll: vi.fn(),
  },
}));

describe("Feature 9 — Vehicle Assignment and Availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", {
      userId: 1,
      email: "admin@example.com",
      fName: "Ada",
      lName: "Admin",
      role: "admin",
      token: "session-token",
    });
    vehicleServices.getAll.mockResolvedValue({ data: [] });
  });

  describe("US-9.4 — Need-vehicle queue", () => {
    it("Need Vehicle view empty state", async () => {
      reservationServices.list.mockResolvedValue({ data: [] });
      const { wrapper } = await mountWithPlugins(RequestServicing, { attachTo: document.body });
      await flushPromises();

      expect(document.body.textContent).toContain("No requests need a vehicle.");
      expect(reservationServices.list).toHaveBeenCalledWith({ status: "awaiting_vehicle" });
      wrapper.unmount();
    });
  });
});
