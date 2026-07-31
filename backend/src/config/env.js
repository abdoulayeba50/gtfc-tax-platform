/**
 * Centralise la lecture des variables d'environnement.
 *
 * But : ne jamais faire de "process.env.XXX" dispersé dans tout le code.
 * Tous les autres fichiers importent ce module pour connaître la config.
 * Ça facilite la maintenance et évite les fautes de frappe sur les noms de variables.
 */

require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: process.env.PORT || 5000,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',

  /**
   * CORS_ORIGIN accepte une liste d'origines separees par des virgules
   * (ex: "http://localhost:3000,http://192.168.1.8:3000"), pour autoriser
   * simultanement le PC et un ou plusieurs appareils sur le meme reseau.
   * "*" reste supporte tel quel pour un usage ponctuel/debug.
   */
  CORS_ORIGINS:
    process.env.CORS_ORIGIN === '*'
      ? '*'
      : (process.env.CORS_ORIGIN || 'http://localhost:3000')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
};

module.exports = env;
