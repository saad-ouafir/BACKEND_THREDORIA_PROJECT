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
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "threads",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      replies_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      shares_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Soft delete to preserve reply chains",
      },
    },
    {
      tableName: "threads",
      timestamps: false,
      paranoid: false, // We handle soft delete manually with deleted_at
      indexes: [
        {
          fields: ["author_id", { attribute: "created_at", order: "DESC" }],
          name: "idx_author_created",
        },
        {
          fields: ["parent_id"],
        },
      ],
    },
  );

  Thread.associate = (models) => {
    // Basic associations
    Thread.belongsTo(models.User, {
      foreignKey: "author_id",
      as: "author",
    });

    // Self-referencing associations
    Thread.belongsTo(models.Thread, {
      foreignKey: "parent_id",
      as: "parent",
    });
    Thread.hasMany(models.Thread, {
      foreignKey: "parent_id",
      as: "replies",
    });

    // Engagement associations
    Thread.hasMany(models.Reaction, {
      foreignKey: "thread_id",
      as: "reactions",
    });

    // Media associations
    Thread.hasMany(models.Media, {
      foreignKey: "thread_id",
      as: "media",
    });

    // Notification associations (for replies)
    Thread.hasMany(models.Notification, {
      foreignKey: "target_id",
      as: "notifications",
      scope: {
        where: {
          type: ["REPLY", "LIKE", "SHARE"],
        },
      },
    });
  };

  return Thread;
};
