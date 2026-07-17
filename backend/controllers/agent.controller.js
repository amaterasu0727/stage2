const prisma = require('../prisma/client');

async function creer(req, res) {
  const { matricule, nom, prenom, sexe, numero, email } = req.body;

  if (!matricule || !nom || !prenom || !sexe || !numero || !email) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.', errors: [] });
  }

  const existant = await prisma.agent.findUnique({ where: { matricule: Number(matricule) } });

  if (existant) {
    return res.status(409).json({ success: false, message: 'Un agent avec ce matricule existe déjà.', errors: [] });
  }

  const emailExistant = await prisma.agent.findUnique({ where: { email } });

  if (emailExistant) {
    return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé par un autre agent.', errors: [] });
  }

  const agent = await prisma.agent.create({
    data: {
      matricule: Number(matricule),
      nom,
      prenom,
      sexe,
      numero,
      email,
      structureId: req.compte.structureId,
      createdBy: `POINT_FOCAL:${req.compte.id}`,
    },
  });

  return res.status(201).json({ success: true, message: 'Agent enregistré.', data: agent });
}

async function lister(req, res) {
  const agents = await prisma.agent.findMany({
    where: { structureId: req.compte.structureId },
    orderBy: { nom: 'asc' },
  });

  return res.status(200).json({ success: true, data: agents });
}

async function desactiver(req, res) {
  const agent = await prisma.agent.findUnique({ where: { matricule: Number(req.params.matricule) } });

  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent introuvable.', errors: [] });
  }

  if (agent.structureId !== req.compte.structureId) {
    return res.status(403).json({ success: false, message: 'Cet agent n\'appartient pas à votre structure.', errors: [] });
  }

  await prisma.agent.update({
    where: { matricule: agent.matricule },
    data: { actif: false, updatedBy: `POINT_FOCAL:${req.compte.id}` },
  });

  const utilisateur = await prisma.utilisateur.findUnique({ where: { agentMatricule: agent.matricule } });

  if (utilisateur) {
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { actif: false },
    });

    await prisma.sessionToken.updateMany({
      where: { typeCompte: 'UTILISATEUR', compteId: utilisateur.id },
      data: { revoque: true },
    });
  }

  return res.status(200).json({ success: true, message: 'Agent désactivé.' });
}

async function reactiver(req, res) {
  const agent = await prisma.agent.findUnique({ where: { matricule: Number(req.params.matricule) } });

  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent introuvable.', errors: [] });
  }

  if (agent.structureId !== req.compte.structureId) {
    return res.status(403).json({ success: false, message: 'Cet agent n\'appartient pas à votre structure.', errors: [] });
  }

  await prisma.agent.update({
    where: { matricule: agent.matricule },
    data: { actif: true, updatedBy: `POINT_FOCAL:${req.compte.id}` },
  });

  const utilisateur = await prisma.utilisateur.findUnique({ where: { agentMatricule: agent.matricule } });

  if (utilisateur) {
    await prisma.utilisateur.update({ where: { id: utilisateur.id }, data: { actif: true } });
  }

  return res.status(200).json({ success: true, message: 'Agent réactivé.' });
}

module.exports = { creer, lister, desactiver, reactiver };