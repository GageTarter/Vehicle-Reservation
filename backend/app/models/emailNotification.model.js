export default (sequelize, Sequelize) => {
  const EmailNotification = sequelize.define(
    "emailNotification",
    {
      notification_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reservation_id: { type: Sequelize.INTEGER, allowNull: false },
      recipient_email: { type: Sequelize.STRING, allowNull: false },
      notification_type: { type: Sequelize.STRING, allowNull: false },
      sent_date: { type: Sequelize.DATE, allowNull: false },
    },
    { tableName: "email_notifications", timestamps: false }
  );

  return EmailNotification;
};
