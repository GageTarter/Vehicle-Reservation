export default (sequelize, Sequelize) => {
  const Area = sequelize.define(
    "area",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "areas",
    },
  );

  return Area;
};
