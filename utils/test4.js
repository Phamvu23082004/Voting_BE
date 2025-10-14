// // import { buildBabyjub } from "circomlibjs";
// // import fs from "fs/promises";

// // const main = async () => {
// //   console.log("🚀 Bắt đầu quá trình tổng hợp phiếu đồng cấu...");

// //   // 1️⃣ Khởi tạo
// //   const babyjub = await buildBabyjub();
// //   const F = babyjub.F;

// //   // 2️⃣ Đọc file input chứa các lá phiếu đã mã hóa
// //   const data = JSON.parse(await fs.readFile("./utils/input_multi_voter.json", "utf8"));
// //   const { votes } = data;
// //   const numVoters = votes.length;
// //   const numCandidates = votes[0].C1x.length;
// //   console.log(`🔍 Tìm thấy ${numVoters} cử tri và ${numCandidates} ứng viên.`);

// //   // 3️⃣ Điểm đơn vị (0, 1) - đóng vai trò là "số 0" trong phép cộng
// //   const identityPoint = [F.e("0"), F.e("1")];
// //   const aggregatedCiphertexts = [];

// //   // 4️⃣ Bắt đầu tổng hợp (Tallying)
// //   for (let i = 0; i < numCandidates; i++) { // Lặp qua từng ứng viên
// //     let totalC1 = identityPoint;
// //     let totalC2 = identityPoint;

// //     for (const vote of votes) { // Lặp qua từng cử tri
// //       // Lấy ciphertext của cử tri này cho ứng viên i
// //       const voterC1 = [F.e(BigInt(vote.C1x[i])), F.e(BigInt(vote.C1y[i]))];
// //       const voterC2 = [F.e(BigInt(vote.C2x[i])), F.e(BigInt(vote.C2y[i]))];

// //       // ✨ PHÉP CỘNG ĐỒNG CẤU ✨
// //       totalC1 = babyjub.addPoint(totalC1, voterC1);
// //       totalC2 = babyjub.addPoint(totalC2, voterC2);
// //     }

// //     aggregatedCiphertexts.push({
// //       candidate: i + 1,
// //       C1_total: { x: F.toObject(totalC1[0]).toString(), y: F.toObject(totalC1[1]).toString() },
// //       C2_total: { x: F.toObject(totalC2[0]).toString(), y: F.toObject(totalC2[1]).toString() },
// //     });
// //   }

// //   // 5️⃣ Ghi kết quả tổng hợp ra file
// //   const finalTally = {
// //     description: `Kết quả tổng hợp đồng cấu cho ${numVoters} cử tri.`,
// //     aggregatedCiphertexts: aggregatedCiphertexts,
// //   };

// //   await fs.writeFile("tally_result.json", JSON.stringify(finalTally, null, 2));
// //   console.log(`\n✅ Tổng hợp hoàn tất! Kết quả đã lưu vào tally_result.json`);
// // };

// // main().catch(console.error);

// // ===============================
// // 🧮 tally_votes.js
// // Tổng hợp đồng cấu các phiếu ElGamal
// // ===============================

// import { buildBabyjub } from "circomlibjs";
// import fs from "fs/promises";
// import path from "path";

// const main = async () => {
//   console.log("🧮 Bắt đầu tổng hợp phiếu đồng cấu...");

//   const babyjub = await buildBabyjub();
//   const F = babyjub.F;

//   const folder = "./votes";
//   const files = (await fs.readdir(folder)).filter(f => f.startsWith("vote_"));
//   const votes = await Promise.all(files.map(async f => JSON.parse(await fs.readFile(path.join(folder, f), "utf8"))));

//   const numVoters = votes.length;
//   const numCandidates = votes[0].C1x.length;
//   console.log(`🔍 Có ${numVoters} cử tri và ${numCandidates} ứng viên.`);

//   const identityPoint = [F.e(0n), F.e(1n)];
//   const aggregated = [];

//   for (let i = 0; i < numCandidates; i++) {
//     let totalC1 = identityPoint;
//     let totalC2 = identityPoint;

//     for (const v of votes) {
//       const C1 = [F.e(BigInt(v.C1x[i])), F.e(BigInt(v.C1y[i]))];
//       const C2 = [F.e(BigInt(v.C2x[i])), F.e(BigInt(v.C2y[i]))];
//       totalC1 = babyjub.addPoint(totalC1, C1);
//       totalC2 = babyjub.addPoint(totalC2, C2);
//     }

