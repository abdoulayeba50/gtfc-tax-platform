const asyncHandler = require('../../utils/asyncHandler');
const service = require('./utilisateurs.service');

const list = asyncHandler(async (req, res) => {
  const { search, role, statut, page, limit } = req.query;
  const result = await service.list({ search, role, statut, page, limit });

  res.status(200).json({
    success: true,
    data: result.utilisateurs,
    pagination: result.pagination,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const utilisateur = await service.getById(req.params.id);
  res.status(200).json({ success: true, data: utilisateur });
});

const create = asyncHandler(async (req, res) => {
  const utilisateur = await service.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Utilisateur créé avec succès', data: utilisateur });
});

const update = asyncHandler(async (req, res) => {
  const utilisateur = await service.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: 'Utilisateur modifié avec succès', data: utilisateur });
});

const updateStatut = asyncHandler(async (req, res) => {
  const utilisateur = await service.updateStatut(req.params.id, req.body.actif, req.user.id);
  res.status(200).json({
    success: true,
    message: utilisateur.actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
    data: utilisateur,
  });
});

const getFormOptions = asyncHandler(async (req, res) => {
  const options = await service.getFormOptions();
  res.status(200).json({ success: true, data: options });
});

module.exports = { list, getOne, create, update, updateStatut, getFormOptions };
