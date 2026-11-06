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
        defaultValue: "Requested",
      },
      start_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      checkout_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      return_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "reservations",
      timestamps: false,
    }
  );

  return Reservation;
};
