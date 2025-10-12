// const fs = require("fs");
const { parse } = require("csv-parse");
const ExcelJS = require("exceljs");
const ValidVoter = require("../models/validVoterModel");
const { exec } = require("child_process");
const path = require("path");
const merkleUtils = require("../utils/merkleUtils");
const Election = require("../models/electionModel");
const Voter = require("../models/voterModel");
const Candidate = require("../models/candidateModel");
const { contract } = require("../config/blockchain");
const { ec: EC } = require('elliptic');
const ec = new EC('secp256k1');
const BN = require('bn.js');
const Organization = require("../models/organizationModel");
const { ethers } = require("ethers");


const n = ec.curve.n;

const getElections = async () => {
  const elections = await Election.find()
    .sort({ createdAt: -1 })
    .select(
      "election_id name description start_date end_date deadline_register status merkle_root"
    );

  if (!elections.length) {
    return { EC: 1, EM: "Chưa có cuộc bầu cử nào", result: [] };
  }

  return {
    EC: 0,
    EM: "Lấy danh sách cuộc bầu cử thành công",
    result: elections,
  };
};

const importCSV = (filePath) => {
  return new Promise((resolve) => {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = "Voting";
    const collection = "validvoters";

    if (!mongoUri) {
      return resolve({
        EC: 1,
        EM: "Thiếu MONGODB_URI trong file .env",
      });
    }

    const command = `mongoimport --uri="${mongoUri}" --db=${dbName} --collection=${collection} --type=csv --columnsHaveTypes --fields="cccd.string(),election_id.string()" --file="${filePath}" --drop`;

    const start = Date.now();

    exec(command, (error, stdout, stderr) => {
      const end = Date.now();
      const duration = ((end - start) / 1000).toFixed(2) + "s";

      if (error) {
        return resolve({
          EC: 2,
          EM: "Lỗi khi import CSV",
          result: { stderr },
        });
      }

      return resolve({
        EC: 0,
        EM: "Import CSV thành công",
        result: {
          details: stdout,
          time: duration,
        },
      });
    });
  });
};

const createElection = async ({
  election_id,
  name,
  description,
  deadline_register,
  start_date,
  end_date,
  filePath,
}) => {
  const existed = await Election.findOne({ election_id });
  if (existed) {
    return {
      EC: 1,
      EM: `Mã cuộc bầu cử "${election_id}" đã tồn tại, vui lòng chọn mã khác.`,
    };
  }

  const election = new Election({
    election_id,
    name,
    description,
    deadline_register,
    start_date,
    end_date,
    status: "active",
  });
  await election.save();

  // 2. Import danh sách cử tri từ file CSV
  const importResult = await importCSV(filePath);
  if (importResult.EC !== 0) {
    throw new Error("Lỗi khi import danh sách cử tri: " + importResult.EM);
  }

  // Xoá file sau khi import
  fs.unlinkSync(filePath);

  return {
    EC: 0,
    EM: "Tạo cuộc bầu cử thành công",
    result: {
      election_id: election.election_id,
      name: election.name,
      description: election.description,
      start_date: election.start_date,
      end_date: election.end_date,
      deadline_register: election.deadline_register,
      status: election.status,
    },
  };
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
      is_valid: row.getCell(3).value === true || row.getCell(3).value === "1",
    });
  });

  if (voters.length === 0) {
    return {
      EC: 1,
      EM: "Không có dữ liệu hợp lệ trong file Excel",
    };
  }

  try {
    const start = Date.now();
    await batchInsert(voters, 10000); // chia nhỏ 10k/lần
    fs.unlinkSync(filePath);
    const end = Date.now();
    return {
      EC: 0,
      EM: "Import Excel thành công",
      result: {
        count: voters.length,
        time: ((end - start) / 1000).toFixed(2) + "s",
      },
    };
  } catch (err) {
    throw err;
  }
};

// Tính path cho voters
// const finalizeElection = async (electionId) => {
//   // 1. Tìm election
//   const election = await Election.findOne({ election_id: electionId });
//   if (!election) {
//     return { EC: 1, EM: "Không tìm thấy cuộc bầu cử" };
//   }

//   // 2. Lấy voter (chỉ lấy trường cần thiết)
//   const voters = await Voter.find(
//     { election_id: electionId },
//     "_id hashed_key"
//   ).lean();

//   if (!voters.length) {
//     return { EC: 2, EM: "Chưa có cử tri đăng ký cho cuộc bầu cử" };
//   }

//   // 3. Build Merkle Tree từ hashed_key
//   const hashedKeys = voters.map((v) => v.hashed_key);
//   const tree = merkleUtils.buildMerkleTree(hashedKeys);
//   const root = merkleUtils.getMerkleRoot(tree);

//   // 4. Update root cho election
//   election.merkle_root = root;
//   election.status = "ended";
//   await election.save();

//   // 5. Tạo bulk operations để update proof
//   const bulkOps = voters.map((voter) => {
//     const proof = merkleUtils.getProof(tree, voter.hashed_key);
//     return {
//       updateOne: {
//         filter: { _id: voter._id },
//         update: { proof },
//       },
//     };
//   });

