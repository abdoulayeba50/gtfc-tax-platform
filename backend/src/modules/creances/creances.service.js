/**
 * Couche metier du module creances.
 */

const ApiError = require('../../utils/ApiError');
const repository = require('./creances.repository');

const DEFAULT_LIMIT = 10;

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Calcule la periode "courante" (debut/fin) pour une frequence donnee, a
 * partir d'une date de reference (aujourd'hui par defaut). Pure fonction,
 * aucun acces base de donnees — facilement testable isolement.
 */
function calculerPeriodeCourante(frequence, reference = new Date()) {
  const d = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());

  switch (frequence) {
    case 'journaliere':
      return { periode_debut: toISODate(d), periode_fin: toISODate(d) };

    case 'hebdomadaire': {
      const jourISO = d.getDay() === 0 ? 7 : d.getDay(); // lundi=1 ... dimanche=7
      const debut = new Date(d);
      debut.setDate(d.getDate() - jourISO + 1);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + 6);
      return { periode_debut: toISODate(debut), periode_fin: toISODate(fin) };
    }

    case 'mensuelle': {
      const debut = new Date(d.getFullYear(), d.getMonth(), 1);
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { periode_debut: toISODate(debut), periode_fin: toISODate(fin) };
    }

    case 'trimestrielle': {
      const trimestre = Math.floor(d.getMonth() / 3);
      const debut = new Date(d.getFullYear(), trimestre * 3, 1);
      const fin = new Date(d.getFullYear(), trimestre * 3 + 3, 0);
      return { periode_debut: toISODate(debut), periode_fin: toISODate(fin) };
    }

    case 'annuelle': {
      const debut = new Date(d.getFullYear(), 0, 1);
      const fin = new Date(d.getFullYear(), 11, 31);
      return { periode_debut: toISODate(debut), periode_fin: toISODate(fin) };
    }

    default:
      throw new ApiError(422, `Fréquence de taxe inconnue : ${frequence}`);
  }
}

async function list({ search, statut, commerce_id, periode, page = 1, limit = DEFAULT_LIMIT }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  const { rows, total } = await repository.findAll({
    search,
    statut,
    commerceId: commerce_id ? Number(commerce_id) : null,
    periode,
    limit: limitNum,
    offset,
  });

  return {
    creances: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

async function getById(id) {
  const creance = await repository.findById(id);
  if (!creance) {
    throw new ApiError(404, 'Créance introuvable');
  }
  return creance;
}

async function create(payload, acteurId) {
  const taxe = await repository.findTaxeById(payload.taxe_id);
  if (!taxe) {
    throw new ApiError(422, 'La taxe sélectionnée est introuvable');
  }

  const data = {
    commerce_id: taxe.commerce_id,
    taxe_id: taxe.id,
    montant: payload.montant ?? taxe.montant,
    date_echeance: payload.date_echeance,
    periode_debut: payload.periode_debut,
    periode_fin: payload.periode_fin,
  };

  try {
    const newId = await repository.create(data, acteurId);
    return getById(newId);
  } catch (err) {
    if (err.code === 'DUPLICATE_PERIOD' || err.code === '23505') {
      throw new ApiError(409, 'Une créance existe déjà pour cette taxe sur cette période');
    }
    throw err;
  }
}

async function update(id, payload, acteurId) {
  await getById(id);
  await repository.update(id, payload, acteurId);
  return getById(id);
}

async function updateStatut(id, statut, acteurId) {
  await getById(id);
  await repository.updateStatut(id, statut, acteurId);
  return getById(id);
}

/**
 * Genere automatiquement les creances dues pour la periode courante de
 * chaque taxe active (POST /api/creances/generer). Une taxe active peut
 * generer une creance PAR periode ; celles deja generees pour la periode
 * courante sont silencieusement ignorees (idempotent — on peut cliquer
 * "Générer" plusieurs fois sans creer de doublons).
 */
async function genererCreances(acteurId) {
  const taxesActives = await repository.findTaxesActives();

  const candidats = taxesActives.map((taxe) => {
    const { periode_debut, periode_fin } = calculerPeriodeCourante(taxe.periodicite);
    return {
      commerce_id: taxe.commerce_id,
      taxe_id: taxe.id,
      montant: taxe.montant,
      date_echeance: periode_fin,
      periode_debut,
      periode_fin,
    };
  });

  const { creeesIds, ignorees } = await repository.genererEnLot(candidats, acteurId);

  return {
    total_taxes_actives: taxesActives.length,
    creees: creeesIds.length,
    deja_existantes: ignorees,
  };
}

async function getFormOptions() {
  const commerces = await repository.findCommerces();
  return { commerces };
}

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatut,
  genererCreances,
  getFormOptions,
  calculerPeriodeCourante, // exporte pour tests unitaires
};
