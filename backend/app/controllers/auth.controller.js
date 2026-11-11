import jwt from "jsonwebtoken";
import { Op, UniqueConstraintError } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";
import { verifyGoogleIdToken } from "../authorization/googleToken.js";

const User = db.user;
const Session = db.session;
const SESSION_MS = 24 * 60 * 60 * 1000;

const exports = {};

function sessionPayload(user, token) {
  return {
    userId: user.id,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
    token,
  };
}

async function getOrCreateSession(user) {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gt]: new Date() },
    },
  });

  if (existing) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await Session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_MS),
    userId: user.id,
  });

  return token;
}

exports.googleAuth = async (req, res) => {
  const idToken = req.body?.idToken;

  if (typeof idToken !== "string" || idToken.trim() === "") {
    return res.status(401).send({ message: "Google sign-in failed." });
  }

  let payload;

  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch (error) {
    logger.warn(`Google token verification failed: ${error.message}`);
    return res.status(401).send({ message: "Google sign-in failed." });
  }

  if (payload.email_verified !== true || typeof payload.sub !== "string" || typeof payload.email !== "string") {
    return res.status(401).send({ message: "Google sign-in failed." });
  }

  try {
    let user = await User.findOne({ where: { googleId: payload.sub } });
    let created = false;

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        fName: typeof payload.given_name === "string" ? payload.given_name : "",
        lName: typeof payload.family_name === "string" ? payload.family_name : "",
        role: "user",
      });
      created = true;
    }

    const token = await getOrCreateSession(user);
    return res.status(created ? 201 : 200).send(sessionPayload(user, token));
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      logger.warn(`Google sign-in conflict: ${error.message}`);
      return res.status(401).send({ message: "Google sign-in failed." });
    }

    logger.error(`Google sign-in error: ${error.message}`);
    throw error;
  }
};

exports.logout = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (token) {
    await Session.destroy({ where: { token, userId: req.user.id } });
  }

  return res.status(200).send({ message: "Signed out." });
};

export default exports;
