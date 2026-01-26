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
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
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
      profile_metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Flexible storage for CDN, provider, and dimensions",
      },
      bio: {
        type: DataTypes.STRING(160),
        allowNull: true,
      },
      follower_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      following_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
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
    },
  );

  User.associate = (models) => {
    // Content associations
    User.hasMany(models.Thread, {
      foreignKey: "author_id",
      as: "threads",
    });

    // Social associations
    User.hasMany(models.Follow, {
      foreignKey: "follower_id",
      as: "following",
    });
    User.hasMany(models.Follow, {
      foreignKey: "following_id",
      as: "followers",
    });

    // Reaction associations
    User.hasMany(models.Reaction, {
      foreignKey: "user_id",
      as: "reactions",
    });

    // Notification associations
    User.hasMany(models.Notification, {
      foreignKey: "recipient_id",
      as: "receivedNotifications",
    });
    User.hasMany(models.Notification, {
      foreignKey: "sender_id",
      as: "sentNotifications",
    });

    // Authentication associations
    User.hasMany(models.RefreshToken, {
      foreignKey: "user_id",
      as: "refreshTokens",
    });

    // Add reverse associations for better querying
    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: "follower_id",
      otherKey: "following_id",
      as: "followingUsers",
    });

    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: "following_id",
      otherKey: "follower_id",
      as: "followerUsers",
    });
  };

  return User;
};
