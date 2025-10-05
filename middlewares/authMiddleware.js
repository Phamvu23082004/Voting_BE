const jwtService = require("../services/jwtService");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: "No token provided" });

  const decoded = jwtService.verifyToken(token);
  if (!decoded) return res.status(403).json({ error: "Invalid or expired token" });

  req.user = decoded; // gắn payload vào request
  next();
}

// Kiểm tra vai trò
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // Nếu user không có role => coi là voter (mặc định)
    const userRole = req.user.role || "VOTER";

    // Nếu route yêu cầu role mà user không nằm trong danh sách
    if (!roles.includes(userRole))
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });

    next();
  };
}

module.exports = { authMiddleware, requireRole };


module.exports = {
  authMiddleware,
  requireRole,
};
