/**
 * Feature 15 — Vehicle Mileage and Service Log Management
 * Spec: features/feature-15-vehicle-mileage-and-service-log-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import VehicleMileageService from "../src/views/VehicleMileageService.vue";
import Utils from "../src/config/utils.js";
import mileageServiceServices from "../src/services/mileageServiceServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/mileageServiceServices.js", () => ({
  default: {
    getMileage: vi.fn(),
    createMileage: vi.fn(),
    getServiceLogs: vi.fn(),
    createServiceLog: vi.fn(),
  },
}));

const mileageRow = {
  mileage_log_id: 1,
  vehicle_id: 4,
  date_recorded: "2026-11-05",
  current_mileage: 45200,
};

const serviceRow = {
  service_log_id: 1,
  vehicle_id: 4,
  service_date: "2026-11-05",
  service_performed: "Oil change and tire rotation",
};

function setUser(role) {
  Utils.setStore("user", { userId: 7, role, token: "test-token" });
}

async function mountView() {
  return mountWithPlugins(VehicleMileageService);
}

async function viewRecords(wrapper, id = "4") {
  await wrapper.find("#vehicle-id").setValue(id);
  await wrapper.findAll("button").find((btn) => btn.text() === "View records")?.trigger("click");
  await flushPromises();
}

describe("Feature 15 — Vehicle Mileage and Service Log Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mileageServiceServices.getMileage.mockResolvedValue({ data: [] });
    mileageServiceServices.getServiceLogs.mockResolvedValue({ data: [] });
  });

  describe("US-15.1 — View vehicle mileage records", () => {
    it("Maintenance user views mileage records", async () => {
      setUser("maintenance");
      mileageServiceServices.getMileage.mockResolvedValue({ data: [mileageRow] });

      const { wrapper } = await mountView();
      await viewRecords(wrapper);

      const list = wrapper.find("[data-testid='mileage-list']");
      expect(list.text()).toContain("2026-11-05");
      expect(list.text()).toContain("45200");
    });

    it("Vehicle has no mileage records", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await viewRecords(wrapper);

      expect(wrapper.find("[data-testid='empty-mileage']").text()).toContain(
        "No mileage records for this vehicle."
      );
    });

    it("User attempts to view mileage records outside their area", async () => {
      setUser("area_admin");
      mileageServiceServices.getMileage.mockRejectedValue({
        response: { status: 403, data: { message: "You cannot access records for this vehicle." } },
      });
      mileageServiceServices.getServiceLogs.mockRejectedValue({
        response: { status: 403, data: { message: "You cannot access records for this vehicle." } },
      });

      const { wrapper } = await mountView();
      await viewRecords(wrapper, "9");

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
      expect(wrapper.find("[data-testid='mileage-list']").exists()).toBe(false);
    });
  });

  describe("US-15.2 — Record vehicle mileage", () => {
    it("Maintenance user records vehicle mileage", async () => {
      setUser("maintenance");
      mileageServiceServices.createMileage.mockResolvedValue({
        data: {
          message: "Mileage record created successfully.",
          mileage_log: { ...mileageRow, current_mileage: 45310, date_recorded: "2026-11-06" },
        },
      });
      mileageServiceServices.getMileage.mockResolvedValue({
        data: [{ ...mileageRow, current_mileage: 45310, date_recorded: "2026-11-06" }],
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#date-recorded").setValue("2026-11-06");
      await wrapper.find("#current-mileage").setValue("45310");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record mileage")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createMileage).toHaveBeenCalledWith("4", {
        date_recorded: "2026-11-06",
        current_mileage: 45310,
      });
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Mileage record created successfully."
      );
      expect(wrapper.find("[data-testid='mileage-list']").text()).toContain("45310");
    });

    it("Maintenance user submits a negative mileage value", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#date-recorded").setValue("2026-11-06");
      await wrapper.find("#current-mileage").setValue("-10");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record mileage")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createMileage).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Maintenance user submits mileage without a value", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#date-recorded").setValue("2026-11-06");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record mileage")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createMileage).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").text()).toContain(
        "Current mileage is required."
      );
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      setUser("maintenance");
      mileageServiceServices.createMileage.mockRejectedValue({
        response: { status: 404, data: { message: "Vehicle with id=99999 not found." } },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("99999");
      await wrapper.find("#date-recorded").setValue("2026-11-06");
      await wrapper.find("#current-mileage").setValue("100");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record mileage")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Unauthorized user attempts to record mileage", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Record mileage");
      expect(mileageServiceServices.createMileage).not.toHaveBeenCalled();
    });
  });

  describe("US-15.3 — View vehicle service records", () => {
    it("Maintenance user views service records", async () => {
      setUser("maintenance");
      mileageServiceServices.getServiceLogs.mockResolvedValue({ data: [serviceRow] });

      const { wrapper } = await mountView();
      await viewRecords(wrapper);

      const list = wrapper.find("[data-testid='service-list']");
      expect(list.text()).toContain("2026-11-05");
      expect(list.text()).toContain("Oil change and tire rotation");
    });

    it("Vehicle has no service records", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await viewRecords(wrapper);

      expect(wrapper.find("[data-testid='empty-service']").text()).toContain(
        "No service records for this vehicle."
      );
    });

    it("Area administrator views service records", async () => {
      setUser("area_admin");
      mileageServiceServices.getServiceLogs.mockResolvedValue({ data: [serviceRow] });

      const { wrapper } = await mountView();
      await viewRecords(wrapper);

      expect(wrapper.find("[data-testid='service-list']").text()).toContain(
        "Oil change and tire rotation"
      );
      expect(wrapper.text()).not.toContain("Outside-area service");
    });
  });

  describe("US-15.4 — Record vehicle service", () => {
    it("Maintenance user records a vehicle service", async () => {
      setUser("maintenance");
      mileageServiceServices.createServiceLog.mockResolvedValue({
        data: {
          message: "Service record created successfully.",
          service_log: { ...serviceRow, service_performed: "Replaced cabin filter" },
        },
      });
      mileageServiceServices.getServiceLogs.mockResolvedValue({
        data: [{ ...serviceRow, service_performed: "Replaced cabin filter" }],
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#service-date").setValue("2026-11-06");
      await wrapper.find("#service-performed").setValue("Replaced cabin filter");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record service")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createServiceLog).toHaveBeenCalledWith("4", {
        service_date: "2026-11-06",
        service_performed: "Replaced cabin filter",
      });
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Service record created successfully."
      );
      expect(wrapper.find("[data-testid='service-list']").text()).toContain(
        "Replaced cabin filter"
      );
    });

    it("Maintenance user submits a service record without a description", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#service-date").setValue("2026-11-06");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record service")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createServiceLog).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").text()).toContain(
        "Service description is required."
      );
    });

    it("Maintenance user submits a service record without a date", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#service-performed").setValue("Oil change");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record service")?.trigger("click");
      await flushPromises();

      expect(mileageServiceServices.createServiceLog).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      setUser("maintenance");
      mileageServiceServices.createServiceLog.mockRejectedValue({
        response: { status: 404, data: { message: "Vehicle with id=99999 not found." } },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("99999");
      await wrapper.find("#service-date").setValue("2026-11-06");
      await wrapper.find("#service-performed").setValue("Oil change");
      await wrapper.findAll("button").find((btn) => btn.text() === "Record service")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Unauthorized user attempts to record a service", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Record service");
      expect(mileageServiceServices.createServiceLog).not.toHaveBeenCalled();
    });
  });
});
