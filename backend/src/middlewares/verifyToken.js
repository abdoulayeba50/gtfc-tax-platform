/**
 * Middleware global (utilisable par TOUS les futurs modules, pas seulement auth).
 *
 * Vérifie la présence et la validité du token JWT dans le header :
 *   Authorization: Bearer <token>
 *
 * Si valide, attache les infos du token à req.user pour que les controllers
 * et checkRole puissent ensuite savoir qui fait la requête et avec quel rôle.
 *
 * Usage futur dans un module protégé :
 *   router.get('/', verifyToken, controller.list);
 */

const ApiError = require('../utils/ApiError');
const { verifyJwt } = require('../utils/jwt');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentification requise : token manquant'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);
    // decoded contient le payload signé au login : { id, email, role, commune_id }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token invalide ou expiré'));
  }
}

module.exports = verifyToken;
