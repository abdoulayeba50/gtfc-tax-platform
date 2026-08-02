/**
 * Couche d'acces aux donnees du module creances.
 * Seule couche autorisee a ecrire du SQL pour ce module.
 */

const pool = require('../../database/pool');

const BASE_SELECT = `
  SELECT
    cr.id, cr.numero, cr.montant, cr.date_emission, cr.date_echeance,
    cr.periode_debut, cr.periode_fin, cr.statut, cr.created_at,
    c.id  AS commerce_id, c.nom_commerce AS commerce, c.nom_proprietaire AS commerce_proprietaire,
    t.id  AS taxe_id, t.nom AS taxe, t.periodicite AS taxe_frequence, t.devise
  FROM creances cr
  INNER JOIN commerces c ON c.id = cr.commerce_id
  INNER JOIN taxes t ON t.id = cr.taxe_id
`;

async function findAll({ search, statut, commerceId, periode, limit, offset }) {
  const filters = `
    WHERE ($1::text IS NULL OR cr.numero ILIKE '%' || $1 || '%' OR c.nom_commerce ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR cr.statut = $2)
      AND ($3::int IS NULL OR c.id = $3)
      AND ($4::text IS NULL OR to_char(cr.periode_debut, 'YYYY-MM') = $4)
  `;
  const params = [search || null, statut || null, commerceId || null, periode || null];

  const rowsQuery = `${BASE_SELECT} ${filters} ORDER BY cr.created_at DESC LIMIT $5 OFFSET $6;`;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM creances cr
    INNER JOIN commerces c ON c.id = cr.commerce_id
    ${filters};
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(rowsQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  return { rows: rowsResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE cr.id = $1;`, [id]);
  return rows[0];
}

async function findCommerces() {
  const { rows } = await pool.query(
    'SELECT id, nom_commerce, nom_proprietaire FROM commerces ORDER BY nom_commerce;'
  );
  return rows;
}

/** Taxe complete (avec commune_id/commerce_id) — necessaire pour creer une creance manuelle. */
async function findTaxeById(taxeId) {
  const { rows } = await pool.query(
    `SELECT id, commerce_id, montant_defaut AS montant, devise, periodicite, actif
     FROM taxes WHERE id = $1;`,
    [taxeId]
  );
  return rows[0];
}

/** Toutes les taxes actives, candidates a la generation de creances. */
async function findTaxesActives() {
  const { rows } = await pool.query(
    `SELECT id, commerce_id, montant_defaut AS montant, devise, periodicite, date_debut, date_fin
     FROM taxes
     WHERE actif = true
       AND date_debut <= CURRENT_DATE
       AND (date_fin IS NULL OR date_fin >= CURRENT_DATE);`
  );
  return rows;
}

/**
 * Genere le prochain numero sequentiel de l'annee en cours, de maniere
 * atomique (UPSERT), a l'interieur du client/transaction fourni.
 * Format : CR-<annee>-<6 chiffres>, ex: CR-2026-000001.
 */
async function genererNumero(client, annee) {
  const { rows } = await client.query(
    `INSERT INTO creances_compteurs (annee, dernier_numero)
     VALUES ($1, 1)
     ON CONFLICT (annee) DO UPDATE SET dernier_numero = creances_compteurs.dernier_numero + 1
     RETURNING dernier_numero;`,
    [annee]
  );
  const sequentiel = String(rows[0].dernier_numero).padStart(6, '0');
  return `CR-${annee}-${sequentiel}`;
}

/** Verifie si une creance existe deja pour cette taxe et cette periode exacte. */
async function existeDejaPourPeriode(client, taxeId, periodeDebut, periodeFin) {
  const { rows } = await client.query(
    'SELECT 1 FROM creances WHERE taxe_id = $1 AND periode_debut = $2 AND periode_fin = $3;',
    [taxeId, periodeDebut, periodeFin]
  );
  return rows.length > 0;
}

/**
 * Cree une creance unique (utilise par la creation manuelle ET par la
 * generation en lot) ET la trace d'audit, dans la transaction du client
 * fourni par l'appelant.
 */
async function insererCreance(client, data, acteurId, action) {
  const annee = new Date(data.periode_debut).getFullYear();
  const numero = await genererNumero(client, annee);

  const { rows } = await client.query(
    `INSERT INTO creances (numero, commerce_id, taxe_id, montant, date_echeance, periode_debut, periode_fin)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id;`,
    [numero, data.commerce_id, data.taxe_id, data.montant, data.date_echeance, data.periode_debut, data.periode_fin]
  );
  const newId = rows[0].id;

  await client.query(
    `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
     VALUES ($1, $2, 'creances', $3, $4);`,
    [acteurId, action, newId, JSON.stringify({ ...data, numero })]
  );

  return newId;
}

/** Creation manuelle d'une creance (POST /api/creances). */
async function create(data, acteurId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dejaExistant = await existeDejaPourPeriode(client, data.taxe_id, data.periode_debut, data.periode_fin);
    if (dejaExistant) {
      const err = new Error('DUPLICATE_PERIOD');
      err.code = 'DUPLICATE_PERIOD';
      throw err;
    }

    const newId = await insererCreance(client, data, acteurId, 'CREATE');

    await client.query('COMMIT');
    return newId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Genere en lot les creances pour une liste de candidats (deja filtres et
 * avec leur periode calculee par le service). Chaque candidat deja
 * existant pour sa periode est silencieusement ignore (idempotent) —
 * la contrainte UNIQUE en base reste le filet de securite ultime.
 */
async function genererEnLot(candidats, acteurId) {
  const client = await pool.connect();
  const creees = [];
  let ignorees = 0;
  try {
    await client.query('BEGIN');

    for (const candidat of candidats) {
      const dejaExistant = await existeDejaPourPeriode(
        client,
        candidat.taxe_id,
        candidat.periode_debut,
        candidat.periode_fin
      );
      if (dejaExistant) {
        ignorees += 1;
        continue;
      }

      const newId = await insererCreance(client, candidat, acteurId, 'GENERATION');
      creees.push(newId);
    }

    await client.query('COMMIT');
    return { creeesIds: creees, ignorees };
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

    await client.query('UPDATE creances SET montant = $1, date_echeance = $2 WHERE id = $3;', [
      data.montant,
      data.date_echeance,
      id,
    ]);

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'UPDATE', 'creances', $2, $3);`,
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

    await client.query('UPDATE creances SET statut = $1 WHERE id = $2;', [statut, id]);

    await client.query(
      `INSERT INTO journal_audit (utilisateur_id, action, table_cible, enregistrement_id, nouvelles_valeurs)
       VALUES ($1, 'STATUT', 'creances', $2, $3);`,
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
  findCommerces,
  findTaxeById,
  findTaxesActives,
  create,
  genererEnLot,
  update,
  updateStatut,
};
