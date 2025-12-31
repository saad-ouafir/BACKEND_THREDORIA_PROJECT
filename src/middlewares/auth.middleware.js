const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

class AuthMiddleware {
  static authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      const error = new Error("Access token required");
      error.status = 401;
      return next(error);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        const error = new Error("Invalid or expired token");
        error.status = 401;
        return next(error);
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
      const error = new Error("Authentication required");
      error.status = 401;
      return next(error);
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
        const error = new Error("User not found");
        error.status = 401;
        return next(error);
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
        const error = new Error("Authentication required");
        error.status = 401;
        return next(error);
      }

      // Add role-based authorization if needed in the future
      // For now, just check if user exists
      next();
    };
  };
}

module.exports = AuthMiddleware;
