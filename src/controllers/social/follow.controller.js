const { User, Follow, Notification, sequelize } = require("../../models/index");

class FollowController {
  // Suivre ou Ne plus suivre
  static async toggleFollow(req, res) {
    // Si sequelize n'est pas disponible, on enlève la transaction pour tester
    // const t = await sequelize.transaction();
    try {
      const followerId = req.user.userId || req.user.id;
      const followingId = parseInt(req.params.id);

      if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }

      const targetUser = await User.findByPk(followingId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingFollow = await Follow.findOne({
        where: { follower_id: followerId, following_id: followingId },
      });

      if (existingFollow) {
        // UNFOLLOW
        await existingFollow.destroy();

        // Nettoyage notif
        await Notification.destroy({
          where: {
            sender_id: followerId,
            recipient_id: followingId,
            type: "FOLLOW_REQUEST",
          },
        });

        // Décrémenter (si accepté)
        if (existingFollow.status === "ACCEPTED") {
          await User.decrement("following_count", {
            where: { id: followerId },
          });
          await User.decrement("follower_count", {
            where: { id: followingId },
          });
        }

        return res.status(200).json({ message: "Unfollowed", status: "NONE" });
      } else {
        // FOLLOW
        const isPrivate = targetUser.is_private;
        const status = isPrivate ? "PENDING" : "ACCEPTED";

        await Follow.create({
          follower_id: followerId,
          following_id: followingId,
          status: status,
        });

        // Notif
        await Notification.create({
          recipient_id: followingId,
          sender_id: followerId,
          target_id: followerId,
          type: "FOLLOW_REQUEST",
        });

        if (!isPrivate) {
          await User.increment("following_count", {
            where: { id: followerId },
          });
          await User.increment("follower_count", {
            where: { id: followingId },
          });
        }

        return res.status(201).json({
          message: isPrivate ? "Request sent" : "Following",
          status: status,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async acceptRequest(req, res) {
    try {
      const userId = req.user.id;
      const followerId = parseInt(req.params.followerId);

      const followRequest = await Follow.findOne({
        where: {
          follower_id: followerId,
          following_id: userId,
          status: "PENDING",
        },
      });

      if (!followRequest)
        return res.status(404).json({ message: "Request not found" });

      followRequest.status = "ACCEPTED";
      await followRequest.save();

      await User.increment("follower_count", { where: { id: userId } });
      await User.increment("following_count", { where: { id: followerId } });

      await Notification.create({
        recipient_id: followerId,
        sender_id: userId,
        target_id: userId,
        type: "FOLLOW_ACCEPT",
      });

      await Notification.destroy({
        where: {
          recipient_id: userId,
          sender_id: followerId,
          type: "FOLLOW_REQUEST",
        },
      });

      return res.status(200).json({ message: "Request accepted" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async refuseRequest(req, res) {
    try {
      const userId = req.user.id;
      const followerId = parseInt(req.params.followerId);

      await Follow.destroy({
        where: {
          follower_id: followerId,
          following_id: userId,
          status: "PENDING",
        },
      });
      await Notification.destroy({
        where: {
          recipient_id: userId,
          sender_id: followerId,
          type: "FOLLOW_REQUEST",
        },
      });

      return res.status(200).json({ message: "Request refused" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = FollowController;
