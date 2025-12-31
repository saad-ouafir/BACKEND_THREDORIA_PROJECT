const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Thread = sequelize.define(
    "Thread",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      author_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "threads",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "threads",
      timestamps: false,
      indexes: [
        {
          fields: ["author_id", "created_at"],
        },
        {
          fields: ["parent_id"],
        },
      ],
    }
  );

  Thread.associate = (models) => {
    Thread.belongsTo(models.User, { foreignKey: "author_id", as: "author" });
    Thread.belongsTo(models.Thread, { foreignKey: "parent_id", as: "parent" });
    Thread.hasMany(models.Thread, { foreignKey: "parent_id", as: "replies" });
    Thread.hasMany(models.Reaction, {
      foreignKey: "thread_id",
      as: "reactions",
    });
    Thread.hasMany(models.Media, { foreignKey: "thread_id", as: "media" });
  };

  return Thread;
};
