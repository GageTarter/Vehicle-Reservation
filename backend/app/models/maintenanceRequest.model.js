export default (sequelize, Sequelize) => {
  const MaintenanceRequest = sequelize.define(
    "maintenanceRequest",
    {
      maintenance_request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      issue_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      tableName: "maintenance_requests",
      timestamps: false,
    }
  );

  return MaintenanceRequest;
};
