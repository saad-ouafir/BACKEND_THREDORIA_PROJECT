const { Thread, Reaction, User } = require("../../models/index");
const { findThread } = require("../../utils/findThread");
const { Sequelize } = require("sequelize");
const { eventsHandler } = require("../../handlers/eventsHandler");

class ReactionController {
  // Like or Unlike a thread
  static async likeOrUnlikeThread(req, res) {
    const threadId = req.params.threadId;
    const userId = req.currentUser?.id;

    // Verify thread exists
    const thread = await findThread(res, threadId, userId);

    // Check if user already liked this thread
    const existingLike = await Reaction.findOne({
      where: {
        user_id: userId,
        thread_id: threadId,
        type: "LIKE",
      },
    });

    // Delete Reaction if exists
    if (existingLike) {
      await Reaction.destroy({
        where: {
          id: existingLike.id,
        },
      });
      await Thread.decrement("likes_count", {
        where: { id: threadId },
        by: 1,
      });

      // Emit Notification Event (send notification to the thread owner)
      eventsHandler.emit("cancelNotification", "LIKE", userId, thread.author.id, threadId);
    } else {
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

      // Emit Notification Event (send notification to the thread owner)
      eventsHandler.emit("notification", "LIKE", userId, thread.author.id, threadId);
    }

    return res.status(200).json({
      message: "Thread liked",
      liked: !existingLike,
      likes_count: thread.replies.likes_count,
    });
  }

  // Share a thread
  static async shareThread(req, res) {
    const threadId = req.params.threadId;
    if (!threadId) return res.status(404).json({ message: "Thread not found" });
    const userId = req.currentUser?.id;

    // Verify thread exists
    const thread = await findThread(res, threadId, userId);

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

      eventsHandler.emit("notification", "SHARE", userId, thread.author.id, threadId);
    }

    // Generate share URL for frontend
    const shareUrl = `${req.protocol}://${req.get("host")}/thread/${threadId}`;

    return res.status(200).json({
      message: "Thread shared successfully",
      shared: true,
      shares_count: thread.shares_count + 1,
      shareUrl: shareUrl,
    });
  }

  static async replyThread(req, res) {}
}

module.exports = ReactionController;
