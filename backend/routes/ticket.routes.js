const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/ticket.controller');
const affectationControleur = require('../controllers/affectation.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

routeur.use(authentifier);

routeur.post(
  '/',
  autoriser('UTILISATEUR'),
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      return upload.single('pieceJointe')(req, res, next);
    }
    return next();
  },
  controleur.creer,
);
routeur.get('/', controleur.lister);
routeur.get('/:id', controleur.obtenir);
routeur.post('/:id/affecter', autoriser('RESPONSABLE'), affectationControleur.affecter);
routeur.patch('/:id/categorie', autoriser('RESPONSABLE'), controleur.classer);
routeur.post('/:id/escalader', autoriser('RESPONSABLE'), affectationControleur.escaladerDepuisTicket);
module.exports = routeur;