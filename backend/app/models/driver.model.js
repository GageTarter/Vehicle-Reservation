export default (sequelize, Sequelize) => {
  const Driver = sequelize.define(
    "driver",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
    },
    {
      tableName: "drivers",
    },
  );

  return Driver;
};
