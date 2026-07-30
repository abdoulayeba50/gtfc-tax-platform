/**
 * Règles de validation des données entrantes du module auth.
 * Utilise express-validator. Le controller reste ainsi totalement
 * déchargé de la validation : il ne reçoit que des données déjà valides.
 */

const { body, validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis")
    .isEmail().withMessage("Format d'email invalide"),

  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

/**
 * Middleware générique qui lit les erreurs collectées par les règles
 * ci-dessus et les transforme en ApiError 422 exploitable par errorHandler.
 * Réutilisable par les futures validations d'autres modules.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ champ: e.path, message: e.msg }));
    return next(new ApiError(422, 'Données invalides', details));
  }

  next();
}

module.exports = { loginValidation, validate };
