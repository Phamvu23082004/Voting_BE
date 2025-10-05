const jwtService = require("./jwtService");
const bcrypt = require("bcryptjs");
const Organization = require("../models/organizationModel");

// CA tạo trustee
const createTrustee = async (data) => {
  const { name, password, walletAddress } = data;
  if (!name || !password || !walletAddress) {
    return {
      EC: 1,
      EM: "Thiếu thông tin bắt buộc (name, password, walletAddress)",
    };
  }
  // Hash password trong service
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("Hashed password:", hashedPassword);
  const trustee = new Organization({
    name,
    password: hashedPassword,
    walletAddress,
    role: "TRUSTEE",
  });

  await trustee.save();

  return {
    EC: 0,
    EM: "Tạo Trustee thành công",
    result: {
      id: trustee._id,
      name: trustee.name,
      walletAddress: trustee.walletAddress,
    },
  };
};

// Đăng nhập CA / Trustee
const login = async (name, password) => {
  const organization = await Organization.findOne({ name });
  if (!organization) {
    return { EC: 1, EM: "Không tìm thấy tổ chức" };
  }

  const valid = await bcrypt.compare(password, organization.password);
  if (!valid) {
    return { EC: 2, EM: "Sai mật khẩu" };
  }

  const payload = {
    _id: organization._id,
    role: organization.role,
  };

  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = jwtService.generateRefreshToken(payload);

  return {
    EC: 0,
    EM: "Đăng nhập thành công",
    result: {
      accessToken,
      refreshToken,
      role: organization.role,
      name: organization.name,
      walletAddress: organization.walletAddress,
    },
  };
};

module.exports = { createTrustee, login };
