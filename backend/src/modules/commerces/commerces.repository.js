/**
 * Couche d'acces aux donnees du module commerces.
 * Seule couche autorisee a ecrire du SQL pour ce module.
 */

const crypto = require('crypto');
const pool = require('../../database/pool');

// Jointures communes a la liste et a la fiche unique.
const BASE_SELECT = `
  SELECT
    c.id, c.nom_commerce, c.nom_proprietaire,
    c.telephone_proprietaire AS telephone,
    c.adresse, c.numero_registre, c.numero_ninea,
    c.latitude, c.longitude, c.statut, c.qr_code_uuid, c.created_at,
    q.id  AS quartier_id, q.nom AS quartier,
    co.id AS commune_id, co.nom AS commune,
    cat.id AS categorie_id, cat.nom AS secteur
  FROM commerces c
  INNER JOIN quartiers q ON q.id = c.quartier_id
  INNER JOIN communes co ON co.id = c.commune_id
  INNER JOIN categories_commerces cat ON cat.id = c.categorie_id
`;

async function findAll({ search, secteur, statut, limit, offset }) {
  const filters = `
    WHERE ($1::text IS NULL OR c.nom_commerce ILIKE '%' || $1 || '%' OR c.nom_proprietaire ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR cat.nom = $2)
      AND ($3::text IS NULL OR c.statut = $3)
  `;
  const params = [search || null, secteur || null, statut || null];

  const rowsQuery = `${BASE_SELECT} ${filters} ORDER BY c.created_at DESC LIMIT $4 OFFSET $5;`;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM commerces c
    INNER JOIN categories_commerces cat ON cat.id = c.categorie_id
    ${filters};
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(rowsQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  return { rows: rowsResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE c.id = $1;`, [id]);
  return rows[0];
}

async function findCommunes() {
  const { rows } = await pool.query('SELECT id, nom FROM communes ORDER BY nom;');
  return rows;
}

/**
 * Quartiers avec la commune a laquelle ils appartiennent (via leur zone),
 * pour permettre au frontend de filtrer le select "Quartier" selon la
 * commune choisie.
 */
async function findQuartiers() {
  const { rows } = await pool.query(`
    SELECT q.id, q.nom, z.commune_id
    FROM quartiers q
    INNER JOIN zones z ON z.id = q.zone_id
    ORDER BY q.nom;
  `);
  return rows;
}

async function findCategories() {
  const { rows } = await pool.query(
    'SELECT id, nom, commune_id FROM categories_commerces ORDER BY nom;'
  );
  return rows;
}

/**
 * Cree le commerce ET la trace d'audit dans la meme transaction.
 * Le qr_code_uuid est genere ici (colonne NOT NULL/UNIQUE en base) : c'est
 * un identifiant provisoire, en attendant le futur module de generation de
 * QR codes physiques qui remplacera cette valeur par un vrai code imprime.
 */
async function create(data, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const qrCodeUuid = crypto.randomUUID();

    const { rows } = await client.query(
      `INSERT INTO commerces (
         commune_id, quartier_id, categorie_id, agent_createur_id,
         nom_commerce, nom_proprietaire, telephone_proprietaire, adresse,
         numero_registre, numero_ninea, latitude, longitude, qr_code_uuid
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id;`,
      [
        data.commune_id, data.quartier_id, data.categorie_id, acteurId,
        data.nom_commerce, data.nom_proprietaire, data.telephone, data.adresse,
        data.numero_registre || null, data.numero_ninea || null,
        data.latitude ?? null, data.longitude ?? null, qrCodeUuid,
      ]
    );
    const newId = rows[0].id;

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'CREATE', 'commerces', $2, $3);`,
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

    await client.query(
      `UPDATE commerces
       SET commune_id = $1, quartier_id = $2, categorie_id = $3,
           nom_commerce = $4, nom_proprietaire = $5, telephone_proprietaire = $6,
           adresse = $7, numero_registre = $8, numero_ninea = $9,
           latitude = $10, longitude = $11
       WHERE id = $12;`,
      [
        data.commune_id, data.quartier_id, data.categorie_id,
        data.nom_commerce, data.nom_proprietaire, data.telephone, data.adresse,
        data.numero_registre || null, data.numero_ninea || null,
        data.latitude ?? null, data.longitude ?? null, id,
      ]
    );

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'UPDATE', 'commerces', $2, $3);`,
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

async function updateStatut(id, statut, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE commerces SET statut = $1 WHERE id = $2;', [statut, id]);

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'STATUT', 'commerces', $2, $3);`,
      [acteurId, id, JSON.stringify({ statut })]
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
  findCommunes,
  findQuartiers,
  findCategories,
  create,
  update,
  updateStatut,
};
