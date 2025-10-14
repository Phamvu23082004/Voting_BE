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

exports.getElections = async (req, res) => {
  try {
    const result = await caService.getElections();
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

exports.uploadcsvfast = async (req, res) => {
  try {
    if (!req.file) {
      return res.error(1, "Không có file được tải lên");
    }

    const filePath = req.file.path;
    const start = Date.now();
    console.log("⏱️ Bắt đầu import CSV...: ", start);
    const result = await caService.importCSV(filePath);
    const end = Date.now();
    console.log(`⏱️ Import CSV mất ${(end - start) / 1000} giây`);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

exports.createElection = async (req, res) => {
  try {
    const {
      election_id,
      name,
      description,
      start_date,
      deadline_register,
      end_date,
    } = req.body;
    const filePath = req.file.path;
    if (
      !election_id ||
      !name ||
      !description ||
      !deadline_register ||
      !start_date ||
      !end_date
    ) {
      return res.error(1, "Thiếu tham số bắt buộc");
    }

    const result = await caService.createElection({
      election_id,
      name,
      description,
      start_date,
      end_date,
      deadline_register,
      filePath,
    });

    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    console.log("err", error)
    return res.InternalError();
  }
};

// Upload Excel
exports.uploadExcel = async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await caService.importExcel(filePath);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

// Tạo merkle tree va proof cho election
// exports.finalizeElection = async (req, res) => {
//   try {
//     const { election_id } = req.params;
//     const result = await caService.finalizeElection(election_id);
//     return result.EC === 0
//       ? res.success(result.result, result.EM)
//       : res.error(result.EC, result.EM);
//   } catch (err) {
//     return res.InternalError();
//   }
// };

exports.finalizeAndPublishMerkle = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.finalizeAndPublishMerkle(election_id);
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
// exports.publishMerkleRoot = async (req, res) => {
//   try {
//     const { election_id } = req.params;
//     const result = await caService.publishMerkleRoot(election_id);
//     return result.EC === 0
//       ? res.success(result.result, result.EM)
//       : res.error(result.EC, result.EM);
//   } catch (err) {
//     return res.InternalError();
//   }
// };

// Publish EPK (sau DKG)

exports.publishEpk = async (req, res) => {
  try {
    const { epk } = req.body;
    const result = await caService.publishEpk();
    res.status(200).json({ success: true, message: "EPK published", ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateKeys = async (req, res) => {
  try {
    //  Sinh khóa và tính epk
    const result = await caService.generateTrusteeShares();


      if (result.EC === 0) {


        return res.success(
          {
            result: result
          },
          "Generate and publish EPK successfully"
    );
    } else {
      return res.error(1, result.EM);
    }
  } catch (error) { 
    console.error("generateKeys Error:", error);
    return res.InternalError();
  }
};


// exports.publishEpk = async (req, res) => {
//   try {
//     const { epk } = req.body;
//     const result = await caService.publishEpk(epk);
//     res.status(200).json({ success: true, message: "EPK published", ...result });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

exports.deleteElection = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await caService.deleteElection(election_id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

