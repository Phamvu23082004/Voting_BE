const express = require("express");
const router = express.Router();
const upload = require("../middlewares/fileUpload");
const caController = require("../controllers/caController");

router.get("/", caController.getElections);

router.post("/upload/excel", upload.single("file"), caController.uploadExcel);

router.post("/upload/CSV", upload.single("file"), caController.uploadcsvfast);

router.post(
  "/create-election",
  upload.single("file"),
  caController.createElection
);

// router.post("/finalize/:electionId", caController.finalizeElection); 

// CA public election info
router.post("/publish-election/:election_id", caController.publishElectionInfo);

// CA public candidate list
router.post("/publish-candidates/:election_id", caController.publishCandidates);

// CA finalize election (publish Merkle root)
// router.post("/public-root/:election_id", caController.finalizeElection);

// CA generate keys for DKG
router.post("/generate", caController.generateKeys);

// CA publish EPK (after DKG)
router.post("/publish-epk", caController.publishEpk);

router.post(
  "/finalize-publish/:election_id",
  caController.finalizeAndPublishMerkle
);

router.delete("/:election_id", caController.deleteElection);

module.exports = router;
