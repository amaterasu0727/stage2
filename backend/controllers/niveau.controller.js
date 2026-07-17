const prisma = require('../prisma/client');

async function lister(req, res) {
  const niveaux = await prisma.niveau.findMany({ orderBy: { ordre: 'asc' } });
  return res.status(200).json({ success: true, data: niveaux });
}

async function creer(req, res) {
  const { libelle, ordre } = req.body;

  if (!libelle || ordre === undefined) {
    return res.status(400).json({ success: false, message: 'Libellé et ordre obligatoires.', errors: [] });
  }

  const niveau = await prisma.niveau.create({ data: { libelle, ordre: Number(ordre) } });
  return res.status(201).json({ success: true, message: 'Niveau créé.', data: niveau });
}

module.exports = { lister, creer };