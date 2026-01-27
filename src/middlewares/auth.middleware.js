const jwt = require("jsonwebtoken");
const { User } = require("../models/index");
const { JWT_SECRET } = require("../config/config");

class AuthMiddleware {
  static authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "User Authentication is required" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Authentication failed! Please reload the page" });
      }

      req.user = decoded;
      next();
    });
  };

  static async attachUser(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ["password_hash"] },
      });
      if (user) {
        req.currentUser = user;
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
    next();
  }
}

module.exports = AuthMiddleware;
