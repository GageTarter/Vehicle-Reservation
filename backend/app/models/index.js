import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import vehicleModel from "./vehicle.model.js";
import reservationModel from "./reservation.model.js";
import vehicleIssueModel from "./vehicleIssue.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.reservation = reservationModel(sequelize, Sequelize);
db.vehicleIssue = vehicleIssueModel(sequelize, Sequelize);

const assoc = { constraints: false };

db.user.hasMany(db.session, { foreignKey: "userId", ...assoc });
db.session.belongsTo(db.user, { foreignKey: "userId", ...assoc });

db.vehicle.hasMany(db.reservation, { foreignKey: "vehicle_id", ...assoc });
db.reservation.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.user.hasMany(db.reservation, { foreignKey: "requester_id", ...assoc });
db.reservation.belongsTo(db.user, { foreignKey: "requester_id", ...assoc });

db.vehicle.hasMany(db.vehicleIssue, { foreignKey: "vehicle_id", ...assoc });
db.vehicleIssue.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.reservation.hasMany(db.vehicleIssue, { foreignKey: "reservation_id", ...assoc });
db.vehicleIssue.belongsTo(db.reservation, { foreignKey: "reservation_id", ...assoc });

db.user.hasMany(db.vehicleIssue, { foreignKey: "reported_by", ...assoc });
db.vehicleIssue.belongsTo(db.user, { foreignKey: "reported_by", ...assoc });

export default db;
