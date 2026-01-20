const { Thread, Reaction, User } = require("../../models/index");
const { findThread } = require("../../utils/findThread");
const { Sequelize } = require("sequelize");

class ReactionController {
  // Like a thread
  static async likeThread(req, res) {
    try {
      const threadId = req.params.threadId;
      const userId = req.currentUser?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify thread exists
      const thread = await findThread(res, threadId);
      if (!thread) return;

      // Check if user already liked this thread
      const existingLike = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: "LIKE",
        },
      });

      if (existingLike) {
        return res.status(400).json({ message: "You already liked this thread" });
      }

      // Create like
      await Reaction.create({
        user_id: userId,
        thread_id: threadId,
        type: "LIKE",
      });

      // Increment thread likes_count
      await Thread.increment("likes_count", {
        where: { id: threadId },
        by: 1,
      });

      return res.status(200).json({
        message: "Thread liked successfully",
        liked: true,
        likes_count: thread.likes_count + 1,
      });
    } catch (error) {
      console.error("Like thread error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Unlike a thread
  static async unlikeThread(req, res) {
    try {
      const threadId = req.params.threadId;
      const userId = req.currentUser?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify thread exists
      const thread = await findThread(res, threadId);
      if (!thread) return;

      // Delete like
      const deleted = await Reaction.destroy({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: "LIKE",
        },
      });

      if (deleted === 0) {
        return res.status(404).json({ message: "Like not found" });
      }

      // Decrement thread likes_count (prevent negative)
      await Thread.update(
        {
          likes_count: Sequelize.literal("GREATEST(0, likes_count - 1)"),
        },
        {
          where: { id: threadId },
        },
      );

      // Get the updated count
      const updatedThread = await Thread.findByPk(threadId, {
        attributes: ["likes_count"],
      });

      return res.status(200).json({
        message: "Like removed successfully",
        liked: false,
        likes_count: updatedThread.likes_count,
      });
    } catch (error) {
      console.error("Unlike thread error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Check if user liked a thread
  static async checkUserLike(req, res) {
    try {
      const threadId = req.params.threadId;
      const userId = req.currentUser?.id;

      if (!userId) {
        return res.status(200).json({
          liked: false,
        });
      }

      const like = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: "LIKE",
        },
      });

      return res.status(200).json({
        liked: !!like,
      });
    } catch (error) {
      console.error("Check user like error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Share a thread
  static async shareThread(req, res) {
    try {
      const threadId = req.params.threadId;
      const userId = req.currentUser?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify thread exists
      const thread = await findThread(res, threadId);
      if (!thread) return;

      // Check if user already shared this thread
      const existingShare = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: "SHARE",
        },
      });

      if (existingShare) {
        // User already shared - just increment thread count and return URL
        await Thread.increment("shares_count", {
          where: { id: threadId },
          by: 1,
        });
      } else {
        // First time sharing - create record and increment count
        await Reaction.create({
          user_id: userId,
          thread_id: threadId,
          type: "SHARE",
        });
        await Thread.increment("shares_count", {
          where: { id: threadId },
          by: 1,
        });
      }

      // Generate share URL for frontend
      const shareUrl = `${req.protocol}://${req.get("host")}/thread/${threadId}`;

      return res.status(200).json({
        message: "Thread shared successfully",
        shared: true,
        shares_count: thread.shares_count + 1,
        shareUrl: shareUrl,
      });
    } catch (error) {
      console.error("Share thread error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = ReactionController;
