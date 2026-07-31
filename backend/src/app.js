/**
 * Configuration de l'application Express.
 *
 * Séparé de server.js à dessein : app.js décrit "ce qu'est" l'application
 * (middlewares, routes), server.js décrit "comment on la démarre" (écoute
 * du port). Cette séparation facilite aussi les tests automatisés plus tard
 * (on peut importer `app` sans démarrer un vrai serveur HTTP).
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// --- Sécurité HTTP de base (headers) ---
app.use(helmet());

// --- CORS : autorise le dashboard (PC ET téléphone sur le même réseau) ---
app.use(
  cors({
    origin(requestOrigin, callback) {
      // Pas d'origine = appel non-navigateur (curl, Postman, app mobile
      // native...) : toujours autorisé, il n'y a pas de notion de CORS
      // en dehors d'un navigateur.
      if (!requestOrigin) return callback(null, true);

      if (env.CORS_ORIGINS === '*' || env.CORS_ORIGINS.includes(requestOrigin)) {
        return callback(null, true);
      }

      callback(new ApiError(403, `Origine non autorisée par CORS : ${requestOrigin}`));
    },
    credentials: true,
  })
);

// --- Logs des requêtes HTTP (format "dev" lisible en développement) ---
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Parsing du corps des requêtes ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes de l'API, toutes préfixées par /api ---
app.use('/api', routes);

// --- 404 : aucune route ne correspond ---
app.use(notFound);

// --- Gestion centralisée des erreurs (toujours en dernier) ---
app.use(errorHandler);

module.exports = app;
