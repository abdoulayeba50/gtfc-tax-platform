/**
 * Point d'entree du backend.
 * Responsabilite : demarrer le serveur HTTP, verifier la base de donnees
 * au demarrage, et fermer proprement les connexions a l'arret.
 */

const app = require('./app');
const env = require('./config/env');
const { pool, testConnection } = require('./config/database');

async function start() {
  try {
    // Verifie que la base de donnees est joignable avant de demarrer l'API.
    // Mieux vaut echouer immediatement et clairement plutot que de demarrer
    // un serveur qui plantera a la premiere requete SQL.
    await testConnection();
    console.log('✅ Connecté à PostgreSQL');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Serveur GTFC démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
    });

    // Arret propre : sur un signal d'arret (Ctrl+C, redeploiement...),
    // on arrete d'accepter de nouvelles requetes puis on ferme le pool
    // PostgreSQL, pour ne pas laisser de connexions ouvertes en base.
    const shutdown = async (signal) => {
      console.log(`\n${signal} reçu, arrêt propre du serveur...`);
      server.close(async () => {
        await pool.end();
        console.log('✅ Pool PostgreSQL fermé. Arrêt terminé.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Échec du démarrage du serveur : base de données injoignable.');
    console.error(err.message);
    process.exit(1);
  }
}

start();
