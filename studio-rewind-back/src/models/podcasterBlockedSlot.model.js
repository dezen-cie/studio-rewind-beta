// src/models/podcasterBlockedSlot.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PodcasterBlockedSlot extends Model {}

PodcasterBlockedSlot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // ID du podcasteur qui bloque ce creneau
    podcaster_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'podcasters',
        key: 'id'
      }
    },
    // Date du blocage
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Heure de debut du blocage (null = jour entier)
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    // Heure de fin du blocage (null = jour entier)
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    // true = jour entier bloque, false = creneau specifique
    is_full_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Raison du blocage (optionnel)
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'PodcasterBlockedSlot',
    tableName: 'podcaster_blocked_slots'
  }
);

export default PodcasterBlockedSlot;
