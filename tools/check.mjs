import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(__dirname + "/../node_modules/@noble/secp256k1/package.json", "utf8")
);

console.log("Loaded @noble/secp256k1 version:", pkg.version);
