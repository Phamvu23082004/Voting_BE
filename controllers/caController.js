const { importCSV, importExcel } = require('../services/caService');
const caService = require('../services/caService');

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
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const start = Date.now();
    console.log('⏱️ Bắt đầu import CSV...: ', start);
    const result = await importCSV(filePath);
    const end = Date.now();
    console.log(`⏱️ Import CSV mất ${(end - start) / 1000} giây`);
    res.json({
      success: true,
      message: 'CSV uploaded',
      ...result,
      time: (end - start) / 1000 + 's'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload Excel
exports.uploadExcel = async (req, res) => {
    try {
        const filePath = req.file.path;
        const result = await importExcel(filePath);
        res.json({ success: true, message: 'Excel uploaded', ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

//tao merkle tree va proof cho election
exports.finalizeElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    const result = await caService.finalizeElection(electionId);
    res.json({ success: true, message: 'Election finalized', ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
