import db from "../models/index.js";
import logger from "../config/logger.js";

const Vehicle = db.vehicle;
const Reservation = db.reservation;
const VehicleIssue = db.vehicleIssue;

const ISSUE_TYPES = new Set(["Low Gas", "Dirty Vehicle", "Maintenance Needed"]);
const STATUSES = new Set(["Open", "In Progress", "Resolved"]);

const controller = {};

function toIssueJson(issue) {
  return {
    issue_id: issue.issue_id,
    vehicle_id: issue.vehicle_id,
    reservation_id: issue.reservation_id ?? null,
    reported_by: issue.reported_by,
    issue_type: issue.issue_type,
    description: issue.description,
    reported_date: issue.reported_date,
    status: issue.status,
  };
}

function isSystemAdmin(user) {
  return user.role === "system_admin";
}

function isAreaAdmin(user) {
  return user.role === "area_admin";
}

function canManageStatus(user) {
  return isSystemAdmin(user) || isAreaAdmin(user);
}

function canAccessVehicle(user, vehicle) {
  if (isSystemAdmin(user)) {
    return true;
  }

  if (user.role === "area_admin" || user.role === "maintenance") {
    return vehicle.area_id === user.area_id;
  }

  return false;
}

function canAccessIssue(user, issue, vehicle) {
  if (canAccessVehicle(user, vehicle)) {
    return true;
  }

  return issue.reported_by === user.id;
}

controller.create = async (req, res) => {
  try {
    const vehicleId = parseInt(req.body.vehicle_id, 10);
    const issueType = req.body.issue_type?.trim();
    const description = req.body.description?.trim();
    const reservationIdRaw = req.body.reservation_id;

    if (!issueType || !description) {
      return res.status(400).send({
        message: "Issue type and description are required.",
      });
    }

    if (!ISSUE_TYPES.has(issueType)) {
      return res.status(400).send({ message: "Invalid issue type." });
    }

    if (Number.isNaN(vehicleId)) {
      return res.status(400).send({ message: "A valid vehicle_id is required." });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).send({ message: `Vehicle with id=${vehicleId} not found.` });
    }

    let reservationId = null;

    if (reservationIdRaw !== undefined && reservationIdRaw !== null && reservationIdRaw !== "") {
      reservationId = parseInt(reservationIdRaw, 10);

      if (Number.isNaN(reservationId)) {
        return res.status(400).send({ message: "A valid reservation_id is required." });
      }

      const reservation = await Reservation.findByPk(reservationId);

      if (!reservation) {
        return res.status(404).send({
          message: `Reservation with id=${reservationId} not found.`,
        });
      }

      if (reservation.requester_id !== req.user.id) {
        return res.status(403).send({
          message: "You cannot report an issue against another user's reservation.",
        });
      }

      if (reservation.vehicle_id && reservation.vehicle_id !== vehicleId) {
        return res.status(409).send({
          message: "The selected vehicle does not match this reservation.",
        });
      }
    }

    const issue = await VehicleIssue.create({
      vehicle_id: vehicleId,
      reservation_id: reservationId,
      reported_by: req.user.id,
      issue_type: issueType,
      description,
      reported_date: new Date(),
      status: "Open",
    });

    return res.status(201).send({
      message: "Vehicle issue reported successfully.",
      issue: toIssueJson(issue),
    });
  } catch (error) {
    logger.error(`Failed to report vehicle issue: ${error.message}`);
    return res.status(500).send({ message: "Unable to report the vehicle issue." });
  }
};

controller.findAll = async (req, res) => {
  try {
    const issues = await VehicleIssue.findAll({
      include: [{ model: Vehicle, required: true }],
      order: [["issue_id", "ASC"]],
    });

    const visible = issues.filter((issue) =>
      canAccessIssue(req.user, issue, issue.vehicle)
    );

    return res.status(200).send(visible.map(toIssueJson));
  } catch (error) {
    logger.error(`Failed to list vehicle issues: ${error.message}`);
    return res.status(500).send({ message: "Unable to load vehicle issues." });
  }
};

controller.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid issue id is required." });
    }

    const issue = await VehicleIssue.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!issue) {
      return res.status(404).send({ message: `Issue with id=${id} not found.` });
    }

    if (!canAccessIssue(req.user, issue, issue.vehicle)) {
      return res.status(403).send({
        message: "You cannot view issues outside your area.",
      });
    }

    return res.status(200).send({ issue: toIssueJson(issue) });
  } catch (error) {
    logger.error(`Failed to load vehicle issue: ${error.message}`);
    return res.status(500).send({ message: "Unable to load this vehicle issue." });
  }
};

controller.updateStatus = async (req, res) => {
  try {
    if (!canManageStatus(req.user)) {
      return res.status(403).send({
        message: "You are not allowed to update an issue status.",
      });
    }

    const id = parseInt(req.params.id, 10);
    const status = req.body.status?.trim();

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid issue id is required." });
    }

    if (!STATUSES.has(status)) {
      return res.status(400).send({ message: "Invalid issue status." });
    }

    const issue = await VehicleIssue.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!issue) {
      return res.status(404).send({ message: `Issue with id=${id} not found.` });
    }

    if (!canAccessVehicle(req.user, issue.vehicle)) {
      return res.status(403).send({
        message: "You cannot update issues outside your area.",
      });
    }

    await issue.update({ status });

    return res.status(200).send({
      message: "Vehicle issue status updated successfully.",
      issue: toIssueJson(issue),
    });
  } catch (error) {
    logger.error(`Failed to update vehicle issue status: ${error.message}`);
    return res.status(500).send({ message: "Unable to update issue status." });
  }
};

controller.findByVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);

    if (Number.isNaN(vehicleId)) {
      return res.status(400).send({ message: "A valid vehicle id is required." });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).send({ message: `Vehicle with id=${vehicleId} not found.` });
    }

    if (!canAccessVehicle(req.user, vehicle)) {
      return res.status(403).send({
        message: "You cannot view issues outside your area.",
      });
    }

    const issues = await VehicleIssue.findAll({
      where: { vehicle_id: vehicleId },
      order: [["issue_id", "ASC"]],
    });

    return res.status(200).send(issues.map(toIssueJson));
  } catch (error) {
    logger.error(`Failed to load vehicle issue history: ${error.message}`);
    return res.status(500).send({ message: "Unable to load vehicle issue history." });
  }
};

export default controller;
