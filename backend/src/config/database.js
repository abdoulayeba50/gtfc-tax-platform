/**
 * Configuration de la connexion PostgreSQL.
 *
 * Source unique de vérité pour le pool de connexions : tout le reste de
 * l'application (repositories, health check, server.js) passe par ce
 * fichier plutôt que de créer son propre Pool.
 *
 * Pourquoi un pool et pas une connexion unique ?
 * Express traite plusieurs requêtes HTTP en parallèle. Un pool garde un
 * ensemble de connexions ouvertes et les réutilise, au lieu d'ouvrir/fermer
 * une connexion TCP à chaque requête SQL (coûteux et plus lent).
 */

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  max: 20,                       // nombre max de connexions simultanées dans le pool
  idleTimeoutMillis: 30000,      // ferme les connexions inactives après 30s
  connectionTimeoutMillis: 5000, // abandonne une tentative de connexion après 5s
});

/**
 * Erreur sur une connexion du pool APRES qu'elle ait été établie (ex: la
 * base redémarre, coupure réseau). On log clairement plutôt que de laisser
 * Node planter avec une stack trace illisible.
 */
pool.on('error', (err) => {
  console.error('❌ Erreur inattendue sur le pool PostgreSQL :', err.message);
});

/**
 * Vérifie que la base de données est bien joignable.
 * Utilisé au démarrage du serveur (server.js) ET par la route /health,
 * pour ne pas dupliquer la logique de vérification à deux endroits.
 *
 * On prend un client dédié du pool (plutôt que pool.query directement)
 * pour être certain de tester une vraie connexion, puis on le relâche
 * immédiatement dans le pool avec release().
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

module.exports = { pool, testConnection };
