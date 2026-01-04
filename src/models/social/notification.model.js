const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      sender_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      target_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "Context: points to the thread, reaction, or follow record",
      },
      type: {
        type: DataTypes.ENUM("REPLY", "FOLLOW_REQUEST", "FOLLOW_ACCEPT", "LIKE"),
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "notifications",
      timestamps: false,
      indexes: [
        {
          fields: ["recipient_id", "is_read"],
          name: "idx_recipient_unread",
        },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "recipient_id",
      as: "recipient",
    });
    Notification.belongsTo(models.User, {
      foreignKey: "sender_id",
      as: "sender",
    });
  };

  return Notification;
};
