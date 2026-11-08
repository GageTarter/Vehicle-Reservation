import db from "../app/models/index.js";

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
