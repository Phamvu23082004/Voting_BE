// =======================================================
// 🔐 generate_multi_input.js
// Sinh input_multi.json cho mạch MultiCiphertextValidity(10)
// =======================================================

import { buildBabyjub, buildPoseidon } from "circomlibjs";
import fs from "fs/promises";

const main = async () => {
  // 1️⃣ Khởi tạo BabyJubJub & Poseidon
  const babyjub = await buildBabyjub();
  const poseidon = await buildPoseidon();
  const F = babyjub.F;
  const G = babyjub.Base8;

  // 2️⃣ Public Key (ví dụ từ DKG hoặc keypair voter)
  const PKx = BigInt(
    "16217789887673573211481589827470768748157422343262687777321492680553568188223"
  );
  const PKy = BigInt(
    "2422818650582836494009072917401788942944476456267904184585597655795660797643"
  );
  const PK = [F.e(PKx), F.e(PKy)];

  // 3️⃣ Voter chọn ứng viên 3 và 6 (bỏ phiếu kiểu vector)
  const mVec = [0n, 0n, 1n, 0n, 0n, 1n, 0n, 0n, 0n, 0n];

  // 4️⃣ Sinh ngẫu nhiên r[i] cho mỗi ciphertext
  const rVec = Array.from({ length: mVec.length }, () =>
    BigInt(Math.floor(Math.random() * 1e6) + 1)
  );

  // 5️⃣ Tạo ciphertext (C1, C2) cho từng ứng viên
  const C1x = [];
  const C1y = [];
  const C2x = [];
  const C2y = [];

  for (let i = 0; i < mVec.length; i++) {
    const r = rVec[i];
    const m = mVec[i];

    // C1 = r * G
    const C1 = babyjub.mulPointEscalar(G, r);

    // rPK = r * PK
    const rPK = babyjub.mulPointEscalar(PK, r);

    // mG = m * G
    const mG = babyjub.mulPointEscalar(G, m);

    // C2 = mG + rPK
    const C2 = babyjub.addPoint(mG, rPK);

    C1x.push(F.toObject(C1[0]).toString());
    C1y.push(F.toObject(C1[1]).toString());
    C2x.push(F.toObject(C2[0]).toString());
    C2y.push(F.toObject(C2[1]).toString());
  }

  // 6️⃣ Hash toàn bộ ciphertexts (chain Poseidon)
  let acc = F.e(0n);
  for (let i = 0; i < mVec.length; i++) {
    const h = poseidon([
      F.e(BigInt(C1x[i])),
      F.e(BigInt(C1y[i])),
      F.e(BigInt(C2x[i])),
      F.e(BigInt(C2y[i])),
    ]);
    acc = poseidon([acc, h]); // chain-hash
  }
  const hashCipher = F.toObject(acc).toString();

  // 7️⃣ Ghi ra file JSON đầu vào cho Circom
  const input = {
    PKx: PKx.toString(),
    PKy: PKy.toString(),
    r: rVec.map((r) => r.toString()),
    m: mVec.map((m) => m.toString()),
    C1x,
    C1y,
    C2x,
    C2y,
    // hashCipher,
  };

  await fs.writeFile("input.json", JSON.stringify(input, null, 2));

  // 8️⃣ Log kết quả
  console.log("✅ input_multi.json generated successfully!");
  console.log("🔢 Candidates:", mVec.length);
  console.log("🧩 hashCipher =", hashCipher);
};

main().catch(console.error);