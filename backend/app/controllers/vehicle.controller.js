import { UniqueConstraintError } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleVehicleOrNull } from "../authorization/vehicleAccess.js";
import { toVehicleJson, validateVehicle } from "./vehicle.validation.js";

const Vehicle = db.vehicle;
const exports = {};

function parseVehicleId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || String(value).trim() === "" || id < 1) {
    return null;
  }

  return id;
}

exports.findAll = async (req, res) => {
  try {
    const rows = await Vehicle.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"]],
    });

    return res.send(rows.map(toVehicleJson));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to fetch vehicles." });
  }
};

exports.create = async (req, res) => {
  const result = validateVehicle(req.body, "create");

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const created = await Vehicle.create({ ...result.value, userId: req.user.id });

    return res.status(201).send(toVehicleJson(created));
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "A vehicle with that year, make, and model already exists." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to create the vehicle." });
  }
};

exports.update = async (req, res) => {
  const id = parseVehicleId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "vehicleId must be a number." });
  }

  const result = validateVehicle(req.body, "edit");

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const row = await getAccessibleVehicleOrNull(req, id);

    if (!row) {
      return res.status(404).send({ message: `Vehicle with id=${id} not found.` });
    }

    await row.update(result.value);

    return res.send({ message: "vehicle was updated successfully." });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "A vehicle with that year, make, and model already exists." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to update the vehicle." });
  }
};

exports.destroy = async (req, res) => {
  const id = parseVehicleId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "vehicleId must be a number." });
  }

  try {
    const row = await getAccessibleVehicleOrNull(req, id);

    if (!row) {
      return res.status(404).send({ message: `Vehicle with id=${id} not found.` });
    }

    await row.destroy();

    return res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to delete the vehicle." });
  }
};

export default exports;
