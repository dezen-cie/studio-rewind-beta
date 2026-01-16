// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { sequelize } from './models/index.js';

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
