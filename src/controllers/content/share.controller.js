const { Reaction, Thread, User } = require('../../models');
const { notificationEmitter } = require('../../middlewares/notification.middleware');

class ShareController {
  // Generate shareable link for a thread
  static async generateShareableLink(req, res) {
    const { threadId } = req.params;

      // Check if thread exists
      const thread = await Thread.findByPk(threadId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'full_name']
          }
        ]
      });

      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Generate shareable link
      const shareableLink = `${req.protocol}://${req.get('host')}/thread/${threadId}`;
      const copyText = `Check out this thread by ${thread.author.username}: ${shareableLink}`;

      return res.status(200).json({
        success: true,
        data: {
          threadId: thread.id,
          threadContent: thread.content.substring(0, 100) + (thread.content.length > 100 ? '...' : ''),
          author: thread.author.username,
          shareableLink: shareableLink,
          copyText: copyText,
          encodedLink: encodeURIComponent(shareableLink),
          encodedText: encodeURIComponent(copyText)
        },
        message: 'Shareable link generated successfully'
      });
  }

  // Share a thread
  static async shareThread(req, res) {
    const { threadId } = req.params;
    const userId = req.currentUser.id;

      // Check if thread exists
      const thread = await Thread.findByPk(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Check if user already shared this thread
      const existingShare = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: 'SHARE'
        }
      });

      if (existingShare) {
        return res.status(400).json({
          success: false,
          message: 'You have already shared this thread'
        });
      }

      // Create the share reaction
      const share = await Reaction.create({
        user_id: userId,
        thread_id: threadId,
        type: 'SHARE'
      });

      // Get share with user info
      const shareWithUser = await Reaction.findByPk(share.id, {
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

      // Generate shareable link
      const shareableLink = `${req.protocol}://${req.get('host')}/thread/${threadId}`;

      // Emit notification if sharing someone else's thread
      if (thread.author_id !== userId) {
        const io = req.app.get('io');
        notificationEmitter.emit('share', {
          recipientId: thread.author_id,
          senderId: userId,
          contentId: threadId,
          type: 'SHARE',
          io: io
        });

        // Increment thread's shares count
        await Thread.increment('shares_count', { 
          where: { id: threadId } 
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          share: shareWithUser,
          shareableLink: shareableLink,
          copyText: `${shareWithUser.user.username} shared a thread: ${shareableLink}`
        },
        message: 'Thread shared successfully'
      });
  }

  // Unshare a thread
  static async unshareThread(req, res) {
    const { threadId, shareId } = req.params;
    const userId = req.currentUser.id;

      // Find the share reaction
      const share = await Reaction.findOne({
        where: {
          id: shareId,
          user_id: userId,
          thread_id: threadId,
          type: 'SHARE'
        }
      });

      if (!share) {
        return res.status(404).json({
          success: false,
          message: 'Share not found'
        });
      }

      await share.destroy();

      // Decrement thread's shares count
      await Thread.decrement('shares_count', { 
        where: { id: threadId } 
      });

      return res.status(200).json({
        success: true,
        message: 'Thread unshared successfully'
      });
  }

  // Get all shares for a thread
  static async getThreadShares(req, res) {
    const { threadId } = req.params;

      const { count, rows } = await Reaction.findAndCountAll({
        where: { 
          thread_id: threadId,
          type: 'SHARE'
        },
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
          shares: rows,
          total: count
        }
      });
  }

  // Get user's shared threads
  static async getUserShares(req, res) {
    const userId = req.currentUser.id;

      const { count, rows } = await Reaction.findAndCountAll({
        where: { 
          user_id: userId,
          type: 'SHARE'
        },
        include: [
          {
            model: Thread,
            as: 'thread',
            attributes: ['id', 'content', 'author_id'],
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'full_name', 'profile_picture_url']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          sharedThreads: rows,
          total: count
        }
      });
  }

  // Toggle share (share if not shared, unshare if already shared)
  static async toggleShare(req, res) {
    const { threadId } = req.params;
    const userId = req.currentUser.id;

      // Check if thread exists
      const thread = await Thread.findByPk(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // Check if user already shared this thread
      const existingShare = await Reaction.findOne({
        where: {
          user_id: userId,
          thread_id: threadId,
          type: 'SHARE'
        }
      });

      if (existingShare) {
        // Remove existing share and decrement count
        await existingShare.destroy();
        
        // Decrement thread's shares count
        await Thread.decrement('shares_count', { 
          where: { id: threadId } 
        });
        
        return res.status(200).json({
          success: true,
          data: { action: 'unshared' },
          message: 'Thread unshared successfully'
        });
      } else {
        // Add new share and increment count
        const share = await Reaction.create({
          user_id: userId,
          thread_id: threadId,
          type: 'SHARE'
        });

        // Get share with user info
        const shareWithUser = await Reaction.findByPk(share.id, {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'full_name', 'profile_picture_url']
            }
          ]
        });

        // Emit notification if sharing someone else's thread
        if (thread.author_id !== userId) {
          const io = req.app.get('io');
          notificationEmitter.emit('SHARE', {
            recipientId: thread.author_id,
            senderId: userId,
            contentId: threadId,
            type: 'SHARE',
            io: io
          });

          // Increment thread's shares count
          await Thread.increment('shares_count', { 
            where: { id: threadId } 
          });
        }

        return res.status(201).json({
          success: true,
          data: { action: 'shared', share: shareWithUser },
          message: 'Thread shared successfully'
        });
      }
  }

  // Get share statistics for a thread
  static async getShareStats(req, res) {
    const { threadId } = req.params;

      const shareCount = await Reaction.count({
        where: { 
          thread_id: threadId,
          type: 'SHARE'
        }
      });

      // Get thread with current shares count
      const thread = await Thread.findByPk(threadId, {
        attributes: ['shares_count']
      });

      return res.status(200).json({
        success: true,
        data: {
          shareCount: shareCount,
          sharesCount: thread ? thread.shares_count : 0
        }
      });
  }
}

module.exports = ShareController;
