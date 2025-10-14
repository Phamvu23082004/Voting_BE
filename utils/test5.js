// import { buildBabyjub } from "circomlibjs";
// import fs from "fs/promises";
// import path from "path";

// const __dirname = import.meta.dirname || new URL(".", import.meta.url).pathname;

// let babyjub, F, G, n;

// // 🔢 Hàm tính modular inverse sử dụng Extended Euclidean Algorithm
// const modInverse = (a, m) => {
//   a = ((a % m) + m) % m;
//   let [oldR, r] = [a, m];
//   let [oldS, s] = [1n, 0n];

//   while (r !== 0n) {
//     const quotient = oldR / r;
//     [oldR, r] = [r, oldR - quotient * r];
//     [oldS, s] = [s, oldS - quotient * s];
//   }

//   if (oldR !== 1n) throw new Error("Không tồn tại modular inverse");
//   return ((oldS % m) + m) % m;
// };

// // 🧮 Lagrange Interpolation để tái tạo secret tại x=0
// const lagrangeInterpolation = (shares, ids) => {
//   let secret = 0n;

//   for (let i = 0; i < shares.length; i++) {
//     let numerator = 1n;
//     let denominator = 1n;

//     for (let j = 0; j < shares.length; j++) {
//       if (i !== j) {
//         numerator = (numerator * (0n - ids[j])) % n;
//         denominator = (denominator * (ids[i] - ids[j])) % n;
//       }
//     }

//     const inv = modInverse(denominator, n);
//     const lambda = (numerator * inv) % n;
//     secret = (secret + shares[i] * lambda) % n;
//   }

//   return ((secret % n) + n) % n;
// };

// // 🔐 Giải mã một điểm mã hóa ElGamal
// const decryptElGamal = (C1, C2, sk) => {
//   // Tính sk * C1
//   const skC1 = babyjub.mulPointEscalar(C1, sk);

//   // C2 - sk*C1 = C2 + (-sk*C1)
//   // Điểm đối trong Twisted Edwards: (-x, y)
//   const minusSkC1 = [F.neg(skC1[0]), skC1[1]];
//   const Mpoint = babyjub.addPoint(C2, minusSkC1);

//   return Mpoint;
// };

// // 🔍 Brute-force tìm m từ m*G (chỉ áp dụng cho giá trị m nhỏ)
// const findDiscreteLog = (Mpoint, maxTries = 100) => {
//   const identityPoint = [F.e(0n), F.e(1n)];

//   // Kiểm tra m = 0
//   if (
//     F.toObject(Mpoint[0]) === F.toObject(identityPoint[0]) &&
//     F.toObject(Mpoint[1]) === F.toObject(identityPoint[1])
//   ) {
//     return 0;
//   }

//   // Brute-force từ m = 1 đến maxTries
//   let testPoint = G;
//   for (let m = 1; m <= maxTries; m++) {
//     if (
//       F.toObject(Mpoint[0]) === F.toObject(testPoint[0]) &&
//       F.toObject(Mpoint[1]) === F.toObject(testPoint[1])
//     ) {
//       return m;
//     }
//     testPoint = babyjub.addPoint(testPoint, G);
//   }

//   return null; // Không tìm thấy
// };

// const main = async () => {
//   console.log("🔓 Bắt đầu giải mã với Threshold 2/3...\n");

//   // 1️⃣ Khởi tạo BabyJubJub
//   babyjub = await buildBabyjub();
//   F = babyjub.F;
//   G = babyjub.Base8;
//   n = babyjub.subOrder;

//   // 2️⃣ Chọn 2 trustees để tham gia giải mã (threshold = 2)
//   const selectedTrustees = ["Alice", "Bob"]; // Có thể thay đổi thành ["Alice", "Charlie"] hoặc ["Bob", "Charlie"]
//   console.log(`👥 Trustees tham gia giải mã: ${selectedTrustees.join(", ")}`);

//   // 3️⃣ Đọc secret shares của các trustees đã chọn
//   const dkgFolder = path.join(__dirname, "./utils/dkgKeys");
//   const shares = [];
//   const ids = [];

//   for (const name of selectedTrustees) {
//     const filePath = path.join(dkgFolder, `${name}.json`);
//     const data = JSON.parse(await fs.readFile(filePath, "utf8"));
//     shares.push(BigInt(data.share));
//     ids.push(BigInt(data.id));
//     console.log(`📄 Đọc share của ${name} (ID=${data.id})`);
//   }

//   // 4️⃣ Tái tạo secret key bằng Lagrange Interpolation
//   const sk = lagrangeInterpolation(shares, ids);
//   console.log(`\n🔑 Secret Key tái tạo thành công!`);
//   console.log(`SK = ${sk.toString()}\n`);

