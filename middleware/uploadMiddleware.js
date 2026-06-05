const multer = require('multer');

const storage = multer.memoryStorage(); // store in memory, not disk

const fileFilter = (req, file, cb) => {
  if (file.originalname.endsWith('.md') || file.mimetype === 'text/markdown' || file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Only .md files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB max
});

module.exports = upload;