//   // 6. Thực hiện bulk update
//   if (bulkOps.length) {
//     await Voter.bulkWrite(bulkOps);
//   }

//   return {
//     EC: 0,
//     EM: "Hoàn tất cuộc bầu cử thành công",
//     result: {
//       election_id: electionId,
//       merkle_root: root,
//       voter_count: voters.length,
//     },
//   };
// };

async function finalizeAndPublishMerkle(electionId) {
  // 1️⃣ Tìm election
  const election = await Election.findOne({ election_id: electionId });
  if (!election) {
    return { EC: 1, EM: "Không tìm thấy cuộc bầu cử" };
  }

  // 2️⃣ Lấy danh sách voter
  const voters = await Voter.find(
    { election_id: electionId },
    "_id hashed_key"
  ).lean();

  if (!voters.length) {
    return { EC: 2, EM: "Chưa có cử tri đăng ký cho cuộc bầu cử" };
  }

  // 3️⃣ Build Merkle tree
  const hashedKeys = voters.map((v) => v.hashed_key);
  const tree = merkleUtils.buildMerkleTree(hashedKeys);
  const root = merkleUtils.getMerkleRoot(tree);

  // 4️⃣ Tạo proof và update voter
  const bulkOps = voters.map((voter) => ({
    updateOne: {
      filter: { _id: voter._id },
      update: { proof: merkleUtils.getProof(tree, voter.hashed_key) },
    },
  }));
  if (bulkOps.length) await Voter.bulkWrite(bulkOps);

  // 5️⃣ Cập nhật election DB
  election.merkle_root = root;
  // election.status = "finalized";
  await election.save();

  // 6️⃣ Publish lên blockchain
  console.log("📤 Publishing Merkle root to blockchain...");
  const tx = await contract.setMerkleRoot(root);
  const receipt = await tx.wait();

  console.log(`✅ Merkle root published! TX: ${receipt.hash}`);

  return {
    EC: 0,
    EM: "Finalize và publish Merkle root thành công",
    result: {
      election_id: electionId,
      merkle_root: root,
      voter_count: voters.length,
      txHash: receipt.hash,
    },
  };
}

//  1. Public thông tin election lên blockchain
async function publishElectionInfo(electionId) {
  const election = await Election.findOne({ election_id: electionId });
  if (!election) {
    return { EC: 1, EM: "Không tìm thấy cuộc bầu cử" };
  }

  console.log(" Publishing election info to blockchain...");

  const tx = await contract.setElectionInfo(
    election.election_id,
    election.name,
    election.start_date.toISOString(),
    election.end_date.toISOString()
  );

  const receipt = await tx.wait();
  console.log(` Election info published! TX: ${receipt.hash}`);

  return {
    EC: 0,
    EM: "Publish thông tin cuộc bầu cử thành công",
    result: {
      election_id: election.election_id,
      txHash: receipt.hash,
    },
  };
}

//  2. Public danh sách ứng cử viên
async function publishCandidates(electionId) {
  const candidates = await Candidate.find({ election_id: electionId });
  if (!candidates.length) {
    return { EC: 1, EM: "Không tìm thấy ứng viên nào trong cuộc bầu cử" };
  }

  console.log(` Publishing ${candidates.length} candidates...`);
  for (const c of candidates) {
    const tx = await contract.addCandidate(c.name);
    await tx.wait();
    console.log(` Candidate added: ${c.name}`);
  }

  return {
    EC: 0,
    EM: "Publish danh sách ứng viên thành công",
    result: {
      election_id: electionId,
      count: candidates.length,
    },
  };
}

//  3. Public Merkle root sau khi hết hạn đăng ký
// async function publishMerkleRoot(electionId) {
//   const election = await Election.findOne({ election_id: electionId });
//   if (!election) {
//     return { EC: 1, EM: "Không tìm thấy cuộc bầu cử" };
//   }

//   if (!election.merkle_root) {
//     return { EC: 2, EM: "Chưa có Merkle root để publish" };
//   }

//   console.log(" Publishing Merkle root to blockchain...");
//   const tx = await contract.setMerkleRoot(election.merkle_root);
//   const receipt = await tx.wait();

//   election.status = "ended";
//   await election.save();

//   return {
//     EC: 0,
//     EM: "Publish Merkle root thành công",
//     result: {
//       election_id: election.election_id,
//       root: election.merkle_root,
//       txHash: receipt.hash,
//     },
//   };
// }

//  4. Public EPK (dùng sau này khi có DKG)
async function publishEpk() {
  const epk = "0x" + "0226d3af593483c58edaba7e0a3add069cc71283c8a9874c74ed024ad4e577e54b"
  const tx = await contract.publishEpk(epk);
  const receipt = await tx.wait();
  console.log("🔐 EPK published!");
  return { txHash: receipt.hash, epk: epk };
}


const { initBabyjub, evalPolynomial, getParams } = require("../utils/eccUtils.js");
const  crypto = require("crypto");

