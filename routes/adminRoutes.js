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

// router.post("/finalize/:election_id", caController.finalizeElection);
router.post("/finalize-publish/:election_id", caController.finalizeAndPublishMerkle);

router.post("/publish-election/:election_id", caController.publishElectionInfo);

router.post("/publish-candidates/:election_id", caController.publishCandidates);

// router.post("/publish-merkle/:election_id", caController.publishMerkleRoot);

// CA publish EPK (after DKG)
// router.post("/publish-epk", caController.publishEpk);

router.delete("/:election_id", caController.deleteElection);

module.exports = router;
