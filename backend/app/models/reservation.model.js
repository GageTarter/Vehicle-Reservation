export default (sequelize, Sequelize) => {
  const Reservation = sequelize.define(
    "reservation",
    {
      requestorUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "requester_id",
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
        field: "vehicle_id",
      },
      checkout_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      return_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      preTripEmailSentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "reservations",
      getterMethods: {
        requester_id() {
          return this.getDataValue("requestorUserId");
        },
        vehicle_id() {
          return this.getDataValue("vehicleId");
        },
        start_datetime() {
          return this.getDataValue("startAt");
        },
        end_datetime() {
          return this.getDataValue("endAt");
        },
      },
      setterMethods: {
        requester_id(value) {
          this.setDataValue("requestorUserId", value);
        },
        vehicle_id(value) {
          this.setDataValue("vehicleId", value);
        },
        start_datetime(value) {
          this.setDataValue("startAt", value);
        },
        end_datetime(value) {
          this.setDataValue("endAt", value);
        },
      },
    }
  );

  return Reservation;
};
