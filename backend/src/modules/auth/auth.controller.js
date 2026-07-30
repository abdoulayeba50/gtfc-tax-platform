/**
 * Couche controller du module auth.
 * Rôle strict : lire req, appeler le service, renvoyer res.
 * Aucune logique métier ici (elle est dans auth.service.js).
 */

const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const { email, mot_de_passe } = req.body;

  const { token, utilisateur } = await authService.login(email, mot_de_passe);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: { token, utilisateur },
  });
});

module.exports = { login };
