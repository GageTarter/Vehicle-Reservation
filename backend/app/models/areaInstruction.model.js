export default (sequelize, Sequelize) => {
  const AreaInstruction = sequelize.define(
    "areaInstruction",
    {
      instruction_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      area_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      pickup_instructions: { type: Sequelize.TEXT, allowNull: false },
      return_instructions: { type: Sequelize.TEXT, allowNull: false },
      contact_information: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "area_instructions", timestamps: false }
  );

  return AreaInstruction;
};
