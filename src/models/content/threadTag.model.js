const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ThreadTag = sequelize.define(
    "ThreadTag",
    {
      thread_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "threads",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      tag_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "tags",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "thread_tags",
      timestamps: false,
      indexes: [
        {
          fields: ["tag_id"],
          name: "idx_tag_lookup",
        },
      ],
    }
  );

  // No additional associations needed - this is a junction table
  ThreadTag.associate = () => {};

  return ThreadTag;
};
