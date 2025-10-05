const fs = require('fs');
const { parse } = require('csv-parse');
const ExcelJS = require('exceljs');
const ValidVoter = require('../models/validVoterModel');
const { exec } = require('child_process');
const path = require('path');
const merkleUtils = require('../utils/merkleUtils');
const Election = require('../models/electionModel');
const Voter = require('../models/voterModel');
const Candidate = require("../models/candidateModel");
const { contract } = require("../config/blockchain");



// Import CSV với mongoimport

const importCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = "Voting";
    const collection = "validvoters";

    const command = `mongoimport --uri="${mongoUri}" --db=${dbName} --collection=${collection} --type=csv --columnsHaveTypes --fields="cccd.string(),election_id.string()" --file="${filePath}" --drop`;

    exec(command, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr));
      resolve({ details: stdout });
    });
  });
};

// Import Excel voters (dùng insertMany)
const importExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const voters = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // bỏ header
    voters.push({
      cccd: row.getCell(1).value,
      election_id: row.getCell(2).value,
      is_valid: row.getCell(3).value === true || row.getCell(3).value === '1'
    });
  });

  try {
    const start = Date.now();
    await batchInsert(voters, 10000);  // chia nhỏ 10k/lần
    fs.unlinkSync(filePath);
    const end = Date.now();
    return { success: true, count: voters.length, time: (end - start) / 1000 + 's' };
  } catch (err) {
    throw err;
  }
};

//Tinh path cho voters
const finalizeElection = async (electionId) => {
  // 1. Tìm election
  const election = await Election.findOne({ election_id: electionId });
  if (!election) throw new Error('Election not found');

  // 2. Lấy voter (chỉ lấy trường cần thiết)
  const voters = await Voter.find(
    { election_id: electionId },
    '_id hashed_key'
  ).lean();

  if (!voters.length) throw new Error('No voters registered');

  // 3. Build Merkle Tree từ hashed_key
  const hashedKeys = voters.map(v => v.hashed_key);
  const tree = merkleUtils.buildMerkleTree(hashedKeys);
  const root = merkleUtils.getMerkleRoot(tree);

  // 4. Update root cho election
  election.merkle_root = root;
  election.status = 'ended';
  await election.save();

  // 5. Tạo bulk operations để update proof
  const bulkOps = voters.map(voter => {
    const proof = merkleUtils.getProof(tree, voter.hashed_key);
    return {
      updateOne: {
        filter: { _id: voter._id },
        update: { proof }
      }
    };
  });

  // 6. Thực hiện bulk update
  if (bulkOps.length) {
    await Voter.bulkWrite(bulkOps);
  }

  return {
    election_id: electionId,
    merkleRoot: root,
    votersCount: voters.length
  };
};

//  1. Public thông tin election lên blockchain
async function publishElectionInfo(electionId) {
  const election = await Election.findOne({ election_id: electionId });
  if (!election) throw new Error("Election not found");

  console.log(" Publishing election info to blockchain...");

  const tx = await contract.setElectionInfo(
    election.election_id,
    election.name,
    election.start_date.toISOString(),
    election.end_date.toISOString()
  );

  const receipt = await tx.wait();
  console.log(` Election info published! TX: ${receipt.hash}`);

  return { txHash: receipt.hash };
}

//  2. Public danh sách ứng cử viên
async function publishCandidates(electionId) {
  const candidates = await Candidate.find({ election_id: electionId });
  if (!candidates.length) throw new Error("No candidates found");

  console.log(` Publishing ${candidates.length} candidates...`);
  for (const c of candidates) {
    const tx = await contract.addCandidate(c.name);
    await tx.wait();
    console.log(` Candidate added: ${c.name}`);
  }

  return { count: candidates.length };
}

//  3. Public Merkle root sau khi hết hạn đăng ký
async function publishMerkleRoot(electionId) {
  const election = await Election.findOne({ election_id: electionId });
  if (!election) throw new Error("Election not found");

  console.log(" Publishing Merkle root to blockchain...");
  const tx = await contract.setMerkleRoot(election.merkle_root);
  const receipt = await tx.wait();

  election.status = "ended";
  await election.save();

  return { txHash: receipt.hash, root: election.merkle_root };
}

//  4. Public EPK (dùng sau này khi có DKG)
// async function publishEpk(epkHex) {
//   const tx = await contract.publishEpk(epkHex);
//   const receipt = await tx.wait();
//   console.log("🔐 EPK published!");
//   return { txHash: receipt.hash, epk: epkHex };
// }




module.exports = { importCSV, importExcel, finalizeElection, publishMerkleRoot, publishElectionInfo, publishCandidates };
