import { UniqueConstraintError } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { toAreaJson, validateArea } from "./area.validation.js";

const Area = db.area;
const exports = {};

function parseAreaId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || String(value).trim() === "" || id < 1) {
    return null;
  }

  return id;
}

exports.findAll = async (_req, res) => {
  try {
    const rows = await Area.findAll({
      order: [["name", "ASC"]],
    });

    return res.send(rows.map(toAreaJson));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to fetch areas." });
  }
};

exports.create = async (req, res) => {
  const result = validateArea(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const created = await Area.create(result.value);

    return res.status(201).send(toAreaJson(created));
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "Area name is in use. Enter a different area name." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to create the area." });
  }
};

exports.update = async (req, res) => {
  const id = parseAreaId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "Area id must be a number." });
  }

  const result = validateArea(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const row = await Area.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "Area not found." });
    }

    await row.update(result.value);

    return res.send({ message: "Area was updated successfully." });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).send({ message: "Area name is in use. Enter a different area name." });
    }

    logger.error(error.message);
    return res.status(500).send({ message: "Failed to update the area." });
  }
};

exports.destroy = async (req, res) => {
  const id = parseAreaId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "Area id must be a number." });
  }

  try {
    const row = await Area.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "Area not found." });
    }

    await row.destroy();

    return res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to delete the area." });
  }
};

export default exports;
