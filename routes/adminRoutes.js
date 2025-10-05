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

// CA public election info
router.post("/publish-election/:electionId", caController.publishElectionInfo);

// CA public candidate list
router.post("/publish-candidates/:electionId", caController.publishCandidates);

// CA finalize election (publish Merkle root)
router.post("/finalize/:electionId", caController.finalizeElection);

// CA publish EPK (after DKG)
// router.post("/publish-epk", caController.publishEpk);
module.exports = router;

