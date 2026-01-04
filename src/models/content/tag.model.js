const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Tag = sequelize.define(
    "Tag",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "tags",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Thread, {
      through: models.ThreadTag,
      foreignKey: "tag_id",
      otherKey: "thread_id",
      as: "threads",
    });
  };

  return Tag;
};
