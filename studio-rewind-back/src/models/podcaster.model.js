// src/models/podcaster.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Podcaster extends Model {}

Podcaster.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    video_url: {
      // URL de la vidéo (ex: /videos/video-podcasteur1.mp4)
      type: DataTypes.STRING,
      allowNull: false
    },
    audio_url: {
      // URL de l'audio (ex: /audios/pod1.mp3)
      type: DataTypes.STRING,
      allowNull: false
    },
    display_order: {
      // Ordre d'affichage (1, 2, 3...)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      // Permet de masquer un podcasteur sans le supprimer
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    user_id: {
      // Lien vers le compte utilisateur du podcasteur
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'Podcaster',
    tableName: 'podcasters'
  }
);

export default Podcaster;
