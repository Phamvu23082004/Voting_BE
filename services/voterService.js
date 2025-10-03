const Voter = require('../models/voterModel');
const ValidVoter = require('../models/validVoterModel');
const Election = require('../models/electionModel');
const merkleUtils = require('../utils/merkleUtils');
const keccak256 = require('keccak256');
const crypto = require('crypto');
const redisClient = require('../config/redis');
const jwtService = require('./jwtService');

const registerVoter = async (cccd, publicKey, electionId) => {
 const election = await Election.findOne({ election_id: electionId });
  if (!election) throw new Error('Election not found');

  // Kiểm tra cử tri hợp lệ
  const valid = await ValidVoter.findOne({ cccd, election_id: electionId });
  if (!valid) throw new Error('Not in valid voter list');

  // Hash pk
  const hashedKey = keccak256(publicKey).toString('hex');

  // Kiểm tra đã có hashedKey chưa
  const existing = await Voter.findOne({ election_id: election._id, hashed_key: hashedKey });
  if (existing) throw new Error('Already registered');

  // Lưu voter (chỉ lưu hash)
  const voter = new Voter({
    hashed_key: hashedKey,
    election_id: electionId,
    is_valid: true,
    proof: [] // proof sẽ được cập nhật khi finalize
  });
  await voter.save();

  return { message: 'Registered (demo)', hashed_key: hashedKey };
};



const verifySignature = async (pkHex, hashPk, signatureHex, election_id) => {
  const secp = await import('@noble/secp256k1'); // dynamic import (ESM lib trong CJS)

  const voter = await Voter.findOne({ hashed_key: hashPk, election_id });
  if (!voter || !voter.is_valid) throw new Error("Voter not valid");

  const challenge = await redisClient.get(`challenge:${hashPk}:${election_id}`);
  if (!challenge) throw new Error("No challenge found or expired");

  // hash challenge
  const msgHash = crypto.createHash("sha256")
    .update(Buffer.from(challenge, "hex"))
    .digest();

  const pkBytes = Buffer.from(pkHex, "hex");
  const sigBytes = Buffer.from(signatureHex, "hex");

  // verify (noble/secp256k1 v3)
  const isValid = secp.verify(sigBytes, msgHash, pkBytes);

  if (!isValid) throw new Error("Invalid signature");

  await redisClient.del(`challenge:${hashPk}:${election_id}`);

  const payload = { hashPk, election_id };
  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = jwtService.generateRefreshToken(payload);

  return { accessToken, refreshToken };
};



//sinh challenge ngẫu nhiên
const generateChallenge = async (hashPk, election_id) => {
  const voter = await Voter.findOne({ hashed_key: hashPk, election_id });
  if (!voter || !voter.is_valid) {
    throw new Error("Voter not valid");
  }

  const challenge = crypto.randomBytes(32).toString("hex");
  await redisClient.setEx(`challenge:${hashPk}:${election_id}`, 1000, challenge); // TTL 60s

  return challenge;
};

module.exports = { registerVoter, verifySignature, generateChallenge };