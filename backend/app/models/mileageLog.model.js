export default (sequelize, Sequelize) => {
  const MileageLog = sequelize.define(
    "mileageLog",
    {
      mileage_log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_id: { type: Sequelize.INTEGER, allowNull: false },
      date_recorded: { type: Sequelize.DATEONLY, allowNull: false },
      current_mileage: { type: Sequelize.INTEGER, allowNull: false },
    },
    { tableName: "mileage_logs", timestamps: false }
  );

  return MileageLog;
};
