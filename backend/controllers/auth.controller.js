const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');
const { genererAccessToken, genererRefreshToken, verifierRefreshToken } = require('../utils/jwt');
const { envoyerCodeInscription } = require('../utils/email');

function genererCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifierMatricule(req, res) {
  const { matricule } = req.body;

  if (!matricule) {
    return res.status(400).json({ success: false, message: 'Le matricule est obligatoire.', errors: [] });
  }

  const agent = await prisma.agent.findUnique({ where: { matricule: Number(matricule) }, include: { utilisateur: true } });

  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent introuvable.', errors: [] });
  }

  if (!agent.actif) {
    return res.status(403).json({ success: false, message: 'Agent inactif.', errors: [] });
  }

  if (agent.utilisateur) {
    return res.status(409).json({ success: false, message: 'Un compte existe déjà pour cet agent.', errors: [] });
  }

  const code = genererCode();
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);

  await prisma.agent.update({
    where: { matricule: agent.matricule },
    data: { codeVerification: code, codeVerificationExpiration: expiration },
  });

  await envoyerCodeInscription(agent.email, `${agent.prenom} ${agent.nom}`, code);

  return res.status(200).json({ success: true, message: 'Code envoyé.' });
}

async function verifierCode(req, res) {
  const { matricule, code } = req.body;

  const agent = await prisma.agent.findUnique({ where: { matricule: Number(matricule) } });

  if (!agent || agent.codeVerification !== code || agent.codeVerificationExpiration < new Date()) {
    return res.status(401).json({ success: false, message: 'Code invalide ou expiré.', errors: [] });
  }

  return res.status(200).json({ success: true, message: 'Code valide.' });
}

async function finaliserInscription(req, res) {
  const { matricule, code, username, motdepasse } = req.body;

  if (!username || !motdepasse) {
    return res.status(400).json({ success: false, message: 'Identifiants obligatoires.', errors: [] });
  }

  if (motdepasse.length < 6) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.', errors: [] });
  }

  const agent = await prisma.agent.findUnique({ where: { matricule: Number(matricule) } });

  if (!agent || agent.codeVerification !== code || agent.codeVerificationExpiration < new Date()) {
    return res.status(401).json({ success: false, message: 'Code invalide ou expiré.', errors: [] });
  }

  const usernameExistant = await prisma.utilisateur.findUnique({ where: { username } });

  if (usernameExistant) {
    return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris.', errors: [] });
  }

  const motdepasseHache = await bcrypt.hash(motdepasse, 10);

  const utilisateur = await prisma.utilisateur.create({
    data: { username, motdepasse: motdepasseHache, telephone: agent.numero, agentMatricule: agent.matricule },
  });

  await prisma.agent.update({
    where: { matricule: agent.matricule },
    data: { codeVerification: null, codeVerificationExpiration: null },
  });

  const { motdepasse: _, ...utilisateurSansMotDePasse } = utilisateur;

  return res.status(201).json({ success: true, message: 'Compte créé.', data: utilisateurSansMotDePasse });
}

const TABLES_PAR_TYPE = {
  UTILISATEUR: 'utilisateur',
  TECHNICIEN: 'technicien',
  RESPONSABLE: 'responsableEquipeTechnique',
  POINT_FOCAL: 'pointFocal',
  ADMIN: 'admin',
};

async function login(req, res) {
  const { username, motdepasse, typeCompte } = req.body;

  if (!username || !motdepasse || !typeCompte || !TABLES_PAR_TYPE[typeCompte]) {
    return res.status(400).json({ success: false, message: 'Champs invalides.', errors: [] });
  }

  const table = prisma[TABLES_PAR_TYPE[typeCompte]];
  const compte = await table.findUnique({ where: { username } });

  if (!compte) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects.', errors: [] });
  }

  if (typeCompte !== 'ADMIN' && !compte.actif) {
    return res.status(403).json({ success: false, message: 'Compte désactivé.', errors: [] });
  }

  const motdepasseValide = await bcrypt.compare(motdepasse, compte.motdepasse);

  if (!motdepasseValide) {
    return res.status(401).json({ success: false, message: 'Identifiants incorrects.', errors: [] });
  }

  const accessToken = genererAccessToken(compte, typeCompte);
  const { token: refreshToken, jti } = genererRefreshToken(compte, typeCompte);

  const dateExpiration = new Date();
  dateExpiration.setDate(dateExpiration.getDate() + 7);

  await prisma.sessionToken.create({
    data: { jti, typeCompte, compteId: compte.id, dateExpiration },
  });

  const { motdepasse: _, ...compteSansMotDePasse } = compte;

  return res.status(200).json({
    success: true,
    message: 'Connexion réussie.',
    data: { accessToken, refreshToken, profil: compteSansMotDePasse, typeCompte },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token requis.', errors: [] });
  }

  let payload;
  try {
    payload = verifierRefreshToken(refreshToken);
  } catch (erreur) {
    return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré.', errors: [] });
  }

  const session = await prisma.sessionToken.findUnique({ where: { jti: payload.jti } });

  if (!session || session.revoque || session.dateExpiration < new Date()) {
    return res.status(401).json({ success: false, message: 'Session invalide.', errors: [] });
  }

  const table = prisma[TABLES_PAR_TYPE[payload.typeCompte]];
  const compte = await table.findUnique({ where: { id: payload.id } });

  if (!compte || (payload.typeCompte !== 'ADMIN' && !compte.actif)) {
    return res.status(401).json({ success: false, message: 'Compte introuvable ou désactivé.', errors: [] });
  }

  const accessToken = genererAccessToken(compte, payload.typeCompte);

  return res.status(200).json({ success: true, message: 'Token renouvelé.', data: { accessToken } });
}

async function logout(req, res) {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const payload = verifierRefreshToken(refreshToken);
      await prisma.sessionToken.updateMany({ where: { jti: payload.jti }, data: { revoque: true } });
    } catch (erreur) {}
  }

  return res.status(200).json({ success: true, message: 'Déconnexion réussie.' });
}

async function moi(req, res) {
  const table = prisma[TABLES_PAR_TYPE[req.compte.typeCompte]];
  const compte = await table.findUnique({ where: { id: req.compte.id } });

  if (!compte) {
    return res.status(404).json({ success: false, message: 'Compte introuvable.', errors: [] });
  }

  const { motdepasse: _, ...compteSansMotDePasse } = compte;

  return res.status(200).json({ success: true, data: { ...compteSansMotDePasse, typeCompte: req.compte.typeCompte } });
}

async function changerMotDePasse(req, res) {
  const { ancienMotDePasse, nouveauMotDePasse } = req.body;

  if (!ancienMotDePasse || !nouveauMotDePasse) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants.', errors: [] });
  }

  const table = prisma[TABLES_PAR_TYPE[req.compte.typeCompte]];
  const compte = await table.findUnique({ where: { id: req.compte.id } });

  const motdepasseValide = await bcrypt.compare(ancienMotDePasse, compte.motdepasse);

  if (!motdepasseValide) {
    return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect.', errors: [] });
  }

  const nouveauMotDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);

  await table.update({ where: { id: compte.id }, data: { motdepasse: nouveauMotDePasseHache } });

  return res.status(200).json({ success: true, message: 'Mot de passe modifié.' });
}

module.exports = { verifierMatricule, verifierCode, finaliserInscription, login, refresh, logout, moi, changerMotDePasse };