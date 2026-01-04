const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Reaction = sequelize.define(
    "Reaction",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      thread_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "threads",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM("LIKE", "SHARE"),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "reactions",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "thread_id", "type"],
          name: "uk_user_thread_type",
        },
        {
          fields: ["thread_id"],
          name: "idx_thread_reactions",
        },
      ],
    }
  );

  Reaction.associate = (models) => {
    Reaction.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Reaction.belongsTo(models.Thread, {
      foreignKey: "thread_id",
      as: "thread",
    });
  };

  return Reaction;
};
