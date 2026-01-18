// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { sequelize } from './models/index.js';
import { processScheduledCampaigns } from './services/emailing.service.js';
import { processReservationReminders } from './services/reminder.service.js';

const PORT = process.env.PORT || 4000;
const SYNC_DB = process.env.SYNC_DB === 'true';

console.log('🔁 Démarrage du serveur Studio Rewind...');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    if (SYNC_DB) {
      await sequelize.sync({ alter: true }); // dev uniquement
      console.log('✅ Modèles synchronisés avec la base de données');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);

      // Cron job: traite les campagnes programmées toutes les 5 minutes
      const FIVE_MINUTES = 5 * 60 * 1000;
      setInterval(async () => {
        try {
          const results = await processScheduledCampaigns();
          if (results.length > 0) {
            console.log(`📧 ${results.length} campagne(s) programmée(s) traitée(s)`);
          }
        } catch (err) {
          console.error('❌ Erreur traitement campagnes programmées:', err.message);
        }
      }, FIVE_MINUTES);

      // Exécuter une fois au démarrage pour traiter les campagnes en retard
      processScheduledCampaigns().then(results => {
        if (results.length > 0) {
          console.log(`📧 ${results.length} campagne(s) programmée(s) traitée(s) au démarrage`);
        }
      }).catch(err => {
        console.error('❌ Erreur traitement campagnes programmées au démarrage:', err.message);
      });

      // Cron job: traite les rappels de réservation toutes les 15 minutes
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      setInterval(async () => {
        try {
          const results = await processReservationReminders();
          if (results.sent > 0) {
            console.log(`📧 ${results.sent} rappel(s) de réservation envoyé(s)`);
          }
          if (results.failed > 0) {
            console.warn(`⚠️ ${results.failed} rappel(s) échoué(s)`);
          }
        } catch (err) {
          console.error('❌ Erreur traitement rappels réservation:', err.message);
        }
      }, FIFTEEN_MINUTES);

      // Exécuter une fois au démarrage pour traiter les rappels en retard
      processReservationReminders().then(results => {
        if (results.sent > 0) {
          console.log(`📧 ${results.sent} rappel(s) de réservation envoyé(s) au démarrage`);
        }
      }).catch(err => {
        console.error('❌ Erreur traitement rappels au démarrage:', err.message);
      });
    });
  } catch (error) {
    console.error(
      '❌ Erreur lors du démarrage du serveur :',
      error
    );
    process.exit(1);
  }
}

startServer();
