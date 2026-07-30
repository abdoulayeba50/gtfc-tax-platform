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

const app = express();

// --- Sécurité HTTP de base (headers) ---
app.use(helmet());

// --- CORS : autorise le dashboard / l'app mobile à consommer l'API ---
app.use(
  cors({
    origin: env.CORS_ORIGIN,
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
