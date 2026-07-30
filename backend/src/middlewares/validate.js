/**
 * Middleware de validation generique, base sur express-validator.
 *
 * Le module auth avait sa propre fonction "validate" locale a
 * auth.validation.js. Plutot que de la dupliquer ou de toucher au module
 * Auth (explicitement interdit dans cette tache), ce fichier centralise la
 * meme logique pour tous les NOUVEAUX modules (utilisateurs, et les
 * suivants). Le module Auth continue de fonctionner exactement comme avant.
 */

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ champ: e.path, message: e.msg }));
    return next(new ApiError(422, 'Données invalides', details));
  }

  next();
}

module.exports = validate;
