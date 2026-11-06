import db from "../models/index.js";
import { sendEmail } from "./mailer.js";
import logger from "../config/logger.js";

export const STATUS_CHANGE = "Status Change";
export const PICKUP_INSTRUCTIONS = "Pickup and Return Instructions";
export const CANCELLED = "Cancelled";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function requestorName(user) {
  return `${user?.fName || ""} ${user?.lName || ""}`.trim() || "Requestor";
}

function ymd(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function isDayBeforeDue(startDatetime, now = new Date()) {
  const start = startDatetime instanceof Date ? startDatetime : new Date(startDatetime);
  const due = new Date(start);
  due.setUTCDate(due.getUTCDate() - 1);
  return ymd(due) === ymd(now);
}

async function recordNotification({ reservationId, recipientEmail, notificationType }) {
  return db.emailNotification.create({
    reservation_id: reservationId,
    recipient_email: recipientEmail,
    notification_type: notificationType,
    sent_date: new Date(),
  });
}

export function buildStatusChangeEmail(reservation) {
  const user = reservation.user;
  const vehicle = reservation.vehicle;

  return {
    to: user?.email,
    subject: `Reservation ${reservation.reservation_id} status: ${reservation.status}`,
    text: [
      `Reservation ID: ${reservation.reservation_id}`,
      `Requestor: ${requestorName(user)}`,
      `Status: ${reservation.status}`,
      `Assigned vehicle: ${vehicle?.name || "None"}`,
      `Start: ${formatDate(reservation.start_datetime)}`,
      `End: ${formatDate(reservation.end_datetime)}`,
      `Destination: ${reservation.destination || "None"}`,
    ].join("\n"),
  };
}

export function buildDayBeforeEmail(reservation, instructions) {
  const user = reservation.user;
  const vehicle = reservation.vehicle;

  return {
    to: user?.email,
    subject: `Pickup and return instructions for reservation ${reservation.reservation_id}`,
    text: [
      `Requestor: ${requestorName(user)}`,
      `Reservation ID: ${reservation.reservation_id}`,
      `Assigned vehicle: ${vehicle?.name || "None"}`,
      `Start: ${formatDate(reservation.start_datetime)}`,
      `End: ${formatDate(reservation.end_datetime)}`,
      `Pickup instructions: ${instructions?.pickup_instructions || ""}`,
      `Return instructions: ${instructions?.return_instructions || ""}`,
      `Contact information: ${instructions?.contact_information || ""}`,
    ].join("\n"),
  };
}

export async function loadReservation(reservationId) {
  return db.reservation.findByPk(reservationId, {
    include: [{ model: db.user }, { model: db.vehicle, include: [db.area] }],
  });
}

export async function sendStatusChangeNotification(reservation) {
  const message = buildStatusChangeEmail(reservation);

  if (!message.to) {
    const error = new Error("A valid recipient email is required.");
    error.code = "MISSING_RECIPIENT";
    throw error;
  }

  await sendEmail(message);
  return recordNotification({
    reservationId: reservation.reservation_id,
    recipientEmail: message.to,
    notificationType: STATUS_CHANGE,
  });
}

export async function alreadySent(reservationId, notificationType) {
  const existing = await db.emailNotification.findOne({
    where: { reservation_id: reservationId, notification_type: notificationType },
  });
  return Boolean(existing);
}

export async function sendDayBeforeNotification(reservation) {
  if (reservation.status === CANCELLED) {
    return { sent: false, reason: "cancelled" };
  }

  if (!reservation.vehicle_id || !reservation.vehicle) {
    return { sent: false, reason: "no_vehicle" };
  }

  if (await alreadySent(reservation.reservation_id, PICKUP_INSTRUCTIONS)) {
    return { sent: false, reason: "duplicate" };
  }

  const instructions = await db.areaInstruction.findOne({
    where: { area_id: reservation.vehicle.area_id },
  });

  const message = buildDayBeforeEmail(reservation, instructions);

  if (!message.to) {
    return { sent: false, reason: "missing_recipient" };
  }

  await sendEmail(message);
  const record = await recordNotification({
    reservationId: reservation.reservation_id,
    recipientEmail: message.to,
    notificationType: PICKUP_INSTRUCTIONS,
  });

  return { sent: true, notification: record };
}

export async function runDayBeforeNotifications(now = new Date()) {
  const reservations = await db.reservation.findAll({
    include: [{ model: db.user }, { model: db.vehicle, include: [db.area] }],
  });

  const results = [];

  for (const reservation of reservations) {
    if (!isDayBeforeDue(reservation.start_datetime, now)) {
      continue;
    }

    try {
      results.push(await sendDayBeforeNotification(reservation));
    } catch (error) {
      logger.error(`Day-before email failed for reservation ${reservation.reservation_id}: ${error.message}`);
      results.push({ sent: false, reason: "delivery_failure" });
    }
  }

  return results;
}

export async function updateReservationStatus(reservation, nextStatus) {
  const previous = reservation.status;

  if (previous === nextStatus) {
    return { changed: false, reservation };
  }

  reservation.status = nextStatus;
  await reservation.save();

  const reloaded = await loadReservation(reservation.reservation_id);

  try {
    await sendStatusChangeNotification(reloaded);
  } catch (error) {
    logger.error(`Status-change email failed for reservation ${reservation.reservation_id}: ${error.message}`);
    return { changed: true, reservation: reloaded, emailError: error.message };
  }

  return { changed: true, reservation: reloaded };
}
