const multer = require('multer');

function gestionnaireNotFound(req, res) {
  return res.status(404).json({ success: false, message: 'Route introuvable.', errors: [] });
}

function gestionnaireErreurs(err, req, res, next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Fichier trop volumineux (2 Mo maximum).', errors: [] });
    }
    return res.status(400).json({ success: false, message: 'Erreur lors de l\'envoi du fichier.', errors: [] });
  }

  if (err.message === 'FORMAT_NON_AUTORISE') {
    return res.status(415).json({ success: false, message: 'Format de fichier non autorisé.', errors: [] });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ success: false, message: 'Données invalides envoyées à la requête.', errors: [] });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Ressource introuvable.', errors: [] });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Cette valeur existe déjà (conflit d\'unicité).', errors: [] });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({ success: false, message: 'Référence invalide (élément lié introuvable).', errors: [] });
    }
    return res.status(400).json({ success: false, message: 'Erreur de données invalides.', errors: [] });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.', errors: [] });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Corps de requête JSON invalide.', errors: [] });
  }

  return res.status(500).json({ success: false, message: 'Erreur interne du serveur.', errors: [] });
}

module.exports = { gestionnaireNotFound, gestionnaireErreurs };