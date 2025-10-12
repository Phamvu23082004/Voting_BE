import { buildEddsa, buildBabyjub } from "circomlibjs";
import crypto from "crypto";
import fs from "fs";

export const generateBabyJubJubKeys = async () => {
  // 1️⃣ Khởi tạo thư viện
  const eddsa = await buildEddsa();
  const babyjub = await buildBabyjub();
  const F = babyjub.F;

  // 2️⃣ Sinh private key ngẫu nhiên và đảm bảo nằm trong subOrder
  const raw = BigInt("0x" + crypto.randomBytes(32).toString("hex"));
  const skBig = raw % babyjub.subOrder; // chuẩn field
  const skHex = skBig.toString(16).padStart(64, "0");
  const skBuf = Buffer.from(skHex, "hex");

  // 3️⃣ Tính public key đúng chuẩn BabyPbk() (không hash/clamp)
  const pub = babyjub.mulPointEscalar(babyjub.Base8, skBig); // ✅ pk = sk * 8G

  // 4️⃣ Lấy tọa độ X, Y dạng số nguyên
  const Ax = F.toObject(pub[0]);
  const Ay = F.toObject(pub[1]);

  console.log("✅ SK:", skBig.toString());
  console.log("✅ PK (Ax):", Ax.toString());
  console.log("✅ PK (Ay):", Ay.toString());

  // 5️⃣ Ghi input.json vào thư mục build/voterProof_js/
  const input = {
    sk: skBig.toString(),
    pk: [Ax.toString(), Ay.toString()],
  };

  fs.mkdirSync("build/voterProof_js", { recursive: true }); // tạo thư mục nếu chưa có
  fs.writeFileSync(
    "build/voterProof_js/input.json",
    JSON.stringify(input, null, 2)
  );

  console.log("\n✅ Đã tạo file: build/voterProof_js/input.json\n");
  console.log(JSON.stringify(input, null, 2));
};

// 6️⃣ Tự chạy nếu file được thực thi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBabyJubJubKeys();
}
