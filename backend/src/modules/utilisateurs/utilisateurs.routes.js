/**
 * Routes du module utilisateurs.
 *
 * Toutes protegees par verifyToken (session valide obligatoire). La
 * creation/modification/activation sont en plus reservees aux roles
 * "Super Admin" et "Admin Commune" via checkRole — reutilisation directe
 * des middlewares du module Auth, sans aucune modification de ce dernier.
 */

const express = require('express');
const router = express.Router();

const controller = require('./utilisateurs.controller');
const validation = require('./utilisateurs.validation');
const validate = require('../../middlewares/validate');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

router.use(verifyToken);

// Doit être déclarée avant '/:id' pour ne pas être capturée comme un id.
router.get('/options', controller.getFormOptions);

router.get('/', validation.listValidation, validate, controller.list);
router.get('/:id', validation.idParam, validate, controller.getOne);

router.post(
  '/',
  checkRole('Super Admin', 'Admin Commune'),
  validation.createValidation,
  validate,
  controller.create
);

router.put(
  '/:id',
  checkRole('Super Admin', 'Admin Commune'),
  validation.idParam,
  validation.updateValidation,
  validate,
  controller.update
);

router.patch(
  '/:id/statut',
  checkRole('Super Admin', 'Admin Commune'),
  validation.idParam,
  validation.statutValidation,
  validate,
  controller.updateStatut
);

module.exports = router;