//   // 5️⃣ Đọc kết quả tổng hợp từ tally_result.json
//   const tallyPath = path.join(__dirname, "./tally_result.json");
//   const tallyData = JSON.parse(await fs.readFile(tallyPath, "utf8"));

//   const { C1_total_x, C1_total_y, C2_total_x, C2_total_y, nVoters } = tallyData;
//   const numCandidates = C1_total_x.length;

//   console.log(`📊 Tổng số cử tri: ${nVoters}`);
//   console.log(`🎯 Số ứng viên: ${numCandidates}\n`);
//   console.log("=".repeat(60));

//   // 6️⃣ Giải mã từng ứng viên
//   const results = [];

//   for (let i = 0; i < numCandidates; i++) {
//     const C1_total = [F.e(BigInt(C1_total_x[i])), F.e(BigInt(C1_total_y[i]))];
//     const C2_total = [F.e(BigInt(C2_total_x[i])), F.e(BigInt(C2_total_y[i]))];

//     // Giải mã: M = C2_total - sk * C1_total
//     const Mpoint = decryptElGamal(C1_total, C2_total, sk);

//     // Tìm m từ m*G
//     const votes = findDiscreteLog(Mpoint, nVoters + 10);

//     results.push({
//       candidate: i + 1,
//       votes: votes !== null ? votes : "unknown",
//     });

//     console.log(
//       `🗳️  Ứng viên ${i + 1}: ${votes !== null ? votes : "???"} phiếu`
//     );
//   }

//   console.log("=".repeat(60));

//   // 7️⃣ Tổng hợp và hiển thị kết quả
//   const totalVotes = results.reduce(
//     (sum, r) => sum + (typeof r.votes === "number" ? r.votes : 0),
//     0
//   );
//   console.log(`\n✅ Tổng số phiếu đã giải mã: ${totalVotes}/${nVoters}`);

//   if (totalVotes === nVoters) {
//     console.log("🎉 Giải mã thành công 100%!");
//   } else {
//     console.log("⚠️  Có vẻ có sự khác biệt, cần kiểm tra lại!");
//   }

//   // 8️⃣ Tìm người thắng cuộc
//   const winner = results.reduce((max, r) => (r.votes > max.votes ? r : max));

//   console.log(
//     `\n🏆 Người thắng cuộc: Ứng viên ${winner.candidate} với ${winner.votes} phiếu!\n`
//   );

//   // 9️⃣ Lưu kết quả vào file
//   const outputPath = path.join(__dirname, "./utils/decryption_result.json");
//   await fs.writeFile(
//     outputPath,
//     JSON.stringify(
//       {
//         trustees_used: selectedTrustees,
//         threshold: "2/3",
//         total_voters: nVoters,
//         results,
//         winner: {
//           candidate: winner.candidate,
//           votes: winner.votes,
//         },
//       },
//       null,
//       2
//     )
//   );

//   console.log(`💾 Kết quả đã được lưu tại: ${outputPath}`);
// };

// main().catch(console.error);

import { buildBabyjub } from "circomlibjs";
import fs from "fs/promises";
import path from "path";
import { performance } from "perf_hooks"; // ⏱️ thêm để đo thời gian

const __dirname = import.meta.dirname || new URL(".", import.meta.url).pathname;

let babyjub, F, G, n;

// 🔢 Modular inverse
const modInverse = (a, m) => {
  a = ((a % m) + m) % m;
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];

  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }

  if (oldR !== 1n) throw new Error("Không tồn tại modular inverse");
  return ((oldS % m) + m) % m;
};

// 🧮 Lagrange Interpolation (x=0)
const lagrangeInterpolation = (shares, ids) => {
  let secret = 0n;

  for (let i = 0; i < shares.length; i++) {
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < shares.length; j++) {
      if (i !== j) {
        numerator = (numerator * (0n - ids[j])) % n;
        denominator = (denominator * (ids[i] - ids[j])) % n;
      }
    }

    const inv = modInverse(denominator, n);
    const lambda = (numerator * inv) % n;
    secret = (secret + shares[i] * lambda) % n;
  }

  return ((secret % n) + n) % n;
};

// 🔐 Giải mã ElGamal
const decryptElGamal = (C1, C2, sk) => {
  const skC1 = babyjub.mulPointEscalar(C1, sk);
  const minusSkC1 = [F.neg(skC1[0]), skC1[1]];
  const Mpoint = babyjub.addPoint(C2, minusSkC1);
  return Mpoint;
};

