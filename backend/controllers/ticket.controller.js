const prisma = require('../prisma/client');

function genererReference() {
  return `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function creer(req, res) {
  const { titre, description } = req.body;

  if (!description) {
    return res.status(400).json({ success: false, message: 'La description est obligatoire.', errors: [] });
  }

  const agent = await prisma.agent.findUnique({ where: { matricule: req.compte.agentMatricule } });

  if (!agent || !agent.actif) {
    return res.status(403).json({ success: false, message: 'Compte agent inactif.', errors: [] });
  }

  const ticket = await prisma.ticket.create({
    data: {
      reference: genererReference(),
      titre: titre || null,
      description,
      agentMatricule: agent.matricule,
      pieceJointe: req.file ? req.file.path : null,
    },
  });

  return res.status(201).json({ success: true, message: 'Ticket créé.', data: ticket });
}

async function classer(req, res) {
  const { categorieId } = req.body;

  if (!categorieId) {
    return res.status(400).json({ success: false, message: 'La catégorie est obligatoire.', errors: [] });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) }, include: { agent: true } });

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket introuvable.', errors: [] });
  }

  if (ticket.agent.structureId !== req.compte.structureId) {
    return res.status(403).json({ success: false, message: 'Ce ticket n\'appartient pas à votre structure.', errors: [] });
  }

  const categorie = await prisma.categorie.findUnique({ where: { id: Number(categorieId) } });

  if (!categorie) {
    return res.status(404).json({ success: false, message: 'Catégorie introuvable.', errors: [] });
  }

  const ticketMisAJour = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { categorieId: Number(categorieId) },
  });

  return res.status(200).json({ success: true, message: 'Ticket classé.', data: ticketMisAJour });
}

async function lister(req, res) {
  const filtres = {};

  if (req.compte.typeCompte === 'UTILISATEUR') {
    filtres.agentMatricule = req.compte.agentMatricule;
  } else if (req.compte.typeCompte === 'RESPONSABLE') {
  filtres.OR = [
    { affectations: { none: {} }, agent: { structureId: req.compte.structureId } },
    { affectations: { some: { affectationSuivante: null, technicien: { responsableId: req.compte.id } } } },
  ];
  } else if (req.compte.typeCompte === 'TECHNICIEN') {
    filtres.affectations = { some: { technicienId: req.compte.id, transferer: false, escalade: false } };
  }

  const tickets = await prisma.ticket.findMany({
    where: filtres,
    include: {
      categorie: true,
      agent: { select: { matricule: true, nom: true, prenom: true, structureId: true } },
    },
    orderBy: { dateCreation: 'desc' },
  });

  return res.status(200).json({ success: true, data: tickets });
}

async function obtenir(req, res) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      categorie: true,
      agent: { select: { matricule: true, nom: true, prenom: true, structureId: true } },
      affectations: {
        include: { technicien: { select: { id: true, username: true, responsableId: true } }, structureCibleEscalade: true },
        orderBy: { dateAffectation: 'asc' },
      },
    },
  });

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket introuvable.', errors: [] });
  }

  return res.status(200).json({ success: true, data: ticket });
}

module.exports = { creer, lister, classer, obtenir };