export default (sequelize, Sequelize) => {
  const Vehicle = sequelize.define(
    "vehicle",
    {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      year: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      vin: {
        type: Sequelize.STRING(17),
        allowNull: false,
      },
      purchaseDate: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      passengerCapacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      licensePlateNo: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      licensePlateExp: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      area: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      area_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "vehicles",
      indexes: [{ unique: true, fields: ["userId", "name"] }],
    },
  );

  return Vehicle;
};
