export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      googleId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      fName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      lName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "requestor",
      },
      area_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );

  return User;
};
