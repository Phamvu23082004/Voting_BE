const { importCSV, importExcel } = require("../services/caService");
const caService = require("../services/caService");

// Upload CSV
// exports.uploadCSV = async (req, res) => {
//     try {
//         const filePath = req.file.path;
//         const result = await importCSV(filePath);
//         res.json({
//             success: true,
//             message: 'CSV uploaded',
//             ...result,
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

exports.uploadcsvfast = async (req, res) => {
  try {
    if (!req.file) {
      return res.error(1, "Không có file được tải lên");
    }

    const filePath = req.file.path;
    const start = Date.now();
    console.log("⏱️ Bắt đầu import CSV...: ", start);
    const result = await importCSV(filePath);
    const end = Date.now();
    console.log(`⏱️ Import CSV mất ${(end - start) / 1000} giây`);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

// Upload Excel
exports.uploadExcel = async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await importExcel(filePath);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

// Tạo merkle tree va proof cho election
exports.finalizeElection = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.finalizeElection(election_id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (err) {
    return res.InternalError();
  }
};

exports.publishElectionInfo = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.publishElectionInfo(election_id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (err) {
    return res.InternalError();
  }
};

// Publish candidate list
exports.publishCandidates = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.publishCandidates(election_id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (err) {
    return res.InternalError();
  }
};

// Finalize election (public Merkle root)
exports.finalizeElection = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.publishMerkleRoot(election_id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (err) {
    return res.InternalError();
  }
};

// Publish EPK (sau DKG)
// exports.publishEpk = async (req, res) => {
//   try {
//     const { epk } = req.body;
//     const result = await caService.publishEpk(epk);
//     res.status(200).json({ success: true, message: "EPK published", ...result });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
