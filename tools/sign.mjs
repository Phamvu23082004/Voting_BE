import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";

const skHex = process.argv[2];
const challengeHex = process.argv[3];

if (!skHex || !challengeHex) {
  console.error("Usage: node tools/sign.mjs <skHex> <challengeHex>");
  process.exit(1);
}

// 👇 BẮT BUỘC: gán sha256 cho utils để secp256k1 không lỗi
secp.utils.sha256Sync = sha256;

// Hash challenge (Uint8Array)
const msgHash = sha256(Uint8Array.from(Buffer.from(challengeHex, "hex")));
const skBytes = Uint8Array.from(Buffer.from(skHex, "hex"));

// prehash:true để nói rõ msgHash đã hash rồi
const sigBytes = await secp.sign(msgHash, skBytes, { der: false, prehash: true });

console.log("signatureHex:", Buffer.from(sigBytes).toString("hex"));
