module.exports = {
  secret: process.env.JWT_SECRET || "super_secret",
  expiresIn: "1h",
  refreshExpiresIn: "7d"
};
