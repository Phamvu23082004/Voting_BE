// eccUtils.js
import { buildBabyjub } from "circomlibjs";
import crypto from "crypto";

// ====================== KHỞI TẠO BABYJUBJUB ======================
let babyjub, F, G, n;

// Gọi hàm này 1 lần ở đầu chương trình
export const initBabyjub = async () => {
  babyjub = await buildBabyjub();
  F = babyjub.F;
  G = babyjub.Base8; // Dùng Base8 để khớp Circom
  n = babyjub.subOrder;
  console.log("✅ BabyJubJub initialized");
  return { babyjub, F, G, n };
};

// ====================== SINH KHÓA NGẪU NHIÊN ======================
export const generateKeyPair = () => {
  const sk = BigInt("0x" + crypto.randomBytes(32).toString("hex")) % n;
  const pk = babyjub.mulPointEscalar(G, sk); // pk = sk * Base8
  return { sk, pk };
};

// ====================== ĐÁNH GIÁ ĐA THỨC ======================
export const evalPolynomial = (coeffs, x) => {
  let res = 0n;
  const X = BigInt(x);
  for (let i = 0; i < coeffs.length; i++) {
    res = (res + coeffs[i] * X ** BigInt(i)) % n;
  }
  return res;
};

// ====================== NGHỊCH ĐẢO MOD ======================
export const modInverse = (a, m = n) => {
  let t = 0n, newT = 1n;
  let r = m, newR = a % m;
  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r > 1n) throw new Error("Not invertible");
  if (t < 0n) t += m;
  return t;
};

// ====================== LẤY THÔNG SỐ ======================
export const getParams = () => ({ babyjub, F, G, n });
