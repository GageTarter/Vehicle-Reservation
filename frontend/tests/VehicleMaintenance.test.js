/**
 * Feature 14 — Vehicle Maintenance Management
 * Spec: features/feature-14-Vehicle Maintenance Management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import VehicleMaintenance from "../src/views/VehicleMaintenance.vue";
import Utils from "../src/config/utils.js";
import maintenanceServices from "../src/services/maintenanceServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/maintenanceServices.js", () => ({
  default: {
    getRequests: vi.fn(),
    createRequest: vi.fn(),
    updateStatus: vi.fn(),
    getVehicleMaintenance: vi.fn(),
  },
}));

const openRequest = {
  maintenance_request_id: 1,
  vehicle_id: 4,
  issue_id: null,
  description: "Brake inspection needed.",
  status: "Open",
};

function setUser(role) {
  Utils.setStore("user", { userId: 7, role, token: "test-token" });
}

async function mountView() {
  return mountWithPlugins(VehicleMaintenance);
}

describe("Feature 14 — Vehicle Maintenance Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    maintenanceServices.getRequests.mockResolvedValue({ data: [] });
    maintenanceServices.getVehicleMaintenance.mockResolvedValue({ data: [] });
  });

  describe("US-14.1 — View maintenance requests", () => {
    it("Maintenance user views authorized maintenance requests", async () => {
      setUser("maintenance");
      maintenanceServices.getRequests.mockResolvedValue({ data: [openRequest] });

      const { wrapper } = await mountView();
      await flushPromises();

      const list = wrapper.find("[data-testid='request-list']");
      expect(list.text()).toContain("4");
      expect(list.text()).toContain("Brake inspection needed.");
      expect(list.text()).toContain("Open");
    });

    it("Administrator views maintenance requests", async () => {
      setUser("admin");
      maintenanceServices.getRequests.mockResolvedValue({ data: [openRequest] });

      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Brake inspection needed.");
      expect(wrapper.text()).toContain("Create a maintenance request");
    });

    it("Area administrator views maintenance requests", async () => {
      setUser("area_admin");
      maintenanceServices.getRequests.mockResolvedValue({ data: [openRequest] });

      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.find("[data-testid='request-list']").text()).toContain(
        "Brake inspection needed."
      );
      expect(wrapper.text()).not.toContain("Oil leak in another area.");
    });

    it("No maintenance requests are available", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.find("[data-testid='empty-requests']").text()).toContain(
        "No maintenance requests are available."
      );
    });
  });

  describe("US-14.2 — Create a maintenance request", () => {
    it("Maintenance user creates a maintenance request", async () => {
      setUser("maintenance");
      maintenanceServices.createRequest.mockResolvedValue({
        data: {
          message: "Maintenance request created successfully.",
          maintenance_request: { ...openRequest, status: "Open" },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#description").setValue(
        "Vehicle needs inspection because of an engine warning light."
      );
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.createRequest).toHaveBeenCalledWith({
        vehicle_id: 4,
        description: "Vehicle needs inspection because of an engine warning light.",
      });
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Maintenance request created successfully."
      );
    });

    it("Maintenance user creates a request linked to an issue", async () => {
      setUser("maintenance");
      maintenanceServices.createRequest.mockResolvedValue({
        data: {
          message: "Maintenance request created successfully.",
          maintenance_request: { ...openRequest, issue_id: 2 },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#issue-id").setValue("2");
      await wrapper.find("#description").setValue("Inspect the reported engine warning.");
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.createRequest).toHaveBeenCalledWith({
        vehicle_id: 4,
        issue_id: 2,
        description: "Inspect the reported engine warning.",
      });
    });

    it("Maintenance user creates a request without an issue", async () => {
      setUser("maintenance");
      maintenanceServices.createRequest.mockResolvedValue({
        data: {
          message: "Maintenance request created successfully.",
          maintenance_request: { ...openRequest, issue_id: null },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#description").setValue("Routine inspection.");
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.createRequest).toHaveBeenCalledWith({
        vehicle_id: 4,
        description: "Routine inspection.",
      });
    });

    it("Maintenance user submits a request without a description", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.createRequest).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").text()).toContain(
        "Description is required."
      );
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      setUser("maintenance");
      maintenanceServices.createRequest.mockRejectedValue({
        response: { status: 404, data: { message: "Vehicle with id=99999 not found." } },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("99999");
      await wrapper.find("#description").setValue("Inspect missing vehicle.");
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Maintenance user selects an issue belonging to another vehicle", async () => {
      setUser("maintenance");
      maintenanceServices.createRequest.mockRejectedValue({
        response: {
          status: 409,
          data: { message: "The selected issue does not belong to the selected vehicle." },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#issue-id").setValue("8");
      await wrapper.find("#description").setValue("Mismatched issue.");
      await wrapper.findAll("button").find((btn) => btn.text() === "Create Request")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });
  });

  describe("US-14.3 — Update maintenance request status", () => {
    it("Maintenance user updates a request to In Progress", async () => {
      setUser("maintenance");
      maintenanceServices.getRequests.mockResolvedValue({ data: [openRequest] });
      maintenanceServices.updateStatus.mockResolvedValue({
        data: {
          message: "Maintenance request status updated successfully.",
          maintenance_request: { ...openRequest, status: "In Progress" },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();
      const statusSelect = wrapper.findAllComponents({ name: "VSelect" }).at(-1);
      await statusSelect.setValue("In Progress");
      await wrapper.findAll("button").find((btn) => btn.text() === "Update Status")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.updateStatus).toHaveBeenCalledWith(1, "In Progress");
      expect(wrapper.text()).toContain("In Progress");
    });

    it("Maintenance user completes a maintenance request", async () => {
      setUser("maintenance");
      maintenanceServices.getRequests.mockResolvedValue({
        data: [{ ...openRequest, status: "In Progress" }],
      });
      maintenanceServices.updateStatus.mockResolvedValue({
        data: {
          message: "Maintenance request status updated successfully.",
          maintenance_request: { ...openRequest, status: "Completed" },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();
      const statusSelect = wrapper.findAllComponents({ name: "VSelect" }).at(-1);
      await statusSelect.setValue("Completed");
      await wrapper.findAll("button").find((btn) => btn.text() === "Update Status")?.trigger("click");
      await flushPromises();

      expect(maintenanceServices.updateStatus).toHaveBeenCalledWith(1, "Completed");
      expect(wrapper.text()).toContain("Completed");
    });

    it("User submits an invalid maintenance status", async () => {
      setUser("maintenance");
      maintenanceServices.getRequests.mockResolvedValue({ data: [openRequest] });
      maintenanceServices.updateStatus.mockRejectedValue({
        response: { status: 400, data: { message: "Invalid maintenance status." } },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "View")?.trigger("click");
      await flushPromises();
      await wrapper.findAll("button").find((btn) => btn.text() === "Update Status")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    });

    it("Unauthorized user attempts to update a maintenance request", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Update Status");
      expect(wrapper.find("[data-testid='error-alert']").text()).toContain(
        "You cannot view maintenance requests."
      );
      expect(maintenanceServices.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("US-14.4 — View vehicle maintenance information", () => {
    it("Maintenance user views maintenance requests for a vehicle", async () => {
      setUser("maintenance");
      maintenanceServices.getVehicleMaintenance.mockResolvedValue({ data: [openRequest] });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.find("#history-vehicle-id").setValue("4");
      await wrapper.findAll("button").find((btn) => btn.text() === "View maintenance")?.trigger("click");
      await flushPromises();

      const history = wrapper.find("[data-testid='history-list']");
      expect(history.text()).toContain("Brake inspection needed.");
      expect(history.text()).toContain("Open");
    });

    it("Vehicle has no maintenance requests", async () => {
      setUser("maintenance");
      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.find("#history-vehicle-id").setValue("4");
      await wrapper.findAll("button").find((btn) => btn.text() === "View maintenance")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='empty-history']").text()).toContain(
        "No maintenance requests for this vehicle."
      );
    });
  });
});
