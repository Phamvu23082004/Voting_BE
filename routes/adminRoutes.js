const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload');
const caController = require('../controllers/caController');


// API: Upload CSV
// router.post('/upload/csv', upload.single('file'), caController.uploadCSV);

// API: Upload Excel
router.post('/upload/excel', upload.single('file'), caController.uploadExcel);

router.post('/upload/CSV', upload.single('file'), caController.uploadcsvfast);

router.post('/finalize/:electionId', caController.finalizeElection); //Tinh merkle root va proof

// CA public election info
router.post("/publish-election/:election_id", caController.publishElectionInfo);

// CA public candidate list
router.post("/publish-candidates/:election_id", caController.publishCandidates);

// CA finalize election (publish Merkle root)
router.post("/public-root/:election_id", caController.finalizeElection);

// CA generate keys for DKG
router.post('/generate', caController.generateKeys);

// CA publish EPK (after DKG)
router.post("/publish-epk", caController.publishEpk);
module.exports = router;

