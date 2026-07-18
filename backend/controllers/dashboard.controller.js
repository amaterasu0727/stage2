const prisma = require('../prisma/client');

async function utilisateur(req, res) {
  const agentMatricule = req.compte.agentMatricule;

  const [total, soumis, enCours, clotures] = await Promise.all([
    prisma.ticket.count({ where: { agentMatricule } }),
    prisma.ticket.count({ where: { agentMatricule, statut: 'SOUMIS' } }),
    prisma.ticket.count({ where: { agentMatricule, statut: { in: ['AFFECTE', 'EN_COURS'] } } }),
    prisma.ticket.count({ where: { agentMatricule, statut: 'CLOTURE' } }),
  ]);

  return res.status(200).json({ success: true, data: { total, soumis, enCours, clotures } });
}

async function technicien(req, res) {
  const technicienId = req.compte.id;

  const [affectes, enTraitement, cloturesDuMois] = await Promise.all([
    prisma.affectation.count({ where: { technicienId, affectationSuivante: null } }),
    prisma.affectation.count({ where: { technicienId, statut: 'EN_TRAITEMENT', affectationSuivante: null } }),
    prisma.affectation.count({
      where: { technicienId, dateFinTrait: { gte: new Date(new Date().setDate(1)) } },
    }),
  ]);

  return res.status(200).json({ success: true, data: { affectes, enTraitement, cloturesDuMois } });
}

async function responsable(req, res) {
  const structureId = req.compte.structureId;

  const [nonAffectes, enCours, escaladesEnCours, techniciensCount] = await Promise.all([
    prisma.ticket.count({ where: { agent: { structureId }, statut: 'SOUMIS' } }),
    prisma.ticket.count({ where: { agent: { structureId }, statut: { in: ['AFFECTE', 'EN_COURS'] } } }),
    prisma.affectation.count({
      where: { technicien: { responsableId: req.compte.id }, escalade: true, affectationSuivante: { isNot: null } },
    }),
    prisma.technicien.count({ where: { responsableId: req.compte.id } }),
  ]);

  return res.status(200).json({ success: true, data: { nonAffectes, enCours, escaladesEnCours, techniciensCount } });
}

async function admin(req, res) {
  const [agents, structures, ticketsTotal, ticketsClotures] = await Promise.all([
    prisma.agent.count(),
    prisma.structure.count(),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { statut: 'CLOTURE' } }),
  ]);

  return res.status(200).json({ success: true, data: { agents, structures, ticketsTotal, ticketsClotures } });
}

module.exports = { utilisateur, technicien, responsable, admin };