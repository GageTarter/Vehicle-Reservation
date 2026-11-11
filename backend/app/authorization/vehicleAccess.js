import db from "../models/index.js";

const Vehicle = () => db.vehicle;

export async function getAccessibleVehicleOrNull(req, vehicleId) {
  const row = await Vehicle().findOne({
    where: { id: vehicleId, userId: req.user.id },
  });

  return row ?? null;
}
