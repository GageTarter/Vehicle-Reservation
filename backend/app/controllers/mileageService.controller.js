import db from "../models/index.js";
import logger from "../config/logger.js";

const Vehicle = db.vehicle;
const MileageLog = db.mileageLog;
const ServiceLog = db.serviceLog;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const controller = {};

function canManage(user) {
  return ["maintenance", "area_admin", "system_admin"].includes(user.role);
}

function canAccessVehicle(user, vehicle) {
  if (user.role === "system_admin") {
    return true;
  }

  if (["maintenance", "area_admin"].includes(user.role)) {
    return vehicle.area_id === user.area_id;
  }

  return false;
}

function toMileageJson(row) {
  return {
    mileage_log_id: row.mileage_log_id,
    vehicle_id: row.vehicle_id,
    date_recorded: row.date_recorded,
    current_mileage: row.current_mileage,
  };
}

function toServiceJson(row) {
  return {
    service_log_id: row.service_log_id,
    vehicle_id: row.vehicle_id,
    service_date: row.service_date,
    service_performed: row.service_performed,
  };
}

async function loadVehicleOrError(req, res, vehicleId) {
  if (Number.isNaN(vehicleId)) {
    res.status(400).send({ message: "A valid vehicle id is required." });
    return null;
  }

  const vehicle = await Vehicle.findByPk(vehicleId);

  if (!vehicle) {
    res.status(404).send({ message: `Vehicle with id=${vehicleId} not found.` });
    return null;
  }

  if (!canAccessVehicle(req.user, vehicle)) {
    res.status(403).send({ message: "You cannot access records for this vehicle." });
    return null;
  }

  return vehicle;
}

controller.listMileage = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).send({ message: "You cannot view mileage records." });
    }

    const vehicle = await loadVehicleOrError(req, res, parseInt(req.params.id, 10));
    if (!vehicle) {
      return undefined;
    }

    const rows = await MileageLog.findAll({
      where: { vehicle_id: vehicle.id },
      order: [
        ["date_recorded", "DESC"],
        ["mileage_log_id", "DESC"],
      ],
    });

    return res.status(200).send(rows.map(toMileageJson));
  } catch (error) {
    logger.error(`Failed to list mileage records: ${error.message}`);
    return res.status(500).send({ message: "Unable to load mileage records." });
  }
};

controller.createMileage = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).send({ message: "You cannot record mileage." });
    }

    const vehicle = await loadVehicleOrError(req, res, parseInt(req.params.id, 10));
    if (!vehicle) {
      return undefined;
    }

    const dateRecorded = req.body.date_recorded?.trim();
    const mileageRaw = req.body.current_mileage;

    if (mileageRaw === undefined || mileageRaw === null || mileageRaw === "") {
      return res.status(400).send({ message: "Current mileage is required." });
    }

    const currentMileage = Number(mileageRaw);

    if (!Number.isFinite(currentMileage) || currentMileage < 0) {
      return res.status(400).send({ message: "Mileage must be a non-negative number." });
    }

    if (!DATE_ONLY.test(dateRecorded || "")) {
      return res.status(400).send({ message: "A valid date_recorded is required." });
    }

    const created = await MileageLog.create({
      vehicle_id: vehicle.id,
      date_recorded: dateRecorded,
      current_mileage: currentMileage,
    });

    return res.status(201).send({
      message: "Mileage record created successfully.",
      mileage_log: toMileageJson(created),
    });
  } catch (error) {
    logger.error(`Failed to create mileage record: ${error.message}`);
    return res.status(500).send({ message: "Unable to create the mileage record." });
  }
};

controller.listService = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).send({ message: "You cannot view service records." });
    }

    const vehicle = await loadVehicleOrError(req, res, parseInt(req.params.id, 10));
    if (!vehicle) {
      return undefined;
    }

    const rows = await ServiceLog.findAll({
      where: { vehicle_id: vehicle.id },
      order: [
        ["service_date", "DESC"],
        ["service_log_id", "DESC"],
      ],
    });

    return res.status(200).send(rows.map(toServiceJson));
  } catch (error) {
    logger.error(`Failed to list service records: ${error.message}`);
    return res.status(500).send({ message: "Unable to load service records." });
  }
};

controller.createService = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).send({ message: "You cannot record a service." });
    }

    const vehicle = await loadVehicleOrError(req, res, parseInt(req.params.id, 10));
    if (!vehicle) {
      return undefined;
    }

    const serviceDate = req.body.service_date?.trim();
    const servicePerformed = req.body.service_performed?.trim();

    if (!DATE_ONLY.test(serviceDate || "")) {
      return res.status(400).send({ message: "A valid service_date is required." });
    }

    if (!servicePerformed) {
      return res.status(400).send({ message: "Service description is required." });
    }

    const created = await ServiceLog.create({
      vehicle_id: vehicle.id,
      service_date: serviceDate,
      service_performed: servicePerformed,
    });

    return res.status(201).send({
      message: "Service record created successfully.",
      service_log: toServiceJson(created),
    });
  } catch (error) {
    logger.error(`Failed to create service record: ${error.message}`);
    return res.status(500).send({ message: "Unable to create the service record." });
  }
};

controller.findMileage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid mileage log id is required." });
    }

    const row = await MileageLog.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!row) {
      return res.status(404).send({ message: `Mileage log with id=${id} not found.` });
    }

    if (!canAccessVehicle(req.user, row.vehicle)) {
      return res.status(403).send({ message: "You cannot access this mileage record." });
    }

    return res.status(200).send({ mileage_log: toMileageJson(row) });
  } catch (error) {
    logger.error(`Failed to load mileage record: ${error.message}`);
    return res.status(500).send({ message: "Unable to load this mileage record." });
  }
};

controller.findService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "A valid service log id is required." });
    }

    const row = await ServiceLog.findByPk(id, {
      include: [{ model: Vehicle, required: true }],
    });

    if (!row) {
      return res.status(404).send({ message: `Service log with id=${id} not found.` });
    }

    if (!canAccessVehicle(req.user, row.vehicle)) {
      return res.status(403).send({ message: "You cannot access this service record." });
    }

    return res.status(200).send({ service_log: toServiceJson(row) });
  } catch (error) {
    logger.error(`Failed to load service record: ${error.message}`);
    return res.status(500).send({ message: "Unable to load this service record." });
  }
};

export default controller;
