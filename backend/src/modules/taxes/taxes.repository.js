/**
 * Couche d'acces aux donnees du module taxes.
 * Seule couche autorisee a ecrire du SQL pour ce module.
 *
 * Note : la colonne SQL "montant_defaut" est exposee comme "montant", et
 * "periodicite" comme "frequence" au niveau de l'API — noms historiques de
 * la table conserves en base pour ne pas casser sa structure, mais l'API
 * expose le vocabulaire demande pour ce module.
 */

const pool = require('../../database/pool');

const BASE_SELECT = `
  SELECT
    t.id, t.nom, t.description,
    t.montant_defaut AS montant, t.devise,
    t.periodicite AS frequence,
    t.date_debut, t.date_fin, t.actif, t.created_at,
    c.id  AS commerce_id, c.nom_commerce AS commerce, c.nom_proprietaire AS commerce_proprietaire,
    cat.id AS categorie_id, cat.nom AS categorie
  FROM taxes t
  INNER JOIN commerces c ON c.id = t.commerce_id
  INNER JOIN categories_taxes cat ON cat.id = t.categorie_id
`;

async function findAll({ search, categorie, frequence, actif, limit, offset }) {
  const filters = `
    WHERE ($1::text IS NULL OR t.nom ILIKE '%' || $1 || '%' OR c.nom_commerce ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR cat.nom = $2)
      AND ($3::text IS NULL OR t.periodicite = $3)
      AND ($4::boolean IS NULL OR t.actif = $4)
  `;
  const params = [search || null, categorie || null, frequence || null, actif ?? null];

  const rowsQuery = `${BASE_SELECT} ${filters} ORDER BY t.created_at DESC LIMIT $5 OFFSET $6;`;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM taxes t
    INNER JOIN commerces c ON c.id = t.commerce_id
    INNER JOIN categories_taxes cat ON cat.id = t.categorie_id
    ${filters};
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(rowsQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  return { rows: rowsResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE t.id = $1;`, [id]);
  return rows[0];
}

async function findCommerceCommuneId(commerceId) {
  const { rows } = await pool.query('SELECT commune_id FROM commerces WHERE id = $1;', [commerceId]);
  return rows[0]?.commune_id ?? null;
}

/** Commerces actifs uniquement, pour peupler le select du formulaire. */
async function findCommercesActifs() {
  const { rows } = await pool.query(
    `SELECT id, nom_commerce, nom_proprietaire, commune_id
     FROM commerces WHERE statut = 'actif' ORDER BY nom_commerce;`
  );
  return rows;
}

async function findCategories() {
  const { rows } = await pool.query('SELECT id, nom, commune_id FROM categories_taxes ORDER BY nom;');
  return rows;
}

/**
 * Cree la taxe ET la trace d'audit dans la meme transaction.
 * commune_id est deduit automatiquement du commerce choisi (denormalisation
 * volontaire, meme logique que commerces.commune_id).
 */
async function create(data, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const communeResult = await client.query('SELECT commune_id FROM commerces WHERE id = $1;', [data.commerce_id]);
    const communeId = communeResult.rows[0]?.commune_id;

    const { rows } = await client.query(
      `INSERT INTO taxes (
         commune_id, commerce_id, categorie_id, nom, description,
         montant_defaut, devise, periodicite, date_debut, date_fin
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id;`,
      [
        communeId, data.commerce_id, data.categorie_id, data.nom, data.description || null,
        data.montant, data.devise || 'FCFA', data.frequence, data.date_debut, data.date_fin || null,
      ]
    );
    const newId = rows[0].id;

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'CREATE', 'taxes', $2, $3);`,
      [acteurId, newId, JSON.stringify(data)]
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

async function update(id, data, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const communeResult = await client.query('SELECT commune_id FROM commerces WHERE id = $1;', [data.commerce_id]);
    const communeId = communeResult.rows[0]?.commune_id;

    await client.query(
      `UPDATE taxes
       SET commune_id = $1, commerce_id = $2, categorie_id = $3, nom = $4, description = $5,
           montant_defaut = $6, periodicite = $7, date_debut = $8, date_fin = $9
       WHERE id = $10;`,
      [
        communeId, data.commerce_id, data.categorie_id, data.nom, data.description || null,
        data.montant, data.frequence, data.date_debut, data.date_fin || null, id,
      ]
    );

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'UPDATE', 'taxes', $2, $3);`,
      [acteurId, id, JSON.stringify(data)]
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

    await client.query('UPDATE taxes SET actif = $1 WHERE id = $2;', [actif, id]);

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, $2, 'taxes', $3, $4);`,
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
  findCommerceCommuneId,
  findCommercesActifs,
  findCategories,
  create,
  update,
  updateStatut,
};
