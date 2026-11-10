export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      googleId: {
        type: Sequelize.STRING,
        allowNull: false,
<<<<<<< HEAD
=======
        unique: true,
>>>>>>> origin/dev
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
<<<<<<< HEAD
      },
      role: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "requestor",
      },
      area_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
=======
        unique: true,
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "user",
>>>>>>> origin/dev
      },
    },
    {
      tableName: "users",
      timestamps: false,
<<<<<<< HEAD
      indexes: [
        { unique: true, name: "users_googleId_unique", fields: ["googleId"] },
        { unique: true, name: "users_email_unique", fields: ["email"] },
      ],
    }
=======
    },
>>>>>>> origin/dev
  );

  return User;
};
