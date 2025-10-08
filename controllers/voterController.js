const voterService = require("../services/voterService");
const jwtService = require("../services/jwtService");

const registerVoter = async (req, res) => {
  const { cccd, publicKey, election_id } = req.body;

  try {
    const result = await voterService.registerVoter(
      cccd,
      publicKey,
      election_id
    );

    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

async function getChallenge(req, res) {
  try {
    const { hashPk, election_id } = req.query;

    if (!hashPk || !election_id) {
      return res.error(1, "Thiếu tham số bắt buộc");
    }

    const result = await voterService.generateChallenge(hashPk, election_id);

    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
}

async function verifyLogin(req, res) {
  try {
    console.log("aaa");
    const { pk, hashPk, signature, election_id } = req.body;

    if (!pk || !hashPk || !signature || !election_id) {
      return res.error(1, "Thiếu tham số bắt buộc");
    }

    const result = await voterService.verifySignature(
      pk,
      hashPk,
      signature,
      election_id
    );

    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.error(1, "Thiếu refresh token");
    }

    const decoded = jwtService.verifyToken(refreshToken);
    if (!decoded) {
      return res.error(2, "Refresh token không hợp lệ hoặc đã hết hạn");
    }

    const payload = {
      pk: decoded.pk,
      hashPk: decoded.hashPk,
      election_id: decoded.election_id,
    };
    const newAccessToken = jwtService.generateAccessToken(payload);

    return res.success(
      { accessToken: newAccessToken },
      "Làm mới access token thành công"
    );
  } catch (err) {
    return res.InternalError();
  }
}

module.exports = { registerVoter, getChallenge, verifyLogin, refreshToken };
