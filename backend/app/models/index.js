import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import vehicleModel from "./vehicle.model.js";
import reservationModel from "./reservation.model.js";
import vehicleIssueModel from "./vehicleIssue.model.js";
import maintenanceRequestModel from "./maintenanceRequest.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.reservation = reservationModel(sequelize, Sequelize);
db.vehicleIssue = vehicleIssueModel(sequelize, Sequelize);
db.maintenanceRequest = maintenanceRequestModel(sequelize, Sequelize);

const assoc = { constraints: false };

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.vehicle, { foreignKey: "userId", onDelete: "CASCADE" });
db.vehicle.belongsTo(db.user, { foreignKey: "userId" });

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

db.vehicle.hasMany(db.maintenanceRequest, { foreignKey: "vehicle_id", ...assoc });
db.maintenanceRequest.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.vehicleIssue.hasMany(db.maintenanceRequest, { foreignKey: "issue_id", ...assoc });
db.maintenanceRequest.belongsTo(db.vehicleIssue, { foreignKey: "issue_id", ...assoc });

export default db;
