
const jwtService = require('./jwtService');
const bcrypt = require('bcryptjs');
const Organization = require('../models/organizationModel');

// CA tạo trustee
const createTrustee = async (data) => {
  const { name, password, walletAddress } = data;

  // Hash password trong service
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password:", hashedPassword);
  const trustee = new Organization({
    name,
    password: hashedPassword,
    walletAddress,
    role: 'TRUSTEE'
  });

  return await trustee.save();
};

// Đăng nhập CA / Trustee
const login = async (name, password) => {
  const organization = await Organization.findOne({ name });
  if (!organization) throw new Error('organization not found');

  const valid = await bcrypt.compare(password, organization.password);
  if (!valid) throw new Error('Invalid password');

  const accessToken = jwtService.generateAccessToken({ _id: organization._id, role: organization.role });
  const refreshToken = jwtService.generateRefreshToken({ _id: organization._id, role: organization.role });

  return {
    accessToken,
    refreshToken,
    role: organization.role,
    name: organization.name,
    walletAddress: organization.walletAddress
  };
};

module.exports = { createTrustee, login };
