const { verifierAccessToken } = require('../utils/jwt');

function authentifier(req, res, next) {
  const enTete = req.headers.authorization;
  if (!enTete || !enTete.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant.', errors: [] });
  }
  const token = enTete.split(' ')[1];
  try {
    req.compte = verifierAccessToken(token);
    next();
  } catch (erreur) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.', errors: [] });
  }
}

function autoriser(...typesAutorises) {
  return (req, res, next) => {
    if (!typesAutorises.includes(req.compte.typeCompte)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.', errors: [] });
    }
    next();
  };
}

module.exports = { authentifier, autoriser };