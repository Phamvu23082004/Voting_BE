const voterService = require('../services/voterService');

const registerVoter = async (req, res) => {
    const { cccd, publicKey, electionID } = req.body;

    try {
        const result = await voterService.registerVoter(cccd, publicKey, electionID);
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
};

async function getChallenge(req, res) {
  try {
    const { hashPk, election_id } = req.query;
    if (!hashPk || !election_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const challenge = await voterService.generateChallenge(hashPk, election_id);
    res.json({ challenge });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyLogin(req, res) {
  try {
    const { pk, hashPk, signature, election_id } = req.body;
    if (!pk || !hashPk || !signature || !election_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const tokens = await voterService.verifySignature(pk, hashPk, signature, election_id);
    res.json(tokens); // { accessToken, refreshToken }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// 🔄 API refresh token
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" });
    }

    const decoded = jwtService.verifyToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    const payload = { pk: decoded.pk, hashPk: decoded.hashPk, election_id: decoded.election_id };
    const newAccessToken = jwtService.generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}


module.exports = { registerVoter, getChallenge, verifyLogin, refreshToken };
