const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      profile_picture_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      profile_picture_cdn: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      profile_picture_provider: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["username"],
        },
        {
          unique: true,
          fields: ["email"],
        },
      ],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Thread, { foreignKey: "author_id", as: "threads" });
    User.hasMany(models.Follow, { foreignKey: "follower_id", as: "following" });
    User.hasMany(models.Follow, {
      foreignKey: "following_id",
      as: "followers",
    });
    User.hasMany(models.Reaction, { foreignKey: "user_id", as: "reactions" });
    User.hasMany(models.Notification, {
      foreignKey: "recipient_id",
      as: "receivedNotifications",
    });
    User.hasMany(models.Notification, {
      foreignKey: "sender_id",
      as: "sentNotifications",
    });
    User.hasMany(models.RefreshToken, {
      foreignKey: "user_id",
      as: "refreshTokens",
    });
  };

  return User;
};
