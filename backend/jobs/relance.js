const cron = require('node-cron');
const prisma = require('../prisma/client');

async function verifierRetards() {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - 2);

  const affectationsEnRetard = await prisma.affectation.findMany({
    where: {
      statut: 'AFFECTE',
      dateDebutTrait: null,
      transferer: false,
      escalade: false,
      dateAffectation: { lte: seuil },
      affectationSuivante: null,
    },
    include: { technicien: { include: { responsable: true } }, ticket: true },
  });

  for (const affectation of affectationsEnRetard) {
    const dejaNotifieTechnicien = await prisma.notification.findFirst({
      where: { destinataireTypeCompte: 'TECHNICIEN', destinataireId: affectation.technicienId, ticketId: affectation.ticketId, titre: 'Retard de traitement' },
    });

    if (!dejaNotifieTechnicien) {
      await prisma.notification.create({
        data: {
          destinataireTypeCompte: 'TECHNICIEN',
          destinataireId: affectation.technicienId,
          titre: 'Retard de traitement',
          message: `Le ticket ${affectation.ticket.reference} n'a pas été démarré depuis plus de 2 jours.`,
          ticketId: affectation.ticketId,
        },
      });

      await prisma.notification.create({
        data: {
          destinataireTypeCompte: 'RESPONSABLE',
          destinataireId: affectation.technicien.responsableId,
          titre: 'Retard de traitement dans votre équipe',
          message: `Le ticket ${affectation.ticket.reference}, affecté à ${affectation.technicien.username}, n'a pas été démarré depuis plus de 2 jours.`,
          ticketId: affectation.ticketId,
        },
      });
    }
  }

  if (affectationsEnRetard.length > 0) {
    console.log(`Relance : ${affectationsEnRetard.length} affectation(s) vérifiée(s), notifications créées si nécessaire.`);
  }
}

function demarrerTacheRelance() {
  cron.schedule('0 * * * *', verifierRetards);
  console.log('Tâche de relance démarrée (vérification toutes les heures).');
}

module.exports = { demarrerTacheRelance, verifierRetards };