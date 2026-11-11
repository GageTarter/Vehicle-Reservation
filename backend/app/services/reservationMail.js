import db from "../models/index.js";
import logger from "../config/logger.js";
import { send } from "./mailer.js";

const User = db.user;
const Destination = db.destination;
const Vehicle = db.vehicle;

const DEFAULT_PRE_TRIP_BODY =
  "Pick up the vehicle and keys as instructed by your area office. Return the vehicle with fuel, cleaned, and keys turned in.";

export async function notifyStatusChange(reservation) {
  try {
    const requestor = await User.findByPk(reservation.requestorUserId);

    if (!requestor?.email) {
      logger.error(`Status email skipped: requestor ${reservation.requestorUserId} has no email.`);
      return;
    }

    const destination = await Destination.findByPk(reservation.destinationId);
    const destinationName = destination?.name || `Destination ${reservation.destinationId}`;
    const startAt = new Date(reservation.startAt).toISOString();

    await send({
      to: requestor.email,
      subject: "Reservation status updated",
      body: `Status: ${reservation.status}. Destination: ${destinationName}. Start: ${startAt}.`,
    });
  } catch (err) {
    logger.error(`Status email failed: ${err.message}`);
  }
}

function utcDayBounds(nowInput) {
  const now = nowInput ? new Date(nowInput) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const tomorrowStart = new Date(Date.UTC(year, month, day + 1));
  const dayAfterStart = new Date(Date.UTC(year, month, day + 2));
  return { tomorrowStart, dayAfterStart };
}

export async function sendDuePreTripNotices(nowInput) {
  const { tomorrowStart, dayAfterStart } = utcDayBounds(nowInput);
  const Reservation = db.reservation;

  const rows = await Reservation.findAll({
    where: {
      status: "reserved",
      preTripEmailSentAt: null,
      startAt: {
        [db.Sequelize.Op.gte]: tomorrowStart,
        [db.Sequelize.Op.lt]: dayAfterStart,
      },
    },
  });

  let sent = 0;

  for (const row of rows) {
    try {
      const requestor = await User.findByPk(row.requestorUserId);

      if (!requestor?.email) {
        logger.error(`Pre-trip email skipped: requestor ${row.requestorUserId} has no email.`);
        continue;
      }

      let body = DEFAULT_PRE_TRIP_BODY;
      if (row.vehicleId) {
        const vehicle = await Vehicle.findByPk(row.vehicleId);
        const label = vehicle?.name || `Vehicle ${row.vehicleId}`;
        body = `Vehicle: ${label}. ${DEFAULT_PRE_TRIP_BODY}`;
      }

      await send({
        to: requestor.email,
        subject: "Vehicle pickup instructions",
        body,
      });
      await row.update({ preTripEmailSentAt: new Date() });
      sent += 1;
    } catch (err) {
      logger.error(`Pre-trip email failed for reservation ${row.id}: ${err.message}`);
    }
  }

  return sent;
}
