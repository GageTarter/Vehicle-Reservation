/**
 * Feature 16 — Email notification history
 * Spec: features/feature-16- Email Notifications and Pickup Instructions.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import NotificationHistory from "../src/views/NotificationHistory.vue";
import Utils from "../src/config/utils.js";
import notificationServices from "../src/services/notificationServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/notificationServices.js", () => ({
  default: {
    getInstructions: vi.fn(),
    saveInstructions: vi.fn(),
    getNotifications: vi.fn(),
  },
}));

const row = {
  notification_id: 1,
  reservation_id: 10,
  recipient_email: "requestor@oc.edu",
  notification_type: "Status Change",
  sent_date: "2026-10-30T10:00:00",
};

function setUser(role, area_id = 1) {
  Utils.setStore("user", { userId: 7, role, area_id, token: "test-token" });
}

async function viewHistory(wrapper) {
  await wrapper.find("#reservation-id").setValue("10");
  await wrapper.findAll("button").find((btn) => btn.text() === "View history")?.trigger("click");
  await flushPromises();
}

describe("Feature 16 — Notification History", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    notificationServices.getNotifications.mockResolvedValue({ data: [] });
  });

  it("View notification history", async () => {
    setUser("area_admin");
    notificationServices.getNotifications.mockResolvedValue({ data: [row] });

    const { wrapper } = await mountWithPlugins(NotificationHistory);
    await viewHistory(wrapper);

    const list = wrapper.find("[data-testid='notification-list']");
    expect(list.text()).toContain("10");
    expect(list.text()).toContain("requestor@oc.edu");
    expect(list.text()).toContain("Status Change");
  });

  it("Prevent unauthorized notification history access", async () => {
    setUser("area_admin");
    notificationServices.getNotifications.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "You cannot view notifications for this reservation." },
      },
    });

    const { wrapper } = await mountWithPlugins(NotificationHistory);
    await viewHistory(wrapper);

    expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='notification-list']").exists()).toBe(false);
  });

  it("shows an empty state when no notifications exist", async () => {
    setUser("system_admin", null);
    const { wrapper } = await mountWithPlugins(NotificationHistory);
    await viewHistory(wrapper);

    expect(wrapper.find("[data-testid='empty-history']").text()).toContain(
      "No notifications have been sent for this reservation."
    );
  });
});
