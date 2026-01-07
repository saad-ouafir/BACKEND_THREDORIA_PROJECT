const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

class AuthMiddleware {
  static authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
      }

      req.user = decoded;
      next();
    });
  };

  static optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
        return next();
      }

      req.user = decoded;
      next();
    });
  };

  static requireAuth = (req, res, next) => {
    if (!req.user) {
     return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  static async attachUser(req, res, next) {
    if (!req.user || !req.user.userId) {
      return next();
    }

    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ["password_hash"] },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  }

  static authorize = (...roles) => {
    return (req, res, next) => {
      if (!req.currentUser) {
       return res.status(401).json({ message: "Authentication required" });
      }

      // Add role-based authorization if needed in the future
      // For now, just check if user exists
      next();
    };
  };
}

module.exports = AuthMiddleware;
