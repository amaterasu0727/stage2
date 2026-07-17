const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');

async function creerResponsable(req, res) {
  const { username, motdepasse, telephone, structureId } = req.body;

  if (!username || !motdepasse || !telephone || !structureId) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.', errors: [] });
  }

  const structure = await prisma.structure.findUnique({ where: { id: Number(structureId) } });

  if (!structure) {
    return res.status(404).json({ success: false, message: 'Structure introuvable.', errors: [] });
  }

  const usernameExistant = await prisma.responsableEquipeTechnique.findUnique({ where: { username } });

  if (usernameExistant) {
    return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris.', errors: [] });
  }

  const motdepasseHache = await bcrypt.hash(motdepasse, 10);

  const responsable = await prisma.responsableEquipeTechnique.create({
    data: { username, motdepasse: motdepasseHache, telephone, structureId: Number(structureId), createdBy: `ADMIN:${req.compte.id}` },
  });

  await prisma.technicien.create({
    data: {
      username: `${username}.technicien`,
      motdepasse: motdepasseHache,
      telephone,
      responsableId: responsable.id,
      createdBy: `ADMIN:${req.compte.id}`,
    },
  });

  const { motdepasse: _, ...responsableSansMotDePasse } = responsable;

  return res.status(201).json({
    success: true,
    message: 'Responsable créé, compte technicien jumeau créé automatiquement.',
    data: responsableSansMotDePasse,
  });
}

async function creerTechnicien(req, res) {
  const { username, motdepasse, telephone, responsableId } = req.body;

  if (!username || !motdepasse || !telephone || !responsableId) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.', errors: [] });
  }

  const responsable = await prisma.responsableEquipeTechnique.findUnique({ where: { id: Number(responsableId) } });

  if (!responsable) {
    return res.status(404).json({ success: false, message: 'Responsable introuvable.', errors: [] });
  }

  const usernameExistant = await prisma.technicien.findUnique({ where: { username } });

  if (usernameExistant) {
    return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris.', errors: [] });
  }

  const motdepasseHache = await bcrypt.hash(motdepasse, 10);

  const technicien = await prisma.technicien.create({
    data: { username, motdepasse: motdepasseHache, telephone, responsableId: Number(responsableId), createdBy: `ADMIN:${req.compte.id}` },
  });

  const { motdepasse: _, ...technicienSansMotDePasse } = technicien;

  return res.status(201).json({ success: true, message: 'Technicien créé.', data: technicienSansMotDePasse });
}

async function creerPointFocal(req, res) {
  const { nom, prenom, username, motdepasse, telephone, structureId } = req.body;

  if (!nom || !prenom || !username || !motdepasse || !telephone || !structureId) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.', errors: [] });
  }

  const structure = await prisma.structure.findUnique({ where: { id: Number(structureId) } });

  if (!structure) {
    return res.status(404).json({ success: false, message: 'Structure introuvable.', errors: [] });
  }

  const structureDejaPourvue = await prisma.pointFocal.findUnique({ where: { structureId: Number(structureId) } });

  if (structureDejaPourvue) {
    return res.status(409).json({ success: false, message: 'Cette structure a déjà un point focal.', errors: [] });
  }

  const usernameExistant = await prisma.pointFocal.findUnique({ where: { username } });

  if (usernameExistant) {
    return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris.', errors: [] });
  }

  const motdepasseHache = await bcrypt.hash(motdepasse, 10);

  const pointFocal = await prisma.pointFocal.create({
    data: { nom, prenom, username, motdepasse: motdepasseHache, telephone, structureId: Number(structureId), createdBy: `ADMIN:${req.compte.id}` },
  });

  const { motdepasse: _, ...pointFocalSansMotDePasse } = pointFocal;

  return res.status(201).json({ success: true, message: 'Point focal créé.', data: pointFocalSansMotDePasse });
}

async function listerResponsables(req, res) {
  const responsables = await prisma.responsableEquipeTechnique.findMany({
    include: { structure: true },
    orderBy: { dateCreation: 'desc' },
  });
  const sansMotDePasse = responsables.map(({ motdepasse, ...reste }) => reste);
  return res.status(200).json({ success: true, data: sansMotDePasse });
}

async function listerTechniciens(req, res) {
  const filtres = {};
  if (req.query.responsableId) filtres.responsableId = Number(req.query.responsableId);

  if (req.compte.typeCompte === 'RESPONSABLE') {
    filtres.responsableId = req.compte.id;
  }

  const techniciens = await prisma.technicien.findMany({
    where: filtres,
    orderBy: { dateCreation: 'desc' },
  });
  const sansMotDePasse = techniciens.map(({ motdepasse, ...reste }) => reste);
  return res.status(200).json({ success: true, data: sansMotDePasse });
}

async function listerPointsFocaux(req, res) {
  const pointsFocaux = await prisma.pointFocal.findMany({
    include: { structure: true },
    orderBy: { dateCreation: 'desc' },
  });
  const sansMotDePasse = pointsFocaux.map(({ motdepasse, ...reste }) => reste);
  return res.status(200).json({ success: true, data: sansMotDePasse });
}

module.exports = { creerResponsable, creerTechnicien, creerPointFocal, listerResponsables, listerTechniciens, listerPointsFocaux };