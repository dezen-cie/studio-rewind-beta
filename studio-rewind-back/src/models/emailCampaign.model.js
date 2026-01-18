// src/models/emailCampaign.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EmailCampaign extends Model {}

EmailCampaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Nom interne de la campagne
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Objet de l'email
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Contenu HTML de l'email
    html_content: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    // Statut de la campagne
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'failed'),
      defaultValue: 'draft'
    },

    // ID de la campagne Brevo (si envoyee)
    brevo_campaign_id: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Stats
    emails_sent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    emails_opened: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    emails_clicked: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    // Liste des emails cibles (JSON array)
    recipients: {
      type: DataTypes.JSON,
      allowNull: true
    },

    // Date d'envoi effectif
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Date d'envoi programmee (null = envoi immediat)
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'EmailCampaign',
    tableName: 'email_campaigns'
  }
);

export default EmailCampaign;
