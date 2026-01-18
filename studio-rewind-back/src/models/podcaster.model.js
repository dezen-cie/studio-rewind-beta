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
      allowNull: true
    },
    audio_url: {
      // URL de l'audio (ex: /audios/pod1.mp3)
      type: DataTypes.STRING,
      allowNull: true
    },
    display_order: {
      // Ordre d'affichage sur la page d'accueil (1, 2, 3...)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    team_display_order: {
      // Ordre d'affichage sur la page équipe (peut être différent de display_order)
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    is_active: {
      // Permet de masquer un podcasteur sans le supprimer
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    photo_url: {
      // Photo de profil pour la page équipe
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      // Description du podcasteur (max 450 mots)
      type: DataTypes.TEXT,
      allowNull: true
    },
    profile_online: {
      // Afficher le profil sur la page équipe
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    team_role: {
      // Rôle affiché sur la page équipe (ex: "CEO & Podcasteur", "CSO")
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Podcasteur'
    },
    is_core_team: {
      // Membres principaux de l'équipe (Karim, Gregory) affichés avant Clément
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    user_id: {
      // Lien vers le compte utilisateur du podcasteur
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // ====== Champs facturation ======
    is_billable: {
      // Si false = employé interne, pas de commission
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    billing_firstname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_lastname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_company: {
      // Nom de l'entreprise (optionnel)
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_siret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_postal_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_city: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Podcaster',
    tableName: 'podcasters'
  }
);

export default Podcaster;
