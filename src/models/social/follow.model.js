const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Follow = sequelize.define(
    "Follow",
    {
      follower_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        primaryKey: true,
      },
      following_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        defaultValue: "PENDING",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "follows",
      timestamps: false,
      indexes: [
        {
          fields: ["following_id", "status"],
        },
      ],
    }
  );

  Follow.associate = (models) => {
    Follow.belongsTo(models.User, {
      foreignKey: "follower_id",
      as: "follower",
    });
    Follow.belongsTo(models.User, {
      foreignKey: "following_id",
      as: "following",
    });
  };

  return Follow;
};
