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

module.exports = { affecter, demarrer, cloturer };