export default (sequelize, Sequelize) => {
  const Reservation = sequelize.define(
    "reservation",
    {
      reservation_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "requester_id",
      },
      vehicle_id: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false },
      start_datetime: { type: Sequelize.DATE, allowNull: false },
      end_datetime: { type: Sequelize.DATE, allowNull: false },
      destination: { type: Sequelize.STRING, allowNull: true },
    },
    { tableName: "reservations", timestamps: false }
  );

  return Reservation;
};
