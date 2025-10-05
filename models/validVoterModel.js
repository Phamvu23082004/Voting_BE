const mongoose = require("mongoose");

const validVoterSchema = new mongoose.Schema(
  {
    cccd: {
      type: String,
      required: true,
      unique: true,
    },
    election_id: {
      type: String,
      required: true, 
    },
    is_valid: {
      type: Boolean,
      default: true, 
    },
  },
  {
    timestamps: true, 
  }
);

// // Tạo index cho cccd và election_id để tối ưu truy vấn
// validVoterSchema.index({ cccd: 1, election_id: 1 }, { unique: true });

const ValidVoter = mongoose.model("ValidVoter", validVoterSchema);

module.exports = ValidVoter;
