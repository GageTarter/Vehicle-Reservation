import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import vehicleModel from "./vehicle.model.js";
import mileageLogModel from "./mileageLog.model.js";
import serviceLogModel from "./serviceLog.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.mileageLog = mileageLogModel(sequelize, Sequelize);
db.serviceLog = serviceLogModel(sequelize, Sequelize);

const assoc = { constraints: false };

db.user.hasMany(db.session, { foreignKey: "userId", ...assoc });
db.session.belongsTo(db.user, { foreignKey: "userId", ...assoc });

db.vehicle.hasMany(db.mileageLog, { foreignKey: "vehicle_id", ...assoc });
db.mileageLog.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

db.vehicle.hasMany(db.serviceLog, { foreignKey: "vehicle_id", ...assoc });
db.serviceLog.belongsTo(db.vehicle, { foreignKey: "vehicle_id", ...assoc });

export default db;
