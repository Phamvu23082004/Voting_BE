// import { buildBabyjub } from "circomlibjs";
// import fs from "fs/promises";

// const main = async () => {
//   const babyjub = await buildBabyjub();
//   const F = babyjub.F;
//   const Base8 = babyjub.Base8; 

//   const data = JSON.parse(await fs.readFile("./utils/input.json", "utf8"));

//   const sk =
//     2129932002007026863377749730262717475699001389369051613129210567269141060427n;

// //   const PK_test = babyjub.mulPointEscalar(Base8, sk);
// //   console.log("🔍 PK từ sk tính ra:");
// //   console.log("PKx =", F.toObject(PK_test[0]).toString());
// //   console.log("PKy =", F.toObject(PK_test[1]).toString());
// //   console.log("📦 PK trong input:");
// //   console.log("PKx =", data.PKx);
// //   console.log("PKy =", data.PKy);
// //   console.log("---");

//   const decryptedM = [];

//   for (let i = 0; i < data.C1x.length; i++) {
//     const C1 = [F.e(BigInt(data.C1x[i])), F.e(BigInt(data.C1y[i]))];
//     const C2 = [F.e(BigInt(data.C2x[i])), F.e(BigInt(data.C2y[i]))];

//     // Tính sk * C1
//     const skC1 = babyjub.mulPointEscalar(C1, sk);

//     // ✅ SỬA LỖI 1: Dùng đúng công thức điểm đối của Twisted Edwards (-x, y)
//     // Phép trừ C2 - skC1 tương đương với C2 + (-skC1)
//     const minusSkC1 = [F.neg(skC1[0]), skC1[1]];

//     // Mpoint = C2 - sk*C1 = m*G
//     const Mpoint = babyjub.addPoint(C2, minusSkC1);

//     // Điểm đơn vị (Identity Point) của BabyJubJub là (0, 1)
//     const identityPoint = { x: 0n, y: 1n };

//     // Kiểm tra với m = 0. Mpoint phải bằng 0*G = Identity Point(0, 1)
//     const isZero =
//       F.toObject(Mpoint[0]) === identityPoint.x &&
//       F.toObject(Mpoint[1]) === identityPoint.y;

//     // ✅ SỬA LỖI 2: Kiểm tra với m = 1. Mpoint phải bằng 1*G = G (Base8)
//     const isOne =
//       F.toObject(Mpoint[0]) === F.toObject(Base8[0]) &&
//       F.toObject(Mpoint[1]) === F.toObject(Base8[1]);

//     let m;
//     if (isZero) m = 0n;
//     else if (isOne) m = 1n;
//     else m = "unknown";

//     decryptedM.push(m);
//     console.log(
//       `🗳️  Candidate ${i + 1}: m = ${m} (${
//         isZero ? "→ Identity (0,1)" : isOne ? "→ G" : "??"
//       })`
//     );
//   }

//   console.log("\n✅ Giải mã hoàn tất:");
//   console.log("Kết quả vector m =", decryptedM.map(v => v.toString()));
// };

// main().catch(console.error);

// ===============================
// 🗳️ generate_vote.js
// Tạo file mã hóa phiếu cho từng cử tri
// ===============================

import { buildBabyjub } from "circomlibjs";
import fs from "fs/promises";

const main = async () => {
  console.log("🚀 Sinh phiếu mã hóa cho nhiều cử tri...");

  const babyjub = await buildBabyjub();
  const F = babyjub.F;
  const G = babyjub.Base8;

  // 🔐 Public Key của hệ thống (từ DKG)
  const PKx = BigInt("17596464219179101706308493636472200114835897172677871649467815891749829182355");
  const PKy = BigInt("8193303007362196043663121080188057262245936097954956565421561573968074301381");
  const PK = [F.e(PKx), F.e(PKy)];

  const numVoters = 10000;       // tạo 3 cử tri test
  const numCandidates = 10;   // 5 ứng viên

  for (let voterId = 1; voterId <= numVoters; voterId++) {
    // Giả lập: mỗi cử tri chỉ chọn 1 ứng viên ngẫu nhiên
    const choice = Math.floor(Math.random() * numCandidates);
    const mVec = Array(numCandidates).fill(0n);
    mVec[choice] = 1n;

    // Sinh ngẫu nhiên r
    const rVec = Array.from({ length: numCandidates }, () =>
      BigInt(Math.floor(Math.random() * 1e6) + 1)
    );

    const C1x = [], C1y = [], C2x = [], C2y = [];

    for (let i = 0; i < numCandidates; i++) {
      const r = rVec[i], m = mVec[i];
      const C1 = babyjub.mulPointEscalar(G, r);
      const rPK = babyjub.mulPointEscalar(PK, r);
      const mG = babyjub.mulPointEscalar(G, m);
      const C2 = babyjub.addPoint(mG, rPK);

      C1x.push(F.toObject(C1[0]).toString());
      C1y.push(F.toObject(C1[1]).toString());
      C2x.push(F.toObject(C2[0]).toString());
      C2y.push(F.toObject(C2[1]).toString());
    }

    const vote = {
      voterId,
      m: mVec.map(String),
      r: rVec.map(String),
      C1x, C1y, C2x, C2y,
    };

    await fs.writeFile(`./utils/votes/vote_${voterId}.json`, JSON.stringify(vote, null, 2));
    console.log(`✅ Đã tạo vote_${voterId}.json (chọn ứng viên ${choice + 1})`);
  }
};

main().catch(console.error);
