const { findUser } = require("../../utils/findUser");
const { sequelize, User, Follow } = require("../../models");
const { Op } = require("sequelize");
const { eventsHandler } = require("../../handlers/eventsHandler");
class FollowController {
  // Follow a user
  static async followUser(req, res) {
    const { followingId } = req.body;
    const followerId = req.currentUser?.id;
    const userToFollow = await findUser(res, followingId);

    const checkFollowed = await Follow.findAll({
      where: {
        [Op.and]: [{ following_id: userToFollow.id }, { follower_id: followerId }],
      },
    });
    if (checkFollowed.length > 0) {
      return res.status(404).json({ message: "You are already following This User" });
    }

    const followStatus = userToFollow.is_private ? "PENDING" : "ACCEPTED";
    await Follow.create({
      follower_id: followerId,
      following_id: parseInt(followingId),
      status: followStatus,
    });

    // Emit notification event instead of direct creation
    const eventType = followStatus === "PENDING" ? "follow_request" : "follow_accept";
    eventsHandler.emit("notification", eventType.toUpperCase(), followerId, followingId, followingId);

    // Update follower/following counts if accepted
    if (followStatus === "ACCEPTED") {
      await User.increment("follower_count", { where: { id: followingId } });
      await User.increment("following_count", { where: { id: followerId } });
    }

    return res.status(201).json({
      message: followStatus === "PENDING" ? "Follow request sent to the user !" : "User followed successfully",
      followStatus,
    });
  }

  // Unfollow a user
  static async unfollowUser(req, res) {
    const { followingId } = req.params;
    const followerId = req.user.userId;
    const follow = await Follow.findOne({
      where: {
        follower_id: followerId,
        following_id: parseInt(followingId),
      },
    });
    if (follow.status === "ACCEPTED") {
      await User.decrement("follower_count", { where: { id: followingId } });
      await User.decrement("following_count", { where: { id: followerId } });
    }

    if (follow.status === "PENDING") {
      await Follow.destroy({ where: { follower_id: followerId, following_id: parseInt(followingId) } });
    }

    await follow.destroy();
    return res.status(200).json({
      message: follow.status === "ACCEPTED" ? "Unfollowed successfully" : "Follow request cancelled successfully",
    });
  }

