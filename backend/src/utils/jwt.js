/**
 * Utilitaire centralisé pour tout ce qui concerne les JWT.
 *
 * Placé dans utils/ (et non dans modules/auth/) car verifyToken sera
 * appelé par le middleware global src/middlewares/verifyToken.js,
 * potentiellement utilisé par n'importe quel module protégé (pas seulement
 * le module auth). Le module auth, lui, ne fait qu'appeler generateToken()
 * au moment du login.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Génère un JWT signé à partir d'un payload (id, email, role, commune_id...).
 * On ne met JAMAIS de données sensibles (mot de passe) dans le payload :
 * le JWT n'est pas chiffré, seulement signé (n'importe qui peut le décoder).
 */
function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Vérifie la signature et l'expiration d'un token.
 * Lève une erreur (jsonwebtoken) si le token est invalide/expiré,
 * à charge du middleware appelant de la transformer en ApiError.
 */
function verifyJwt(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { generateToken, verifyJwt };
