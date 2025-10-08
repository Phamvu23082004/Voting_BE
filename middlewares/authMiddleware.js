const jwtService = require("../services/jwtService");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.error(1, "Thiếu token xác thực", 401);
  }

  const decoded = jwtService.verifyToken(token);
  if (!decoded) {
    return res.error(2, "Token không hợp lệ hoặc đã hết hạn", 403);
  }

  req.user = decoded;
  next();
}

// Kiểm tra vai trò
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.error(4, "Chưa đăng nhập hoặc không có quyền truy cập", 401);
    }

    // Nếu user không có role => coi là voter (mặc định)
    const userRole = req.user.role || "VOTER";

    // Nếu route yêu cầu role mà user không nằm trong danh sách
    if (!roles.includes(userRole))
      return res.error(5, "Không đủ quyền để truy cập tài nguyên này", 403);

    next();
  };
}

module.exports = { authMiddleware, requireRole };

module.exports = {
  authMiddleware,
  requireRole,
};
