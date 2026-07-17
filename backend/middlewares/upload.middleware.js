const fs = require('fs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const destination = path.join(__dirname, '..', 'uploads', 'ticekts');
fs.mkdirSync(destination, { recursive: true });

const stockage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destination),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage: stockage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;