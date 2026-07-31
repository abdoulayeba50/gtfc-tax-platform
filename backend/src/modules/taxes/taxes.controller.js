const asyncHandler = require('../../utils/asyncHandler');
const service = require('./taxes.service');

const list = asyncHandler(async (req, res) => {
  const { search, categorie, frequence, statut, page, limit } = req.query;
  const result = await service.list({ search, categorie, frequence, statut, page, limit });

  res.status(200).json({
    success: true,
    data: result.taxes,
    pagination: result.pagination,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const taxe = await service.getById(req.params.id);
  res.status(200).json({ success: true, data: taxe });
});

const create = asyncHandler(async (req, res) => {
  const taxe = await service.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Taxe créée avec succès', data: taxe });
});

const update = asyncHandler(async (req, res) => {
  const taxe = await service.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: 'Taxe modifiée avec succès', data: taxe });
});

const updateStatut = asyncHandler(async (req, res) => {
  const taxe = await service.updateStatut(req.params.id, req.body.actif, req.user.id);
  res.status(200).json({
    success: true,
    message: taxe.actif ? 'Taxe activée' : 'Taxe désactivée',
    data: taxe,
  });
});

const getFormOptions = asyncHandler(async (req, res) => {
  const options = await service.getFormOptions();
  res.status(200).json({ success: true, data: options });
});

module.exports = { list, getOne, create, update, updateStatut, getFormOptions };
