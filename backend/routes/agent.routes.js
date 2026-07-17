const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/agent.controller');
const { authentifier, autoriser } = require('../middlewares/auth.middleware');

routeur.use(authentifier);
routeur.use(autoriser('POINT_FOCAL'));

routeur.post('/', controleur.creer);
routeur.get('/', controleur.lister);
routeur.patch('/:matricule/desactiver', controleur.desactiver);
routeur.patch('/:matricule/reactiver', controleur.reactiver);
module.exports = routeur;