const fs = require("fs").promises;

const generateTrusteeShares = async (threshold = 2) => {
  const start = Date.now();
  console.log("🚀 Bắt đầu sinh shares cho các trustee...");

  try {
    // 1️⃣ Khởi tạo curve BabyJubJub
    await initBabyjub();
    const { babyjub, F, G, n } = getParams();

    // 2️⃣ Lấy danh sách trustee từ DB
    const trusteesFromDB = await Organization.find().select("name");
    if (!trusteesFromDB || trusteesFromDB.length < threshold) {
      throw new Error(`Không đủ trustee trong DB (cần >= ${threshold})`);
    }

    const trusteeNames = trusteesFromDB.map((t) => t.name);
    console.log(`✅ Có ${trusteeNames.length} trustee trong hệ thống`);

    // 3️⃣ Mỗi trustee sinh đa thức bí mật
    const trustees = trusteeNames.map((name) => {
      const coeffs = Array.from({ length: threshold }, () =>
        BigInt("0x" + crypto.randomBytes(32).toString("hex")) % n
      );
      return { name, coeffs };
    });

    // 4️⃣ Tính các share F(ID_i)
    const shares = trusteeNames.map((name, i) => {
      const IDi = BigInt(i + 1);
      const total = trustees.reduce((sum, t) => {
        const val = evalPolynomial(t.coeffs, IDi);
        return (sum + val) % n;
      }, 0n);
      return { name, F: total };
    });

    // 5️⃣ Public Yi = F(ID_i) * Base8
    const publicYi = shares.map((s) => ({
      name: s.name,
      Y: babyjub.mulPointEscalar(G, s.F),
    }));

    // 6️⃣ Ghi file share của từng trustee (async)
    const folderPath = path.join(__dirname, "../keys/trustingKeys");
    await fs.mkdir(folderPath, { recursive: true });

    await Promise.all(
      shares.map(async (s) => {
        const safeName = s.name.replace(/\s+/g, "_");
        const filePath = path.join(folderPath, `${safeName}.json`);
        await fs.writeFile(
          filePath,
          JSON.stringify({ trustee: s.name, share: s.F.toString() }, null, 2)
        );
      })
    );

    console.log("✅ Ghi file shares thành công");

    // 7️⃣ Tính F(0) = tổng các hệ số a₀
    const F0 = trustees.reduce((sum, t) => (sum + t.coeffs[0]) % n, 0n);

    // 8️⃣ Khóa công khai đồng cấu PK_HE = F(0) * Base8
    const epkPoint = babyjub.mulPointEscalar(G, F0);
    const epk = {
      x: F.toObject(epkPoint[0]).toString(),
      y: F.toObject(epkPoint[1]).toString(),
    };

    console.log(`✅ Hoàn tất trong ${(Date.now() - start) / 1000}s`);

    // ✅ Kết quả trả về
    return {
      EC: 0,
      EM: "Success",
      totalTrustees: trusteeNames.length,
      publicYi,
      epk,
    };
  } catch (err) {
    console.error("❌ Lỗi trong generateTrusteeShares:", err);
    return {
      EC: 1,
      EM: err.message,
    };
  }
};




// const publishEpkToBlockchain = async (epkPoint) => {
//   try {
//     const epk = String(epkPoint).startsWith("0x") ? String(epkPoint) : "0x" + String(epkPoint);
//     console.log("🔹 EPK (type):", typeof epk, " | isHex:", ethers.isHexString(epk));

//     console.log("🔹 Calling publishEpk...", epk);
//     const tx = await contract.publishEpk(epk);
//     const receipt = await tx.wait();
//     // console.log("✅ Published EPK on chain. Block:", receipt.blockNumber);

//     return {
//       EC: 0,
//       EM: "Publish EPK thành công",
//       result: { epk: epkPoint, txHash: receipt.hash },
//     };
//   } catch (err) {
//     console.error("❌ Publish EPK Error:", err);
//     return { EC: 1, EM: err.message };
//   }
// };

const deleteElection = async (election_id) => {
  if (!election_id) {
    return { EC: 1, EM: "Thiếu mã cuộc bầu cử cần xoá" };
  }

  const election = await Election.findOne({ election_id: election_id });
  if (!election) {
    return { EC: 2, EM: "Không tìm thấy cuộc bầu cử" };
  }

  await Promise.all([
    Voter.deleteMany({ election_id: election_id }),
    Candidate.deleteMany({ election_id: election_id }),
    ValidVoter.deleteMany({ election_id: election_id }),
  ]);

  await Election.deleteOne({ election_id: election_id });

  return {
    EC: 0,
    EM: `Đã xoá cuộc bầu cử "${election.name}" và dữ liệu liên quan`,
    result: { election_id: election_id },
  };
};

module.exports = {
  getElections,
  importCSV,
  importExcel,
  generateTrusteeShares,
  publishEpk,
  createElection,
  // finalizeElection,
  // publishMerkleRoot,
  finalizeAndPublishMerkle,
  publishElectionInfo,
  publishCandidates,
  deleteElection,

};
