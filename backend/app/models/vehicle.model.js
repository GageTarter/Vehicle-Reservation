export default (sequelize, Sequelize) => {
  const Vehicle = sequelize.define(
    "vehicle",
    {
      name: { type: Sequelize.STRING, allowNull: false },
      area_id: { type: Sequelize.INTEGER, allowNull: false },
    },
    { tableName: "vehicles", timestamps: false }
  );

  return Vehicle;
};
