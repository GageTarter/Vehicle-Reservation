import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  canMarkReturned,
  isAreaAdmin,
  isRequestor,
  isSystemAdmin,
} from "../authorization/kitRoles.js";

const Reservation = db.reservation;
const Vehicle = db.vehicle;
const User = db.user;

const controller = {};

function toReservationJson(reservation) {
  const vehicle = reservation.vehicle;

  return {
    reservation_id: reservation.id,
    requester_id: reservation.requester_id,
    vehicle_id: reservation.vehicle_id,
    vehicle_name: vehicle?.name ?? null,
    requester_name: reservation.user
      ? `${reservation.user.fName} ${reservation.user.lName}`.trim()
      : null,
    status: reservation.status,
    start_datetime: reservation.start_datetime,
    end_datetime: reservation.end_datetime,
    checkout_datetime: reservation.checkout_datetime,
    return_datetime: reservation.return_datetime,
  };
}

function canAccessReservation(user, reservation) {
  if (isSystemAdmin(user)) {
    return true;
  }

  if (isAreaAdmin(user)) {
    return reservation.vehicle?.area_id === user.area_id;
  }

  return isRequestor(user) && reservation.requester_id === user.id;
}

async function loadReservation(id) {
  return Reservation.findByPk(id, {
    include: [
      { model: Vehicle, required: false },
      { model: User, required: false },
    ],
  });
}

controller.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid reservation id is required." });
    }

    const reservation = await loadReservation(id);

    if (!reservation) {
      return res.status(404).send({ message: `Reservation with id=${id} not found.` });
    }

    if (!canAccessReservation(req.user, reservation)) {
      return res.status(403).send({ message: "You cannot access this reservation." });
    }

    return res.status(200).send({ reservation: toReservationJson(reservation) });
  } catch (error) {
    logger.error(`Failed to load checkout information: ${error.message}`);
    return res.status(500).send({ message: "Unable to load checkout information." });
  }
};

controller.checkout = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid reservation id is required." });
    }

    const reservation = await loadReservation(id);

    if (!reservation) {
      return res.status(404).send({ message: `Reservation with id=${id} not found.` });
    }

    if (reservation.requester_id !== req.user.id) {
      return res.status(403).send({ message: "You cannot check out another user's reservation." });
    }

    if (!reservation.vehicle_id) {
      return res.status(409).send({
        message: "A vehicle must be assigned before checkout.",
      });
    }

    if (reservation.status === "Checked Out") {
      return res.status(409).send({ message: "This reservation is already checked out." });
    }

    if (reservation.status !== "Assigned") {
      return res.status(409).send({ message: "Only an assigned reservation can be checked out." });
    }

    const checkoutDatetime = new Date();
    await reservation.update({
      status: "Checked Out",
      checkout_datetime: checkoutDatetime,
    });

    return res.status(200).send({
      message: "Vehicle checkout recorded successfully.",
      reservation: toReservationJson(reservation),
    });
  } catch (error) {
    logger.error(`Failed to record vehicle checkout: ${error.message}`);
    return res.status(500).send({ message: "Unable to record vehicle checkout." });
  }
};

controller.returnVehicle = async (req, res) => {
  try {
    if (!canMarkReturned(req.user)) {
      return res.status(403).send({
        message: "You are not allowed to mark a vehicle as returned.",
      });
    }

    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid reservation id is required." });
    }

    const reservation = await loadReservation(id);

    if (!reservation) {
      return res.status(404).send({ message: `Reservation with id=${id} not found.` });
    }

    if (!canAccessReservation(req.user, reservation)) {
      return res.status(403).send({ message: "You cannot return a vehicle outside your area." });
    }

    if (reservation.status === "Returned") {
      return res.status(409).send({ message: "This reservation is already returned." });
    }

    if (reservation.status !== "Checked Out") {
      return res.status(409).send({
        message: "A vehicle must be checked out before it can be returned.",
      });
    }

    await reservation.update({
      status: "Returned",
      return_datetime: new Date(),
    });

    return res.status(200).send({
      message: "Vehicle return recorded successfully.",
      reservation: toReservationJson(reservation),
    });
  } catch (error) {
    logger.error(`Failed to record vehicle return: ${error.message}`);
    return res.status(500).send({ message: "Unable to record vehicle return." });
  }
};

controller.findStatus = async (req, res) => {
  try {
    if (!canMarkReturned(req.user)) {
      return res.status(403).send({
        message: "You are not allowed to view checkout and return statuses.",
      });
    }

    const reservations = await Reservation.findAll({
      include: [
        { model: Vehicle, required: false },
        { model: User, required: false },
      ],
      order: [["id", "ASC"]],
    });

    const visible = reservations.filter((reservation) =>
      canAccessReservation(req.user, reservation)
    );

    return res.status(200).send(visible.map(toReservationJson));
  } catch (error) {
    logger.error(`Failed to list checkout statuses: ${error.message}`);
    return res.status(500).send({ message: "Unable to load checkout and return statuses." });
  }
};

export default controller;
