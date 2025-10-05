const mongoose = require("mongoose");

const merkleLeafSchema = new mongoose.Schema({
  election_id: String,
  hashedKey: String,
});

const MerkleLeaf = mongoose.model("MerkleLeaf", merkleLeafSchema);
module.exports = MerkleLeaf;
