import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import vehicleModel from "./vehicle.model.js";
import reservationModel from "./reservation.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.reservation = reservationModel(sequelize, Sequelize);

const assoc = { constraints: false };

db.user.hasMany(db.session, { foreignKey: "userId", ...assoc });
db.session.belongsTo(db.user, { foreignKey: "userId", ...assoc });

db.vehicle.hasMany(db.reservation, { foreignKey: "vehicle_id", ...assoc });
db.reservation.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.user.hasMany(db.reservation, { foreignKey: "requester_id", ...assoc });
db.reservation.belongsTo(db.user, { foreignKey: "requester_id", ...assoc });

export default db;
