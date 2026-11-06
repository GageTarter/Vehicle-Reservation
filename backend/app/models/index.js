import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import areaModel from "./area.model.js";
import vehicleModel from "./vehicle.model.js";
import reservationModel from "./reservation.model.js";
import areaInstructionModel from "./areaInstruction.model.js";
import emailNotificationModel from "./emailNotification.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.area = areaModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.reservation = reservationModel(sequelize, Sequelize);
db.areaInstruction = areaInstructionModel(sequelize, Sequelize);
db.emailNotification = emailNotificationModel(sequelize, Sequelize);

const assoc = { constraints: false };

db.user.hasMany(db.session, { foreignKey: "userId", ...assoc });
db.session.belongsTo(db.user, { foreignKey: "userId", ...assoc });

db.area.hasMany(db.vehicle, { foreignKey: "area_id", ...assoc });
db.vehicle.belongsTo(db.area, { foreignKey: "area_id", ...assoc });

db.area.hasOne(db.areaInstruction, { foreignKey: "area_id", ...assoc });
db.areaInstruction.belongsTo(db.area, { foreignKey: "area_id", ...assoc });

db.user.hasMany(db.reservation, {
  foreignKey: "requester_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  ...assoc,
});
db.reservation.belongsTo(db.user, {
  foreignKey: "requester_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  ...assoc,
});

db.vehicle.hasMany(db.reservation, { foreignKey: "vehicle_id", ...assoc });
db.reservation.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.reservation.hasMany(db.emailNotification, { foreignKey: "reservation_id", ...assoc });
db.emailNotification.belongsTo(db.reservation, { foreignKey: "reservation_id", ...assoc });

export default db;
