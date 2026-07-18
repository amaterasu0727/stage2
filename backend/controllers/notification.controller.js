const prisma = require('../prisma/client');

async function lister(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { destinataireTypeCompte: req.compte.typeCompte, destinataireId: req.compte.id },
    orderBy: { dateEnvoi: 'desc' },
  });

  return res.status(200).json({ success: true, data: notifications });
}

async function marquerLue(req, res) {
  const notification = await prisma.notification.findUnique({ where: { id: Number(req.params.id) } });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification introuvable.', errors: [] });
  }

  if (notification.destinataireTypeCompte !== req.compte.typeCompte || notification.destinataireId !== req.compte.id) {
    return res.status(403).json({ success: false, message: 'Accès refusé.', errors: [] });
  }

  const notificationMiseAJour = await prisma.notification.update({ where: { id: notification.id }, data: { lu: true } });

  return res.status(200).json({ success: true, data: notificationMiseAJour });
}

module.exports = { lister, marquerLue };