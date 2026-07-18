const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/affectation.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');

routeur.use(authentifier);

routeur.post('/:id/demarrer', autoriser('TECHNICIEN'), controleur.demarrer);
routeur.post('/:id/cloturer', autoriser('TECHNICIEN'), controleur.cloturer);
routeur.post('/:id/transferer', autoriser('RESPONSABLE'), controleur.transferer);
routeur.post('/:id/escalader', autoriser('TECHNICIEN', 'RESPONSABLE'), controleur.escaladerDepuisAffectation);

module.exports = routeur;