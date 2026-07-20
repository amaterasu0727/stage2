const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const niveauxMetier = [
  { libelle: 'Central (National)', ordre: 1 },
  { libelle: 'Intermédiaire (Départemental)', ordre: 2 },
  { libelle: 'Périphérique (Local)', ordre: 3 },
];

const typesMetier = [
  'Administratif / Technique',
  'Administratif / Décisionnel',
  'Administratif / Gestion',
  'Technique / Régulation',
  'Établissement Public / Soutien',
  'Contrôle / Régulation',
  'Technique / Soutien',
  'Soins (Dernier Recours)',
  'Soins (2ème Recours)',
  'Soins (1er Recours)',
  'Soins de Base',
];

const structuresMetier = [
  { nomstructure: 'DSI (Direction des Systèmes d\'Information)', type: 'Administratif / Technique', niveau: 'Central (National)' },
  { nomstructure: 'CAB-MIN (Cabinet du Ministre)', type: 'Administratif / Décisionnel', niveau: 'Central (National)' },
  { nomstructure: 'SGM (Secrétariat Général du Ministère)', type: 'Administratif / Gestion', niveau: 'Central (National)' },
  { nomstructure: 'DPAF (Direction de la Planification, de l\'Administration et des Finances)', type: 'Administratif / Gestion', niveau: 'Central (National)' },
  { nomstructure: 'DRH (Direction des Ressources Humaines)', type: 'Administratif / Gestion', niveau: 'Central (National)' },
  { nomstructure: 'DNSP (Direction Nationale de la Santé Publique)', type: 'Technique / Régulation', niveau: 'Central (National)' },
  { nomstructure: 'ANSSP (Agence Nationale des Soins de Santé Primaires)', type: 'Établissement Public / Soutien', niveau: 'Central (National)' },
  { nomstructure: 'ABRP (Agence Beninoise de Régulation Pharmaceutique)', type: 'Contrôle / Régulation', niveau: 'Central (National)' },
  { nomstructure: 'ANTS (Agence Nationale pour la Transfusion Sanguine)', type: 'Technique / Soutien', niveau: 'Central (National)' },
  { nomstructure: 'CNHU-HKM (Centre Hospitalier Universitaire National)', type: 'Soins (Dernier Recours)', niveau: 'Central (National)' },
  { nomstructure: 'DDS (Direction Départementale de la Santé)', type: 'Administratif / Gestion', niveau: 'Intermédiaire (Départemental)' },
  { nomstructure: 'CHD (Centre Hospitalier Départemental)', type: 'Soins (2ème Recours)', niveau: 'Intermédiaire (Départemental)' },
  { nomstructure: 'BZS (Bureau de Zone Sanitaire)', type: 'Administratif / Gestion', niveau: 'Périphérique (Local)' },
  { nomstructure: 'HZ (Hôpital de Zone)', type: 'Soins (1er Recours)', niveau: 'Périphérique (Local)' },
  { nomstructure: 'CSC (Centre de Santé de Commune)', type: 'Soins de Base', niveau: 'Périphérique (Local)' },
  { nomstructure: 'CSA (Centre de Santé d\'Arrondissement)', type: 'Soins de Base', niveau: 'Périphérique (Local)' },
  { nomstructure: 'DISP (Dispensaire isolé / Unité locale)', type: 'Soins de Base', niveau: 'Périphérique (Local)' },
];

async function ensureUniqueType(libelle) {
  const existing = await prisma.type.findUnique({ where: { libelle } });
  if (existing) {
    return existing;
  }

  return prisma.type.create({ data: { libelle } });
}

async function ensureUniqueNiveau({ libelle, ordre }) {
  const existing = await prisma.niveau.findUnique({ where: { libelle } });
  if (existing) {
    if (existing.ordre !== ordre) {
      return prisma.niveau.update({
        where: { id: existing.id },
        data: { ordre },
      });
    }
    return existing;
  }

  return prisma.niveau.create({ data: { libelle, ordre } });
}

async function ensureStructure({ nomstructure, typeLibelle, niveauLibelle }) {
  const existing = await prisma.structure.findFirst({ where: { nomstructure } });
  const type = await ensureUniqueType(typeLibelle);
  const niveau = await ensureUniqueNiveau(
    niveauxMetier.find((item) => item.libelle === niveauLibelle)
  );

  if (existing) {
    return prisma.structure.update({
      where: { id: existing.id },
      data: {
        typeId: type.id,
        niveauId: niveau.id,
        nomResponsable: existing.nomResponsable,
        prenomResponsable: existing.prenomResponsable,
        mailResponsable: existing.mailResponsable,
        numResponsable: existing.numResponsable,
      },
    });
  }

  return prisma.structure.create({
    data: {
      nomstructure,
      typeId: type.id,
      niveauId: niveau.id,
    },
  });
}

async function main() {
  const motDePasseHache = await bcrypt.hash('Passer123!', 10);

  await prisma.affectation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.technicien.deleteMany({});
  await prisma.responsableEquipeTechnique.deleteMany({});
  await prisma.pointFocal.deleteMany({});
  await prisma.utilisateur.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.structure.deleteMany({});
  await prisma.type.deleteMany({});
  await prisma.niveau.deleteMany({});

  for (const niveau of niveauxMetier) {
    await ensureUniqueNiveau(niveau);
  }

  for (const typeLibelle of typesMetier) {
    await ensureUniqueType(typeLibelle);
  }

  for (const structure of structuresMetier) {
    await ensureStructure({
      nomstructure: structure.nomstructure,
      typeLibelle: structure.type,
      niveauLibelle: structure.niveau,
    });
  }

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', motdepasse: motDePasseHache },
  });

  await prisma.categorie.upsert({
    where: { nom: 'Materiel' },
    update: {},
    create: { nom: 'Materiel', description: 'Problemes materiels' },
  });

  await prisma.categorie.upsert({
    where: { nom: 'Reseau' },
    update: {},
    create: { nom: 'Reseau', description: 'Problemes de connexion et reseau' },
  });

  console.log('Seed termine. Données de références mises à jour avec la hiérarchie métier officielle.');
  console.log('Compte admin conservé : admin');
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });