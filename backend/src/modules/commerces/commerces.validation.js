const { body, param, query } = require('express-validator');

const idParam = [param('id').isInt().withMessage("L'identifiant doit être un entier")];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const commerceBodyValidation = [
  body('nom_commerce').trim().notEmpty().withMessage('Le nom du commerce est requis'),
  body('nom_proprietaire').trim().notEmpty().withMessage('Le nom du propriétaire est requis'),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('adresse').trim().notEmpty().withMessage("L'adresse est requise"),
  body('commune_id').isInt().withMessage('La commune est requise'),
  body('quartier_id').isInt().withMessage('Le quartier est requis'),
  body('categorie_id').isInt().withMessage("Le secteur d'activité est requis"),
  body('numero_registre').optional({ nullable: true, checkFalsy: true }).isString(),
  body('numero_ninea').optional({ nullable: true, checkFalsy: true }).isString(),
  body('latitude').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
  body('longitude').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide'),
];

const statutValidation = [
  body('statut').isIn(['actif', 'inactif']).withMessage('"statut" doit être "actif" ou "inactif"'),
];

module.exports = { idParam, listValidation, commerceBodyValidation, statutValidation };
