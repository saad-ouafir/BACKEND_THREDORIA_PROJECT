const { where, Op, Sequelize } = require("sequelize");
const { User, Follow, Thread } = require("../../models/index");
const { findUser } = require("../../utils/findUser");
const { userDataSanitizer } = require("../../utils/userDataSanitizer");

class ProfileController {
  static async suggestProfiles(req, res) {
    const { cursor, limit = 10 } = req.query;
    const currentUserId = req.currentUser?.id;
    console.log("current userID : ", currentUserId);

    // If user is authenticated, exclude users they already follow or have pending requests with
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: { id: currentUserId || null },
        },
      },
      limit: parseInt(limit),
      order: [["id", "DESC"]],
      attributes: ["id", "full_name", "username", "profile_picture_url"],
    });

    const nextCursor = users.length === parseInt(limit) ? users[users.length - 1].id : null;

    return res.status(200).json({
      users: users,
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
    const { q } = req.query;
    const currentUserId = req.currentUser?.id;
    const { applyPagination, buildPaginationMeta } = require("../../utils/pagination");

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const { limit, offset, paginationParams } = applyPagination(req.query);

    // Build where clause: search by name/username
    // Include public profiles, and if authenticated, also show private profiles
    const searchCondition = {
      [Op.or]: [{ full_name: { [Op.like]: `%${q.trim()}%` } }, { username: { [Op.like]: `%${q.trim()}%` } }],
    };

    // Privacy filter: show public profiles OR (if authenticated) profiles user follows
    // For simplicity, we show all matching profiles but can be restricted later
    const whereClause = {
      ...searchCondition,
      // Don't filter by is_private - let users find anyone, they just can't see private content
    };

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["follower_count", "DESC"]],
      attributes: [
        "id",
        "full_name",
        "username",
        "profile_picture_url",
        "bio",
        "follower_count",
        "following_count",
        "is_private",
      ],
      include: [
        ...(currentUserId
          ? [
              {
                model: Follow,
                as: "followers",
                required: false,
                where: { follower_id: currentUserId },
                attributes: ["status"],
              },
            ]
          : []),
      ],
    });

    const formattedUsers = users.map((u) => {
      const userData = u.toJSON();
      const followStatus = userData.followers?.[0]?.status || null;
      return {
        ...userDataSanitizer(userData),
        isFollowing: followStatus === "ACCEPTED",
        followStatus,
        isPrivate: userData.is_private || false,
      };
    });

    return res.status(200).json({
      message: "Profiles fetched successfully",
      users: formattedUsers,
      pagination: buildPaginationMeta(count, paginationParams.page, paginationParams.limit),
    });
  }
}

module.exports = ProfileController;
