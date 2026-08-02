const asyncHandler = require('../../utils/asyncHandler');
const service = require('./creances.service');

const list = asyncHandler(async (req, res) => {
  const { search, statut, commerce_id, periode, page, limit } = req.query;
  const result = await service.list({ search, statut, commerce_id, periode, page, limit });

  res.status(200).json({
    success: true,
    data: result.creances,
    pagination: result.pagination,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const creance = await service.getById(req.params.id);
  res.status(200).json({ success: true, data: creance });
});

const create = asyncHandler(async (req, res) => {
  const creance = await service.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Créance créée avec succès', data: creance });
});

const update = asyncHandler(async (req, res) => {
  const creance = await service.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: 'Créance modifiée avec succès', data: creance });
});

const updateStatut = asyncHandler(async (req, res) => {
  const creance = await service.updateStatut(req.params.id, req.body.statut, req.user.id);
  res.status(200).json({ success: true, message: 'Statut mis à jour', data: creance });
});

const generer = asyncHandler(async (req, res) => {
  const resultat = await service.genererCreances(req.user.id);
  res.status(201).json({
    success: true,
    message: `${resultat.creees} créance(s) générée(s), ${resultat.deja_existantes} déjà existante(s) ignorée(s).`,
    data: resultat,
  });
});

const getFormOptions = asyncHandler(async (req, res) => {
  const options = await service.getFormOptions();
  res.status(200).json({ success: true, data: options });
});

module.exports = { list, getOne, create, update, updateStatut, generer, getFormOptions };
