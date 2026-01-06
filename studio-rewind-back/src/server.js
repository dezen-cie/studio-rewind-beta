// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { sequelize } from './models/index.js';

const PORT = process.env.PORT || 4000;
const SYNC_DB = process.env.SYNC_DB === 'true';

console.log('🔁 Démarrage du serveur Studio Rewind...');

// Fonction pour ajouter des valeurs aux enums PostgreSQL si elles n'existent pas
async function updateEnums() {
  try {
    // Vérifier si 'reseaux' existe dans l'enum
    const [results] = await sequelize.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_reservations_formula')
    `);

    const existingValues = results.map(r => r.enumlabel);

    if (!existingValues.includes('reseaux')) {
      await sequelize.query(`ALTER TYPE enum_reservations_formula ADD VALUE 'reseaux'`);
      console.log('✅ Valeur "reseaux" ajoutée à enum_reservations_formula');
    }
  } catch (error) {
    // L'enum n'existe peut-être pas encore, ce sera créé par sync
    console.log('ℹ️ Mise à jour enum ignorée (sera créé par sync)');
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Mettre à jour les enums avant le sync
    await updateEnums();

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
