export default (sequelize, Sequelize) => {
  const Area = sequelize.define(
    "area",
    {
      area_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: Sequelize.STRING, allowNull: false },
    },
    { tableName: "areas", timestamps: false }
  );

  return Area;
};
