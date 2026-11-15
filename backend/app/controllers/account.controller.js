import db from "../models/index.js";

const User = db.user;
const Session = db.session;

const exports = {};

function accountPayload(user) {
  return {
    userId: user.id,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
  };
}

function namesAreText(body) {
  return typeof body?.fName === "string" && typeof body?.lName === "string";
}

exports.findMe = async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  return res.status(200).send(accountPayload(user));
};

exports.updateMe = async (req, res) => {
  if (!namesAreText(req.body)) {
    return res.status(400).send({ message: "First and last name must be text." });
  }

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  await user.update({ fName: req.body.fName, lName: req.body.lName });
  return res.status(200).send(accountPayload(user));
};

exports.deleteMe = async (req, res) => {
  await Session.destroy({ where: { userId: req.user.id } });
  await User.destroy({ where: { id: req.user.id } });
  return res.status(200).send({ message: "Account deleted." });
};

export default exports;
