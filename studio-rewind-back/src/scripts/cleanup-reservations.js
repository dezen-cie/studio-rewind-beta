// Script de nettoyage des réservations sans podcasteur
// À exécuter une seule fois après la migration vers le nouveau système
// Usage: node src/scripts/cleanup-reservations.js

import { Reservation, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

async function cleanupReservations() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('Connexion réussie.\n');

    // Compter les réservations sans podcasteur
    const count = await Reservation.count({
      where: {
        podcaster_id: { [Op.is]: null }
      }
    });

    if (count === 0) {
      console.log('Aucune réservation sans podcasteur à supprimer.');
      process.exit(0);
    }

    console.log(`${count} réservation(s) sans podcasteur trouvée(s).`);

    // Demander confirmation
    console.log('\nCes réservations vont être supprimées.');
    console.log('Appuyez sur Ctrl+C pour annuler ou attendez 5 secondes pour continuer...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Supprimer les réservations sans podcasteur
    const deleted = await Reservation.destroy({
      where: {
        podcaster_id: { [Op.is]: null }
      }
    });

    console.log(`${deleted} réservation(s) supprimée(s) avec succès.`);

  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

cleanupReservations();
