// src/models/index.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

import User from './user.model.js';
import Subscription from './subscription.model.js';
import Reservation from './reservation.model.js';
import Formula from './formula.model.js';
import BlockedSlot from './blockedSlot.model.js';

// ====== Modèle Message ======
class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('new', 'read', 'archived'),
      defaultValue: 'new'
    }
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages'
  }
);

// ====== Relations ======
User.hasOne(Subscription, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});
Subscription.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Reservation, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});
Reservation.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Message, {
  foreignKey: 'user_id',
  onDelete: 'SET NULL'
});
Message.belongsTo(User, { foreignKey: 'user_id' });

// Pas de relation particulière pour Formula pour l’instant

export {
  sequelize,
  User,
  Subscription,
  Reservation,
  Message,
  Formula,
  BlockedSlot
};
