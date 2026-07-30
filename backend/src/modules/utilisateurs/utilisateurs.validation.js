const { body, param, query } = require('express-validator');

const idParam = [param('id').isInt().withMessage("L'identifiant doit être un entier")];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page doit être un entier >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit être entre 1 et 100'),
];

const createValidation = [
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').trim().notEmpty().withMessage("L'email est requis").isEmail().withMessage("Format d'email invalide"),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('role_id').isInt().withMessage('Le rôle est requis'),
  body('commune_id').optional({ nullable: true }).isInt().withMessage('Commune invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

const updateValidation = [
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').trim().notEmpty().withMessage("L'email est requis").isEmail().withMessage("Format d'email invalide"),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('role_id').isInt().withMessage('Le rôle est requis'),
  body('commune_id').optional({ nullable: true }).isInt().withMessage('Commune invalide'),
];

const statutValidation = [body('actif').isBoolean().withMessage('"actif" doit être un booléen')];

module.exports = { idParam, listValidation, createValidation, updateValidation, statutValidation };
