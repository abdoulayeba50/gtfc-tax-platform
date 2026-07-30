/**
 * Middleware centralisé de gestion des erreurs.
 * Doit être déclaré EN DERNIER dans app.js (après routes + notFound).
 *
 * Toutes les erreurs de l'application (services, controllers, validations,
 * erreurs 404, erreurs PostgreSQL...) finissent ici grâce à next(err) ou
 * asyncHandler. Un seul endroit gère le format de réponse d'erreur envoyé
 * au client : cohérence garantie sur toute l'API.
 */

const env = require('../config/env');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Erreur interne du serveur';

  // Log complet côté serveur (utile en dev, et pour debug en prod)
  console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);
  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