  // Get followers of a user
  static async getFollowers(req, res) {
    const { userId } = req.params;
    const currentUserId = req.currentUser?.id;
    const { limit = 20, offset = 0 } = req.query;
    // Check if user exists and get privacy settings
    const targetUser = await findUser(res, userId);
    const isOwnProfile = currentUserId === parseInt(userId);
    const isPublicAccount = !targetUser.is_private;

    // Check if current user follows the target user (for private accounts)
    let isFollowing = false;
    if (!isOwnProfile && !isPublicAccount) {
      const followRelation = await Follow.findOne({
        where: {
          follower_id: currentUserId,
          following_id: parseInt(userId),
          status: "ACCEPTED",
        },
      });
      isFollowing = !!followRelation;
    }

    // Deny access if conditions are not met
    if (!isOwnProfile && !isPublicAccount && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: "This account is private. Follow to see their followers.",
      });
    }

    const followers = await Follow.findAll({
      where: {
        following_id: parseInt(userId),
        status: "ACCEPTED",
      },
      include: [
        {
          model: User,
          as: "follower",
          attributes: ["id", "full_name", "username", "profile_picture_url"],
          // Add follow relationship with current user
          ...(currentUserId
            ? [
                {
                  model: Follow,
                  as: "followers",
                  required: false,
                  where: {
                    follower_id: currentUserId,
                  },
                  attributes: ["status", "created_at"],
                },
              ]
            : []),
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    // Process followers to add follow status
    const processedFollowers = followers.map((follow) => {
      const follower = follow.follower.toJSON();

      // Determine follow status
      let isFollowing = false;
      let followStatus = null;

      if (currentUserId && follower.followers && follower.followers.length > 0) {
        const followRecord = follower.followers[0];
        isFollowing = followRecord.status === "ACCEPTED";
        followStatus = followRecord.status;
      }

      // Remove the followers array from the response
      delete follower.followers;

      return {
        ...follower,
        isFollowing,
        followStatus,
      };
    });

    return res.status(200).json({
      message: "Followers fetched successfully",
      followers: processedFollowers,
    });
  }

  // Get following of a user
  static async getFollowing(req, res) {
    const { userId } = req.params;
    const currentUserId = req.currentUser?.id;
    const { limit = 20, offset = 0 } = req.query;

    // Check if user exists and get privacy settings
    const targetUser = await User.findByPk(parseInt(userId));
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check privacy conditions
    const isOwnProfile = currentUserId === parseInt(userId);
    const isPublicAccount = !targetUser.is_private;

    // Check if current user follows the target user (for private accounts)
    let isFollowing = false;
    if (!isOwnProfile && !isPublicAccount) {
      const followRelation = await Follow.findOne({
        where: {
          follower_id: currentUserId,
          following_id: parseInt(userId),
          status: "ACCEPTED",
        },
      });
      isFollowing = !!followRelation;
    }

    // Deny access if conditions are not met
    if (!isOwnProfile && !isPublicAccount && !isFollowing) {
      return res.status(403).json({
        success: false,
        message: "This account is private. Follow to see who they're following.",
      });
    }

    const following = await Follow.findAll({
      where: {
        follower_id: parseInt(userId),
        status: "ACCEPTED",
      },
      include: [
        {
          model: User,
          as: "following",
          attributes: ["id", "full_name", "username", "profile_picture_url"],
          // Add follow relationship with current user
          ...(currentUserId
            ? [
                {
                  model: Follow,
                  as: "followers",
                  required: false,
                  where: {
                    follower_id: currentUserId,
                  },
                  attributes: ["status", "created_at"],
                },
              ]
            : []),
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });
    // Process following to add follow status
    const processedFollowing = following.map((follow) => {
      const followingUser = follow.following.toJSON();

      // Determine follow status
      let isFollowing = false;
      let followStatus = null;

      if (currentUserId && followingUser.followers && followingUser.followers.length > 0) {
        const followRecord = followingUser.followers[0];
        isFollowing = followRecord.status === "ACCEPTED";
        followStatus = followRecord.status;
      }

      // Remove the followers array from the response
      delete followingUser.followers;

      return {
        ...followingUser,
        isFollowing,
        followStatus,
      };
    });

    return res.status(200).json({
      message: "Following fetched successfully",
      following: processedFollowing,
    });
  }

  // Get follow requests of a user
  static async getFollowRequests(req, res) {
    const userId = req.currentUser.id;
    const { limit = 20, offset = 0 } = req.query;
    const followRequests = await Follow.findAll({
      where: {
        following_id: userId,
        status: "PENDING",
      },
      include: [
        {
          model: User,
          as: "follower",
          attributes: ["id", "full_name", "username", "profile_picture_url"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Follow requests fetched successfully",
      followRequests,
    });
  }

  // Accept a follow request
  static async acceptFollowRequest(req, res) {
    const { followerID } = req.body;
    const userId = req.currentUser.id;
    console.log("follower id", followerID);

    const followRequest = await Follow.findOne({
      where: {
        follower_id: followerID,
        following_id: userId,
        status: "PENDING",
      },
    });

    if (!followRequest) {
      return res.status(404).json({
        message: "Follow request not found",
      });
    }
    await followRequest.update({ status: "ACCEPTED" });
    await User.increment("follower_count", { where: { id: followRequest.following_id } });
    await User.increment("following_count", { where: { id: followRequest.follower_id } });

    // Emit follow accept notification event
    eventsHandler.emit("notification", "FOLLOW_ACCEPT", userId, followerID, followerID);

    return res.status(200).json({
      message: "Follow request accepted Successfully !",
    });
  }

  static async rejectFollowRequest(req, res) {
    const { followerID } = req.params;
    const userId = req.currentUser.id;

    const followRequest = await Follow.findOne({
      where: {
        follower_id: parseInt(followerID),
        following_id: userId,
        status: "PENDING",
      },
    });

    if (!followRequest) {
      return res.status(404).json({
        success: false,
        message: "Follow request not found",
      });
    }
    await followRequest.update({ status: "REJECTED" });

    return res.status(200).json({
      message: "Follow request rejected Successfully !",
    });
  }
}

module.exports = FollowController;
