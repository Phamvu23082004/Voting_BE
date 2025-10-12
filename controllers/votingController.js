const { keccak256, toUtf8Bytes, hexlify } = require("ethers");
const Vote = require("../models/voteModel");
const { contract } = require("../config/blockchain");

exports.submitVote = async (req, res) => {
  try {
    const { nullifier, ciphertext, proof } = req.body;

    // 1️⃣ Tạo hash của proof (tạm thời, chưa dùng ZKP thật)
    const proofHash = keccak256(toUtf8Bytes(proof || "placeholder"));

    // 2️⃣ Lưu off-chain (MongoDB)
    const existing = await Vote.findOne({ nullifier });
    if (existing)
      await Vote.updateOne({ nullifier }, { ciphertext, proof });
    else
      await Vote.create({ nullifier, ciphertext, proof });

    // 3️⃣ Chuẩn bị dữ liệu on-chain
    // Nullifier phải là bytes32, ciphertext là bytes
    const nullifierBytes32 = nullifier; // nếu FE đã gửi dạng 0x...32 bytes
    const ciphertextBytes = hexlify(toUtf8Bytes(ciphertext)); // convert string -> bytes

    // 4️⃣ Gửi giao dịch on-chain
    const tx = await contract.submitVote(nullifierBytes32, ciphertextBytes);
    await tx.wait();

    res.json({
      EC: 0,
      EM: "Vote saved (off-chain) + submitted (on-chain)",
      proofHash,
      txHash: tx.hash
    });
  } catch (err) {
    console.error(err);
    res.json({ EC: 1, EM: "Error submitting vote", error: err.message });
  }
};

exports.tallyVotes = async (req, res) => {
  try {
    const votes = await Vote.find();
    if (!votes.length) return res.json({ EC: 1, EM: "No votes found" });

    // Giả lập tổng đồng cấu bằng cách hash chuỗi để ra số
    let C_total = 0n;
    for (const v of votes) {
      const hashed = keccak256(toUtf8Bytes(v.ciphertext)); // băm text thành hex
      const num = BigInt(hashed.slice(0, 18)); // lấy phần đầu để tránh tràn
      C_total += num; // hoặc nhân nếu bạn muốn mô phỏng đồng cấu
    }

    const proofTally = "proof_" + Date.now();
    const proofHash = keccak256(toUtf8Bytes(proofTally));

    const tx = await contract.submitTally("0x" + C_total.toString(16), proofHash);
    await tx.wait();

    res.json({
      EC: 0,
      EM: "✅ Tally submitted",
      C_total: C_total.toString(),
      proofHash,
      txHash: tx.hash
    });
  } catch (err) {
    console.error(err);
    res.json({ EC: 1, EM: "❌ Error tallying votes", error: err.message });
  }
};