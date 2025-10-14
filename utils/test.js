import { buildBabyjub } from "circomlibjs";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const __dirname = import.meta.dirname || new URL(".", import.meta.url).pathname;

// ====================== BABYJUBJUB SETUP ======================
let babyjub, F, G, n;

const initBabyjub = async () => {
  babyjub = await buildBabyjub();
  F = babyjub.F;
  G = babyjub.Base8; // dùng Base8 để tương thích Circom
  n = babyjub.subOrder;
  console.log("✅ BabyJubJub initialized");
  return { babyjub, F, G, n };
};

// ====================== EVAL POLYNOMIAL ======================
const evalPolynomial = (coeffs, x) => {
  let res = 0n;
  const X = BigInt(x);
  for (let i = 0; i < coeffs.length; i++) {
    res = (res + coeffs[i] * X ** BigInt(i)) % n;
  }
  return res;
};

// ====================== DKG TEST FUNCTION ======================
const generateTrusteeShares = async (trusteeNames, threshold = 2) => {
  const start = Date.now();
  console.log("🚀 Bắt đầu DKG...");

  try {
    await initBabyjub();

    if (trusteeNames.length < threshold) {
      throw new Error(`Không đủ trustee (cần >= ${threshold})`);
    }

    // 1️⃣ Mỗi trustee sinh đa thức ngẫu nhiên bậc (threshold-1)
    const trustees = trusteeNames.map((name) => {
      const coeffs = Array.from(
        { length: threshold },
        () => BigInt("0x" + crypto.randomBytes(32).toString("hex")) % n
      );
      return { name, coeffs };
    });

    // 2️⃣ Tính các share cho từng trustee
    const shares = trusteeNames.map((name, i) => {
      const IDi = BigInt(i + 1);
      const total = trustees.reduce((sum, t) => {
        const val = evalPolynomial(t.coeffs, IDi);
        return (sum + val) % n;
      }, 0n);
      return { name, F: total };
    });

    // 3️⃣ Tính public Yi = F(i) * G
    const publicYi = shares.map((s) => ({
      name: s.name,
      Y: babyjub.mulPointEscalar(G, s.F),
    }));

    console.log("publicYi", publicYi)

    // 4️⃣ Ghi ra file
    const folderPath = path.join(__dirname, "./dkgKeys");
    await fs.mkdir(folderPath, { recursive: true });
    await Promise.all(
      shares.map(async (s) => {
        const safeName = s.name.replace(/\s+/g, "_");
        const filePath = path.join(folderPath, `${safeName}.json`);
        await fs.writeFile(
          filePath,
          JSON.stringify(
            {
              trustee: s.name,
              share: s.F.toString(),
            },
            null,
            2
          )
        );
      })
    );
    console.log("✅ Đã lưu các share vào thư mục dkgKeys/");

    // 5️⃣ Tính F(0) = tổng hệ số đầu tiên (a₀)
    const F0 = trustees.reduce((sum, t) => (sum + t.coeffs[0]) % n, 0n);
    console.log("🧩 Private key (F0 / sk_total):", F0.toString());
    // 6️⃣ Tính public key đồng cấu
    const epkPoint = babyjub.mulPointEscalar(G, F0);
    const epk = {
      x: F.toObject(epkPoint[0]).toString(),
      y: F.toObject(epkPoint[1]).toString(),
    };

    console.log("✅ Public Key (epk):", epk);
    console.log(`✅ Hoàn tất DKG trong ${(Date.now() - start) / 1000}s`);

    return {
      EC: 0,
      EM: "Success",
      totalTrustees: trusteeNames.length,
      publicYi,
      epk,
    };
  } catch (err) {
    console.error("❌ Lỗi DKG:", err);
    return { EC: 1, EM: err.message };
  }
};

// ====================== CHẠY DEMO ======================
const main = async () => {
  const trustees = ["Alice", "Bob", "Charlie"];
  const threshold = 2;

  const result = await generateTrusteeShares(trustees, threshold);
  console.log("\n📦 Kết quả cuối cùng:\n", JSON.stringify(result, null, 2));
};

main();
