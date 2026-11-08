export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      googleId: {
        type: Sequelize.STRING,
        allowNull: false,
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
      indexes: [
        { unique: true, name: "users_googleId_unique", fields: ["googleId"] },
        { unique: true, name: "users_email_unique", fields: ["email"] },
      ],
    }
  );

  return User;
};
