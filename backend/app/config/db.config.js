import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

if (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === "test") {
  dotenv.config({ path: path.join(backendRoot, ".env.test"), override: true });
  process.env.NODE_ENV = "test";
} else {
  dotenv.config();
}

const dbConfig = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PW || "",
  DB: process.env.DB_NAME || "speckit-db",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default dbConfig;
