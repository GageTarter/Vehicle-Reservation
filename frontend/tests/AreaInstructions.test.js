/**
 * Feature 16 — Area pickup and return instructions
 * Spec: features/feature-16- Email Notifications and Pickup Instructions.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import AreaInstructions from "../src/views/AreaInstructions.vue";
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

const saved = {
  instruction_id: 1,
  area_id: 1,
  pickup_instructions: "Pick up the vehicle from the Athletics parking area.",
  return_instructions: "Return the vehicle to the designated parking space.",
  contact_information: "Contact the Athletics office for assistance.",
};

function setUser(role, area_id = 1) {
  Utils.setStore("user", { userId: 7, role, area_id, token: "test-token" });
}

describe("Feature 16 — Area Instructions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    notificationServices.getInstructions.mockResolvedValue({ data: saved });
    notificationServices.saveInstructions.mockResolvedValue({
      data: { message: "Area instructions updated successfully." },
    });
  });

  it("Area admin updates instructions", async () => {
    setUser("area_admin", 1);
    const { wrapper } = await mountWithPlugins(AreaInstructions);
    await flushPromises();

    expect(notificationServices.getInstructions).toHaveBeenCalledWith("1");
    await wrapper.find("#pickup-instructions").setValue(
      "Pick up the vehicle from the Athletics office."
    );
    await wrapper.find("#return-instructions").setValue(
      "Return the vehicle to the designated parking area."
    );
    await wrapper.findAll("button").find((btn) => btn.text() === "Save")?.trigger("click");
    await flushPromises();

    expect(notificationServices.saveInstructions).toHaveBeenCalledWith("1", {
      pickup_instructions: "Pick up the vehicle from the Athletics office.",
      return_instructions: "Return the vehicle to the designated parking area.",
      contact_information: "Contact the Athletics office for assistance.",
    });
    expect(wrapper.find("[data-testid='success-alert']").text()).toContain(
      "Area instructions updated successfully."
    );
  });

  it("Area admin cannot update another area's instructions", async () => {
    setUser("area_admin", 1);
    notificationServices.saveInstructions.mockRejectedValue({
      response: { status: 403, data: { message: "You cannot manage instructions for this area." } },
    });

    const { wrapper } = await mountWithPlugins(AreaInstructions);
    await flushPromises();
    await wrapper.findAll("button").find((btn) => btn.text() === "Save")?.trigger("click");
    await flushPromises();

    expect(wrapper.find("[data-testid='error-alert']").exists()).toBe(true);
  });

  it("System admin manages area instructions", async () => {
    setUser("system_admin", null);
    const { wrapper } = await mountWithPlugins(AreaInstructions);
    await wrapper.find("#area-id").setValue("2");
    await wrapper.findAll("button").find((btn) => btn.text() === "Load instructions")?.trigger("click");
    await flushPromises();
    await wrapper.find("#pickup-instructions").setValue("Pick up at Facilities.");
    await wrapper.find("#return-instructions").setValue("Return to Facilities lot.");
    await wrapper.find("#contact-information").setValue("Call Facilities.");
    await wrapper.findAll("button").find((btn) => btn.text() === "Save")?.trigger("click");
    await flushPromises();

    expect(notificationServices.saveInstructions).toHaveBeenCalledWith("2", {
      pickup_instructions: "Pick up at Facilities.",
      return_instructions: "Return to Facilities lot.",
      contact_information: "Call Facilities.",
    });
  });

  it("Unauthorized users cannot access this screen", async () => {
    setUser("requestor", null);
    const { wrapper } = await mountWithPlugins(AreaInstructions);
    await flushPromises();

    expect(wrapper.text()).not.toContain("Save");
    expect(notificationServices.getInstructions).not.toHaveBeenCalled();
  });
});
