/**
 * Routes du module commerces.
 *
 * Restrictions de role alignees sur la matrice de permissions deja seedee
 * dans database/schema.sql (table role_permissions) :
 *   - commerces.read   : les 4 roles
 *   - commerces.create : Super Admin, Admin Commune, Agent Terrain
 *   - commerces.update : Super Admin, Admin Commune, Superviseur
 *     (l'activation/desactivation est traitee comme une mise a jour)
 */

const express = require('express');
const router = express.Router();

const controller = require('./commerces.controller');
const validation = require('./commerces.validation');
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
  checkRole('Super Admin', 'Admin Commune', 'Agent Terrain'),
  validation.commerceBodyValidation,
  validate,
  controller.create
);

router.put(
  '/:id',
  checkRole('Super Admin', 'Admin Commune', 'Superviseur'),
  validation.idParam,
  validation.commerceBodyValidation,
  validate,
  controller.update
);

router.patch(
  '/:id/statut',
  checkRole('Super Admin', 'Admin Commune', 'Superviseur'),
  validation.idParam,
  validation.statutValidation,
  validate,
  controller.updateStatut
);

module.exports = router;
