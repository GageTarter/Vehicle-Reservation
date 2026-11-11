export default (sequelize, Sequelize) => {
  const Destination = sequelize.define(
    "destination",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "destinations",
    },
  );

  return Destination;
};
