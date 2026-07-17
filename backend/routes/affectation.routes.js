const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/affectation.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');

routeur.use(authentifier);
routeur.use(autoriser('TECHNICIEN'));

routeur.post('/:id/demarrer', controleur.demarrer);
routeur.post('/:id/cloturer', controleur.cloturer);

module.exports = routeur;