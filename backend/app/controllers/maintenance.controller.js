import db from "../models/index.js";
import logger from "../config/logger.js";

const Vehicle = db.vehicle;
const VehicleIssue = db.vehicleIssue;
const MaintenanceRequest = db.maintenanceRequest;

const STATUSES = new Set(["Open", "In Progress", "Completed"]);

const controller = {};

function toJson(request) {
  return {
    maintenance_request_id: request.maintenance_request_id,
    vehicle_id: request.vehicle_id,
    issue_id: request.issue_id ?? null,
    description: request.description,
    status: request.status,
  };
}

function isSystemAdmin(user) {
  return user.role === "system_admin";
}

function canManageMaintenance(user) {
  return ["maintenance", "area_admin", "system_admin"].includes(user.role);
}

function canAccessVehicle(user, vehicle) {
  if (isSystemAdmin(user)) {
    return true;
  }

  if (["maintenance", "area_admin"].includes(user.role)) {
    return vehicle.area_id === user.area_id;
  }

  return false;
}

controller.findAll = async (req, res) => {
  try {
    if (!canManageMaintenance(req.user)) {
      return res.status(403).send({ message: "You cannot view maintenance requests." });
    }

    const requests = await MaintenanceRequest.findAll({
      include: [{ model: Vehicle, required: true }],
      order: [["maintenance_request_id", "ASC"]],
    });

    const visible = requests.filter((request) => canAccessVehicle(req.user, request.vehicle));
    return res.status(200).send(visible.map(toJson));
  } catch (error) {
    logger.error(`Failed to list maintenance requests: ${error.message}`);
    return res.status(500).send({ message: "Unable to load maintenance requests." });
  }
};

controller.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid maintenance request id is required." });
    }

    const request = await MaintenanceRequest.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!request) {
      return res.status(404).send({
        message: `Maintenance request with id=${id} not found.`,
      });
    }

    if (!canAccessVehicle(req.user, request.vehicle)) {
      return res.status(403).send({
        message: "You cannot view maintenance requests outside your area.",
      });
    }

    return res.status(200).send({ maintenance_request: toJson(request) });
  } catch (error) {
    logger.error(`Failed to load maintenance request: ${error.message}`);
    return res.status(500).send({ message: "Unable to load this maintenance request." });
  }
};

controller.create = async (req, res) => {
  try {
    if (!canManageMaintenance(req.user)) {
      return res.status(403).send({ message: "You cannot create a maintenance request." });
    }

    const vehicleId = parseInt(req.body.vehicle_id, 10);
    const description = req.body.description?.trim();
    const issueIdRaw = req.body.issue_id;

    if (Number.isNaN(vehicleId)) {
      return res.status(400).send({ message: "A valid vehicle_id is required." });
    }

    if (!description) {
      return res.status(400).send({ message: "Description is required." });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).send({ message: `Vehicle with id=${vehicleId} not found.` });
    }

    if (!canAccessVehicle(req.user, vehicle)) {
      return res.status(403).send({
        message: "You cannot create a maintenance request for this vehicle.",
      });
    }

    let issueId = null;

    if (issueIdRaw !== undefined && issueIdRaw !== null && issueIdRaw !== "") {
      issueId = parseInt(issueIdRaw, 10);

      if (Number.isNaN(issueId)) {
        return res.status(400).send({ message: "A valid issue_id is required." });
      }

      const issue = await VehicleIssue.findByPk(issueId);

      if (!issue) {
        return res.status(404).send({ message: `Issue with id=${issueId} not found.` });
      }

      if (issue.vehicle_id !== vehicleId) {
        return res.status(409).send({
          message: "The selected issue does not belong to the selected vehicle.",
        });
      }
    }

    const created = await MaintenanceRequest.create({
      vehicle_id: vehicleId,
      issue_id: issueId,
      description,
      status: "Open",
    });

    return res.status(201).send({
      message: "Maintenance request created successfully.",
      maintenance_request: toJson(created),
    });
  } catch (error) {
    logger.error(`Failed to create maintenance request: ${error.message}`);
    return res.status(500).send({ message: "Unable to create the maintenance request." });
  }
};

controller.updateStatus = async (req, res) => {
  try {
    if (!canManageMaintenance(req.user)) {
      return res.status(403).send({
        message: "You cannot update a maintenance request.",
      });
    }

    const id = parseInt(req.params.id, 10);
    const status = req.body.status?.trim();

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid maintenance request id is required." });
    }

    if (!STATUSES.has(status)) {
      return res.status(400).send({ message: "Invalid maintenance status." });
    }

    const request = await MaintenanceRequest.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!request) {
      return res.status(404).send({
        message: `Maintenance request with id=${id} not found.`,
      });
    }

    if (!canAccessVehicle(req.user, request.vehicle)) {
      return res.status(403).send({
        message: "You cannot update maintenance requests outside your area.",
      });
    }

    await request.update({ status });

    return res.status(200).send({
      message: "Maintenance request status updated successfully.",
      maintenance_request: toJson(request),
    });
  } catch (error) {
    logger.error(`Failed to update maintenance request: ${error.message}`);
    return res.status(500).send({ message: "Unable to update the maintenance request." });
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
        message: "You cannot view maintenance for this vehicle.",
      });
    }

    const requests = await MaintenanceRequest.findAll({
      where: { vehicle_id: vehicleId },
      order: [["maintenance_request_id", "ASC"]],
    });

    return res.status(200).send(requests.map(toJson));
  } catch (error) {
    logger.error(`Failed to load vehicle maintenance: ${error.message}`);
    return res.status(500).send({ message: "Unable to load vehicle maintenance information." });
  }
};

export default controller;
