const { where, Op, Sequelize } = require("sequelize");
const { User, Follow, Thread } = require("../../models/index");
const { findUser } = require("../../utils/findUser");

class ProfileController {
  // Get all public users (for suggestions)
  static async getProfiles(req, res) {
    console.log("getProfiles called");
    try {
      const { limit = 10, offset = 0 } = req.query;
      
      const users = await User.findAll({
        where: {
          is_private: false
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        attributes: ['id', 'full_name', 'username', 'profile_picture_url', 'bio', 'follower_count', 'following_count', 'created_at']
      });
      
      // Format users for frontend
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.full_name,
        username: `@${user.username}`,
        avatar: user.profile_picture_url || `https://i.pravatar.cc/150?img=${user.id}`,
        bio: user.bio,
        followers: user.follower_count,
        following: user.following_count,
        joined: user.created_at
      }));
      
      return res.status(200).json({ 
        success: true,
        message: "Profiles fetched successfully",
        users: formattedUsers,
        total: users.length
      });
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to fetch profiles", 
      });
    }
  }

  // Get profile by ID
  static async getProfilebyID(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Thread,
            as: 'threads',
            limit: 10,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Check if profile is private and not the owner
      if (user.is_private && (!req.user || req.user.id !== parseInt(id))) {
        return res.status(403).json({ 
          success: false,
          message: "This profile is private" 
        });
      }

      return res.status(200).json({ 
        success: true,
        message: "Profile fetched successfully",
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          bio: user.bio,
          profile_picture_url: user.profile_picture_url,
          profile_metadata: user.profile_metadata,
          is_private: user.is_private,
          follower_count: user.follower_count,
          following_count: user.following_count,
          created_at: user.created_at,
          threads: user.threads
        }
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch profile", 
        error: error.message 
      });
    }
  }

  // Get profile by username
  static async getProfileByUsername(req, res) {
    try {
      const { username } = req.params;
      const user = await User.findOne({
        where: { username },
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Check if profile is private and not the owner
      if (user.is_private && (!req.user || req.user.id !== user.id)) {
        return res.status(403).json({ 
          success: false,
          message: "This profile is private" 
        });
      }

      return res.status(200).json({ 
        success: true,
        message: "Profile fetched successfully",
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          bio: user.bio,
          profile_picture_url: user.profile_picture_url,
          profile_metadata: user.profile_metadata,
          is_private: user.is_private,
          follower_count: user.follower_count,
          following_count: user.following_count,
          created_at: user.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch profile", 
        error: error.message 
      });
    }
  }

  // Search profiles
  static async searchProfiles(req, res) {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const users = await User.findAll({
      where: {
        is_private: false,
        [Op.or]: [
          { full_name: { [Op.like]: `%${q}%` } },
          { username: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: Number(limit),
      offset: Number(offset),
      order: [["follower_count", "DESC"]],
      attributes: [
        "id",
        "full_name",
        "username",
        "profile_picture_url",
        "bio",
        "follower_count",
        "following_count",
      ],
    });

    return res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
}


  // Get user's followers
  static async getFollowers(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const followers = await Follow.findAll({
        where: { following_id: id },
        include: [
          {
            model: User,
            as: 'follower',
            attributes: ['id', 'full_name', 'username', 'profile_picture_url']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      const formattedFollowers = followers.map(follow => ({
        id: follow.follower.id,
        name: follow.follower.full_name,
        username: `@${follow.follower.username}`,
        avatar: follow.follower.profile_picture_url || `https://i.pravatar.cc/150?img=${follow.follower.id}`,
        followed_at: follow.created_at
      }));

      return res.status(200).json({ 
        success: true,
        message: "Followers fetched successfully",
        followers: formattedFollowers,
        total: followers.length
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch followers", 
        error: error.message 
      });
    }
  }

  // Get user's following
  static async getFollowing(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const following = await Follow.findAll({
        where: { follower_id: id },
        include: [
          {
            model: User,
            as: 'following',
            attributes: ['id', 'full_name', 'username', 'profile_picture_url']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      const formattedFollowing = following.map(follow => ({
        id: follow.following.id,
        name: follow.following.full_name,
        username: `@${follow.following.username}`,
        avatar: follow.following.profile_picture_url || `https://i.pravatar.cc/150?img=${follow.following.id}`,
        followed_at: follow.created_at
      }));

      return res.status(200).json({ 
        success: true,
        message: "Following fetched successfully",
        following: formattedFollowing,
        total: following.length
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch following", 
        error: error.message 
      });
    }
  }
  // Update profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const {
        full_name,
        username,
        bio,
        profile_picture_url,
        profile_metadata,
        is_private
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Check if username is already taken by another user
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          return res.status(400).json({ 
            success: false,
            message: "Username is already taken" 
          });
        }
      }

      const updatedUser = await user.update({
        full_name: full_name || user.full_name,
        username: username || user.username,
        bio: bio !== undefined ? bio : user.bio,
        profile_picture_url: profile_picture_url || user.profile_picture_url,
        profile_metadata: profile_metadata || user.profile_metadata,
        is_private: is_private !== undefined ? is_private : user.is_private
      });

      return res.status(200).json({ 
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          username: updatedUser.username,
          email: updatedUser.email,
          bio: updatedUser.bio,
          profile_picture_url: updatedUser.profile_picture_url,
          profile_metadata: updatedUser.profile_metadata,
          is_private: updatedUser.is_private,
          follower_count: updatedUser.follower_count,
          following_count: updatedUser.following_count,
          created_at: updatedUser.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to update profile", 
        error: error.message 
      });
    }
  }
  // Delete profile (soft delete)
  static async deleteProfile(req, res) {
    try {
      const userId = req.user.id; // From auth middleware

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Soft delete by updating email and username
      await user.update({
        email: `deleted_${Date.now()}@deleted.com`,
        username: `deleted_${Date.now()}`,
        full_name: "Deleted User",
        bio: null,
        profile_picture_url: null
      });

      return res.status(200).json({ 
        success: true,
        message: "Profile deleted successfully" 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to delete profile", 
        error: error.message 
      });
    }
  }
}

module.exports = ProfileController;
