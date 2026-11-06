import db from "../models/index.js";

const Reservation = db.reservation;

export async function getAccessibleReservationOrNull(req, reservationId) {
  const id = Number(reservationId);

  if (!Number.isInteger(id)) {
    return null;
  }

  const where = { id };

  if (req.user.role !== "admin") {
    where.requestorUserId = req.user.id;
  }

  return Reservation.findOne({ where });
}
