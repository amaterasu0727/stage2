const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/compte.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');

routeur.use(authentifier);

routeur.post('/responsables', autoriser('ADMIN'), controleur.creerResponsable);
routeur.get('/responsables', autoriser('ADMIN'), controleur.listerResponsables);
routeur.patch('/responsables/:id/desactiver', autoriser('ADMIN'), controleur.desactiverResponsable);
routeur.patch('/responsables/:id/reactiver', autoriser('ADMIN'), controleur.reactiverResponsable);
routeur.post('/techniciens', autoriser('ADMIN'), controleur.creerTechnicien);
routeur.get('/techniciens', autoriser('ADMIN', 'RESPONSABLE'), controleur.listerTechniciens);
routeur.patch('/techniciens/:id/desactiver', autoriser('ADMIN'), controleur.desactiverTechnicien);
routeur.patch('/techniciens/:id/reactiver', autoriser('ADMIN'), controleur.reactiverTechnicien);
routeur.post('/points-focaux', autoriser('ADMIN'), controleur.creerPointFocal);
routeur.get('/points-focaux', autoriser('ADMIN'), controleur.listerPointsFocaux);
routeur.patch('/points-focaux/:id/desactiver', autoriser('ADMIN'), controleur.desactiverPointFocal);
routeur.patch('/points-focaux/:id/reactiver', autoriser('ADMIN'), controleur.reactiverPointFocal);

module.exports = routeur;