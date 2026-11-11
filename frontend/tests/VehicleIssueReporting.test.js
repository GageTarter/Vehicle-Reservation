/**
 * Feature 13 — Vehicle Issue Reporting
 * Spec: features/feature-13- vehicle issue reporting.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import VehicleIssueReporting from "../src/views/VehicleIssueReporting.vue";
import Utils from "../src/config/utils.js";
import issueServices from "../src/services/issueServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/issueServices.js", () => ({
  default: {
    getIssues: vi.fn(),
    getIssue: vi.fn(),
    createIssue: vi.fn(),
    updateIssue: vi.fn(),
    updateIssueStatus: vi.fn(),
    deleteIssue: vi.fn(),
    getVehicleIssues: vi.fn(),
  },
}));

const sampleIssue = {
  issue_id: 1,
  vehicle_id: 4,
  reservation_id: 12,
  reported_by: 7,
  issue_type: "Low Gas",
  description: "The vehicle has less than one-quarter tank of gas.",
  reported_date: "2026-11-05T17:00:00",
  status: "Open",
};

function setUser(role) {
  Utils.setStore("user", {
    userId: 7,
    role,
    token: "test-token",
  });
}

async function mountView() {
  return mountWithPlugins(VehicleIssueReporting);
}

describe("Feature 13 — Vehicle Issue Reporting", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    issueServices.getIssues.mockResolvedValue({ data: [] });
    issueServices.getVehicleIssues.mockResolvedValue({ data: [] });
  });

  describe("US-13.1 — Report a vehicle issue", () => {
    it("Requestor reports a vehicle issue", async () => {
      setUser("requestor");
      issueServices.createIssue.mockResolvedValue({
        data: {
          message: "Vehicle issue reported successfully.",
          issue: sampleIssue,
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.findComponent({ name: "VSelect" }).setValue("Low Gas");
      await wrapper.find("#issue-description").setValue(
        "The vehicle has less than one-quarter tank of gas."
      );
      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      expect(issueServices.createIssue).toHaveBeenCalledWith({
        vehicle_id: 4,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
      });
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Vehicle issue reported successfully."
      );
    });

    it("Requestor reports an issue associated with a reservation", async () => {
      setUser("requestor");
      issueServices.createIssue.mockResolvedValue({
        data: {
          message: "Vehicle issue reported successfully.",
          issue: sampleIssue,
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#reservation-id").setValue("12");
      await wrapper.findComponent({ name: "VSelect" }).setValue("Low Gas");
      await wrapper.find("#issue-description").setValue(
        "The vehicle has less than one-quarter tank of gas."
      );
      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      expect(issueServices.createIssue).toHaveBeenCalledWith({
        vehicle_id: 4,
        reservation_id: 12,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
      });
    });

    it("Requestor submits an incomplete issue report", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();

      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      expect(issueServices.createIssue).not.toHaveBeenCalled();
      expect(wrapper.find("[data-testid='error-alert']").text()).toContain(
        "Issue type and description are required."
      );
    });

    it("Requestor reports an issue against another user's reservation", async () => {
      setUser("requestor");
      issueServices.createIssue.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "You cannot report an issue against another user's reservation." },
        },
      });

      const { wrapper } = await mountView();
      await wrapper.find("#vehicle-id").setValue("4");
      await wrapper.find("#reservation-id").setValue("99");
      await wrapper.findComponent({ name: "VSelect" }).setValue("Low Gas");
      await wrapper.find("#issue-description").setValue("Unauthorized reservation.");
      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
      expect(wrapper.find("[data-testid='success-alert']").exists()).toBe(false);
    });
  });

  describe("US-13.5 — View reported vehicle issues", () => {
    it("Area administrator views issues for their area", async () => {
      setUser("area_admin");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });

      const { wrapper } = await mountView();
      await flushPromises();

      const list = wrapper.find("[data-testid='issue-list']");
      expect(list.exists()).toBe(true);
      expect(list.text()).toContain("Low Gas");
      expect(list.text()).toContain(
        "The vehicle has less than one-quarter tank of gas."
      );
      expect(list.text()).toContain("7");
      expect(list.text()).toContain("2026-11-05T17:00:00");
      expect(list.text()).toContain("Open");
    });

    it("Area administrator attempts to view an issue outside their area", async () => {
      setUser("area_admin");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });
      issueServices.getIssue.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "You cannot view issues outside your area." },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.get("[aria-label='See issue']").trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
      expect(wrapper.text()).not.toContain("Maintenance Needed");
    });

    it("System administrator views all vehicle issues", async () => {
      setUser("system_admin");
      issueServices.getIssues.mockResolvedValue({
        data: [
          sampleIssue,
          {
            ...sampleIssue,
            issue_id: 2,
            issue_type: "Maintenance Needed",
            description: "Check engine light is on.",
          },
        ],
      });

      const { wrapper } = await mountView();
      await flushPromises();

      const list = wrapper.find("[data-testid='issue-list']");
      expect(list.text()).toContain("Low Gas");
      expect(list.text()).toContain("Maintenance Needed");
    });
  });

  describe("US-13.6 — Update vehicle issue status", () => {
    it("Area administrator updates an issue status", async () => {
      setUser("area_admin");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });
      issueServices.getIssue.mockResolvedValue({ data: { issue: sampleIssue } });
      issueServices.updateIssueStatus.mockResolvedValue({
        data: {
          message: "Vehicle issue status updated successfully.",
          issue: { ...sampleIssue, status: "In Progress" },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.get("[aria-label='See issue']").trigger("click");
      await flushPromises();

      const statusSelect = wrapper.findAllComponents({ name: "VSelect" }).at(-1);
      await statusSelect.setValue("In Progress");
      await wrapper.findAll("button").find((btn) => btn.text() === "Update Status")?.trigger("click");
      await flushPromises();

      expect(issueServices.updateIssueStatus).toHaveBeenCalledWith(1, "In Progress");
      expect(wrapper.text()).toContain("In Progress");
    });

    it("Administrator resolves an issue", async () => {
      setUser("system_admin");
      const inProgress = { ...sampleIssue, status: "In Progress" };
      issueServices.getIssues.mockResolvedValue({ data: [inProgress] });
      issueServices.getIssue.mockResolvedValue({ data: { issue: inProgress } });
      issueServices.updateIssueStatus.mockResolvedValue({
        data: {
          message: "Vehicle issue status updated successfully.",
          issue: { ...sampleIssue, status: "Resolved" },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.get("[aria-label='See issue']").trigger("click");
      await flushPromises();

      const statusSelect = wrapper.findAllComponents({ name: "VSelect" }).at(-1);
      await statusSelect.setValue("Resolved");
      await wrapper.findAll("button").find((btn) => btn.text() === "Update Status")?.trigger("click");
      await flushPromises();

      expect(issueServices.updateIssueStatus).toHaveBeenCalledWith(1, "Resolved");
      expect(wrapper.text()).toContain("Resolved");
    });

    it("Requestor attempts to update an issue status", async () => {
      setUser("requestor");
      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Update Status");
      expect(issueServices.updateIssueStatus).not.toHaveBeenCalled();
    });
  });

  describe("US-13.7 — View vehicle issue history", () => {
    it("Administrator views vehicle issue history", async () => {
      setUser("area_admin");
      issueServices.getVehicleIssues.mockResolvedValue({ data: [sampleIssue] });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.find("#history-vehicle-id").setValue("4");
      await wrapper.findAll("button").find((btn) => btn.text() === "View history")?.trigger("click");
      await flushPromises();

      const history = wrapper.find("[data-testid='issue-history']");
      expect(history.text()).toContain("Low Gas");
      expect(history.text()).toContain(
        "The vehicle has less than one-quarter tank of gas."
      );
      expect(history.text()).toContain("2026-11-05T17:00:00");
      expect(history.text()).toContain("Open");
    });

    it("Vehicle has no reported issues", async () => {
      setUser("area_admin");
      issueServices.getVehicleIssues.mockResolvedValue({ data: [] });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.find("#history-vehicle-id").setValue("4");
      await wrapper.findAll("button").find((btn) => btn.text() === "View history")?.trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='empty-history']").text()).toContain(
        "No reported issues for this vehicle."
      );
    });
  });

  describe("US-13.4 — Delete a reported issue", () => {
    it("Requestor deletes a reported issue", async () => {
      setUser("requestor");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });
      issueServices.deleteIssue.mockResolvedValue({ status: 204 });

      const { wrapper } = await mountView();
      await flushPromises();

      expect(wrapper.find("[data-testid='my-issue-list']").text()).toContain("Low Gas");

      issueServices.getIssues.mockResolvedValue({ data: [] });
      await wrapper.get("[aria-label='Delete issue']").trigger("click");
      await flushPromises();

      expect(issueServices.deleteIssue).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Low Gas");
    });
  });

  describe("US-13.2 — View my reported issues", () => {
    it("Requestor views their reported issues", async () => {
      setUser("requestor");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });
      issueServices.getIssue.mockResolvedValue({ data: { issue: sampleIssue } });

      const { wrapper } = await mountView();
      await flushPromises();

      const list = wrapper.find("[data-testid='my-issue-list']");
      expect(list.text()).toContain("Low Gas");
      expect(list.text()).toContain(
        "The vehicle has less than one-quarter tank of gas."
      );
      expect(list.text()).toContain("2026-11-05T17:00:00");
      expect(list.text()).toContain("Open");

      await wrapper.get("[aria-label='See issue']").trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='my-issue-detail']").text()).toContain("Low Gas");

      await wrapper.get("[aria-label='Unsee issue']").trigger("click");
      await flushPromises();

      expect(wrapper.find("[data-testid='my-issue-detail']").exists()).toBe(false);
    });
  });

  describe("US-13.3 — Edit a reported issue", () => {
    it("Requestor edits a reported issue", async () => {
      setUser("requestor");
      issueServices.getIssues.mockResolvedValue({ data: [sampleIssue] });
      issueServices.updateIssue.mockResolvedValue({
        data: {
          message: "Vehicle issue updated successfully.",
          issue: {
            ...sampleIssue,
            issue_type: "Dirty Vehicle",
            description: "The seats and floor need cleaning.",
          },
        },
      });

      const { wrapper } = await mountView();
      await flushPromises();
      await wrapper.get("[aria-label='Edit issue']").trigger("click");
      await wrapper.find("#issue-description").setValue(
        "The seats and floor need cleaning."
      );
      await wrapper.findAll("button").find((btn) => btn.text() === "Save Changes")?.trigger("click");
      await flushPromises();

      expect(issueServices.updateIssue).toHaveBeenCalledWith(1, {
        vehicle_id: 4,
        reservation_id: 12,
        issue_type: "Low Gas",
        description: "The seats and floor need cleaning.",
      });
      expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
        "Vehicle issue updated successfully."
      );
    });
  });
});
