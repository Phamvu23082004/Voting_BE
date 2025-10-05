const { ethers } = require("ethers");
require("dotenv").config();

const electionABI = require("../artifacts/Election.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.CA_PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  electionABI.abi,
  wallet
);

module.exports = { provider, wallet, contract };
