/**
 * Middleware global de contrôle d'accès par rôle.
 *
 * Doit toujours être utilisé APRÈS verifyToken (car il dépend de req.user).
 * C'est une factory : on lui passe la liste des rôles autorisés et elle
 * retourne le middleware Express correspondant.
 *
 * Usage futur :
 *   router.delete('/:id', verifyToken, checkRole('admin'), controller.remove);
 *   router.get('/', verifyToken, checkRole('admin', 'superviseur'), controller.list);
 */

const ApiError = require('../utils/ApiError');

function checkRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentification requise'));
    }

    if (!rolesAutorises.includes(req.user.role)) {
      return next(new ApiError(403, "Accès refusé : rôle insuffisant"));
    }

    next();
  };
}

module.exports = checkRole;
