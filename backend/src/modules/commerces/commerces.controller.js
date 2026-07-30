const asyncHandler = require('../../utils/asyncHandler');
const service = require('./commerces.service');

const list = asyncHandler(async (req, res) => {
  const { search, secteur, statut, page, limit } = req.query;
  const result = await service.list({ search, secteur, statut, page, limit });

  res.status(200).json({
    success: true,
    data: result.commerces,
    pagination: result.pagination,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const commerce = await service.getById(req.params.id);
  res.status(200).json({ success: true, data: commerce });
});

const create = asyncHandler(async (req, res) => {
  const commerce = await service.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Commerce créé avec succès', data: commerce });
});

const update = asyncHandler(async (req, res) => {
  const commerce = await service.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: 'Commerce modifié avec succès', data: commerce });
});

const updateStatut = asyncHandler(async (req, res) => {
  const commerce = await service.updateStatut(req.params.id, req.body.statut, req.user.id);
  res.status(200).json({
    success: true,
    message: commerce.statut === 'actif' ? 'Commerce activé' : 'Commerce désactivé',
    data: commerce,
  });
});

const getFormOptions = asyncHandler(async (req, res) => {
  const options = await service.getFormOptions();
  res.status(200).json({ success: true, data: options });
});

module.exports = { list, getOne, create, update, updateStatut, getFormOptions };
