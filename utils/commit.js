import { buildPoseidon } from "circomlibjs";
import fs from "fs/promises";

const exampleHashCiphers = [
  "21262784045309719227965872023032554165452043686194824902452795194578957795100",
  "1418376059341917044396517310306089669664270101518304135743292031947438647761",
  "1783024049493296724837658301875711898780103877060638549036987488677158488023",
];

const main = async () => {
  const poseidon = await buildPoseidon();
  const hashCipherArr = exampleHashCiphers.map(BigInt);
  let acc = 0n;

  for (const h of hashCipherArr) {
    console.log("DEBUG h =", h);
    const hashVal = poseidon([acc, h]);
    acc = poseidon.F.toObject(hashVal); // ✅ lấy BigInt thật
  }

  console.log("✅ hashCipherAll =", acc.toString());
};

main().catch((err) => console.error("❌ Error:", err));

// 4878737803089152366139208125288969124846486104031966917288495002976150828197