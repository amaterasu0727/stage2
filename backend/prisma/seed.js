const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const motDePasseHache = await bcrypt.hash('Passer123!', 10);

  const niveauNational = await prisma.niveau.upsert({
    where: { libelle: 'National' },
    update: {},
    create: { libelle: 'National', ordre: 1 },
  });

  const niveauDepartemental = await prisma.niveau.upsert({
    where: { libelle: 'Departemental' },
    update: {},
    create: { libelle: 'Departemental', ordre: 2 },
  });

  await prisma.niveau.upsert({
    where: { libelle: 'Sanitaire' },
    update: {},
    create: { libelle: 'Sanitaire', ordre: 3 },
  });

  await prisma.niveau.upsert({
    where: { libelle: 'Formation sanitaire' },
    update: {},
    create: { libelle: 'Formation sanitaire', ordre: 4 },
  });

  const typeDirectionCentrale = await prisma.type.upsert({
    where: { libelle: 'Direction centrale' },
    update: {},
    create: { libelle: 'Direction centrale' },
  });

  const typeDDS = await prisma.type.upsert({
    where: { libelle: 'Direction Departementale de la Sante' },
    update: {},
    create: { libelle: 'Direction Departementale de la Sante' },
  });

  await prisma.type.upsert({
    where: { libelle: 'Agence' },
    update: {},
    create: { libelle: 'Agence' },
  });

  const structureNationale = await prisma.structure.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nomstructure: 'Direction Nationale de la Sante Publique',
      typeId: typeDirectionCentrale.id,
      niveauId: niveauNational.id,
    },
  });

  const structureDepartementale = await prisma.structure.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nomstructure: 'DDS Atlantique-Littoral',
      typeId: typeDDS.id,
      niveauId: niveauDepartemental.id,
    },
  });

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', motdepasse: motDePasseHache },
  });

  const pointFocal = await prisma.pointFocal.upsert({
    where: { structureId: structureDepartementale.id },
    update: {},
    create: {
      nom: 'Pointfocal',
      prenom: 'Test',
      username: 'pointfocal.test',
      motdepasse: motDePasseHache,
      telephone: '0100000001',
      structureId: structureDepartementale.id,
    },
  });

  const agent = await prisma.agent.upsert({
    where: { matricule: 100001 },
    update: {},
    create: {
      matricule: 100001,
      nom: 'Agent',
      prenom: 'Test',
      sexe: 'M',
      numero: '0100000002',
      email: 'agent.test@ministere.bj',
      structureId: structureDepartementale.id,
    },
  });

  await prisma.utilisateur.upsert({
    where: { agentMatricule: agent.matricule },
    update: {},
    create: {
      username: 'agent.test',
      motdepasse: motDePasseHache,
      telephone: agent.numero,
      agentMatricule: agent.matricule,
    },
  });

  const responsable = await prisma.responsableEquipeTechnique.upsert({
    where: { structureId: structureDepartementale.id },
    update: {},
    create: {
      username: 'responsable.test',
      motdepasse: motDePasseHache,
      telephone: '0100000003',
      structureId: structureDepartementale.id,
    },
  });

  await prisma.technicien.upsert({
    where: { username: 'responsable.test.technicien' },
    update: {},
    create: {
      username: 'responsable.test.technicien',
      motdepasse: motDePasseHache,
      telephone: '0100000003',
      responsableId: responsable.id,
    },
  });

  await prisma.technicien.upsert({
    where: { username: 'technicien.test' },
    update: {},
    create: {
      username: 'technicien.test',
      motdepasse: motDePasseHache,
      telephone: '0100000004',
      responsableId: responsable.id,
    },
  });

  const responsableNational = await prisma.responsableEquipeTechnique.upsert({
    where: { structureId: structureNationale.id },
    update: {},
    create: {
      username: 'responsable.national',
      motdepasse: motDePasseHache,
      telephone: '0100000005',
      structureId: structureNationale.id,
    },
  });

  await prisma.technicien.upsert({
    where: { username: 'responsable.national.technicien' },
    update: {},
    create: {
      username: 'responsable.national.technicien',
      motdepasse: motDePasseHache,
      telephone: '0100000005',
      responsableId: responsableNational.id,
    },
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

  console.log('Seed termine. Mot de passe pour tous les comptes : Passer123!');
  console.log('Comptes crees : admin / pointfocal.test / agent.test / responsable.test / responsable.test.technicien / technicien.test / responsable.national / responsable.national.technicien');
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });