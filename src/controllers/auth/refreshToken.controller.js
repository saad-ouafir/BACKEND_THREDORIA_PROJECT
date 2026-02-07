const { RefreshToken } = require("../../models/index");
const { JWT_SECRET } = require("../../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class RefreshTokenController {
  static generateAccessToken(userId) {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: "30m",
    });
    return accessToken;
  }

  static async generateRefreshToken(userId) {
    console.time("generateToken");
    await RefreshTokenController.deleteRefreshTokens(userId);
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await RefreshToken.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    console.timeEnd("generateToken");

    return token;
  }

  static async validateRefreshToken(token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const refreshToken = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
      },
    });
    if (refreshToken && refreshToken.expires_at > new Date()) {
      return refreshToken;
    }

    return null;
  }

  static async deleteRefreshTokens(userId) {
    console.time("deleteTokens");
    const result = await RefreshToken.destroy({ where: { user_id: userId }, limit: 100 });
    console.timeEnd("deleteTokens");
    return result;
  }
}

module.exports = RefreshTokenController;
