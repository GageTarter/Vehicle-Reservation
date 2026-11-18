export default (sequelize, Sequelize) => {
  const Destination = sequelize.define(
    "destination",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      addressLine1: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      addressLine2: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      zip: {
        type: Sequelize.STRING(5),
        allowNull: false,
      },
    },
    {
      tableName: "destinations",
    },
  );

  return Destination;
};
