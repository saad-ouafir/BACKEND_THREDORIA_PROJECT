const controllers = {
  authcontroller: require("./auth/auth.controller"),
  profilecontroller: require("./social/profile.controller"),
  threadcontroller: require("./content/thread.controller"),
  followcontroller: require("./social/follow.controller"),
  mediacontroller: require("./content/media.controller"),
  reactioncontroller: require("./content/reaction.controller"),
  notificationcontroller: require("./social/notification.controller"),
};

module.exports = controllers;
