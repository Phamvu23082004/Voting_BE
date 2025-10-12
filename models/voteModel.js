const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  nullifier: String,
  ciphertext: String,
  proof: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vote", voteSchema);
