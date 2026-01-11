const { Notification, User, Follow } = require("../../models/index");
const { formatDate } = require("../../utils/formatDate"); // Assure-toi d'avoir un utilitaire de date ou utilise une lib

class NotificationController {
  
  static async getNotifications(req, res) {
    try {
        const userId = req.user.userId || req.user.id;
        
const currentUser = await User.findByPk(userId);
if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
}

        // --- 1. Récupérer les Demandes de Suivi (Si Privé) ---
        let requestsData = [];
        
        if (currentUser.is_private) {
            const pendingFollows = await Follow.findAll({
                where: { 
                    following_id: userId, 
                    status: 'PENDING' 
                },
                include: [
                    {
                        model: User,
                        as: 'follower',
                        attributes: ['id', 'username', 'full_name', 'profile_picture_url']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // Formater pour le frontend
            requestsData = pendingFollows.map(f => ({
                id: f.follower.id, // On utilise l'ID du user comme clé pour accepter/refuser
                user: {
                    id: f.follower.id,
                    name: f.follower.full_name,
                    username: `@${f.follower.username}`,
                    avatar: f.follower.profile_picture_url || "https://via.placeholder.com/150"
                },
                time: "Recently" // Tu peux utiliser une librairie comme 'dayjs' ou 'moment' ici
            }));
        }

        // --- 2. Récupérer les Notifications Classiques ---
        const rawNotifications = await Notification.findAll({
            where: { recipient_id: userId },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'username', 'full_name', 'profile_picture_url']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Filtrer et Formater
        const notificationsData = rawNotifications
            .filter(n => {
                // Si je suis PRIVE, je ne veux PAS voir les FOLLOW_REQUEST ici (elles sont dans requestsData)
                if (currentUser.is_private && n.type === 'FOLLOW_REQUEST') return false;
                return true;
            })
            .map(n => {
                // Mapper les types de la DB vers les types du Frontend
                let type = 'system';
                let message = 'interaction';
                
                switch(n.type) {
                    case 'LIKE': type = 'like'; message = 'liked your thread'; break;
                    case 'REPLY': type = 'reply'; message = 'replied to your thread'; break;
                    case 'FOLLOW_REQUEST': type = 'follow'; message = 'started following you'; break; // Pour compte public
                    case 'FOLLOW_ACCEPT': type = 'follow'; message = 'accepted your follow request'; break;
                }

                return {
                    id: n.id,
                    type: type,
                    user: {
                        name: n.sender.full_name,
                        username: `@${n.sender.username}`,
                        avatar: n.sender.profile_picture_url || "https://via.placeholder.com/150"
                    },
                    message: message,
                    time: new Date(n.created_at).toLocaleDateString(), // Simplifié
                    read: n.is_read
                };
            });

        return res.status(200).json({
            isPrivate: currentUser.is_private,
            followRequests: requestsData,
            notifications: notificationsData
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);
        return res.status(500).json({ message: "Unable to fetch notifications" });
    }
  }

  static async markNotificationAsRead(req, res) {
      try {
          const { id } = req.params;
          await Notification.update(
              { is_read: true }, 
              { where: { id: id, recipient_id: req.user.id } }
          );
          return res.status(200).json({ success: true });
      } catch (e) {
          return res.status(500).json({ error: e.message });
      }
  }

  static async deleteNotification(req, res) {
      // Optionnel
  }
  static async clearAllNotifications(req, res) {
       // Optionnel
  }
}

module.exports = NotificationController;