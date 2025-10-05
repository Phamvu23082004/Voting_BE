import { createHash } from "crypto";
import elliptic from "elliptic";

const { ec: EC } = elliptic;
const ec = new EC("secp256k1");

// Nhận tham số dòng lệnh
const privKey = process.argv[2]; // private key hex
const msg = process.argv[3]; // message hex

// Hash message
const msgHash = createHash("sha256").update(Buffer.from(msg, "hex")).digest();

// Tạo keypair và ký
const keyPair = ec.keyFromPrivate(privKey, "hex");
const signature = keyPair.sign(msgHash);

// ✅ Xuất chữ ký dạng (r || s), tổng cộng 64 bytes = 128 hex chars
const rHex = signature.r.toString("hex").padStart(64, "0");
const sHex = signature.s.toString("hex").padStart(64, "0");
const sigHex = rHex + sHex;

console.log(sigHex);
