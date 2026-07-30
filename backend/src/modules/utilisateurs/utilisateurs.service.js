/**
 * Couche metier du module utilisateurs.
 * Le controller ne fait qu'appeler ces fonctions ; toute la logique
 * (hash du mot de passe, verification d'unicite, pagination...) vit ici.
 */

const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const repository = require('./utilisateurs.repository');

const DEFAULT_LIMIT = 10;

async function list({ search, role, statut, page = 1, limit = DEFAULT_LIMIT }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  // Traduit le filtre "actif" / "inactif" / non renseigné en booleen ou NULL
  let actif = null;
  if (statut === 'actif') actif = true;
  else if (statut === 'inactif') actif = false;

  const { rows, total } = await repository.findAll({ search, role, actif, limit: limitNum, offset });

  return {
    utilisateurs: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

async function getById(id) {
  const utilisateur = await repository.findById(id);
  if (!utilisateur) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }
  return utilisateur;
}

async function create(payload, acteurId) {
  const existing = await repository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, 'Un utilisateur avec cet email existe déjà');
  }

  const motDePasseHash = await bcrypt.hash(payload.mot_de_passe, 10);

  const newId = await repository.create(
    {
      prenom: payload.prenom,
      nom: payload.nom,
      email: payload.email,
      telephone: payload.telephone,
      roleId: payload.role_id,
      communeId: payload.commune_id ?? null,
      motDePasseHash,
    },
    acteurId
  );

  return getById(newId);
}

async function update(id, payload, acteurId) {
  await getById(id); // leve un 404 si l'utilisateur n'existe pas

  if (payload.email) {
    const existing = await repository.findByEmail(payload.email);
    if (existing && Number(existing.id) !== Number(id)) {
      throw new ApiError(409, 'Un utilisateur avec cet email existe déjà');
    }
  }

  await repository.update(
    id,
    {
      prenom: payload.prenom,
      nom: payload.nom,
      email: payload.email,
      telephone: payload.telephone,
      roleId: payload.role_id,
      communeId: payload.commune_id ?? null,
    },
    acteurId
  );

  return getById(id);
}

async function updateStatut(id, actif, acteurId) {
  await getById(id);
  await repository.updateStatut(id, actif, acteurId);
  return getById(id);
}

async function getFormOptions() {
  const [roles, communes] = await Promise.all([repository.findRoles(), repository.findCommunes()]);
  return { roles, communes };
}

module.exports = { list, getById, create, update, updateStatut, getFormOptions };
