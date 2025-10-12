const jwtService = require("./jwtService");
const bcrypt = require("bcryptjs");
const Organization = require("../models/organizationModel");

const getOrganizations = async () => {
  const organizations = await Organization.find().select(
    "_id username name walletAddress role"
  );
  return {
    EC: 0,
    EM: "Lấy danh sách tổ chức thành công",
    result: organizations,
  };
};
// CA tạo trustee
const createTrustee = async (data) => {
  const { username, name, password, walletAddress } = data;
  if (!username || !name || !password || !walletAddress) {
    return {
      EC: 1,
      EM: "Thiếu thông tin bắt buộc (username, name, password, walletAddress)",
    };
  }

  const existingUsername = await Organization.findOne({ username });
  if (existingUsername) {
    return { EC: 2, EM: "Tài khoản đã tồn tại" };
  }

  const existingWallet = await Organization.findOne({ walletAddress });
  if (existingWallet) {
    return { EC: 3, EM: "Wallet address đã được sử dụng" };
  }

  // Hash password trong service
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("Hashed password:", hashedPassword);
  const trustee = new Organization({
    username,
    name,
    password: hashedPassword,
    walletAddress: walletAddress,
    role: "TRUSTEE",
  });

  await trustee.save();

  return {
    EC: 0,
    EM: "Tạo Trustee thành công",
    result: {
      id: trustee._id,
      username: trustee.username,
      name: trustee.name,
      walletAddress: trustee.walletAddress,
    },
  };
};

// Đăng nhập CA / Trustee
const login = async (username, password) => {
  const organization = await Organization.findOne({ username });
  if (!organization) {
    return { EC: 1, EM: "Sai tài khoản" };
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

const deleteOrganization = async (id) => {
  if (!id) {
    return { EC: 1, EM: "Thiếu ID tổ chức cần xoá" };
  }

  const organization = await Organization.findById(id);
  if (!organization) {
    return { EC: 2, EM: "Tổ chức không tồn tại" };
  }

  await Organization.findByIdAndDelete(id);

  return {
    EC: 0,
    EM: `Đã xoá tổ chức '${organization.name}' thành công`,
    result: { id },
  };
};

const deleteAllOrganizations = async () => {
  const result = await Organization.deleteMany({ role: { $ne: "CA" } });

  return {
    EC: 0,
    EM: `Đã xoá toàn bộ tổ chức thành công`,
    result,
  };
};

module.exports = {
  getOrganizations,
  createTrustee,
  login,
  deleteOrganization,
  deleteAllOrganizations,
};
