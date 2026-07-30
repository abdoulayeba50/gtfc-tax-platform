/**
 * Évite d'écrire des try/catch dans chaque controller.
 *
 * Sans ça, chaque fonction de controller async doit faire :
 *   try { ... } catch (err) { next(err); }
 *
 * Avec asyncHandler, on enveloppe simplement la fonction :
 *   router.get('/', asyncHandler(controller.list));
 *
 * Si une erreur (ou une Promise rejetée) survient, elle est automatiquement
 * transmise à next(), donc récupérée par le middleware errorHandler.
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
