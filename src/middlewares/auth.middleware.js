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
}

module.exports = AuthMiddleware;
