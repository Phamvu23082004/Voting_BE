const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    election_id: {
      type: String,
      required: true,
      unique: true, 
    },
    name: {
      type: String,
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    merkle_root: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

electionSchema.index({ election_id: 1 }, { unique: true });

const Election = mongoose.model("Election", electionSchema);
module.exports = Election;
