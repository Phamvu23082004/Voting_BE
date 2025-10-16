const fs = require('fs');
const path = require('path');
const {groth16} = require('snarkjs');
const Votes = require('../models/voteModel');
const fileURLToPath = require('url').fileURLToPath;

const { buildBabyjub, buildPoseidon } = require("circomlibjs");

const verifyValidVote = async (proof, publicSignals, voteData) => {
  try {
    //  Đọc verification key
    const vKey = JSON.parse(fs.readFileSync("./verifier/verification_key.json"));

    //  Verify proof voter gửi
    const res = await groth16.verify(vKey, publicSignals, proof);

    if (!res) {
      console.log(" Invalid proof");
      return { EC: 1, EM: "Invalid proof" };
    }

    const voteRecord = {
      C1x: voteData.C1x,
      C1y: voteData.C1y,
      C2x: voteData.C2x,
      C2y: voteData.C2y,
      hashCipher: voteData.hashCipher,
      electionId: voteData.electionId,
      nullifier: voteData.nullifier,
      timestamp: new Date(),
    };

    await Votes.create(voteRecord); // Lưu DB
    console.log(" Proof valid — vote saved");

    return { EC: 0, EM: "Proof valid, vote saved" };
  } catch (error) {
    console.error("Error during proof verification:", error);
    throw error;
  }
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const verifyValidCipherAll = async (electionId) => {
  try {
    console.log(" Bắt đầu tạo proof tổng hợp (CipherAll)...");

    //  Khởi tạo curve và hash
    const babyjub = await buildBabyjub();
    const poseidon = await buildPoseidon();
    const F = babyjub.F;

    //  Lấy dữ liệu phiếu từ DB
    const votes = await Votes.find({ electionId });
    if (!votes.length) throw new Error(" Không có phiếu nào trong DB!");

    const nVoters = votes.length;
    const nCandidates = votes[0].C1x.length;
    console.log(` Có ${nVoters} cử tri và ${nCandidates} ứng viên.`);

    //  Gom tất cả ciphertext
    const C1x = [], C1y = [], C2x = [], C2y = [];
    for (let j = 0; j < nVoters; j++) {
      C1x[j] = [];
      C1y[j] = [];
      C2x[j] = [];
      C2y[j] = [];
      for (let i = 0; i < nCandidates; i++) {
        C1x[j][i] = F.toObject(F.e(BigInt(votes[j].C1x[i])));
        C1y[j][i] = F.toObject(F.e(BigInt(votes[j].C1y[i])));
        C2x[j][i] = F.toObject(F.e(BigInt(votes[j].C2x[i])));
        C2y[j][i] = F.toObject(F.e(BigInt(votes[j].C2y[i])));
      }
    }

    //  Cộng đồng cấu các phiếu
    const identity = [F.e(0n), F.e(1n)];
    const C1_total_x = [], C1_total_y = [], C2_total_x = [], C2_total_y = [];

    for (let i = 0; i < nCandidates; i++) {
      let accC1 = identity;
      let accC2 = identity;
      for (const v of votes) {
        const C1 = [F.e(BigInt(v.C1x[i])), F.e(BigInt(v.C1y[i]))];
        const C2 = [F.e(BigInt(v.C2x[i])), F.e(BigInt(v.C2y[i]))];
        accC1 = babyjub.addPoint(accC1, C1);
        accC2 = babyjub.addPoint(accC2, C2);
      }
      C1_total_x[i] = F.toObject(accC1[0]);
      C1_total_y[i] = F.toObject(accC1[1]);
      C2_total_x[i] = F.toObject(accC2[0]);
      C2_total_y[i] = F.toObject(accC2[1]);
    }

    // Tính hashCipherAll = chain Poseidon
    let acc = F.e(0n);
    for (let v of votes) {
      for (let i = 0; i < nCandidates; i++) {
        const h = poseidon([
          BigInt(v.C1x[i]),
          BigInt(v.C1y[i]),
          BigInt(v.C2x[i]),
          BigInt(v.C2y[i]),
        ]);
        acc = poseidon([acc, h]);
      }
    }
    const hashCipherAll = F.toObject(acc);
    const hashOnChain = hashCipherAll; // thực tế lấy từ SC

    //  Tạo input cho mạch
    const input = {
      C1x, C1y, C2x, C2y,
      C1_total_x, C1_total_y,
      C2_total_x, C2_total_y,
      hashOnChain: hashOnChain.toString(),
    };

    //  Sinh proof tổng hợp
    const wasmPath = path.join(__dirname, "../circuits/cipherAll/cipherAll.wasm");
    const zkeyPath = path.join(__dirname, "../circuits/cipherAll/cipherAll.zkey");

    console.log("Generating proof...");
    const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
    console.log("Proof generated!");

    //  Verify proof local
    const vKeyPath = path.join(__dirname, "../circuits/cipherAll/vKey.json");
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf8"));
    const verified = await groth16.verify(vKey, publicSignals, proof);

    if (!verified) {
      console.log(" Invalid proof (CipherAll tally)");
      return { EC: 1, EM: "Invalid proof" };
    }

    console.log(" CipherAll proof verified successfully");
    return { EC: 0, EM: "Proof valid and verified", proof, publicSignals };
  } catch (err) {
    console.error(" Error during CipherAll tally verification:", err);
    return { EC: 2, EM: err.message };
  }
};

module.exports = {
    verifyValidVote,
    verifyValidCipherAll
}