// 🔍 Brute-force tìm m
const findDiscreteLog = (Mpoint, maxTries = 100) => {
  const identityPoint = [F.e(0n), F.e(1n)];

  if (
    F.toObject(Mpoint[0]) === F.toObject(identityPoint[0]) &&
    F.toObject(Mpoint[1]) === F.toObject(identityPoint[1])
  ) {
    return 0;
  }

  let testPoint = G;
  for (let m = 1; m <= maxTries; m++) {
    if (
      F.toObject(Mpoint[0]) === F.toObject(testPoint[0]) &&
      F.toObject(Mpoint[1]) === F.toObject(testPoint[1])
    ) {
      return m;
    }
    testPoint = babyjub.addPoint(testPoint, G);
  }

  return null;
};

const main = async () => {
  console.log("🔓 Bắt đầu giải mã với Threshold 2/3...\n");

  const t0 = performance.now(); // ⏱️ bắt đầu tổng thời gian

  // 1️⃣ Init BabyJubJub
  babyjub = await buildBabyjub();
  F = babyjub.F;
  G = babyjub.Base8;
  n = babyjub.subOrder;

  // 2️⃣ Trustees
  const selectedTrustees = ["Alice", "Bob"];
  console.log(`👥 Trustees tham gia giải mã: ${selectedTrustees.join(", ")}`);

  // 3️⃣ Đọc share
  const dkgFolder = path.join(__dirname, "./utils/dkgKeys");
  const shares = [];
  const ids = [];

  for (const name of selectedTrustees) {
    const filePath = path.join(dkgFolder, `${name}.json`);
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    shares.push(BigInt(data.share));
    ids.push(BigInt(data.id));
    console.log(`📄 Đọc share của ${name} (ID=${data.id})`);
  }

  // 4️⃣ Lagrange interpolate
  const sk = lagrangeInterpolation(shares, ids);
  console.log(`\n🔑 Secret Key tái tạo thành công!`);
  console.log(`SK = ${sk.toString()}\n`);

  // 5️⃣ Đọc dữ liệu tally
  const tallyPath = path.join(__dirname, "./tally_result.json");
  const tallyData = JSON.parse(await fs.readFile(tallyPath, "utf8"));

  const { C1_total_x, C1_total_y, C2_total_x, C2_total_y, nVoters } = tallyData;
  const numCandidates = C1_total_x.length;

  console.log(`📊 Tổng số cử tri: ${nVoters}`);
  console.log(`🎯 Số ứng viên: ${numCandidates}\n`);
  console.log("=".repeat(60));

  // 6️⃣ Giải mã từng ứng viên
  const results = [];
  for (let i = 0; i < numCandidates; i++) {
    const tStart = performance.now(); // ⏱️ bắt đầu từng ứng viên

    const C1_total = [F.e(BigInt(C1_total_x[i])), F.e(BigInt(C1_total_y[i]))];
    const C2_total = [F.e(BigInt(C2_total_x[i])), F.e(BigInt(C2_total_y[i]))];
    const Mpoint = decryptElGamal(C1_total, C2_total, sk);
    const votes = findDiscreteLog(Mpoint, nVoters + 10);

    const tEnd = performance.now();
    const timeTaken = (tEnd - tStart).toFixed(2);

    results.push({
      candidate: i + 1,
      votes: votes !== null ? votes : "unknown",
      time_ms: Number(timeTaken),
    });

    console.log(
      `🗳️  Ứng viên ${i + 1}: ${votes !== null ? votes : "???"} phiếu  ⏱️ ${timeTaken} ms`
    );
  }

  console.log("=".repeat(60));

  // 7️⃣ Tổng kết
  const totalVotes = results.reduce(
    (sum, r) => sum + (typeof r.votes === "number" ? r.votes : 0),
    0
  );
  const t1 = performance.now(); // ⏱️ kết thúc tổng thời gian
  const totalTime = (t1 - t0).toFixed(2);

  console.log(`\n✅ Tổng số phiếu đã giải mã: ${totalVotes}/${nVoters}`);
  console.log(`🕒 Tổng thời gian giải mã: ${totalTime} ms (${(totalTime / 1000).toFixed(2)} s)`);

  if (totalVotes === nVoters) console.log("🎉 Giải mã thành công 100%!");
  else console.log("⚠️  Có sự khác biệt, cần kiểm tra lại!");

  // 8️⃣ Người thắng cuộc
  const winner = results.reduce((max, r) => (r.votes > max.votes ? r : max));
  console.log(
    `\n🏆 Người thắng cuộc: Ứng viên ${winner.candidate} với ${winner.votes} phiếu!`
  );

  // 9️⃣ Lưu kết quả
  const outputPath = path.join(__dirname, "./utils/decryption_result.json");
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        trustees_used: selectedTrustees,
        threshold: "2/3",
        total_voters: nVoters,
        total_time_ms: Number(totalTime),
        results,
        winner: {
          candidate: winner.candidate,
          votes: winner.votes,
        },
      },
      null,
      2
    )
  );

  console.log(`💾 Kết quả đã lưu tại: ${outputPath}\n`);
};

main().catch(console.error);
