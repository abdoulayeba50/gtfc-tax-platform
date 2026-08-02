/**
 * Routes du module creances.
 *
 * Une creance decoule toujours d'une taxe : meme restriction de role que
 * le module Taxes (Super Admin, Admin Commune uniquement), par coherence —
 * la matrice de permissions seedee dans schema.sql ne prevoit pas non plus
 * de permission "creances.*" pour Superviseur/Agent Terrain.
 */

const express = require('express');
const router = express.Router();

const controller = require('./creances.controller');
const validation = require('./creances.validation');
const validate = require('../../middlewares/validate');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const ROLES_AUTORISES = ['Super Admin', 'Admin Commune'];

router.use(verifyToken);
router.use(checkRole(...ROLES_AUTORISES));

// Doit être déclarée avant '/:id' pour ne pas être capturée comme un id.
router.get('/options', controller.getFormOptions);

// Génération en lot : POST /api/creances/generer (avant '/:id' pour la même raison).
router.post('/generer', controller.generer);

router.get('/', validation.listValidation, validate, controller.list);
router.get('/:id', validation.idParam, validate, controller.getOne);

router.post('/', validation.createValidation, validate, controller.create);

router.put('/:id', validation.idParam, validation.updateValidation, validate, controller.update);

router.patch('/:id/statut', validation.idParam, validation.statutValidation, validate, controller.updateStatut);

module.exports = router;
