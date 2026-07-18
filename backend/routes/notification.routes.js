const express = require('express');
const routeur = express.Router();
const controleur = require('../controllers/notification.controller');
const { authentifier } = require('../middlewares/auth.middleware');

routeur.use(authentifier);

routeur.get('/', controleur.lister);
routeur.patch('/:id/lu', controleur.marquerLue);

module.exports = routeur;