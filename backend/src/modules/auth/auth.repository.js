/**
 * Couche d'accès aux données (SQL brut) du module auth.
 * Seule couche autorisée à parler directement à PostgreSQL pour ce module.
 * Le service ne doit jamais écrire de SQL lui-même.
 *
 * Hypothèse de schéma (aucune table créée dans ce module) :
 *   utilisateurs(id, nom, prenom, email, mot_de_passe, role_id, commune_id, actif, created_at, updated_at)
 *   roles(id, nom)
 */

const pool = require('../../database/pool');

/**
 * Recherche un utilisateur actif par email, avec son rôle joint.
 * Retourne undefined si aucun utilisateur ne correspond.
 */
async function findByEmail(email) {
  const query = `
    SELECT
      u.id,
      u.nom,
      u.prenom,
      u.email,
      u.mot_de_passe,
      u.commune_id,
      u.actif,
      r.id   AS role_id,
      r.nom  AS role
    FROM utilisateurs u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.email = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0];
}

module.exports = { findByEmail };
