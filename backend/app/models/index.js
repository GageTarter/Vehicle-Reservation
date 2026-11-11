import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import vehicleModel from "./vehicle.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.vehicle, { foreignKey: "userId", onDelete: "CASCADE" });
db.vehicle.belongsTo(db.user, { foreignKey: "userId" });

export default db;
