import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  loadReservation,
  runDayBeforeNotifications,
  updateReservationStatus,
} from "../services/notificationService.js";

const controller = {};

function canManageInstructions(user, areaId) {
  if (user.role === "system_admin") {
    return true;
  }

  if (user.role === "area_admin") {
    return user.area_id === areaId;
  }

  return false;
}

function canViewReservation(user, reservation) {
  if (user.role === "system_admin") {
    return true;
  }

  if (user.role === "area_admin") {
    return reservation.vehicle?.area_id === user.area_id;
  }

  return false;
}

function toInstructionJson(row, areaId) {
  if (!row) {
    return {
      instruction_id: null,
      area_id: areaId,
      pickup_instructions: "",
      return_instructions: "",
      contact_information: "",
    };
  }

  return {
    instruction_id: row.instruction_id,
    area_id: row.area_id,
    pickup_instructions: row.pickup_instructions,
    return_instructions: row.return_instructions,
    contact_information: row.contact_information || "",
  };
}

function toNotificationJson(row) {
  return {
    notification_id: row.notification_id,
    reservation_id: row.reservation_id,
    recipient_email: row.recipient_email,
    notification_type: row.notification_type,
    sent_date: row.sent_date,
  };
}

controller.getInstructions = async (req, res) => {
  try {
    const areaId = parseInt(req.params.id, 10);

    if (Number.isNaN(areaId)) {
      return res.status(400).send({ message: "A valid area id is required." });
    }

    if (!canManageInstructions(req.user, areaId)) {
      return res.status(403).send({ message: "You cannot view instructions for this area." });
    }

    const area = await db.area.findByPk(areaId);

    if (!area) {
      return res.status(404).send({ message: `Area with id=${areaId} not found.` });
    }

    const row = await db.areaInstruction.findOne({ where: { area_id: areaId } });
    return res.status(200).send(toInstructionJson(row, areaId));
  } catch (error) {
    logger.error(`Failed to load area instructions: ${error.message}`);
    return res.status(500).send({ message: "Unable to load area instructions." });
  }
};

controller.upsertInstructions = async (req, res) => {
  try {
    const areaId = parseInt(req.params.id, 10);

    if (Number.isNaN(areaId)) {
      return res.status(400).send({ message: "A valid area id is required." });
    }

    if (!canManageInstructions(req.user, areaId)) {
      return res.status(403).send({ message: "You cannot manage instructions for this area." });
    }

    const area = await db.area.findByPk(areaId);

    if (!area) {
      return res.status(404).send({ message: `Area with id=${areaId} not found.` });
    }

    const pickup = req.body.pickup_instructions?.trim();
    const ret = req.body.return_instructions?.trim();
    const contact = req.body.contact_information?.trim() || null;

    if (!pickup || !ret) {
      return res.status(400).send({ message: "Required instruction information is missing." });
    }

    const existing = await db.areaInstruction.findOne({ where: { area_id: areaId } });

    if (existing) {
      existing.pickup_instructions = pickup;
      existing.return_instructions = ret;
      existing.contact_information = contact;
      await existing.save();
    } else {
      await db.areaInstruction.create({
        area_id: areaId,
        pickup_instructions: pickup,
        return_instructions: ret,
        contact_information: contact,
      });
    }

    return res.status(200).send({ message: "Area instructions updated successfully." });
  } catch (error) {
    logger.error(`Failed to save area instructions: ${error.message}`);
    return res.status(500).send({ message: "Unable to save area instructions." });
  }
};

controller.listNotifications = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);

    if (Number.isNaN(reservationId)) {
      return res.status(400).send({ message: "A valid reservation id is required." });
    }

    const reservation = await loadReservation(reservationId);

    if (!reservation) {
      return res.status(404).send({ message: `Reservation with id=${reservationId} not found.` });
    }

    if (!canViewReservation(req.user, reservation)) {
      return res.status(403).send({ message: "You cannot view notifications for this reservation." });
    }

    const rows = await db.emailNotification.findAll({
      where: { reservation_id: reservationId },
      order: [
        ["sent_date", "DESC"],
        ["notification_id", "DESC"],
      ],
    });

    return res.status(200).send(rows.map(toNotificationJson));
  } catch (error) {
    logger.error(`Failed to load notification history: ${error.message}`);
    return res.status(500).send({ message: "Unable to load notification history." });
  }
};

controller.updateStatus = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const nextStatus = req.body.status?.trim();

    if (Number.isNaN(reservationId) || !nextStatus) {
      return res.status(400).send({ message: "A valid reservation id and status are required." });
    }

    const reservation = await loadReservation(reservationId);

    if (!reservation) {
      return res.status(404).send({ message: `Reservation with id=${reservationId} not found.` });
    }

    if (!canViewReservation(req.user, reservation)) {
      return res.status(403).send({ message: "You cannot update this reservation." });
    }

    const result = await updateReservationStatus(reservation, nextStatus);

    return res.status(200).send({
      message: result.changed
        ? "Reservation status updated successfully."
        : "Reservation status was unchanged.",
      status: result.reservation.status,
      status_changed: result.changed,
    });
  } catch (error) {
    logger.error(`Failed to update reservation status: ${error.message}`);
    return res.status(500).send({ message: "Unable to update reservation status." });
  }
};

controller.runDayBefore = async (req, res) => {
  try {
    if (req.user.role !== "system_admin") {
      return res.status(403).send({ message: "You cannot run the day-before notification job." });
    }

    const now = req.body.now ? new Date(req.body.now) : new Date();
    const results = await runDayBeforeNotifications(now);
    return res.status(200).send({ message: "Day-before notification job completed.", results });
  } catch (error) {
    logger.error(`Day-before notification job failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to run the day-before notification job." });
  }
};

export default controller;
