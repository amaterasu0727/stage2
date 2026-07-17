const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/compte.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');

routeur.use(authentifier);

routeur.post('/responsables', autoriser('ADMIN'), controleur.creerResponsable);
routeur.get('/responsables', autoriser('ADMIN'), controleur.listerResponsables);
routeur.post('/techniciens', autoriser('ADMIN'), controleur.creerTechnicien);
routeur.get('/techniciens', autoriser('ADMIN', 'RESPONSABLE'), controleur.listerTechniciens);
routeur.post('/points-focaux', autoriser('ADMIN'), controleur.creerPointFocal);
routeur.get('/points-focaux', autoriser('ADMIN'), controleur.listerPointsFocaux);

module.exports = routeur;