// tools/sign.mjs
import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";

const privKey = process.argv[2];   // private key hex
const msg = process.argv[3];       // message hex

// Tạo Uint8Array từ message
const msgBytes = Buffer.from(msg, "hex");

// Hash message
const msgHash = sha256(msgBytes);

// Ký bằng private key
const signature = await secp.sign(msgHash, privKey, { der: false });

// In ra signature hex
console.log(Buffer.from(signature).toString("hex"));
