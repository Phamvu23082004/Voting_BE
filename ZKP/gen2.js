// import { buildEddsa, buildPoseidon } from "circomlibjs";
// import fs from "fs";
// import crypto from "crypto";

// console.log("🚀 Bắt đầu tạo input cho ProofKeyRelation (Merkle + hash_pk + nullifier)...");

// // =================== CONFIG ===================
// const TREE_DEPTH = 14;
// const OUTPUT_DIR = "results/vote_js";
// const OUTPUT_FILE = `${OUTPUT_DIR}/input.json`;
// const ELECTION_ID = "ELEC2025"; // 🗳️ ID cuộc bầu cử

// // =================== HÀM TIỆN ÍCH ===================
// function randomBigInt(modulus) {
//   const rand = BigInt("0x" + crypto.randomBytes(32).toString("hex"));
//   return rand % modulus;
// }

// function poseidonHash(poseidon, inputs) {
//   return poseidon.F.toObject(poseidon(inputs));
// }

// function buildPoseidonTree(poseidon, leaves) {
//   const tree = [leaves];
//   while (tree[tree.length - 1].length > 1) {
//     const prev = tree[tree.length - 1];
//     const next = [];
//     for (let i = 0; i < prev.length; i += 2) {
//       const left = prev[i];
//       const right = i + 1 < prev.length ? prev[i + 1] : left;
//       const parent = poseidonHash(poseidon, [left, right]);
//       next.push(parent);
//     }
//     tree.push(next);
//   }
//   return tree;
// }

// function getPoseidonProof(tree, index) {
//   const proof = [];
//   for (let level = 0; level < tree.length - 1; level++) {
//     const currentLevel = tree[level];
//     const isRight = index % 2;
//     const siblingIndex = isRight ? index - 1 : index + 1;
//     const sibling =
//       siblingIndex < currentLevel.length
//         ? currentLevel[siblingIndex]
//         : currentLevel[index];
//     proof.push({ sibling, isRight });
//     index = Math.floor(index / 2);
//   }
//   return proof;
// }

// function computeRootFromProof(poseidon, leaf, proof) {
//   let current = leaf;
//   for (const { sibling, isRight } of proof) {
//     const inputs = isRight ? [sibling, current] : [current, sibling];
//     current = poseidonHash(poseidon, inputs);
//   }
//   return current;
// }

// // =================== MAIN ===================
// async function main() {
//   const eddsa = await buildEddsa();
//   const poseidon = await buildPoseidon();
//   const babyjub = eddsa.babyJub;
//   const F = babyjub.F;

//   console.log("✅ Khởi tạo thành công Poseidon & BabyJub.");

//   // 1️⃣ Sinh private key & public key
//   const sk = randomBigInt(babyjub.subOrder);
//   const pkPoint = babyjub.mulPointEscalar(babyjub.Base8, sk);
//   const pk = [F.toObject(pkPoint[0]), F.toObject(pkPoint[1])];
//   console.log("🔑 sk:", sk.toString());
//   console.log("📡 pk:", pk.map(String));

//   // 2️⃣ Hash public key (hash_pk = Poseidon(Ax, Ay))
//   const hash_pk = poseidonHash(poseidon, pk);
//   console.log("🔒 hash_pk:", hash_pk.toString());

//   // 3️⃣ Sinh danh sách voters ngẫu nhiên
//   const voters = [];
//   for (let i = 0; i < 10000; i++) {
//     const rSk = randomBigInt(babyjub.subOrder);
//     const rPkPoint = babyjub.mulPointEscalar(babyjub.Base8, rSk);
//     voters.push([
//       F.toObject(rPkPoint[0]),
//       F.toObject(rPkPoint[1]),
//     ]);
//   }

//   // Chèn pk thật vào danh sách ngẫu nhiên
//   const targetIndex = Math.floor(Math.random() * (voters.length + 1));
//   const allPks = [...voters];
//   allPks.splice(targetIndex, 0, pk);

//   // 4️⃣ Hash từng leaf = Poseidon(pk)
//   const leaves = allPks.map((p) => poseidonHash(poseidon, p));

//   // 5️⃣ Xây Merkle tree
//   const tree = buildPoseidonTree(poseidon, leaves);
//   const root = tree[tree.length - 1][0];
//   console.log("🌿 Root Merkle Tree:", root.toString());

