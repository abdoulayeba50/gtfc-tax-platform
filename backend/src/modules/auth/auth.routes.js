/**
 * Routes du module auth.
 * Seule route exposée : le login. Pas d'inscription publique (les comptes
 * agents/admins seront créés plus tard via le module Utilisateurs, par un admin).
 */

const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { loginValidation, validate } = require('./auth.validation');

router.post('/login', loginValidation, validate, authController.login);

module.exports = router;
