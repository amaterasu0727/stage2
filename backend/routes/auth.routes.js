const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/auth.controller');
const { authentifier } = require('../middlewares/auth.middleware');

routeur.post('/inscription/verifier-matricule', controleur.verifierMatricule);
routeur.post('/inscription/verifier-code', controleur.verifierCode);
routeur.post('/inscription/finaliser', controleur.finaliserInscription);
routeur.post('/login', controleur.login);
routeur.post('/refresh', controleur.refresh);
routeur.post('/logout', authentifier, controleur.logout);
routeur.get('/me', authentifier, controleur.moi);
routeur.put('/changer-mot-de-passe', authentifier, controleur.changerMotDePasse);
routeur.post('/inscription/renvoyer-code', controleur.verifierMatricule);

module.exports = routeur;