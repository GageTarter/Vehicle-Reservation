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

  const user = session.user;
  req.user = {
    id: user.id,
    role: user.role,
    area_id: user.area_id,
    email: user.email,
  };

  return next();
}
