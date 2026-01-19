const { Reaction, Thread, User } = require('../../models');
const { notificationEmitter } = require('../../middlewares/notification.middleware');

class ReplyController {
  // Add a reply to a thread
  static async addReply(req, res) {

    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.currentUser.id;

      // Check if parent thread exists
      const parentThread = await Thread.findByPk(threadId);
      if (!parentThread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Create the reply thread
      const reply = await Thread.create({
        author_id: userId,
        parent_id: threadId,
        content: content
      });

      // Get reply with user info
      const replyWithUser = await Thread.findByPk(reply.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Create REPLY reaction entry
      const reaction = await Reaction.create({
        user_id: userId,
        thread_id: reply.id,
        type: 'REPLY'
      });

      // Emit notification if replying to someone else's thread
      if (parentThread.author_id !== userId) {
        const io = req.app.get('io');
        notificationEmitter.emit('reply', {
          recipientId: parentThread.author_id,
          senderId: userId,
          threadId: threadId,
          replyId: reply.id,
          type: 'REPLY',
          io: io
        });

        // Increment parent thread's replies count
        await Thread.increment('replies_count', { 
          where: { id: threadId } 
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          reply: replyWithUser,
          reaction: reaction
        },
        message: 'Reply added successfully'
      });
  }

  // Get all replies for a thread
  static async getThreadReplies(req, res) {
    const { threadId } = req.params;

      const replies = await Thread.findAll({
        where: { parent_id: threadId },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          },
          {
            model: Reaction,
            as: 'reactions',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name', 'profile_picture_url']
              }
            ]
          }
        ],
        order: [['created_at', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          replies: replies
        }
      });
  }

  // Update a reply
  static async updateReply(req, res) {
    const { threadId, replyId } = req.params;
    const { content } = req.body;
    const userId = req.currentUser.id;

      // Find the reply (must be a reply to the specified thread)
      const reply = await Thread.findOne({
        where: {
          id: replyId,
          parent_id: threadId,
          author_id: userId
        }
      });

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found or you do not have permission to edit it'
        });
      }

      // Update the reply content
      await reply.update({ content });

      // Get updated reply with user info
      const updatedReply = await Thread.findByPk(replyId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        data: updatedReply,
        message: 'Reply updated successfully'
      });
  }

  // Delete a reply
  static async deleteReply(req, res) {
    const { threadId, replyId } = req.params;
    const userId = req.currentUser.id;

      // Find the reply (must be a reply to the specified thread)
      const reply = await Thread.findOne({
        where: {
          id: replyId,
          parent_id: threadId,
          author_id: userId
        }
      });

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found or you do not have permission to delete it'
        });
      }

      // Delete associated reactions first
      await Reaction.destroy({
        where: { thread_id: replyId }
      });

      // Delete the reply
      await reply.destroy();

      // Decrement parent thread's replies count
      await Thread.decrement('replies_count', { 
        where: { id: threadId } 
      });

      return res.status(200).json({
        success: true,
        message: 'Reply deleted successfully'
      });
  }

  // Get reply statistics for a thread
  static async getReplyStats(req, res) {
    const { threadId } = req.params;

      const replyCount = await Thread.count({
        where: { parent_id: threadId }
      });

      const likeCount = await Reaction.count({
        where: { 
          thread_id: threadId,
          type: 'like'
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          replyCount: replyCount,
          likeCount: likeCount
        }
      });
  }
}

module.exports = ReplyController;
