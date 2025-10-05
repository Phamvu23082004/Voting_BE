const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    election_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    voteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);
module.exports = Candidate;
