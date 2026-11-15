import db from "../models/index.js";
import logger from "../config/logger.js";
import { toDriverJson, validateDriver } from "./driver.validation.js";

const Driver = db.driver;
const exports = {};

function parseDriverId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || String(value).trim() === "" || id < 1) {
    return null;
  }

  return id;
}

exports.findAll = async (_req, res) => {
  try {
    const rows = await Driver.findAll({
      order: [
        ["lastName", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.send(rows.map(toDriverJson));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to fetch drivers." });
  }
};

exports.create = async (req, res) => {
  const result = validateDriver(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const created = await Driver.create(result.value);

    return res.status(201).send(toDriverJson(created));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to create the driver." });
  }
};

exports.update = async (req, res) => {
  const id = parseDriverId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "driver id must be a number." });
  }

  const result = validateDriver(req.body);

  if (result.message) {
    return res.status(400).send({ message: result.message });
  }

  try {
    const row = await Driver.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "driver not found." });
    }

    await row.update(result.value);

    return res.send({ message: "driver was updated successfully." });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to update the driver." });
  }
};

exports.destroy = async (req, res) => {
  const id = parseDriverId(req.params.id);

  if (id === null) {
    return res.status(400).send({ message: "driver id must be a number." });
  }

  try {
    const row = await Driver.findByPk(id);

    if (!row) {
      return res.status(404).send({ message: "driver not found." });
    }

    await row.destroy();

    return res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Failed to delete the driver." });
  }
};

export default exports;
