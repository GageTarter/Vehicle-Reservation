export default (sequelize, Sequelize) => {
  const Reservation = sequelize.define(
    "reservation",
    {
      requestorUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      partyName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      driverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      destinationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      startAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      passengerCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      noteType: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      noteText: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "requested",
      },
      vehicleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "reservations",
    },
  );

  return Reservation;
};
