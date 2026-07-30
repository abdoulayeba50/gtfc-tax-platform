/**
 * Couche d'acces aux donnees du module utilisateurs.
 * Seule couche autorisee a ecrire du SQL pour ce module.
 */

const pool = require('../../database/pool');

// Jointures communes a la liste et a la fiche unique : une seule source de
// verite pour la forme des lignes utilisateur retournees par l'API.
const BASE_SELECT = `
  SELECT
    u.id, u.prenom, u.nom, u.email, u.telephone, u.actif, u.created_at, u.derniere_connexion,
    r.id  AS role_id, r.nom AS role,
    c.id  AS commune_id, c.nom AS commune
  FROM utilisateurs u
  INNER JOIN roles r ON r.id = u.role_id
  LEFT JOIN communes c ON c.id = u.commune_id
`;

/**
 * Liste paginee + filtrable. Les filtres sont optionnels : chaque
 * condition est ignorée si le parametre correspondant est NULL (pattern
 * "$n::type IS NULL OR ..." plutot que de construire la requete SQL a la
 * main avec des concatenations, ce qui eviterait les injections).
 */
async function findAll({ search, role, actif, limit, offset }) {
  const filters = `
    WHERE ($1::text IS NULL OR u.nom ILIKE '%' || $1 || '%' OR u.prenom ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR r.nom = $2)
      AND ($3::boolean IS NULL OR u.actif = $3)
  `;
  const params = [search || null, role || null, actif ?? null];

  const rowsQuery = `${BASE_SELECT} ${filters} ORDER BY u.created_at DESC LIMIT $4 OFFSET $5;`;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM utilisateurs u
    INNER JOIN roles r ON r.id = u.role_id
    ${filters};
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(rowsQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  return { rows: rowsResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE u.id = $1;`, [id]);
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE email = $1;', [email]);
  return rows[0];
}

async function findRoles() {
  const { rows } = await pool.query('SELECT id, nom FROM roles ORDER BY nom;');
  return rows;
}

async function findCommunes() {
  const { rows } = await pool.query('SELECT id, nom FROM communes ORDER BY nom;');
  return rows;
}

/**
 * Cree l'utilisateur ET la trace d'audit dans la MEME transaction : si
 * l'insertion du log echoue, la creation de l'utilisateur est annulee.
 * C'est le cas d'usage justifiant une transaction demande par la tache.
 */
async function create({ prenom, nom, email, telephone, roleId, communeId, motDePasseHash }, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, telephone, mot_de_passe)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id;`,
      [communeId, roleId, nom, prenom, email, telephone, motDePasseHash]
    );
    const newId = rows[0].id;

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'CREATE', 'utilisateurs', $2, $3);`,
      [acteurId, newId, JSON.stringify({ prenom, nom, email, telephone, roleId, communeId })]
    );

    await client.query('COMMIT');
    return newId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, { prenom, nom, email, telephone, roleId, communeId }, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE utilisateurs
       SET prenom = $1, nom = $2, email = $3, telephone = $4, role_id = $5, commune_id = $6
       WHERE id = $7;`,
      [prenom, nom, email, telephone, roleId, communeId, id]
    );

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'UPDATE', 'utilisateurs', $2, $3);`,
      [acteurId, id, JSON.stringify({ prenom, nom, email, telephone, roleId, communeId })]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateStatut(id, actif, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE utilisateurs SET actif = $1 WHERE id = $2;', [actif, id]);

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, $2, 'utilisateurs', $3, $4);`,
      [acteurId, actif ? 'ACTIVATE' : 'DEACTIVATE', id, JSON.stringify({ actif })]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  findRoles,
  findCommunes,
  create,
  update,
  updateStatut,
};
