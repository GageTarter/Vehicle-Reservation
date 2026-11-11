import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleReservationOrNull } from "../authorization/reservationAccess.js";

const Reservation = db.reservation;
const Driver = db.driver;
const Destination = db.destination;
const Vehicle = db.vehicle;

const exports = {};

function reservationPayload(row) {
  return {
    id: row.id,
    requestorUserId: row.requestorUserId,
    partyName: row.partyName,
    driverId: row.driverId,
    destinationId: row.destinationId,
    startAt: row.startAt,
    endAt: row.endAt,
    passengerCount: row.passengerCount,
    noteType: row.noteType,
    noteText: row.noteText,
    status: row.status,
    vehicleId: row.vehicleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function optionalText(value, max, label) {
  if (value == null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${label} must be text.` };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return { value: null };
  }

  if (trimmed.length > max) {
    return { error: `${label} must be ${max} characters or fewer.` };
  }

  return { value: trimmed };
}

function parsePositiveInt(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

async function readTrip(body) {
  const driverId = parsePositiveInt(body?.driverId);
  const driver = driverId ? await Driver.findByPk(driverId) : null;

  if (!driver || driver.status !== "approved") {
    return { error: { status: 400, message: "Driver must be on the approved drivers list." } };
  }

  const destinationId = parsePositiveInt(body?.destinationId);
  const destination = destinationId ? await Destination.findByPk(destinationId) : null;

  if (!destination) {
    return { error: { status: 400, message: "Destination is required." } };
  }

  const startAt = new Date(body?.startAt);
  const endAt = new Date(body?.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return { error: { status: 400, message: "End must be after start." } };
  }

  const passengerCount = parsePositiveInt(body?.passengerCount);

  if (!passengerCount) {
    return { error: { status: 400, message: "Number of people must be at least 1." } };
  }

  const partyName = optionalText(body?.partyName, 100, "Party name");
  const noteType = optionalText(body?.noteType, 50, "Note type");
  const noteText = optionalText(body?.noteText, 2000, "Note");
  const textError = partyName.error || noteType.error || noteText.error;

  if (textError) {
    return { error: { status: 400, message: textError } };
  }

  return {
    value: {
      driverId,
      destinationId,
      startAt,
      endAt,
      passengerCount,
      partyName: partyName.value,
      noteType: noteType.value,
      noteText: noteText.value,
    },
  };
}

function reservationId(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).send({ message: "Reservation id must be a number." });
    return null;
  }

  return id;
}

exports.findAll = async (req, res) => {
  const where = req.user.role === "admin" ? {} : { requestorUserId: req.user.id };

  if (typeof req.query.status === "string" && req.query.status) {
    where.status = req.query.status;
  }

  const rows = await Reservation.findAll({
    where,
    order: [
      ["startAt", "ASC"],
      ["id", "ASC"],
    ],
  });

  return res.status(200).send(rows.map(reservationPayload));
};

exports.findOne = async (req, res) => {
  const id = reservationId(req, res);

  if (id == null) {
    return undefined;
  }

  const row = await getAccessibleReservationOrNull(req, id);

  if (!row) {
    return res.status(404).send({ message: `Reservation with id=${id} not found.` });
  }

  return res.status(200).send(reservationPayload(row));
};

exports.create = async (req, res) => {
  const trip = await readTrip(req.body);

  if (trip.error) {
    return res.status(trip.error.status).send({ message: trip.error.message });
  }

  try {
    const row = await Reservation.create({
      ...trip.value,
      requestorUserId: req.user.id,
      status: "requested",
      vehicleId: null,
    });

    return res.status(201).send(reservationPayload(row));
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: "Unable to save the reservation." });
  }
};

exports.update = async (req, res) => {
  const id = reservationId(req, res);

  if (id == null) {
    return undefined;
  }

  const row = await getAccessibleReservationOrNull(req, id);

  if (!row || row.requestorUserId !== req.user.id) {
    return res.status(404).send({ message: `Reservation with id=${id} not found.` });
  }

  if (row.status !== "requested") {
    return res.status(400).send({ message: "Only requested reservations can be updated." });
  }

  const trip = await readTrip(req.body);

  if (trip.error) {
    return res.status(trip.error.status).send({ message: trip.error.message });
  }

  try {
    await row.update(trip.value);
    return res.status(200).send(reservationPayload(row));
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: "Unable to save the reservation." });
  }
};

exports.assign = async (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(req.body ?? {}, "vehicleId")) {
    return res.status(400).send({ message: "vehicleId is required." });
  }

  const id = reservationId(req, res);

  if (id == null) {
    return undefined;
  }

  const row = await getAccessibleReservationOrNull(req, id);

  if (!row) {
    return res.status(404).send({ message: `Reservation with id=${id} not found.` });
  }

  if (req.body.vehicleId === null) {
    await row.update({ status: "awaiting_vehicle", vehicleId: null });
    return res.status(200).send(reservationPayload(row));
  }

  const vehicleId = Number(req.body.vehicleId);

  if (!Number.isInteger(vehicleId)) {
    return res.status(400).send({ message: "vehicleId must be a number or null." });
  }

  const vehicle = await Vehicle.findByPk(vehicleId);

  if (!vehicle) {
    return res.status(404).send({ message: `Vehicle with id=${vehicleId} not found.` });
  }

  const conflict = await Reservation.findOne({
    where: {
      vehicleId,
      status: "reserved",
      id: { [Op.ne]: row.id },
      startAt: { [Op.lt]: row.endAt },
      endAt: { [Op.gt]: row.startAt },
    },
  });

  if (conflict) {
    return res.status(409).send({ message: "Vehicle is not available for this time." });
  }

  await row.update({ status: "reserved", vehicleId });
  return res.status(200).send(reservationPayload(row));
};

exports.listDrivers = async (_req, res) => {
  const rows = await Driver.findAll({
    where: { status: "approved" },
    order: [["name", "ASC"]],
  });

  return res.status(200).send(rows.map((row) => ({ id: row.id, name: row.name, status: row.status })));
};

exports.listDestinations = async (_req, res) => {
  const rows = await Destination.findAll({ order: [["name", "ASC"]] });

  return res.status(200).send(rows.map((row) => ({ id: row.id, name: row.name })));
};

export default exports;
