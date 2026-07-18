const nodemailer = require('nodemailer');

const transporteur = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function envoyerCodeInscription(destinataire, nomComplet, code) {
  try {
    await transporteur.sendMail({
      from: process.env.EMAIL_FROM,
      to: destinataire,
      subject: 'Code de vérification — Inscription',
      text: `Bonjour ${nomComplet},\n\nVotre code de vérification est : ${code}\n\nCe code est valable 1 heure.`,
    });
  } catch (erreur) {
    console.error('Erreur envoi code inscription :', erreur.message);
  }
}
async function envoyerEmailRelance(destinataireUsername, referenceTicket, role) {
  console.log(`[RELANCE] ${role} (${destinataireUsername}) — ticket ${referenceTicket} en retard`);
}

module.exports = { envoyerCodeInscription };