const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

const jwtSecret = process.env.JWT_SECRET || "kindledger-local-development-secret";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }
    const payload = jwt.verify(token, jwtSecret);
    const users = await query(
      "SELECT id, name, email, role, phone, city FROM users WHERE id = ?",
      [payload.id]
    );
    if (!users.length) {
      return res.status(401).json({ message: "Account no longer exists." });
    }
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
