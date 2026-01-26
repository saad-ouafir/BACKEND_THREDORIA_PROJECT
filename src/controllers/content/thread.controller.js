const { Thread, Media } = require("../../models/index");
const { findThread, findThreads } = require("../../utils/findThread");
const { Sequelize } = require("sequelize");
class ThreadController {
  static async getThreadsByUserID(req, res) {
    const { userId } = req.params;
    const currentUserId = req.currentUser?.id || null;
    const threads = await findThreads(res, userId, null, null, 10, 0, currentUserId);
    const formattedThreads = threads.map((thread) => {
      const isLiked = thread.reactions && thread.reactions.length > 0;
      return {
        ...thread.toJSON(),
        isLiked,
      };
    });
    return res.status(200).json({
      message: "Threads fetched successfully",
      threads: formattedThreads,
    });
  }

  // Get Sub Threads
  static async getSubThreads(req, res) {
    const { parentID } = req.params;
    const currentUserId = req.currentUser?.id || null;
    const threads = await findThreads(res, null, null, parentID, 10, 0, currentUserId);
    if (threads === null) return; // Error already handled in findThreads

    return res.status(200).json({
      message: "Sub threads fetched successfully",
      threads,
    });
  }

  // Get Thread By ID
  static async getThreadById(req, res) {
    const { threadId } = req.params;
    const thread = await findThread(res, threadId);
    if (thread === null) return; // Error already handled in findThread

    return res.status(200).json({
      message: "Thread fetched successfully",
      thread,
    });
  }

  // Create Thread
  static async createThread(req, res) {
    try {
      const { content, parent_id } = req.body;
      const author_id = req.currentUser?.id;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      if (!author_id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const thread = await Thread.create({
        content: content.trim(),
        author_id,
        parent_id: parent_id || null,
      });

      // If this is a reply, increment parent's replies_count
      if (parent_id) {
        await Thread.increment("replies_count", {
          where: { id: parent_id },
          by: 1,
        });
      }

      return res.status(201).json({
        message: "Thread created successfully",
        thread: {
          id: thread.id,
          content: thread.content,
          parent_id: thread.parent_id,
          created_at: thread.created_at,
        },
      });
    } catch (error) {
      console.error("Error creating thread:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteThreadById(req, res) {
    try {
      const { threadId } = req.params;
      const author_id = req.currentUser?.id;

      // Check if thread exists and belongs to user
      const thread = await Thread.findByPk(threadId, {
        include: [
          {
            model: Media,
            as: "media",
            required: false,
          },
        ],
      });
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      // Check if user is authorized to delete this thread
      if (thread.author_id !== author_id) {
        return res.status(403).json({ message: "Not authorized to delete this thread" });
      }

      // Delete associated media files from storage
      if (thread.media && thread.media.length > 0) {
        const { DeleteHandler } = require("../../handlers/mediaHandler");
        for (const mediaItem of thread.media) {
          try {
            await DeleteHandler(mediaItem.url, author_id);
          } catch (err) {
            console.error(`Failed to delete media file ${mediaItem.url}:`, err.message);
            return res.status(500).json({ message: "Failed to delete Media !" });
          }
        }
      }

      // If this thread is a reply, decrement parent's replies_count (prevent negative)
      if (thread.parent_id) {
        await Thread.update(
          {
            replies_count: Sequelize.literal("GREATEST(0, replies_count - 1)"),
          },
          {
            where: { id: thread.parent_id },
          },
        );
      }

      await thread.destroy();

      return res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
      console.error("Error deleting thread:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async searchThreads(req, res) {
    try {
      const { search, limit = 20, offset = 0 } = req.query;

      if (!search || !search.trim()) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const whereClause = {
        content: {
          [require("sequelize").Op.iLike]: `%${search.trim()}%`,
        },
      };

      const threads = await Thread.findAll({
        where: whereClause,
        include: [
          {
            model: require("../../models/index").User,
            as: "author",
            attributes: ["id", "username", "full_name"],
          },
          {
            model: require("../../models/index").Media,
            as: "media",
            required: false,
            attributes: ["id", "url", "media_type"],
            separate: true,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return res.status(200).json({
        message: "Threads found",
        threads,
        total: threads.length,
      });
    } catch (error) {
      console.error("Error searching threads:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async suggestThreadByTag(req, res) {
    try {
      const { limit = 10 } = req.query;
      const threads = await Thread.findAll({
        include: [
          {
            model: require("../../models/index").User,
            as: "author",
            attributes: ["id", "username", "full_name", "profile_picture_url"],
          },
          {
            model: require("../../models/index").Media,
            as: "media",
            required: false,
            attributes: ["id", "url", "media_type"],
            separate: true,
          },
        ],
        limit: parseInt(limit),
      });

      return res.status(200).json({
        message: "Trending threads retrieved",
        threads,
        total: threads.length,
      });
    } catch (error) {
      console.error("Error retrieving trending threads:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = ThreadController;
