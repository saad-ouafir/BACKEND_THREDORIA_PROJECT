const { findUser } = require("../../utils/findUser");
const { sequelize, User, Follow } = require("../../models");


class FollowRequest {
  static async followUser(req, res) {
      const { followingId } = req.params;
      const followerId = req.user.userId;
      const userToFollow = await findUser(req, res, followingId);

      // Check if already following
      const existingFollow = await Follow.findOne({
        where: {
          follower_id: followerId,
          following_id: parseInt(followingId)
        }
      });

      if (existingFollow) {
        return res.status(400).json({
          message: "Already following this user"
        });
      }

      // Create follow request
      const followStatus = userToFollow.is_private ? "PENDING" : "ACCEPTED";
      
      const follow = await Follow.create({
        follower_id: followerId,
        following_id: parseInt(followingId),
        status: followStatus
      });

      // Update follower/following counts if accepted
      if (followStatus === "ACCEPTED") {
        await User.increment('follower_count', { where: { id: followingId } });
        await User.increment('following_count', { where: { id: followerId } });
      }

      return res.status(201).json({
        success: true,
        message: followStatus === "PENDING" ? "Follow request sent" : "User followed successfully",
        follow: {
          id: follow.id,
          follower_id: follow.follower_id,
          following_id: follow.following_id,
          status: follow.status,
          created_at: follow.created_at
        }
      });
  }

  static async unFollowUser(req, res) {
      const { followingId } = req.params;
      const followerId = req.user.userId;

      // Find existing follow relationship
      const follow = await Follow.findOne({
        where: {
          follower_id: followerId,
          following_id: parseInt(followingId)
        }
      });

      // Update follower/following counts if it was an accepted follow
      if (follow.status === "ACCEPTED") {
        await User.decrement('follower_count', { where: { id: followingId } });
        await User.decrement('following_count', { where: { id: followerId } });
      }
      // Delete follow relationship
      await follow.destroy();

      return res.status(200).json({
        message: "Unfollowed successfully"
      });
  
  } 

  static async getFollowers(req, res) {
  
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const followers = await Follow.findAll({
        where: { 
          following_id: parseInt(userId),
          status: "ACCEPTED"
        },
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
  }

  static async getFollowing(req, res) {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const following = await Follow.findAll({
        where: { 
          follower_id: parseInt(userId),
          status: "ACCEPTED"
        },
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
    
  }

  static async getFollowRequests(req, res) {
      const userId = req.currentUser.id;
  
      const { limit = 20, offset = 0 } = req.query;

      const followRequests = await Follow.findAll({
        where: { 
          following_id: userId,
          status: "PENDING"
        },
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

      const formattedRequests = followRequests.map(request => ({
        id: request.id,
        follower: {
          id: request.follower.id,
          name: request.follower.full_name,
          username: `@${request.follower.username}`,
          avatar: request.follower.profile_picture_url || `https://i.pravatar.cc/150?img=${request.follower.id}`
        },
        requested_at: request.created_at
      }));

      return res.status(200).json({
        success: true,
        message: "Follow requests fetched successfully",
        requests: formattedRequests,
        total: followRequests.length
      });
    
  }

  static async acceptFollowRequest(req, res) {
  
      const { requestId } = req.params;
      const userId = req.currentUser.id;

      const followRequest = await Follow.findOne({
        where: { 
          follower_id: Number(requestId),
          following_id: userId,
          status: "PENDING"
        }
      });

      if (!followRequest) {
        return res.status(404).json({
          success: false,
          message: "Follow request not found"
        });
      }

      // Update status to ACCEPTED
      await followRequest.update({ status: "ACCEPTED" });

      // Update follower/following counts
      await User.increment('follower_count', { where: { id: followRequest.following_id } });
      await User.increment('following_count', { where: { id: followRequest.follower_id } });

      return res.status(200).json({
        success: true,
        message: "Follow request accepted"
      });
    } 

  static async rejectFollowRequest(req, res) {
    
      const { requestId } = req.params;
      const userId = req.currentUser.id;

      const followRequest = await Follow.findOne({
        where: { 
          follower_id: parseInt(requestId),
          following_id: userId,
          status: "PENDING"
        }
      });

      if (!followRequest) {
        return res.status(404).json({
          success: false,
          message: "Follow request not found"
        });
      }

      // Update status to REJECTED
      await followRequest.update({ status: "REJECTED" });

      return res.status(200).json({
        success: true,
        message: "Follow request rejected"
      });
    }
}

module.exports = FollowRequest;
