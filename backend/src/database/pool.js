/**
 * Point d'entree historique du pool de connexions.
 *
 * La configuration reelle de la connexion vit desormais dans
 * src/config/database.js (emplacement plus coherent avec l'architecture :
 * config/ pour la configuration, database/ reserve aux migrations/seeds).
 *
 * Ce fichier est conserve tel quel pour ne rien casser dans les modules
 * deja ecrits (ex: modules/auth/auth.repository.js fait
 * require('../../database/pool')). Il ne fait que re-exporter le meme pool.
 */

const { pool } = require('../config/database');

module.exports = pool;
