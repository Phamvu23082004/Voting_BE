// =======================================================
// 🧩 benchmark_zkp.js
// Đo thời gian setup / prove / verify cho 2 mạch Circom
// =======================================================

import { execSync } from "child_process";
import { performance } from "perf_hooks";
import fs from "fs";

const circuits = [
  {
    name: "VoteProofCombined",
    input: "ZKP/input_tally.json", // đổi nếu bạn đặt input khác
  },
  // {
  //   name: "TallyValidityWithCommit",
  //   input: "ZKP/input_tally.json",
  // },
];

const run = (cmd) => {
  console.log(`\n▶️ ${cmd}`);
  try {
    const t0 = performance.now();
    execSync(cmd, { stdio: "inherit" });
    const t1 = performance.now();
    const sec = ((t1 - t0) / 1000).toFixed(2);
    console.log(`✅ Done in ${sec}s`);
    return sec;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
};

const main = async () => {
  console.log("===============================================");
  console.log("   🕒 Benchmark setup / prove / verify ZKPs   ");
  console.log("===============================================\n");

  const results = [];

  for (const c of circuits) {
    console.log(`\n==============================`);
    console.log(`🚀 Circuit: ${c.name}`);
    console.log(`==============================`);

    const base = `ZKP/build/${c.name}`;

    // --------------------- 1️⃣ Setup ---------------------
    const setupTime = run(
      `snarkjs groth16 setup ${base}.r1cs ZKP/powersOfTau28_hez_final_16.ptau ${base}.zkey`
    );

    // --------------------- 2️⃣ Witness ---------------------
    const witnessTime = run(
      `node ZKP/build/${c.name}_js/generate_witness.js ZKP/build/${c.name}_js/${c.name}.wasm ${c.input} ZKP/build/${c.name}.wtns`
    );

    // --------------------- 3️⃣ Prove ---------------------
    const proveTime = run(
      `snarkjs groth16 prove ${base}.zkey ${base}.wtns ${base}_proof.json ${base}_public.json`
    );

    // --------------------- 4️⃣ Verify ---------------------
    // tạo verification key nếu chưa có
    const vkPath = "ZKP/build/verification_key.json";
    if (!fs.existsSync(vkPath)) {
      console.log("📄 Generating verification key...");
      run(`snarkjs zkey export verificationkey ${base}.zkey ${vkPath}`);
    }

    const verifyTime = run(
      `snarkjs groth16 verify ${vkPath} ${base}_public.json ${base}_proof.json`
    );

    results.push({
      circuit: c.name,
      setup: setupTime,
      witness: witnessTime,
      prove: proveTime,
      verify: verifyTime,
    });
  }

  console.log("\n\n===============================================");
  console.log("📊 Benchmark Summary:");
  console.table(results);
  console.log("===============================================\n");
};

main();
