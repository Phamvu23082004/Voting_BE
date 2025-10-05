const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Tên cơ quan, ví dụ "Ủy ban Bầu cử"
  password: { type: String, required: true },   
  walletAddress: { type: String, unique: true }, // mapping tới ví on-chain
  role: { type: String, enum: ['CA', 'TRUSTEE'], required: true },
  publicShare: { type: String },   // trustee: Y_i
  shareKey: { type: String },      // nếu có lưu (khuyên mã hóa hoặc không lưu raw)
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Organization', organizationSchema);
