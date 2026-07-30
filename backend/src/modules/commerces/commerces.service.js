/**
 * Couche metier du module commerces.
 */

const ApiError = require('../../utils/ApiError');
const repository = require('./commerces.repository');

const DEFAULT_LIMIT = 10;

async function list({ search, secteur, statut, page = 1, limit = DEFAULT_LIMIT }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  const { rows, total } = await repository.findAll({ search, secteur, statut, limit: limitNum, offset });

  return {
    commerces: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

async function getById(id) {
  const commerce = await repository.findById(id);
  if (!commerce) {
    throw new ApiError(404, 'Commerce introuvable');
  }
  return commerce;
}

async function create(payload, acteurId) {
  const newId = await repository.create(payload, acteurId);
  return getById(newId);
}

async function update(id, payload, acteurId) {
  await getById(id); // 404 si inexistant
  await repository.update(id, payload, acteurId);
  return getById(id);
}

async function updateStatut(id, statut, acteurId) {
  await getById(id);
  await repository.updateStatut(id, statut, acteurId);
  return getById(id);
}

async function getFormOptions() {
  const [communes, quartiers, categories] = await Promise.all([
    repository.findCommunes(),
    repository.findQuartiers(),
    repository.findCategories(),
  ]);
  return { communes, quartiers, categories };
}

module.exports = { list, getById, create, update, updateStatut, getFormOptions };
