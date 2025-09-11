const express = require('express');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadFile,
  uploadMultipleFiles,
  getFiles,
  getFile,
  deleteFile
} = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/upload', upload.single('file'), handleUploadError, uploadFile);
router.post('/upload-multiple', upload.array('files', 10), handleUploadError, uploadMultipleFiles);
router.get('/', getFiles);
router.get('/:id', getFile);
router.delete('/:id', deleteFile);

module.exports = router;