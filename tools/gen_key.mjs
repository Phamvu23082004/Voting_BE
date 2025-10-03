// tools/gen_keys.js
import * as secp from "@noble/secp256k1";
import crypto from "crypto";

const bytesToHex = (b) => Buffer.from(b).toString("hex");

// private key (32 bytes)
const sk = crypto.randomBytes(32);

// public key (uncompressed, 65 bytes → dễ verify hơn)
const pk = secp.getPublicKey(sk, false);

const skHex = bytesToHex(sk);
const pkHex = bytesToHex(pk);

// hash public key
const hashPk = crypto.createHash("sha256").update(pk).digest("hex");

console.log("=== Generated Keys ===");
console.log("skHex:", skHex);
console.log("pkHex:", pkHex);
console.log("hashPk:", hashPk);
