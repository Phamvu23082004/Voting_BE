const e = require("express");
const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  nullifier: String,
  hashCipher: String,
  election_id: String,
  C1x: String,
  C1y: String,
  C2x: String,
  C2y: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vote", voteSchema);
