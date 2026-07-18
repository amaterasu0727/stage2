const prisma = require('../prisma/client');

async function affecter(req, res) {
  const { technicienId } = req.body;

  if (!technicienId) {
    return res.status(400).json({ success: false, message: 'Le technicien est obligatoire.', errors: [] });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) }, include: { agent: true } });

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket introuvable.', errors: [] });
  }

  if (ticket.agent.structureId !== req.compte.structureId) {
    return res.status(403).json({ success: false, message: 'Ce ticket n\'appartient pas à votre structure.', errors: [] });
  }

  if (!ticket.categorieId) {
    return res.status(409).json({ success: false, message: 'Le ticket doit être catégorisé avant affectation.', errors: [] });
  }

  if (ticket.statut !== 'SOUMIS') {
    return res.status(409).json({ success: false, message: 'Ce ticket a déjà une affectation en cours.', errors: [] });
  }

  const technicien = await prisma.technicien.findUnique({ where: { id: Number(technicienId) } });

  if (!technicien || technicien.responsableId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Ce technicien ne fait pas partie de votre équipe.', errors: [] });
  }

  const affectation = await prisma.affectation.create({
    data: { ticketId: ticket.id, technicienId: technicien.id },
  });

  await prisma.ticket.update({ where: { id: ticket.id }, data: { statut: 'AFFECTE' } });

  return res.status(201).json({ success: true, message: 'Ticket affecté.', data: affectation });
}

async function demarrer(req, res) {
  const affectation = await prisma.affectation.findUnique({ where: { id: Number(req.params.id) } });

  if (!affectation) {
    return res.status(404).json({ success: false, message: 'Affectation introuvable.', errors: [] });
  }

  if (affectation.technicienId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Cette affectation ne vous appartient pas.', errors: [] });
  }

  if (affectation.transferer || affectation.escalade) {
    return res.status(409).json({ success: false, message: 'Vous n\'avez plus la main sur ce ticket.', errors: [] });
  }

  const affectationMiseAJour = await prisma.affectation.update({
    where: { id: affectation.id },
    data: { statut: 'EN_TRAITEMENT', dateDebutTrait: new Date() },
  });

  await prisma.ticket.update({ where: { id: affectation.ticketId }, data: { statut: 'EN_COURS' } });

  return res.status(200).json({ success: true, message: 'Traitement démarré.', data: affectationMiseAJour });
}

async function cloturer(req, res) {
  const { commentaire } = req.body;

  const affectation = await prisma.affectation.findUnique({ where: { id: Number(req.params.id) } });

  if (!affectation) {
    return res.status(404).json({ success: false, message: 'Affectation introuvable.', errors: [] });
  }

  if (affectation.technicienId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Cette affectation ne vous appartient pas.', errors: [] });
  }

  if (affectation.transferer || affectation.escalade) {
    return res.status(409).json({ success: false, message: 'Vous n\'avez plus la main sur ce ticket.', errors: [] });
  }

  const affectationMiseAJour = await prisma.affectation.update({
    where: { id: affectation.id },
    data: { dateFinTrait: new Date(), commentaire: commentaire || affectation.commentaire },
  });

  await prisma.ticket.update({ where: { id: affectation.ticketId }, data: { statut: 'CLOTURE' } });

  return res.status(200).json({ success: true, message: 'Ticket clôturé.', data: affectationMiseAJour });
}

async function transferer(req, res) {
  const { nouveauTechnicienId, raisonTransfert, commentaireTransfert } = req.body;

  if (!nouveauTechnicienId || !raisonTransfert) {
    return res.status(400).json({ success: false, message: 'Nouveau technicien et raison obligatoires.', errors: [] });
  }

  const affectation = await prisma.affectation.findUnique({
    where: { id: Number(req.params.id) },
    include: { technicien: true },
  });

  if (!affectation) {
    return res.status(404).json({ success: false, message: 'Affectation introuvable.', errors: [] });
  }

  if (affectation.technicien.responsableId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Cette affectation ne relève pas de votre équipe.', errors: [] });
  }

  if (affectation.transferer || affectation.escalade) {
    return res.status(409).json({ success: false, message: 'Cette affectation a déjà été transférée ou escaladée.', errors: [] });
  }

  const nouveauTechnicien = await prisma.technicien.findUnique({ where: { id: Number(nouveauTechnicienId) } });

  if (!nouveauTechnicien || nouveauTechnicien.responsableId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Ce technicien ne fait pas partie de votre équipe.', errors: [] });
  }

  const nouvelleAffectation = await prisma.$transaction(async (tx) => {
    await tx.affectation.update({
      where: { id: affectation.id },
      data: { transferer: true, dateTransfert: new Date(), raisonTransfert, commentaireTransfert },
    });

    return tx.affectation.create({
      data: { ticketId: affectation.ticketId, technicienId: nouveauTechnicien.id, affectationPrecedenteId: affectation.id },
    });
  });

  await prisma.ticket.update({ where: { id: affectation.ticketId }, data: { statut: 'AFFECTE' } });

  return res.status(201).json({ success: true, message: 'Ticket transféré.', data: nouvelleAffectation });
}

async function trouverTechnicienJumeau(responsableId) {
  const responsable = await prisma.responsableEquipeTechnique.findUnique({ where: { id: responsableId } });
  if (!responsable) return null;
  return prisma.technicien.findFirst({ where: { username: `${responsable.username}.technicien` } });
}

async function trouverTechnicienJumeau(responsableId) {
  const responsable = await prisma.responsableEquipeTechnique.findUnique({ where: { id: responsableId } });
  if (!responsable) return null;
  return prisma.technicien.findFirst({ where: { username: `${responsable.username}.technicien` } });
}

