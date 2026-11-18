/**
 * Feature 11 — Weekly Reservation Calendar
 * Spec: features/feature-11-weekly-reservation-calendar.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Calendar from "../src/views/Calendar.vue";
import Utils from "../src/config/utils.js";
import reservationServices from "../src/services/reservationServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/reservationServices.js", () => ({
  default: {
    calendar: vi.fn(),
  },
}));

function button(label) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === label);
}

async function mountCalendar() {
  const mounted = await mountWithPlugins(Calendar, { attachTo: document.body });
  await flushPromises();
  return mounted.wrapper;
}

describe("Feature 11 — Weekly Reservation Calendar", () => {
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
  });

  describe("US-11.1 — View this week's schedule", () => {
    it("Admin loads a week with reservations", async () => {
      reservationServices.calendar.mockImplementation(async (weekStart) => {
        if (weekStart !== "2026-11-16") {
          return { data: [] };
        }

        return {
          data: [
            {
              id: 1,
              partyName: "Soccer",
              requestorUserId: 2,
              status: "reserved",
              vehicleId: 7,
              startAt: "2026-11-18T14:00:00.000Z",
              endAt: "2026-11-18T18:00:00.000Z",
              destinationId: 3,
            },
          ],
        };
      });

      const wrapper = await mountCalendar();
      wrapper.vm.weekStart = "2026-11-16";
      await flushPromises();

      expect(document.body.textContent).toContain("Wed");
      expect(document.body.textContent).toContain("Soccer");
      expect(document.body.textContent).toContain("Reserved");
      expect(document.body.textContent).toContain("Vehicle 7");
      wrapper.unmount();
    });

    it("Empty week", async () => {
      reservationServices.calendar.mockResolvedValue({ data: [] });
      const wrapper = await mountCalendar();

      expect(document.body.textContent).toContain("No reservations this week.");
      wrapper.unmount();
    });
  });

  describe("US-11.2 — Move to another week", () => {
    it("Admin opens the next week", async () => {
      reservationServices.calendar.mockResolvedValue({ data: [] });
      const wrapper = await mountCalendar();
      wrapper.vm.weekStart = "2026-11-16";
      await flushPromises();

      reservationServices.calendar.mockClear();
      button("Next week").click();
      await flushPromises();

      expect(reservationServices.calendar).toHaveBeenCalledWith("2026-11-23");
      expect(document.body.textContent).toContain("2026-11-23");
      wrapper.unmount();
    });
  });
});
