import path from "path";
import { pathToFileURL } from "url";
import dotenv from "dotenv";
import db from "../models/index.js";
import logger from "../config/logger.js";

dotenv.config();

const User = db.user;

export async function seedAdmin(options = {}) {
  const googleId = options.googleId || process.env.ADMIN_GOOGLE_ID;
  const email = options.email || process.env.ADMIN_EMAIL;
  const fName = options.fName ?? process.env.ADMIN_FNAME ?? "Admin";
  const lName = options.lName ?? process.env.ADMIN_LNAME ?? "";

  if (!googleId || !email) {
    throw new Error("ADMIN_GOOGLE_ID and ADMIN_EMAIL are required.");
  }

  const [user, created] = await User.findOrCreate({
    where: { googleId },
    defaults: {
      email,
      fName,
      lName,
      role: "admin",
    },
  });

  if (!created && user.role !== "admin") {
    await user.update({ role: "admin" });
  }

  return user;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  seedAdmin()
    .then((user) => {
      logger.info(`Admin ready for ${user.email} (${user.googleId}).`);
      return db.sequelize.close();
    })
    .catch(async (error) => {
      logger.error(error.message);
      await db.sequelize.close();
      process.exit(1);
    });
}