async function effectuerEscalade({ res, ticket, affectationCourante, structureActuelleId, structureCibleId, commentaireEscalade }) {
  const structureActuelle = await prisma.structure.findUnique({ where: { id: structureActuelleId }, include: { niveau: true } });
  const structureCible = await prisma.structure.findUnique({ where: { id: Number(structureCibleId) }, include: { niveau: true } });

  if (!structureCible) {
    return res.status(404).json({ success: false, message: 'Structure cible introuvable.', errors: [] });
  }

  const vaVersLeHaut = structureCible.niveau.ordre < structureActuelle.niveau.ordre;
  const recuParEscalade = affectationCourante.affectationPrecedente?.escalade === true;

  if (vaVersLeHaut && recuParEscalade) {
    return res.status(409).json({ success: false, message: 'Cette structure a reçu ce ticket par escalade, elle ne peut pas l\'escalader plus haut.', errors: [] });
  }

  if (!vaVersLeHaut && !recuParEscalade) {
    return res.status(409).json({ success: false, message: 'Seul un ticket reçu par escalade peut être renvoyé vers un niveau inférieur.', errors: [] });
  }

  const responsableCible = await prisma.responsableEquipeTechnique.findUnique({ where: { structureId: structureCible.id } });

  if (!responsableCible) {
    return res.status(404).json({ success: false, message: 'Cette structure n\'a pas de responsable équipe technique.', errors: [] });
  }

  const technicienJumeauCible = await trouverTechnicienJumeau(responsableCible.id);

  if (!technicienJumeauCible) {
    return res.status(500).json({ success: false, message: 'Compte technicien jumeau de la structure cible introuvable.', errors: [] });
  }

  const nouvelleAffectation = await prisma.$transaction(async (tx) => {
    await tx.affectation.update({
      where: { id: affectationCourante.id },
      data: {
        escalade: vaVersLeHaut,
        dateEscalade: new Date(),
        commentaireEscalade: commentaireEscalade || null,
        structureCibleEscaladeId: structureCible.id,
      },
    });

    return tx.affectation.create({
      data: { ticketId: ticket.id, technicienId: technicienJumeauCible.id, affectationPrecedenteId: affectationCourante.id },
    });
  });

  await prisma.ticket.update({ where: { id: ticket.id }, data: { statut: 'AFFECTE' } });

  return res.status(200).json({
    success: true,
    message: vaVersLeHaut ? 'Ticket escaladé.' : 'Ticket renvoyé au niveau inférieur.',
    data: nouvelleAffectation,
  });
}

async function escaladerDepuisAffectation(req, res) {
  const { structureCibleId, commentaireEscalade } = req.body;

  if (!structureCibleId) {
    return res.status(400).json({ success: false, message: 'La structure cible est obligatoire.', errors: [] });
  }

  const affectationCourante = await prisma.affectation.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      technicien: { include: { responsable: true } },
      affectationPrecedente: true,
      ticket: true,
    },
  });

  if (!affectationCourante) {
    return res.status(404).json({ success: false, message: 'Affectation introuvable.', errors: [] });
  }

  const estProprietaireTechnicien = req.compte.typeCompte === 'TECHNICIEN' && affectationCourante.technicienId === req.compte.id;
  const estResponsableEquipe = req.compte.typeCompte === 'RESPONSABLE' && affectationCourante.technicien.responsableId === req.compte.id;

  if (!estProprietaireTechnicien && !estResponsableEquipe) {
    return res.status(403).json({ success: false, message: 'Vous n\'avez pas la main sur ce ticket.', errors: [] });
  }

  if (affectationCourante.transferer || affectationCourante.escalade) {
    return res.status(409).json({ success: false, message: 'Ce ticket a déjà été transféré ou escaladé.', errors: [] });
  }

  return effectuerEscalade({
    res,
    ticket: affectationCourante.ticket,
    affectationCourante,
    structureActuelleId: affectationCourante.technicien.responsable.structureId,
    structureCibleId,
    commentaireEscalade,
  });
}

async function escaladerDepuisTicket(req, res) {
  const { structureCibleId, commentaireEscalade } = req.body;

  if (!structureCibleId) {
    return res.status(400).json({ success: false, message: 'La structure cible est obligatoire.', errors: [] });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) }, include: { agent: true } });

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket introuvable.', errors: [] });
  }

  if (ticket.agent.structureId !== req.compte.structureId) {
    return res.status(403).json({ success: false, message: 'Ce ticket n\'appartient pas à votre structure.', errors: [] });
  }

  if (ticket.statut !== 'SOUMIS') {
    return res.status(409).json({ success: false, message: 'Ce ticket a déjà une affectation en cours, utilisez la route d\'escalade depuis une affectation.', errors: [] });
  }

  const technicienJumeau = await trouverTechnicienJumeau(req.compte.id);

  if (!technicienJumeau) {
    return res.status(500).json({ success: false, message: 'Compte technicien jumeau introuvable.', errors: [] });
  }

  const affectationCourante = await prisma.affectation.create({
    data: { ticketId: ticket.id, technicienId: technicienJumeau.id },
    include: { affectationPrecedente: true },
  });

  return effectuerEscalade({
    res,
    ticket,
    affectationCourante,
    structureActuelleId: req.compte.structureId,
    structureCibleId,
    commentaireEscalade,
  });
}

module.exports = { affecter, demarrer, cloturer, transferer, escaladerDepuisAffectation, escaladerDepuisTicket };