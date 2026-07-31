/**
 * Couche metier du module taxes.
 */

const ApiError = require('../../utils/ApiError');
const repository = require('./taxes.repository');

const DEFAULT_LIMIT = 10;

// Liste fixe : ce ne sont pas des donnees metier variables (contrairement
// aux categories, qui elles sont propres a chaque commune et stockees en
// base), donc pas besoin d'une table pour ca.
const FREQUENCES = ['journaliere', 'hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle'];

async function list({ search, categorie, frequence, statut, page = 1, limit = DEFAULT_LIMIT }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  let actif = null;
  if (statut === 'actif') actif = true;
  else if (statut === 'inactif') actif = false;

  const { rows, total } = await repository.findAll({ search, categorie, frequence, actif, limit: limitNum, offset });

  return {
    taxes: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

async function getById(id) {
  const taxe = await repository.findById(id);
  if (!taxe) {
    throw new ApiError(404, 'Taxe introuvable');
  }
  return taxe;
}

async function create(payload, acteurId) {
  const communeId = await repository.findCommerceCommuneId(payload.commerce_id);
  if (!communeId) {
    throw new ApiError(422, 'Le commerce sélectionné est introuvable');
  }

  const newId = await repository.create(payload, acteurId);
  return getById(newId);
}

async function update(id, payload, acteurId) {
  await getById(id);

  const communeId = await repository.findCommerceCommuneId(payload.commerce_id);
  if (!communeId) {
    throw new ApiError(422, 'Le commerce sélectionné est introuvable');
  }

  await repository.update(id, payload, acteurId);
  return getById(id);
}

async function updateStatut(id, actif, acteurId) {
  await getById(id);
  await repository.updateStatut(id, actif, acteurId);
  return getById(id);
}

async function getFormOptions() {
  const [commerces, categories] = await Promise.all([
    repository.findCommercesActifs(),
    repository.findCategories(),
  ]);
  return { commerces, categories, frequences: FREQUENCES };
}

module.exports = { list, getById, create, update, updateStatut, getFormOptions };
