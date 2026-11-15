export default (sequelize, Sequelize) => {
  const Driver = sequelize.define(
    "driver",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      driverID: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      licenseState: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      licenseExp: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      approvedDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      area: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "drivers",
    },
  );

  return Driver;
};
