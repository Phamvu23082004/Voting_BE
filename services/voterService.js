const Voter = require("../models/voterModel");
const ValidVoter = require("../models/validVoterModel");
const Election = require("../models/electionModel");
const merkleUtils = require("../utils/merkleUtils");
const keccak256 = require("keccak256");
const crypto = require("crypto");
const redisClient = require("../config/redis");
const jwtService = require("./jwtService");
const EC = require("elliptic").ec;

const ec = new EC("secp256k1");

const registerVoter = async (cccd, publicKey, election_id) => {
  const election = await Election.findOne({ election_id: election_id });
  if (!election) {
    return {
      EC: 1,
      EM: "Cuộc bầu cử không tồn tại",
    };
  }

  const valid = await ValidVoter.findOne({ cccd, election_id });
  if (!valid) {
    return { EC: 2, EM: "Cử tri không có trong danh sách hợp lệ" };
  }

  if (!valid.is_valid) {
    return { EC: 3, EM: "Cử tri đã đăng ký trước đó" };
  }

  const hashedKey = keccak256(publicKey).toString("hex");

  // Kiểm tra đã có hashedKey chưa
  const existing = await Voter.findOne({ election_id, hashed_key: hashedKey });
  if (existing) {
    return { EC: 4, EM: "Khóa công khai này đã được sử dụng" };
  }

  const voter = new Voter({
    hashed_key: hashedKey,
    election_id: election_id,
    is_valid: true,
    proof: [],
  });
  await voter.save();

  valid.is_valid = false;
  await valid.save();

  return {
    EC: 0,
    EM: "Đăng ký cử tri thành công",
    result: {
      hashed_key: hashedKey,
    },
  };
};

const generateChallenge = async (hashPk, election_id) => {
  const voter = await Voter.findOne({ hashed_key: hashPk, election_id });
  if (!voter || !voter.is_valid) {
    return {
      EC: 1,
      EM: "Cử tri không hợp lệ hoặc chưa được xác nhận",
    };
  }

  const challenge = crypto.randomBytes(32).toString("hex");
  await redisClient.setEx(
    `challenge:${hashPk}:${election_id}`,
    1000,
    challenge
  ); // TTL 60s

  return {
    EC: 0,
    EM: "Tạo challenge thành công",
    result: { challenge },
  };
};

const verifySignature = async (pkHex, hashPk, signatureHex, election_id) => {
  const voter = await Voter.findOne({ hashed_key: hashPk, election_id });
  console.log("verifySignature input:", {
    pkHex,
    hashPk,
    signatureHex,
    election_id,
  });

  if (!voter || !voter.is_valid) {
    return {
      EC: 1,
      EM: "Cử tri không hợp lệ hoặc chưa được xác nhận",
    };
  }

  const challenge = await redisClient.get(`challenge:${hashPk}:${election_id}`);
  if (!challenge) {
    return {
      EC: 2,
      EM: "Challenge không tồn tại hoặc đã hết hạn",
    };
  }

  // Hash challenge
  const msgHash = crypto
    .createHash("sha256")
    .update(Buffer.from(challenge, "hex"))
    .digest();

  const keyPair = ec.keyFromPublic(pkHex, "hex");
  const r = signatureHex.slice(0, 64);
  const s = signatureHex.slice(64, 128);
  const signature = { r, s };

  // Verify
  const isValid = keyPair.verify(msgHash, signature);
  if (!isValid) {
    return {
      EC: 3,
      EM: "Chữ ký không hợp lệ",
    };
  }

  await redisClient.del(`challenge:${hashPk}:${election_id}`);

  const payload = { hashPk, election_id };
  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = jwtService.generateRefreshToken(payload);

  return {
    EC: 0,
    EM: "Xác thực thành công",
    result: {
      accessToken,
      refreshToken,
    },
  };
};

module.exports = { registerVoter, verifySignature, generateChallenge };
