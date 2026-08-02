/**
 * Point d'entrée central de toutes les routes de l'API.
 *
 * Chaque futur module (auth, utilisateurs, communes, commerces, taxes...)
 * exposera son propre router dans src/modules/<module>/<module>.routes.js.
 * Ce fichier se contentera alors de faire :
 *
 *   const authRoutes = require('../modules/auth/auth.routes');
 *   router.use('/auth', authRoutes);
 *
 * Pour l'instant, aucun module métier n'existe encore : on expose
 * uniquement une route de vérification (health check) de l'API.
 */

const express = require('express');
const router = express.Router();

const { testConnection } = require('../config/database');
const { version } = require('../../package.json');

/**
 * Health check : vérifie que l'API répond ET que la base de données est
 * réellement joignable (pas juste que le process Node tourne).
 * Utile pour un monitoring externe ou un simple "ping" avant déploiement.
 */
router.get('/health', async (req, res) => {
  try {
    await testConnection();

    res.status(200).json({
      status: 'success',
      message: 'GTFC API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version,
    });
  } catch (err) {
    // L'API tourne, mais la base est injoignable : on le signale clairement
    // avec un 503 (Service Unavailable) plutôt qu'un faux "tout va bien".
    res.status(503).json({
      status: 'error',
      message: 'GTFC API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      version,
    });
  }
});

// --- Module Authentification ---
router.use('/auth', require('../modules/auth/auth.routes'));

// --- Module Utilisateurs ---
router.use('/utilisateurs', require('../modules/utilisateurs/utilisateurs.routes'));

// --- Module Commerces ---
router.use('/commerces', require('../modules/commerces/commerces.routes'));

// --- Module Taxes ---
router.use('/taxes', require('../modules/taxes/taxes.routes'));

// --- Module Créances ---
router.use('/creances', require('../modules/creances/creances.routes'));

// --- Emplacement réservé aux futurs modules ---
// router.use('/communes', require('../modules/communes/communes.routes'));
// ...

module.exports = router;
