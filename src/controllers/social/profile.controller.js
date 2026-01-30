const { where, Op, Sequelize } = require("sequelize");
const { User, Follow, Thread } = require("../../models/index");
const { findUser } = require("../../utils/findUser");
const { userDataSanitizer } = require("../../utils/userDataSanitizer");

class ProfileController {
  static async suggestProfiles(req, res) {
    const { cursor, exclude } = req.params;
    const excludeIds = exclude ? exclude.split(",").map(Number) : [];
    const currentUserId = req.currentUser?.id;

    if (currentUserId) excludeIds.push(currentUserId);

    const whereClause = {
      // is_private: false,
      ...(excludeIds.length && { id: { [Op.notIn]: excludeIds } }),
      ...(cursor && { id: { [Op.lt]: cursor, ...(excludeIds.length && { [Op.notIn]: excludeIds }) } }),
    };

    const users = await User.findAll({
      where: whereClause,
      limit: parseInt(10),
      order: [["id", "DESC"]],
      attributes: ["id", "full_name", "username", "profile_picture_url"],
    });

    const nextCursor = users.length === parseInt(10) ? users[users.length - 1].id : null;

    return res.status(200).json({
      users: users.map((u) => userDataSanitizer(u)),
      nextCursor,
      hasMore: !!nextCursor,
    });
  }

  // Get profile by ID
  static async getProfilebyID(req, res) {
    const { id } = req.params;
    const currentUserId = req.currentUser?.id;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash", "email"] },
      include: [
        ...(currentUserId
          ? [
              {
                model: Follow,
                as: "followers",
                required: false,
                where: {
                  follower_id: currentUserId,
                  following_id: id,
                },
                attributes: ["status", "created_at"],
              },
            ]
          : []),
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if profile is private and not the owner
    if (user.is_private && (!req.currentUser || req.currentUser.id !== parseInt(id))) {
      let followStatus = null;
      if (currentUserId) {
        followStatus = user.followers[0]?.status;
      }
      return res.status(200).json({
        message: "This profile is private",
        user: {
          ...userDataSanitizer(user),
          isFollowing: followStatus === "ACCEPTED" ? true : false,
          followStatus: followStatus || null,
        },
      });
    }

    const followRecordStatus = () => {
      if (currentUserId && user.followers && user.followers.length > 0) {
        const followStatus = user.followers[0].status;
        return {
          isFollowing: followStatus === "ACCEPTED" ? true : false,
          followStatus: followStatus || null,
        };
      }
      return {
        isFollowing: false,
        followStatus: null,
      };
    };

    return res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        ...userDataSanitizer(user),
        isFollowing: followRecordStatus().isFollowing || false,
        followStatus: followRecordStatus().followStatus || null,
      },
    });
  }

  // Search profiles
  static async searchProfiles(req, res) {
    const { q, limit = 10, offset = 0 } = req.query;
    const users = await User.findAll({
      where: {
        is_private: false,
        [Op.or]: [{ full_name: { [Op.like]: `%${q}%` } }, { username: { [Op.like]: `%${q}%` } }],
      },
      limit: Number(limit),
      offset: Number(offset),
      order: [["follower_count", "DESC"]],
      attributes: ["id", "full_name", "username", "profile_picture_url", "bio", "follower_count", "following_count"],
    });

    return res.status(200).json({
      message: "Profiles fetched successfully",
      users: users.map((u) => userDataSanitizer(u)),
    });
  }
}

module.exports = ProfileController;
