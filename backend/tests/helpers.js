import db from "../app/models/index.js";

export function kitVehicleFields(overrides = {}) {
  return {
    userId: 1,
    name: `Test Vehicle ${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    make: "Toyota",
    model: "Camry",
    year: "2020",
    vin: "1HGCM82633A004352",
    purchaseDate: "2020-01-01",
    color: "Blue",
    passengerCapacity: 5,
    licensePlateNo: "ABC1234",
    licensePlateExp: "2027-01-01",
    area: "Athletics",
    area_id: 1,
    ...overrides,
  };
}

export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await db.sequelize.query("SHOW TABLES");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    await db.sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
  await db.sequelize.sync();
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};
