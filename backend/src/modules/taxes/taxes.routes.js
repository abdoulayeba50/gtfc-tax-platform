/**
 * Routes du module taxes.
 *
 * Restriction de role : dans la matrice deja seedee (database/schema.sql,
 * table role_permissions), les permissions "taxes.*" ne sont accordees qu'a
 * "Super Admin" et "Admin Commune" (ni Superviseur, ni Agent Terrain n'ont
 * de permission taxes.read/create/update). Ce module respecte fidelement
 * cette matrice deja definie, y compris pour la lecture.
 */

const express = require('express');
const router = express.Router();

const controller = require('./taxes.controller');
const validation = require('./taxes.validation');
const validate = require('../../middlewares/validate');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const ROLES_AUTORISES = ['Super Admin', 'Admin Commune'];

router.use(verifyToken);
router.use(checkRole(...ROLES_AUTORISES));

// Doit être déclarée avant '/:id' pour ne pas être capturée comme un id.
router.get('/options', controller.getFormOptions);

router.get('/', validation.listValidation, validate, controller.list);
router.get('/:id', validation.idParam, validate, controller.getOne);

router.post('/', validation.taxeBodyValidation, validate, controller.create);

router.put('/:id', validation.idParam, validation.taxeBodyValidation, validate, controller.update);

router.patch('/:id/statut', validation.idParam, validation.statutValidation, validate, controller.updateStatut);

module.exports = router;
