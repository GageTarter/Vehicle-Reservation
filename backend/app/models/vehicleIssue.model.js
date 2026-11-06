export default (sequelize, Sequelize) => {
  const VehicleIssue = sequelize.define(
    "vehicleIssue",
    {
      issue_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      issue_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Open",
      },
    },
    {
      tableName: "vehicle_issues",
      timestamps: false,
    }
  );

  return VehicleIssue;
};
