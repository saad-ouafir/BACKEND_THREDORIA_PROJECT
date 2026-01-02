const { RefreshToken } = require("../../models/index");
const { JWT_SECRET } = require("../../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

class RefreshTokenController {
  static async generateAccessToken(userId) {
    const accessToken = await jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: "30m",
    });
    return accessToken;
  }

  static async generateRefreshToken(userId) {
    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await RefreshToken.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return token;
  }

  static async validateRefreshToken(token) {
    const refreshTokens = await RefreshToken.findAll({
      where: { user_id: userId },
    });
    for (const refreshToken of refreshTokens) {
      let isValid = await bcrypt.compare(token, refreshToken.token_hash);
      if (isValid && refreshToken.expires_at > new Date()) {
        return refreshToken;
      }
    }
    return null;
  }

  static async deleteRefreshTokens(userId) {
    await RefreshToken.destroy({ where: { user_id: userId } });
  }
}

module.exports = RefreshTokenController;
