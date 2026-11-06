/**
 * Feature 12 — Vehicle Checkout & Return Management
 * Spec: features/feature-12-vehicle checkout & return management.md
 */
import app from "../server.js";
import { syncTestDatabase } from "./helpers.js";
import {
  createReservation,
  createUser,
  createVehicle,
  getCheckoutReturn,
  getCheckoutStatus,
  postCheckout,
  postReturn,
  sessionTokenFor,
} from "./checkoutHelpers.js";

async function assignedReservationWorld() {
  const requestor = await createUser({ role: "requestor" });
  const vehicle = await createVehicle({ area_id: 1, name: "Van 4" });
  const reservation = await createReservation({
    requester_id: requestor.id,
    vehicle_id: vehicle.id,
    status: "Assigned",
  });
  const token = await sessionTokenFor(requestor);

  return { requestor, vehicle, reservation, token };
}

describe("Feature 12 — Vehicle Checkout & Return Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-12.1 — Record vehicle checkout", () => {
    it("Requestor checks out an assigned vehicle", async () => {
      const { reservation, token } = await assignedReservationWorld();

      const res = await postCheckout(app, token, reservation.id);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Vehicle checkout recorded successfully.");
      expect(res.body.reservation.status).toBe("Checked Out");
      expect(res.body.reservation.checkout_datetime).toBeTruthy();
      expect(res.body.reservation.reservation_id).toBe(reservation.id);
    });

    it("Requestor tries to check out a reservation without a vehicle", async () => {
      const requestor = await createUser({ role: "requestor" });
      const reservation = await createReservation({
        requester_id: requestor.id,
        vehicle_id: null,
        status: "Awaiting Vehicle",
      });
      const token = await sessionTokenFor(requestor);

      const res = await postCheckout(app, token, reservation.id);

      expect(res.status).toBe(409);
      const check = await getCheckoutReturn(app, token, reservation.id);
      expect(check.body.reservation.status).toBe("Awaiting Vehicle");
      expect(check.body.reservation.checkout_datetime).toBeNull();
    });

    it("Requestor checks out a vehicle twice", async () => {
      const { reservation, token } = await assignedReservationWorld();
      const first = await postCheckout(app, token, reservation.id);
      const originalCheckout = first.body.reservation.checkout_datetime;

      const res = await postCheckout(app, token, reservation.id);

      expect(res.status).toBe(409);
      const check = await getCheckoutReturn(app, token, reservation.id);
      expect(check.body.reservation.status).toBe("Checked Out");
      expect(String(check.body.reservation.checkout_datetime).slice(0, 19)).toBe(
        String(originalCheckout).slice(0, 19)
      );
    });
  });

  describe("US-12.2 — View checkout information", () => {
    it("Requestor views an assigned reservation", async () => {
      const { reservation, vehicle, token } = await assignedReservationWorld();

      const res = await getCheckoutReturn(app, token, reservation.id);

      expect(res.status).toBe(200);
      expect(res.body.reservation.vehicle_id).toBe(vehicle.id);
      expect(res.body.reservation.vehicle_name).toBe("Van 4");
      expect(res.body.reservation.status).toBe("Assigned");
      expect(res.body.reservation.start_datetime).toBeTruthy();
      expect(res.body.reservation.end_datetime).toBeTruthy();
    });

    it("Requestor cannot view another user's reservation", async () => {
      const { reservation } = await assignedReservationWorld();
      const other = await createUser({ role: "requestor" });
      const token = await sessionTokenFor(other);

      const res = await getCheckoutReturn(app, token, reservation.id);

      expect(res.status).toBe(403);
      expect(res.body.reservation).toBeUndefined();
    });
  });

  describe("US-12.3 — Mark a vehicle as returned", () => {
    it("Area administrator marks a checked-out vehicle as returned", async () => {
      const { reservation, token } = await assignedReservationWorld();
      await postCheckout(app, token, reservation.id);
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const areaToken = await sessionTokenFor(areaAdmin);

      const res = await postReturn(app, areaToken, reservation.id);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Vehicle return recorded successfully.");
      expect(res.body.reservation.status).toBe("Returned");
      expect(res.body.reservation.return_datetime).toBeTruthy();
    });

    it("Area administrator tries to return a vehicle that was not checked out", async () => {
      const { reservation } = await assignedReservationWorld();
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const areaToken = await sessionTokenFor(areaAdmin);

      const res = await postReturn(app, areaToken, reservation.id);

      expect(res.status).toBe(409);
      const check = await getCheckoutReturn(app, areaToken, reservation.id);
      expect(check.body.reservation.status).toBe("Assigned");
      expect(check.body.reservation.return_datetime).toBeNull();
    });

    it("Requestor tries to mark a vehicle as returned", async () => {
      const { reservation, token } = await assignedReservationWorld();
      await postCheckout(app, token, reservation.id);

      const res = await postReturn(app, token, reservation.id);

      expect(res.status).toBe(403);
      const check = await getCheckoutReturn(app, token, reservation.id);
      expect(check.body.reservation.status).toBe("Checked Out");
    });

    it("Area administrator attempts to return a vehicle twice", async () => {
      const { reservation, token } = await assignedReservationWorld();
      await postCheckout(app, token, reservation.id);
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const areaToken = await sessionTokenFor(areaAdmin);
      const first = await postReturn(app, areaToken, reservation.id);
      const originalReturn = first.body.reservation.return_datetime;

      const res = await postReturn(app, areaToken, reservation.id);

      expect(res.status).toBe(409);
      const check = await getCheckoutReturn(app, areaToken, reservation.id);
      expect(check.body.reservation.status).toBe("Returned");
      expect(String(check.body.reservation.return_datetime).slice(0, 19)).toBe(
        String(originalReturn).slice(0, 19)
      );
    });
  });

  describe("US-12.4 — View checkout and return statuses", () => {
    it("Area administrator views reservation statuses", async () => {
      const { reservation, vehicle } = await assignedReservationWorld();
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const areaToken = await sessionTokenFor(areaAdmin);

      const res = await getCheckoutStatus(app, areaToken);

      expect(res.status).toBe(200);
      const found = res.body.find((row) => row.reservation_id === reservation.id);
      expect(found).toBeTruthy();
      expect(found.status).toBe("Assigned");
      expect(found.vehicle_id).toBe(vehicle.id);
    });

    it("No reservations require checkout or return", async () => {
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const areaToken = await sessionTokenFor(areaAdmin);

      const res = await getCheckoutStatus(app, areaToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
