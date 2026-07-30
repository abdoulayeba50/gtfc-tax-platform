/**
 * Erreur personnalisée utilisée dans toute l'application.
 *
 * Plutôt que de lancer des erreurs génériques (throw new Error("...")),
 * les services lanceront des ApiError avec un statusCode HTTP précis.
 * Le middleware errorHandler saura alors quoi renvoyer au client.
 *
 * Exemple d'utilisation future (dans un service) :
 *   throw new ApiError(404, "Commerce introuvable");
 */

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // permet de distinguer une erreur "prévue" d'un bug

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