//   // 6️⃣ Lấy proof
//   const proof = getPoseidonProof(tree, targetIndex);
//   const pathElements = proof.map((p) => p.sibling);
//   const pathIndices = proof.map((p) => (p.isRight ? 1 : 0));

//   // 7️⃣ Kiểm tra lại root
//   const recomputedRoot = computeRootFromProof(poseidon, leaves[targetIndex], proof);
//   if (root !== recomputedRoot) throw new Error("❌ Root tính lại KHÔNG khớp!");

//   // 8️⃣ Hash election_id (Poseidon-friendly)
//   const elecBytes = Buffer.from(ELECTION_ID, "utf8");
//   const elecInputs = Array.from(elecBytes, (b) => BigInt(b));
//   const election_id = F.toObject(poseidon(elecInputs));
//   console.log("🗳️ Election ID:", ELECTION_ID);
//   console.log("🧩 election_id (Poseidon hash):", election_id.toString());

//   // 9️⃣ Ghi file input Circom khớp với ProofKeyRelation
//   const input = {
//     sk: sk.toString(),
//     pathElements: pathElements.map(String),
//     pathIndices: pathIndices.map(String),
//     root: root.toString(),
//     hash_pk: hash_pk.toString(),
//     election_hash: election_id.toString(),
//   };

//   fs.mkdirSync(OUTPUT_DIR, { recursive: true });
//   fs.writeFileSync(OUTPUT_FILE, JSON.stringify(input, null, 2));

//   console.log(`\n✅ File input Circom đã được tạo: ${OUTPUT_FILE}`);
//   console.log(`📍 Voter index: ${targetIndex}`);
// }

// main().catch((err) => {
//   console.error("❌ Lỗi:", err);
// });

// ============================================================
// ✅ generate_input_proofkeyrelation.js
// Tạo input.json cho mạch ProofKeyRelation
// + Sinh keypair ngẫu nhiên
// + Sinh 10k voter giả lập
// + Xây Merkle tree (Poseidon hash)
// + Tính proof + hash_pk + nullifier input
// + Đo thời gian từng bước
// ============================================================

import { buildEddsa, buildPoseidon } from "circomlibjs";
import fs from "fs";
import crypto from "crypto";

console.log("🚀 Bắt đầu tạo input cho ProofKeyRelation (Merkle + hash_pk + nullifier)...");

// =================== CONFIG ===================
const TREE_DEPTH = 14;
const OUTPUT_DIR = "results/vote_js";
const OUTPUT_FILE = `${OUTPUT_DIR}/input.json`;
const ELECTION_ID = "ELEC2025"; // 🗳️ ID cuộc bầu cử
const NUM_VOTERS = 10000; // 👥 10k voters

// =================== HÀM TIỆN ÍCH ===================
function randomBigInt(modulus) {
  const rand = BigInt("0x" + crypto.randomBytes(32).toString("hex"));
  return rand % modulus;
}

function poseidonHash(poseidon, inputs) {
  return poseidon.F.toObject(poseidon(inputs));
}

function buildPoseidonTree(poseidon, leaves) {
  const tree = [leaves];
  while (tree[tree.length - 1].length > 1) {
    const prev = tree[tree.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = i + 1 < prev.length ? prev[i + 1] : left;
      const parent = poseidonHash(poseidon, [left, right]);
      next.push(parent);
    }
    tree.push(next);
  }
  return tree;
}

function getPoseidonProof(tree, index) {
  const proof = [];
  for (let level = 0; level < tree.length - 1; level++) {
    const currentLevel = tree[level];
    const isRight = index % 2;
    const siblingIndex = isRight ? index - 1 : index + 1;
    const sibling =
      siblingIndex < currentLevel.length
        ? currentLevel[siblingIndex]
        : currentLevel[index];
    proof.push({ sibling, isRight });
    index = Math.floor(index / 2);
  }
  return proof;
}

function computeRootFromProof(poseidon, leaf, proof) {
  let current = leaf;
  for (const { sibling, isRight } of proof) {
    const inputs = isRight ? [sibling, current] : [current, sibling];
    current = poseidonHash(poseidon, inputs);
  }
  return current;
}