//     aggregated.push({
//       candidate: i + 1,
//       C1_total_x: F.toObject(totalC1[0]).toString(),
//       C1_total_y: F.toObject(totalC1[1]).toString(),
//       C2_total_x: F.toObject(totalC2[0]).toString(),
//       C2_total_y: F.toObject(totalC2[1]).toString(),
//     });
//   }

//   await fs.writeFile(
//     "./utils/tally_result.json",
//     JSON.stringify({ nVoters: numVoters, nCandidates: numCandidates, aggregated }, null, 2)
//   );

//   console.log("✅ Tổng hợp xong → lưu tại utils/tally_result.json");
// };

// main().catch(console.error);

// =======================================================
// 🧩 generate_tally_input.js
// Tạo input_tally.json cho mạch TallyValidityWithCommit
// =======================================================

// =======================================================
// 🧩 generate_tally_input.js
// Tạo input_tally.json cho mạch TallyValidityWithCommit
// =======================================================

// utils/buildInputTally.js
import { buildBabyjub, buildPoseidon } from "circomlibjs";
import fs from "fs/promises";
import path from "path";

const main = async () => {
  console.log("🧮 Bắt đầu tạo input_tally.json...");

  // 1️⃣ Khởi tạo BabyJubJub và Poseidon
  const babyjub = await buildBabyjub();
  const poseidon = await buildPoseidon();
  const F = babyjub.F;

  // 2️⃣ Đọc tất cả phiếu từ thư mục ./votes
  const folder = "./utils/votes";
  const files = (await fs.readdir(folder)).filter(
    (f) => f.startsWith("vote_") && f.endsWith(".json")
  );
  if (files.length === 0) throw new Error("❌ Không tìm thấy file vote_*.json");

  const votes = await Promise.all(
    files.map(async (f) => {
      const raw = await fs.readFile(path.join(folder, f), "utf8");
      const json = JSON.parse(raw);
      if (!json.C1x || !json.C2x)
        throw new Error(`⚠️ File ${f} thiếu dữ liệu C1/C2`);
      return json;
    })
  );

  const nVoters = votes.length;
  const nCandidates = votes[0].C1x.length;
  console.log(`🔍 Có ${nVoters} cử tri và ${nCandidates} ứng viên.`);

  // 3️⃣ Gom tất cả ciphertext
  const C1x = [],
    C1y = [],
    C2x = [],
    C2y = [];
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

  // 4️⃣ Tổng hợp C1_total, C2_total
  const identity = [F.e(0n), F.e(1n)];
  const C1_total_x = [],
    C1_total_y = [],
    C2_total_x = [],
    C2_total_y = [];

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

  // 5️⃣ Tính lại hashCipherAll = Poseidon chain (giống mạch)
  let acc = F.e(0n);
  const allHashCiphers = [];

  for (let j = 0; j < nVoters; j++) {
    for (let i = 0; i < nCandidates; i++) {
      const h = poseidon([
        BigInt(C1x[j][i]),
        BigInt(C1y[j][i]),
        BigInt(C2x[j][i]),
        BigInt(C2y[j][i]),
      ]);
      const hObj = F.toObject(h);
      allHashCiphers.push(hObj.toString());
      acc = poseidon([acc, h]);
    }
  }
  const hashCipherAll = F.toObject(acc);

  // 6️⃣ hashOnChain (có thể lấy từ SC, ở đây tạm giả định)
  const hashOnChain = hashCipherAll; // hoặc thay giá trị commit từ SC

  // 7️⃣ Tạo input JSON đúng chuẩn Circom
  const input = {
    C1x,
    C1y,
    C2x,
    C2y,
    C1_total_x,
    C1_total_y,
    C2_total_x,
    C2_total_y,
    hashOnChain: hashOnChain,
  };

  await fs.writeFile(
    "./ZKP/input_tally2.json",
    JSON.stringify(
      input,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    )
  );

  const tallyResult = {
    C1_total_x: C1_total_x.map(String),
    C1_total_y: C1_total_y.map(String),
    C2_total_x: C2_total_x.map(String),
    C2_total_y: C2_total_y.map(String),
    nVoters: nVoters, // <-- Thêm số lượng cử tri vào đây!
  };

  await fs.writeFile(
    "./utils/tally_result.json",
    JSON.stringify(tallyResult, null, 2)
  );
  console.log("✅ Đã tạo xong utils/tally_result.json cho việc giải mã");

  console.log("✅ Đã tạo xong ZKP/input_tally.json");
  console.log("🔢 hashCipherAll =", hashCipherAll.toString());
  console.log("📦 Số lượng hashCipher =", allHashCiphers.length);
};

main().catch(console.error);
