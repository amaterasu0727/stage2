const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

function genererAccessToken(compte, typeCompte) {
  const payload = { id: compte.id, typeCompte };
  if (typeCompte === 'UTILISATEUR') payload.agentMatricule = compte.agentMatricule;
  if (['TECHNICIEN', 'RESPONSABLE', 'POINT_FOCAL'].includes(typeCompte)) payload.structureId = compte.structureId || compte.responsable?.structureId;
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function genererRefreshToken(compte, typeCompte) {
  const jti = randomUUID();
  const token = jwt.sign({ id: compte.id, typeCompte, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, jti };
}

function verifierAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifierRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { genererAccessToken, genererRefreshToken, verifierAccessToken, verifierRefreshToken };