const { body, param, query } = require('express-validator');

const FREQUENCES = ['journaliere', 'hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle'];

const idParam = [param('id').isInt().withMessage("L'identifiant doit être un entier")];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const taxeBodyValidation = [
  body('commerce_id').isInt().withMessage('Le commerce est requis'),
  body('categorie_id').isInt().withMessage('La catégorie est requise'),
  body('nom').trim().notEmpty().withMessage('Le nom de la taxe est requis'),
  body('description').optional({ nullable: true, checkFalsy: true }).isString(),
  body('montant').isFloat({ min: 0 }).withMessage('Le montant doit être un nombre positif'),
  body('frequence').isIn(FREQUENCES).withMessage(`La fréquence doit être l'une de : ${FREQUENCES.join(', ')}`),
  body('date_debut').isISO8601().withMessage('Date de début invalide'),
  body('date_fin')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      if (value && req.body.date_debut && value < req.body.date_debut) {
        throw new Error('La date de fin doit être postérieure ou égale à la date de début');
      }
      return true;
    }),
];

const statutValidation = [body('actif').isBoolean().withMessage('"actif" doit être un booléen')];

module.exports = { idParam, listValidation, taxeBodyValidation, statutValidation };
