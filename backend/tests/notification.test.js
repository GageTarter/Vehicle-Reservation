/**
 * Feature 16 — Email Notifications and Pickup Instructions
 * Spec: features/feature-16- Email Notifications and Pickup Instructions.md
 */
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";
import { PICKUP_INSTRUCTIONS, STATUS_CHANGE } from "../app/services/notificationService.js";
import {
  createArea,
  createInstructions,
  createReservation,
  createUser,
  createVehicle,
  getInstructions,
  getNotifications,
  patchStatus,
  putInstructions,
  restoreMailer,
  runDayBefore,
  sentMail,
  sessionTokenFor,
  useCapturingMailer,
  useFailingMailer,
} from "./notificationHelpers.js";

const START = "2026-11-08T15:00:00.000Z";
const DAY_BEFORE = "2026-11-07T12:00:00.000Z";

async function world() {
  const area1 = await createArea({ name: "Athletics" });
  const area2 = await createArea({ name: "Facilities" });
  const requestor = await createUser({
    role: "requestor",
    email: "requestor@oc.edu",
    fName: "Riley",
    lName: "Requestor",
  });
  const areaAdmin = await createUser({ role: "area_admin", area_id: area1.area_id });
  const systemAdmin = await createUser({ role: "system_admin", area_id: null });
  const vehicle = await createVehicle({ area_id: area1.area_id, name: "Van 4" });
  const otherVehicle = await createVehicle({ area_id: area2.area_id, name: "Truck 9" });
  await createInstructions({ area_id: area1.area_id });
  const reservation = await createReservation({
    user_id: requestor.id,
    vehicle_id: vehicle.id,
    status: "Approved",
    start_datetime: START,
  });

  return {
    area1,
    area2,
    requestor,
    areaAdmin,
    systemAdmin,
    vehicle,
    otherVehicle,
    reservation,
    areaToken: await sessionTokenFor(areaAdmin),
    systemToken: await sessionTokenFor(systemAdmin),
  };
}