// =================== MAIN ===================
async function main() {
  console.time("⏱️ Tổng thời gian toàn bộ script");

  console.time("⏱️ Khởi tạo CircomLibJS");
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();
  const babyjub = eddsa.babyJub;
  const F = babyjub.F;
  console.timeEnd("⏱️ Khởi tạo CircomLibJS");

  // 1️⃣ Sinh private key & public key
  console.time("⏱️ Sinh keypair chính");
  const sk = randomBigInt(babyjub.subOrder);
  const pkPoint = babyjub.mulPointEscalar(babyjub.Base8, sk);
  const pk = [F.toObject(pkPoint[0]), F.toObject(pkPoint[1])];
  console.timeEnd("⏱️ Sinh keypair chính");

  console.log("🔑 sk:", sk.toString());
  console.log("📡 pk:", pk.map(String));

  // 2️⃣ Hash public key
  const hash_pk = poseidonHash(poseidon, pk);
  console.log("🔒 hash_pk:", hash_pk.toString());

  // 3️⃣ Sinh danh sách voters ngẫu nhiên
  console.time(`⏱️ Sinh ${NUM_VOTERS.toLocaleString()} voter giả`);
  const voters = [];
  for (let i = 0; i < NUM_VOTERS; i++) {
    const rSk = randomBigInt(babyjub.subOrder);
    const rPkPoint = babyjub.mulPointEscalar(babyjub.Base8, rSk);
    voters.push([F.toObject(rPkPoint[0]), F.toObject(rPkPoint[1])]);
  }
  console.timeEnd(`⏱️ Sinh ${NUM_VOTERS.toLocaleString()} voter giả`);

  // Chèn pk thật vào danh sách ngẫu nhiên
  const targetIndex = Math.floor(Math.random() * (voters.length + 1));
  const allPks = [...voters];
  allPks.splice(targetIndex, 0, pk);

  // 4️⃣ Hash từng leaf
  console.time("⏱️ Hash từng leaf (Poseidon)");
  const leaves = allPks.map((p) => poseidonHash(poseidon, p));
  console.timeEnd("⏱️ Hash từng leaf (Poseidon)");

  // 5️⃣ Xây Merkle tree
  console.time("⏱️ Build Merkle tree");
  const tree = buildPoseidonTree(poseidon, leaves);
  console.timeEnd("⏱️ Build Merkle tree");

  const root = tree[tree.length - 1][0];
  console.log("🌿 Root Merkle Tree:", root.toString());

  // 6️⃣ Lấy proof
  console.time("⏱️ Tạo proof Merkle path");
  const proof = getPoseidonProof(tree, targetIndex);
  console.timeEnd("⏱️ Tạo proof Merkle path");

  const pathElements = proof.map((p) => p.sibling);
  const pathIndices = proof.map((p) => (p.isRight ? 1 : 0));

  // 7️⃣ Kiểm tra lại root
  const recomputedRoot = computeRootFromProof(poseidon, leaves[targetIndex], proof);
  if (root !== recomputedRoot) throw new Error("❌ Root tính lại KHÔNG khớp!");

  // 8️⃣ Hash election_id
  const elecBytes = Buffer.from(ELECTION_ID, "utf8");
  const elecInputs = Array.from(elecBytes, (b) => BigInt(b));
  const election_id = F.toObject(poseidon(elecInputs));
  console.log("🗳️ Election ID:", ELECTION_ID);
  console.log("🧩 election_id (Poseidon hash):", election_id.toString());

  // 9️⃣ Ghi file input Circom
  console.time("💾 Ghi file JSON đầu ra");
  const input = {
    sk: sk.toString(),
    pathElements: pathElements.map(String),
    pathIndices: pathIndices.map(String),
    root: root.toString(),
    hash_pk: hash_pk.toString(),
    election_hash: election_id.toString(),
  };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(input, null, 2));
  console.timeEnd("💾 Ghi file JSON đầu ra");

  console.log(`✅ File input Circom đã được tạo: ${OUTPUT_FILE}`);
  console.log(`📍 Voter index: ${targetIndex}`);
  console.timeEnd("⏱️ Tổng thời gian toàn bộ script");
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
});
