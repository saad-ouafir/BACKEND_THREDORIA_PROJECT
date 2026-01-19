const { Reaction, Thread, User } = require('../../models');
const { notificationEmitter } = require('../../middlewares/notification.middleware');

class ReactionController {
  // Add a reaction to a thread
  static async addReaction(req, res) {
    const { threadId } = req.params;
    const { type } = req.body;
    const userId = req.currentUser.id;

      // Check if thread exists
      const thread = await Thread.findByPk(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Check if user already reacted with this type
      const existingReaction = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: type
        }
      });

      if (existingReaction) {
        return res.status(400).json({
          success: false,
          message: `You have already ${type.toLowerCase()}d this thread`
        });
      }

      // Create the reaction
      const reaction = await Reaction.create({
        user_id: userId,
        thread_id: threadId,
        type: type
      });

      // Get reaction with user info
      const reactionWithUser = await Reaction.findByPk(reaction.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          },
          {
            model: Thread,
            as: 'thread',
            attributes: ['id', 'content']
          }
        ]
      });

      // Emit notification if user is not reacting to their own content
      if (thread.author_id !== userId) {
        const io = req.app.get('io');
        notificationEmitter.emit('like', {
          recipientId: thread.author_id,
          senderId: userId,
          contentId: threadId,
          type: 'LIKE',
          io: io
        });

        // Increment thread's likes count
        await Thread.increment('likes_count', { 
          where: { id: threadId } 
        });
      }

      return res.status(201).json({
        success: true,
        data: reactionWithUser,
        message: `${type} added successfully`
      });
  }

  // Remove a reaction from a thread
  static async removeReaction(req, res) {
    const { threadId, reactionId } = req.params;
    const userId = req.currentUser.id;

      // Find the reaction
      const reaction = await Reaction.findOne({
        where: {
          id: reactionId,
          user_id: userId,
          thread_id: threadId
        }
      });

      if (!reaction) {
        return res.status(404).json({
          success: false,
          message: 'Reaction not found'
        });
      }

      await reaction.destroy();

      // Decrement thread's likes count
      await Thread.decrement('likes_count', { 
        where: { id: threadId } 
      });

      return res.status(200).json({
        success: true,
        message: 'Reaction removed successfully'
      });
  }

  // Get all reactions for a thread
  static async getThreadReactions(req, res) {
    const { threadId } = req.params

      const { count, rows } = await Reaction.findAndCountAll({
        where: { thread_id: threadId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          reactions: rows,
        }
      });
  }

  // Get user's reactions
  static async getUserReactions(req, res) {
    const userId = req.currentUser.id;
    const { type } = req.query;
      const where = { user_id: userId };

      if (type) {
        where.type = type.toUpperCase();
      }

      const { count, rows } = await Reaction.findAndCountAll({
        where,
        include: [
          {
            model: Thread,
            as: 'thread',
            attributes: ['id', 'content', 'author_id']
          }
        ],

        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          reactions: rows
        }
      });
  }

  // Toggle reaction (add if doesn't exist, remove if it does)
  static async toggleReaction(req, res) {
    const { threadId } = req.params;
    const { type } = req.body;
    const userId = req.currentUser.id;

      // Check if thread exists
      const thread = await Thread.findByPk(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Check if reaction already exists
      const existingReaction = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: type
        }
      });

      if (existingReaction) {
        // Remove existing reaction and decrement count
        await existingReaction.destroy();
        
        // Decrement thread's likes count
        await Thread.decrement('likes_count', { 
          where: { id: threadId } 
        });
        
        return res.status(200).json({
          success: true,
          data: { action: 'removed', type: type },
          message: `${type} removed successfully`
        });
      } else {
        // Add new reaction and increment count
        const reaction = await Reaction.create({
          user_id: userId,
          thread_id: threadId,
          type: type
        });

        // Get reaction with user info
        const reactionWithUser = await Reaction.findByPk(reaction.id, {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'full_name', 'profile_picture_url']
            }
          ]
        });

        // Emit notification if user is not reacting to their own content
        if (thread.author_id !== userId) {
          const io = req.app.get('io');
          notificationEmitter.emit('like', {
            recipientId: thread.author_id,
            senderId: userId,
            contentId: threadId,
            type: 'LIKE',
            io: io
          });

          // Increment thread's likes count
          await Thread.increment('likes_count', { 
            where: { id: threadId } 
          });
        }

        return res.status(201).json({
          success: true,
          data: { action: 'added', reaction: reactionWithUser },
          message: `${type} added successfully`
        });
      }
  }
}

module.exports = ReactionController;