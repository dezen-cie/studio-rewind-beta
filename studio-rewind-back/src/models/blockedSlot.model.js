// src/models/blockedSlot.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlockedSlot extends Model {}

BlockedSlot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Date du blocage (sans heure, pour les jours entiers ou pour regrouper)
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Heure de début du blocage (null = jour entier)
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    // Heure de fin du blocage (null = jour entier)
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    // true = jour entier bloqué, false = créneau spécifique
    is_full_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Raison du blocage (optionnel, pour l'admin)
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // ID de l'admin qui a créé le blocage
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'BlockedSlot',
    tableName: 'blocked_slots'
  }
);

export default BlockedSlot;
