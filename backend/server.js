import routes from "./app/routes/index.js";
import mileageServiceRoutes from "./app/routes/mileageService.routes.js";
import issueRoutes from "./app/routes/issue.routes.js";
import authRoutes from "./app/routes/auth.routes.js";
import accountRoutes from "./app/routes/account.routes.js";
import vehicleRoutes from "./app/routes/vehicle.routes.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import db from "./app/models/index.js";
import logger from "./app/config/logger.js";

const shouldAlterSchema =
  process.env.SEQUELIZE_SYNC_ALTER === "true" ||
  process.env.SEQUELIZE_SYNC_ALTER === "1" ||
  (process.env.NODE_ENV === "development" && process.env.SEQUELIZE_SYNC_ALTER !== "false");

const syncOptions = shouldAlterSchema ? { alter: true } : {};

async function dropExtraUniqueIndexes() {
  const [tables] = await db.sequelize.query("SHOW TABLES");
  const hasUsers = tables.some((row) => Object.values(row)[0] === "users");

  if (!hasUsers) {
    return;
  }

  const [indexes] = await db.sequelize.query("SHOW INDEX FROM `users`");
  const seen = new Set();
  const extraName = /^(googleId|email)(_\d+)?$/;

  for (const index of indexes) {
    if (
      index.Non_unique !== 0 ||
      index.Key_name === "PRIMARY" ||
      seen.has(index.Key_name) ||
      !extraName.test(index.Key_name)
    ) {
      continue;
    }

    seen.add(index.Key_name);
    await db.sequelize.query(`ALTER TABLE \`users\` DROP INDEX \`${index.Key_name}\``);
  }
}

if (process.env.NODE_ENV !== "test") {
  db.sequelize
    .query("SET FOREIGN_KEY_CHECKS = 0")
    .then(() => dropExtraUniqueIndexes())
    .then(() => db.sequelize.sync(syncOptions))
    .then(() => db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1"))
    .then(() => {
      if (syncOptions.alter) {
        logger.info("Database sync completed with alter: true.");
      }
    })
    .catch((err) => {
      logger.error(`Database sync failed: ${err.message}`);
      process.exit(1);
    });
}

const app = express();

app.use(morgan("combined", { stream: logger.stream }));

app.use(
  cors({
    origin: "http://localhost:8082",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/vehicles", authRoutes);
app.use("/vehicles", accountRoutes);
app.use("/fleets", vehicleRoutes);
app.use("/api", routes);
app.use("/vehicleapi", issueRoutes);
app.use("/api/vehicleapi", issueRoutes);
app.use("/vehicleapi", mileageServiceRoutes);
app.use("/api/vehicleapi", mileageServiceRoutes);

const PORT = process.env.PORT || 3200;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Speckit App API running on port ${PORT}`);
  });
}

export { logger };
export default app;
