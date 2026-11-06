import db from "../models/index.js";

const User = db.user;
const Session = db.session;

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const session = await Session.findOne({
    where: { token },
    include: [{ model: User }],
  });

  if (!session || !session.user || new Date(session.expirationDate) < new Date()) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = {
    id: session.user.id,
    role: session.user.role,
    area_id: session.user.area_id,
    email: session.user.email,
  };

  return next();
}
