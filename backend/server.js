const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
const { gestionnaireNotFound, gestionnaireErreurs } = require('./middlewares/erreur.middleware');

const agentRoutes = require('./routes/agent.routes');
app.use('/api/agents', agentRoutes);

const structureRoutes = require('./routes/structure.routes');
const typeRoutes = require('./routes/type.routes');
const niveauRoutes = require('./routes/niveau.routes');
const compteRoutes = require('./routes/compte.routes');
const categorieRoutes = require('./routes/categorie.routes');

app.use('/api/structures', structureRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/niveaux', niveauRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api', compteRoutes);

const ticketRoutes = require('./routes/ticket.routes');
const affectationRoutes = require('./routes/affectation.routes');

app.use('/api/tickets', ticketRoutes);
app.use('/api/affectations', affectationRoutes);

const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);

app.use(gestionnaireNotFound);
app.use(gestionnaireErreurs);

app.listen(PORT, () => {
  console.log('=== SERVEUR DEMARRE ===');
  console.log(`URL : http://localhost:${PORT}`);
  console.log(`Environnement : ${process.env.NODE_ENV || 'development'}`);
});