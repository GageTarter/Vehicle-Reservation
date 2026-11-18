import { UniqueConstraintError } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { toDestinationJson, validateDestination } from "./destination.validation.js";

const Destination = db.destination;
const exports = {};

function parseDestinationId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || String(value).trim() === "" || id < 1) {
    return null;
  }

  return id;
}

exports.findAll = async (_req, res) => {
  try {
    const rows = await Destination.findAll({
      order: [["name", "ASC"]],
    });

    return res.send(rows.map(toDestinationJson));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to fetch destinations." });
  }
};

exports.create = async (req, res) => {
  const result = validateDestination(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const created = await Destination.create(result.value);

    return res.status(201).send(toDestinationJson(created));
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "destination name is in use. Enter a different destination name." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to create the destination." });
  }
};

exports.update = async (req, res) => {
  const id = parseDestinationId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "destination id must be a number." });
  }

  const result = validateDestination(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const row = await Destination.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "destination not found." });
    }

    await row.update(result.value);

    return res.send({ message: "destination was updated successfully." });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "destination name is in use. Enter a different destination name." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to update the destination." });
  }
};

exports.destroy = async (req, res) => {
  const id = parseDestinationId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "destination id must be a number." });
  }

  try {
    const row = await Destination.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "destination not found." });
    }

    await row.destroy();

    return res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to delete the destination." });
  }
};

export default exports;
