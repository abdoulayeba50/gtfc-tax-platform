/**
 * Middleware exécuté quand aucune route ne correspond à la requête.
 * Doit être déclaré APRÈS toutes les routes dans app.js.
 */

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
