import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import driverModel from "./driver.model.js";
import destinationModel from "./destination.model.js";
import reservationModel from "./reservation.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.driver = driverModel(sequelize, Sequelize);
db.destination = destinationModel(sequelize, Sequelize);
db.reservation = reservationModel(sequelize, Sequelize);

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.reservation, { foreignKey: "requestorUserId" });
db.reservation.belongsTo(db.user, { foreignKey: "requestorUserId" });
db.driver.hasMany(db.reservation, { foreignKey: "driverId" });
db.reservation.belongsTo(db.driver, { foreignKey: "driverId" });
db.destination.hasMany(db.reservation, { foreignKey: "destinationId" });
db.reservation.belongsTo(db.destination, { foreignKey: "destinationId" });

export default db;
