const { body, param, query } = require('express-validator');

const STATUTS = ['en_attente', 'partiellement_payee', 'payee', 'annulee'];

const idParam = [param('id').isInt().withMessage("L'identifiant doit être un entier")];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('statut').optional().isIn(STATUTS).withMessage(`statut doit être l'un de : ${STATUTS.join(', ')}`),
  query('commerce_id').optional().isInt(),
  query('periode').optional().matches(/^\d{4}-\d{2}$/).withMessage('periode doit être au format YYYY-MM'),
];

const createValidation = [
  body('taxe_id').isInt().withMessage('La taxe est requise'),
  body('montant').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('date_echeance').isISO8601().withMessage("La date d'échéance est requise"),
  body('periode_debut').isISO8601().withMessage('La période de début est requise'),
  body('periode_fin')
    .isISO8601()
    .withMessage('La période de fin est requise')
    .custom((value, { req }) => {
      if (value < req.body.periode_debut) {
        throw new Error('La période de fin doit être postérieure ou égale à la période de début');
      }
      return true;
    }),
];

const updateValidation = [
  body('montant').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('date_echeance').isISO8601().withMessage("Date d'échéance invalide"),
];

const statutValidation = [
  body('statut').isIn(STATUTS).withMessage(`"statut" doit être l'un de : ${STATUTS.join(', ')}`),
];

module.exports = { idParam, listValidation, createValidation, updateValidation, statutValidation, STATUTS };
