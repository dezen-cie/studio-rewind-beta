// src/models/index.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

import User from './user.model.js';
import Subscription from './subscription.model.js';
import Reservation from './reservation.model.js';
import Formula from './formula.model.js';
import FormulaOption from './formulaOption.model.js';
import BlockedSlot from './blockedSlot.model.js';
import Podcaster from './podcaster.model.js';
import PodcasterBlockedSlot from './podcasterBlockedSlot.model.js';
import PromoCode from './promoCode.model.js';
import PopupConfig from './popupConfig.model.js';
import EmailCampaign from './emailCampaign.model.js';

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
    },

    // Champs pour stocker la réponse
    reply_subject: {
      type: DataTypes.STRING,
      allowNull: true
    },

    reply_content: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    replied_at: {
      type: DataTypes.DATE,
      allowNull: true
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

// ====== Relations Formula ======
Formula.hasMany(FormulaOption, { foreignKey: 'formula_id', as: 'options' });
FormulaOption.belongsTo(Formula, { foreignKey: 'formula_id' });

// ====== Relations Podcaster ======
// Un podcasteur a un compte utilisateur
Podcaster.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Podcaster, { foreignKey: 'user_id', as: 'podcaster' });

// Une réservation est liée à un podcasteur
Podcaster.hasMany(Reservation, { foreignKey: 'podcaster_id', as: 'reservations' });
Reservation.belongsTo(Podcaster, { foreignKey: 'podcaster_id', as: 'podcaster' });

// Un podcasteur peut avoir plusieurs creneaux bloques
Podcaster.hasMany(PodcasterBlockedSlot, { foreignKey: 'podcaster_id', as: 'blockedSlots' });
PodcasterBlockedSlot.belongsTo(Podcaster, { foreignKey: 'podcaster_id', as: 'podcaster' });

export {
  sequelize,
  User,
  Subscription,
  Reservation,
  Message,
  Formula,
  FormulaOption,
  BlockedSlot,
  Podcaster,
  PodcasterBlockedSlot,
  PromoCode,
  PopupConfig,
  EmailCampaign
};
