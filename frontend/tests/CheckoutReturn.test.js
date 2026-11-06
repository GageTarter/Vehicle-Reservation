/**
 * Feature 12 — Vehicle Checkout & Return Management
 * Spec: features/feature-12-vehicle checkout & return management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import CheckoutReturn from "../src/views/CheckoutReturn.vue";
import Utils from "../src/config/utils.js";
import checkoutServices from "../src/services/checkoutServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/checkoutServices.js", () => ({
  default: {
    getCheckoutReturn: vi.fn(),
    checkout: vi.fn(),
    returnVehicle: vi.fn(),
    getCheckoutStatus: vi.fn(),
  },
}));

const assignedReservation = {
  reservation_id: 12,
  requester_id: 7,
  vehicle_id: 4,
  vehicle_name: "Van 4",
  status: "Assigned",
  start_datetime: "2026-11-05T09:00:00",
  end_datetime: "2026-11-05T17:00:00",
  checkout_datetime: null,
  return_datetime: null,
};

function setUser(role) {
  Utils.setStore("user", {
    userId: 7,
    role,
    token: "test-token",
  });
}

async function mountView() {
  return mountWithPlugins(CheckoutReturn);
}

describe("Feature 12 — Vehicle Checkout & Return Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    checkoutServices.getCheckoutStatus.mockResolvedValue({ data: [] });
  });

  describe("US-12.1 — Record vehicle checkout", () => {
    it("Requestor checks out an assigned vehicle", async () => {
      setUser("requestor");
      checkoutServices.getCheckoutReturn.mockResolvedValue({
        data: { reservation: assignedReservation },
      });
      checkoutServices.checkout.mockResolvedValue({
        data: {
          message: "Vehicle checkout recorded successfully.",
          reservation: {
            ...assignedReservation,
            status: "Checked Out",
            checkout_datetime: "2026-11-05T09:05:00",
          },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#reservation-id").setValue("12");
      await wrapper.findAll("button").find((btn) => btn.text() === "Open reservation")?.trigger("click");
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "Check Out Vehicle")?.trigger("click");
      await flushPromises();

      expect(checkoutServices.checkout).toHaveBeenCalledWith(12);
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Vehicle checkout recorded successfully."
      );
      expect(wrapper.text()).toContain("Checked Out");
    });

    it("Requestor tries to check out a reservation without a vehicle", async () => {
      setUser("requestor");
      checkoutServices.getCheckoutReturn.mockResolvedValue({
        data: {
          reservation: { ...assignedReservation, vehicle_id: null, vehicle_name: null },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#reservation-id").setValue("12");
      await wrapper.findAll("button").find((btn) => btn.text() === "Open reservation")?.trigger("click");
      await flushPromises();

      expect(wrapper.text()).not.toContain("Check Out Vehicle");
      expect(checkoutServices.checkout).not.toHaveBeenCalled();
    });

    it("Requestor checks out a vehicle twice", async () => {
      setUser("requestor");
      checkoutServices.getCheckoutReturn.mockResolvedValue({
        data: {
          reservation: {
            ...assignedReservation,
            status: "Checked Out",
            checkout_datetime: "2026-11-05T09:05:00",
          },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#reservation-id").setValue("12");
      await wrapper.findAll("button").find((btn) => btn.text() === "Open reservation")?.trigger("click");
      await flushPromises();

      expect(wrapper.text()).not.toContain("Check Out Vehicle");
      expect(checkoutServices.checkout).not.toHaveBeenCalled();
    });
  });

  describe("US-12.2 — View checkout information", () => {
    it("Requestor views an assigned reservation", async () => {
      setUser("requestor");
      checkoutServices.getCheckoutReturn.mockResolvedValue({
        data: { reservation: assignedReservation },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#reservation-id").setValue("12");
      await wrapper.findAll("button").find((btn) => btn.text() === "Open reservation")?.trigger("click");
      await flushPromises();

      const details = wrapper.find("[data-testid='reservation-details']");
      expect(details.text()).toContain("Van 4");
      expect(details.text()).toContain("Assigned");
      expect(details.text()).toContain("2026-11-05T09:00:00");
      expect(details.text()).toContain("2026-11-05T17:00:00");
    });

    it("Requestor cannot view another user's reservation", async () => {
      setUser("requestor");
      checkoutServices.getCheckoutReturn.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "You cannot access this reservation." },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#reservation-id").setValue("99");
      await wrapper.findAll("button").find((btn) => btn.text() === "Open reservation")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
      expect(wrapper.find("[data-testid='reservation-details']").exists()).toBe(false);
    });
  });

  describe("US-12.3 — Mark a vehicle as returned", () => {
    it("Area administrator marks a checked-out vehicle as returned", async () => {
      setUser("area_admin");
      checkoutServices.getCheckoutStatus.mockResolvedValue({
        data: [
          {
            ...assignedReservation,
            status: "Checked Out",
            checkout_datetime: "2026-11-05T09:05:00",
          },
        ],
      });
      checkoutServices.returnVehicle.mockResolvedValue({
        data: {
          message: "Vehicle return recorded successfully.",
          reservation: {
            ...assignedReservation,
            status: "Returned",
            checkout_datetime: "2026-11-05T09:05:00",
            return_datetime: "2026-11-05T17:00:00",
          },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "Mark as Returned")?.trigger("click");
      await flushPromises();

      expect(checkoutServices.returnVehicle).toHaveBeenCalledWith(12);
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Vehicle return recorded successfully."
      );
    });

    it("Area administrator tries to return a vehicle that was not checked out", async () => {
      setUser("area_admin");
      checkoutServices.getCheckoutStatus.mockResolvedValue({
        data: [assignedReservation],
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();

      expect(wrapper.text()).not.toContain("Mark as Returned");
      expect(checkoutServices.returnVehicle).not.toHaveBeenCalled();
    });

    it("Requestor tries to mark a vehicle as returned", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Mark as Returned");
      expect(checkoutServices.returnVehicle).not.toHaveBeenCalled();
    });

    it("Area administrator attempts to return a vehicle twice", async () => {
      setUser("area_admin");
      checkoutServices.getCheckoutStatus.mockResolvedValue({
        data: [
          {
            ...assignedReservation,
            status: "Returned",
            checkout_datetime: "2026-11-05T09:05:00",
            return_datetime: "2026-11-05T17:00:00",
          },
        ],
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();

      expect(wrapper.text()).not.toContain("Mark as Returned");
      expect(checkoutServices.returnVehicle).not.toHaveBeenCalled();
    });
  });

  describe("US-12.4 — View checkout and return statuses", () => {
    it("Area administrator views reservation statuses", async () => {
      setUser("area_admin");
      checkoutServices.getCheckoutStatus.mockResolvedValue({
        data: [
          {
            ...assignedReservation,
            checkout_datetime: "2026-11-05T09:05:00",
          },
        ],
      });

      const { wrapper } = await mountView();
      await flushPromises();

      const list = wrapper.find("[data-testid='reservation-list']");
      expect(list.text()).toContain("12");
      expect(list.text()).toContain("Van 4");
      expect(list.text()).toContain("Assigned");
      expect(list.text()).toContain("2026-11-05T09:05:00");
    });

    it("No reservations require checkout or return", async () => {
      setUser("area_admin");
      checkoutServices.getCheckoutStatus.mockResolvedValue({ data: [] });

      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.find("[data-testid='empty-reservations']").text()).toContain(
        "No reservations require checkout or return."
      );
    });
  });
});
