const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  recipient_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sender_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  target_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('REPLY', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPT', 'LIKE', 'REPOST'),
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  indexes: [
    {
      fields: ['recipient_id', 'created_at']
    },
    {
      fields: ['recipient_id', 'is_read']
    },
    {
      fields: ['sender_id', 'created_at']
    }
  ]
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.is_read = true;
  this.read_at = new Date();
  await this.save();
  return this;
};

// Class methods
Notification.getUnreadCount = async function(userId) {
  const result = await this.count({
    where: {
      recipient_id: userId,
      is_read: false
    }
  });
  return result;
};

Notification.findByUserId = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const where = { recipient_id: userId };
  
  if (unreadOnly) {
    where.is_read = false;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await this.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: sequelize.models.User,
        as: 'sender',
        attributes: ['id', 'username', 'name', 'avatar']
      },
      {
        model: sequelize.models.User,
        as: 'recipient',
        attributes: ['id', 'username', 'name', 'avatar']
      }
    ]
  });

  return {
    notifications: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
};

// Associations
Notification.associate = function(models) {
  Notification.belongsTo(models.User, {
    foreignKey: 'recipient_id',
    as: 'recipient'
  });
  
  Notification.belongsTo(models.User, {
    foreignKey: 'sender_id',
    as: 'sender'
  });
};

module.exports = Notification;
