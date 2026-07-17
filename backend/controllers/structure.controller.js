const prisma = require('../prisma/client');

async function lister(req, res) {
  const structures = await prisma.structure.findMany({
    include: { type: true, niveau: true },
    orderBy: { nomstructure: 'asc' },
  });
  return res.status(200).json({ success: true, data: structures });
}

async function creer(req, res) {
  const { nomstructure, typeId, niveauId, nomrespo, mailrespo, numrespo } = req.body;

  if (!nomstructure || !typeId || !niveauId) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.', errors: [] });
  }

  const structure = await prisma.structure.create({
    data: { nomstructure, typeId: Number(typeId), niveauId: Number(niveauId), nomrespo, mailrespo, numrespo },
  });

  return res.status(201).json({ success: true, message: 'Structure créée.', data: structure });
}

async function modifier(req, res) {
  const { nomstructure, typeId, niveauId, nomrespo, mailrespo, numrespo } = req.body;

  const structure = await prisma.structure.update({
    where: { id: Number(req.params.id) },
    data: {
      nomstructure,
      typeId: typeId ? Number(typeId) : undefined,
      niveauId: niveauId ? Number(niveauId) : undefined,
      nomrespo,
      mailrespo,
      numrespo,
    },
  });

  return res.status(200).json({ success: true, message: 'Structure modifiée.', data: structure });
}

async function supprimer(req, res) {
  const agentsLies = await prisma.agent.count({ where: { structureId: Number(req.params.id) } });

  if (agentsLies > 0) {
    return res.status(409).json({ success: false, message: 'Impossible de supprimer une structure liée à des agents.', errors: [] });
  }

  await prisma.structure.delete({ where: { id: Number(req.params.id) } });

  return res.status(200).json({ success: true, message: 'Structure supprimée.' });
}

async function escaladables(req, res) {
  const structure = await prisma.structure.findUnique({
    where: { id: Number(req.params.id) },
    include: { niveau: true },
  });

  if (!structure) {
    return res.status(404).json({ success: false, message: 'Structure introuvable.', errors: [] });
  }

  const structures = await prisma.structure.findMany({
    where: { niveau: { ordre: { lt: structure.niveau.ordre } } },
    include: { type: true, niveau: true },
    orderBy: { niveau: { ordre: 'asc' } },
  });

  return res.status(200).json({ success: true, data: structures });
}

async function retournables(req, res) {
  const structure = await prisma.structure.findUnique({
    where: { id: Number(req.params.id) },
    include: { niveau: true },
  });

  if (!structure) {
    return res.status(404).json({ success: false, message: 'Structure introuvable.', errors: [] });
  }

  const structures = await prisma.structure.findMany({
    where: { niveau: { ordre: { gt: structure.niveau.ordre } } },
    include: { type: true, niveau: true },
    orderBy: { niveau: { ordre: 'asc' } },
  });

  return res.status(200).json({ success: true, data: structures });
}

module.exports = { lister, creer, modifier, supprimer, escaladables, retournables };