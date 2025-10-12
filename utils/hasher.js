const { buildPoseidon } = require("circomlibjs");

let poseidon;

async function getPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  return poseidon;
}

module.exports = { getPoseidon };
