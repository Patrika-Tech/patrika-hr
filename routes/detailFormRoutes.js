const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const ctrl    = require('../controllers/detailFormController');

// Photo upload for detail form
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads/photos');
      require('fs').mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `photo_${req.params.token}_${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /image\/(jpeg|jpg|png)/.test(file.mimetype));
  }
});

router.get('/detail-form/:token',  ctrl.showDetailForm);
router.post('/detail-form/:token', photoUpload.single('photo'), ctrl.submitDetailForm);

module.exports = router;
