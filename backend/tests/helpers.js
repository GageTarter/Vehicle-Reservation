import db from "../app/models/index.js";

/** Sync schema for tests (no models registered in the starter shell). */
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

/**
 * Add feature-specific helpers here as you implement auth/lists/etc.
 * Example after Feature 1:
 *   export const registerUser = async (overrides = {}) => { … }
 */
