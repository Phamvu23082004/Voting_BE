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

module.exports = authMiddleware;
