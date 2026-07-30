/**
 * Couche métier du module auth.
 * Toute la logique de "comment on authentifie quelqu'un" vit ici,
 * jamais dans le controller (qui ne fait que router la requête/réponse HTTP).
 */

const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const { generateToken } = require('../../utils/jwt');
const authRepository = require('./auth.repository');

/**
 * Authentifie un utilisateur avec email + mot de passe.
 * Retourne le token JWT + les infos publiques de l'utilisateur (sans mot de passe).
 */
async function login(email, motDePasse) {
  const utilisateur = await authRepository.findByEmail(email);

  // Message volontairement identique que l'email n'existe pas OU que le mot
  // de passe soit faux : on ne révèle jamais si un email existe en base.
  if (!utilisateur) {
    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  if (!utilisateur.actif) {
    throw new ApiError(403, 'Ce compte a été désactivé. Contactez un administrateur.');
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
  if (!motDePasseValide) {
    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  // Payload du JWT : uniquement les infos nécessaires pour identifier
  // l'utilisateur et vérifier ses droits (jamais le mot de passe, même hashé).
  const payload = {
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
    commune_id: utilisateur.commune_id,
  };

  const token = generateToken(payload);

  return {
    token,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      commune_id: utilisateur.commune_id,
    },
  };
}

module.exports = { login };
