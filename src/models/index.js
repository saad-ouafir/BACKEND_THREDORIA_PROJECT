const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/database");

const User = require("./auth/user.model")(sequelize);
const RefreshToken = require("./auth/refreshToken.model")(sequelize);
const Thread = require("./content/thread.model")(sequelize);
const Media = require("./content/media.model")(sequelize);
const Follow = require("./social/follow.model")(sequelize);
const Reaction = require("./social/reaction.model")(sequelize);
const Notification = require("./social/notification.model")(sequelize);

const models = {
  User,
  RefreshToken,
  Thread,
  Media,
  Follow,
  Reaction,
  Notification,
};

// Setup associations
User.associate(models);
RefreshToken.associate(models);
Thread.associate(models);
Media.associate(models);
Follow.associate(models);
Reaction.associate(models);
Notification.associate(models);

module.exports = {
  sequelize,
  ...models,
};
