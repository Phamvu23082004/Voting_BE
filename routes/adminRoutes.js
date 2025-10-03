const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload');
const caController = require('../controllers/caController');


// API: Upload CSV
// router.post('/upload/csv', upload.single('file'), caController.uploadCSV);

// API: Upload Excel
router.post('/upload/excel', upload.single('file'), caController.uploadExcel);

router.post('/upload/CSV', upload.single('file'), caController.uploadcsvfast);

router.post('/finalize/:electionId', caController.finalizeElection);
module.exports = router;

