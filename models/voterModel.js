const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  hashed_key: { type: String, required: true },
  election_id: { type: String, required: true },
  proof: [String],
  is_valid: { type: Boolean, default: false },
  pk_secp: { type: String, required: true },
});

const Voter = mongoose.model("Voter", voterSchema);

module.exports = Voter;
