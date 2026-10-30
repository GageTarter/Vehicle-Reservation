import db from "../models/index.js";

const User = db.user;
const Session = db.session;

function bearerToken(req) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

export async function authenticate(req, res, next) {
  const token = bearerToken(req);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const session = await Session.findOne({
    where: { token },
    include: [{ model: User }],
  });
  const expired = !session || new Date(session.expirationDate).getTime() < Date.now();

  if (expired || !session.user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = { id: session.user.id, role: session.user.role };
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden! Admin access required." });
  }

  return next();
}
