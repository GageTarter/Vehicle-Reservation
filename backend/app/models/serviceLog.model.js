export default (sequelize, Sequelize) => {
  const ServiceLog = sequelize.define(
    "serviceLog",
    {
      service_log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_id: { type: Sequelize.INTEGER, allowNull: false },
      service_date: { type: Sequelize.DATEONLY, allowNull: false },
      service_performed: { type: Sequelize.TEXT, allowNull: false },
    },
    { tableName: "service_logs", timestamps: false }
  );

  return ServiceLog;
};
