export default (sequelize, Sequelize) => {
  const Reservation = sequelize.define(
    "reservation",
    {
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Assigned",
      },
    },
    {
      tableName: "reservations",
      timestamps: false,
    }
  );

  return Reservation;
};
