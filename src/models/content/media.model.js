const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Media = sequelize.define(
    "Media",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
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
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      media_type: {
        type: DataTypes.ENUM("IMAGE", "VIDEO"),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Store CDN provider, width, height, etc.",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "media",
      timestamps: false,
      indexes: [
        {
          fields: ["thread_id"],
          name: "idx_thread_media",
        },
      ],
    }
  );

  Media.associate = (models) => {
    Media.belongsTo(models.Thread, { foreignKey: "thread_id", as: "thread" });
  };

  return Media;
};
