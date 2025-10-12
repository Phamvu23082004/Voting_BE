import { buildEddsa, buildPoseidon } from "circomlibjs";
import fs from "fs";
import crypto from "crypto";

console.log("🚀 Bắt đầu tạo Merkle tree Poseidon BigInt (ZK-friendly)...");

// =================== CONFIG ===================
const TREE_DEPTH = 3;
const OUTPUT_DIR = "results/vote_js";
const OUTPUT_FILE = `${OUTPUT_DIR}/input.json`;
const ELECTION_ID = "ELEC2025"; // 🗳️ ID cuộc bầu cử

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
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();
  const babyjub = eddsa.babyJub;
  const F = babyjub.F;

  console.log("✅ Khởi tạo thành công Poseidon & BabyJub.");

  // 1️⃣ Sinh private key & public key cho voter
  const sk = randomBigInt(babyjub.subOrder);
  const pkPoint = babyjub.mulPointEscalar(babyjub.Base8, sk);
  const pk = [F.toObject(pkPoint[0]), F.toObject(pkPoint[1])];
  console.log("🔑 sk:", sk.toString());
  console.log("📡 pk:", pk.map(String));

  // 2️⃣ Sinh danh sách voters ngẫu nhiên
  const voters = [];
  for (let i = 0; i < 5; i++) {
    const rSk = randomBigInt(babyjub.subOrder);
    const rPkPoint = babyjub.mulPointEscalar(babyjub.Base8, rSk);
    voters.push([
      F.toObject(rPkPoint[0]),
      F.toObject(rPkPoint[1]),
    ]);
  }

  // Random vị trí của bạn trong danh sách
  const targetIndex = Math.floor(Math.random() * voters.length);
  const allPks = [...voters];
  allPks.splice(targetIndex, 0, pk);

  // 3️⃣ Hash từng leaf = Poseidon(pk)
  const leaves = allPks.map((p) => poseidonHash(poseidon, p));

  // 4️⃣ Xây Merkle tree
  const tree = buildPoseidonTree(poseidon, leaves);
  const root = tree[tree.length - 1][0];
  console.log("🌿 Root Merkle Tree:", root.toString());

  // 5️⃣ Tạo proof cho voter ở index target
  const proof = getPoseidonProof(tree, targetIndex);
  const pathElements = proof.map((p) => p.sibling);
  const pathIndices = proof.map((p) => (p.isRight ? 1 : 0));

  // 6️⃣ Kiểm tra lại root
  const recomputedRoot = computeRootFromProof(poseidon, leaves[targetIndex], proof);
  if (root !== recomputedRoot) throw new Error("❌ Root tính lại KHÔNG khớp!");

  // 7️⃣ Hash election_id → election_hash (theo Poseidon)
  const elecBytes = Buffer.from(ELECTION_ID, "utf8");
  const elecHash = F.toObject(poseidon(Array.from(elecBytes, (b) => BigInt(b))));
  console.log("🗳️ Election ID:", ELECTION_ID);
  console.log("🧩 Election Hash:", elecHash.toString());

  // 8️⃣ Tính nullifier = Poseidon(sk, election_hash)
  const nullifier = F.toObject(poseidon([sk, elecHash]));
  console.log("🧮 Nullifier:", nullifier.toString());

  // 9️⃣ Ghi file input Circom
  const input = {
    election_id: ELECTION_ID,
    election_hash: elecHash.toString(),
    nullifier: nullifier.toString(),
    sk: sk.toString(),
    pk: pk.map(String),
    root: root.toString(),
    pathElements: pathElements.map(String),
    pathIndices: pathIndices.map(String),
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(input, null, 2));

  console.log(`\n✅ File input Circom đã được tạo: ${OUTPUT_FILE}`);
  console.log(`📍 Voter index: ${targetIndex}`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
});