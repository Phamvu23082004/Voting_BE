const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  password: { type: String, required: true },
  walletAddress: { type: String, unique: true }, 
  role: { type: String, enum: ["CA", "TRUSTEE"], required: true },
  publicShare: { type: String }, 
  shareKey: { type: String }, 
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model("Organization", organizationSchema);