describe("Feature 16 — Email Notifications and Pickup Instructions", () => {
  beforeEach(async () => {
    await syncTestDatabase();
    useCapturingMailer();
  });

  afterEach(() => {
    restoreMailer();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("Status Change Notifications", () => {
    it("Send an email when reservation status changes", async () => {
      const { reservation, areaToken, requestor } = await world();

      const res = await patchStatus(app, areaToken, reservation.reservation_id, "Assigned");

      expect(res.status).toBe(200);
      expect(res.body.status_changed).toBe(true);
      expect(sentMail).toHaveLength(1);
      expect(sentMail[0].to).toBe(requestor.email);
      expect(sentMail[0].text).toContain("Assigned");

      const history = await getNotifications(app, areaToken, reservation.reservation_id);
      expect(history.body.some((row) => row.notification_type === STATUS_CHANGE)).toBe(true);
    });

    it("Do not send an email when the status does not change", async () => {
      const { reservation, areaToken } = await world();

      const res = await patchStatus(app, areaToken, reservation.reservation_id, "Approved");

      expect(res.status).toBe(200);
      expect(res.body.status_changed).toBe(false);
      expect(sentMail).toHaveLength(0);

      const history = await getNotifications(app, areaToken, reservation.reservation_id);
      expect(history.body).toEqual([]);
    });
  });

  describe("Pickup and Return Instructions", () => {
    it("Send instructions one day before a reservation", async () => {
      const { reservation, systemToken, requestor } = await world();

      const res = await runDayBefore(app, systemToken, DAY_BEFORE);

      expect(res.status).toBe(200);
      expect(sentMail).toHaveLength(1);
      expect(sentMail[0].to).toBe(requestor.email);
      expect(sentMail[0].text).toContain("Pick up the vehicle from the Athletics parking area.");
      expect(sentMail[0].text).toContain("Contact the Athletics office for assistance.");

      const history = await getNotifications(app, systemToken, reservation.reservation_id);
      expect(history.body.some((row) => row.notification_type === PICKUP_INSTRUCTIONS)).toBe(
        true
      );
    });

    it("Do not send instructions for a cancelled reservation", async () => {
      const { reservation, systemToken } = await world();
      reservation.status = "Cancelled";
      await reservation.save();

      const res = await runDayBefore(app, systemToken, DAY_BEFORE);

      expect(res.status).toBe(200);
      expect(sentMail).toHaveLength(0);

      const history = await getNotifications(app, systemToken, reservation.reservation_id);
      expect(history.body).toEqual([]);
    });

    it("Prevent duplicate scheduled notifications", async () => {
      const { reservation, systemToken } = await world();

      await runDayBefore(app, systemToken, DAY_BEFORE);
      expect(sentMail).toHaveLength(1);

      await runDayBefore(app, systemToken, DAY_BEFORE);
      expect(sentMail).toHaveLength(1);

      const history = await getNotifications(app, systemToken, reservation.reservation_id);
      const pickup = history.body.filter((row) => row.notification_type === PICKUP_INSTRUCTIONS);
      expect(pickup).toHaveLength(1);
    });
  });

  describe("Area Instructions", () => {
    it("Area admin updates instructions", async () => {
      const { area1, areaToken } = await world();

      const res = await putInstructions(app, areaToken, area1.area_id, {
        pickup_instructions: "Pick up the vehicle from the Athletics office.",
        return_instructions: "Return the vehicle to the designated parking area.",
        contact_information: "Contact the Athletics office at the listed department email.",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Area instructions updated successfully.");

      const saved = await getInstructions(app, areaToken, area1.area_id);
      expect(saved.body.pickup_instructions).toBe(
        "Pick up the vehicle from the Athletics office."
      );
    });

    it("Area admin cannot update another area's instructions", async () => {
      const { area2, areaToken } = await world();

      const res = await putInstructions(app, areaToken, area2.area_id, {
        pickup_instructions: "Should not save.",
        return_instructions: "Should not save.",
      });

      expect(res.status).toBe(403);
    });

    it("System admin manages area instructions", async () => {
      const { area2, systemToken } = await world();

      const res = await putInstructions(app, systemToken, area2.area_id, {
        pickup_instructions: "Pick up at Facilities.",
        return_instructions: "Return to Facilities lot.",
        contact_information: "Call Facilities.",
      });

      expect(res.status).toBe(200);
      const saved = await getInstructions(app, systemToken, area2.area_id);
      expect(saved.body.pickup_instructions).toBe("Pick up at Facilities.");
    });
  });

  describe("Notification History", () => {
    it("View notification history", async () => {
      const { reservation, areaToken } = await world();
      await patchStatus(app, areaToken, reservation.reservation_id, "Assigned");

      const res = await getNotifications(app, areaToken, reservation.reservation_id);

      expect(res.status).toBe(200);
      expect(res.body[0].reservation_id).toBe(reservation.reservation_id);
      expect(res.body[0].recipient_email).toBe("requestor@oc.edu");
      expect(res.body[0].notification_type).toBe(STATUS_CHANGE);
      expect(res.body[0].sent_date).toBeTruthy();
    });

    it("Prevent unauthorized notification history access", async () => {
      const { reservation, area2 } = await world();
      const outsider = await createUser({ role: "area_admin", area_id: area2.area_id });
      const token = await sessionTokenFor(outsider);

      const res = await getNotifications(app, token, reservation.reservation_id);

      expect(res.status).toBe(403);
    });
  });

  describe("Coverage extras", () => {
    it("includes required reservation details in the status email", async () => {
      const { reservation, areaToken, vehicle } = await world();

      await patchStatus(app, areaToken, reservation.reservation_id, "Assigned");

      expect(sentMail[0].text).toContain(`Reservation ID: ${reservation.reservation_id}`);
      expect(sentMail[0].text).toContain("Riley Requestor");
      expect(sentMail[0].text).toContain(vehicle.name);
      expect(sentMail[0].text).toContain("Athletics event");
    });

    it("handles email delivery failure without recording success", async () => {
      const { reservation, areaToken } = await world();
      useFailingMailer();

      const res = await patchStatus(app, areaToken, reservation.reservation_id, "Assigned");

      expect(res.status).toBe(200);
      const history = await getNotifications(app, areaToken, reservation.reservation_id);
      expect(history.body).toEqual([]);
    });

    it("handles a missing requestor email address", async () => {
      const { reservation, requestor, areaToken } = await world();
      requestor.email = null;
      await requestor.save();

      await patchStatus(app, areaToken, reservation.reservation_id, "Assigned");

      expect(sentMail).toHaveLength(0);
      const history = await getNotifications(app, areaToken, reservation.reservation_id);
      expect(history.body).toEqual([]);
    });

    it("handles missing area instructions", async () => {
      const { area1, systemToken, reservation } = await world();
      await db.areaInstruction.destroy({ where: { area_id: area1.area_id } });

      const res = await runDayBefore(app, systemToken, DAY_BEFORE);

      expect(res.status).toBe(200);
      expect(sentMail).toHaveLength(1);

      const history = await getNotifications(app, systemToken, reservation.reservation_id);
      expect(history.body.some((row) => row.notification_type === PICKUP_INSTRUCTIONS)).toBe(
        true
      );
    });
  });
});
